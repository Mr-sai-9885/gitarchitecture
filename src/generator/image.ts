import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createRequire } from 'node:module';
import { mkdtemp, rm, stat, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve } from 'node:path';
import type { ImageRenderOptions, MermaidTheme } from '../types.js';

const execFileAsync = promisify(execFile);
const require = createRequire(import.meta.url);
const THEMES: MermaidTheme[] = ['dark', 'default', 'forest', 'neutral'];

export async function renderMermaidToImage(
  mermaidMarkup: string,
  outputPath: string,
  options: ImageRenderOptions,
): Promise<void> {
  if (!THEMES.includes(options.theme)) {
    throw new Error(`Unsupported Mermaid theme "${options.theme}".`);
  }
  if (options.format !== 'png' && options.format !== 'svg') {
    throw new Error(`Unsupported image format "${options.format}". Use png or svg.`);
  }
  if (extname(outputPath).toLowerCase() !== `.${options.format}`) {
    throw new Error(`The output path must use the .${options.format} extension.`);
  }

  const cliPath = resolveMermaidCli();
  const tempDir = await mkdtemp(join(tmpdir(), 'repo-arch-'));
  const inputPath = join(tempDir, 'architecture.mmd');
  const resolvedOutputPath = resolve(outputPath);

  try {
    await writeFile(inputPath, mermaidMarkup, 'utf8');
    await execFileAsync(
      process.execPath,
      [cliPath, ...createMermaidCliArgs(inputPath, resolvedOutputPath, options.theme)],
      { windowsHide: true },
    );
    const image = await stat(resolvedOutputPath);
    if (image.size === 0) {
      throw new Error(`Mermaid CLI produced an empty image at ${resolvedOutputPath}.`);
    }
  } catch (error) {
    if (isExecutableMissing(error)) {
      throw new Error(
        'Mermaid CLI could not be started. Install dependencies with "npm install" and ensure Chromium can run.',
        { cause: error },
      );
    }
    throw new Error(`Failed to render architecture image: ${errorMessage(error)}`, { cause: error });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

export function createMermaidCliArgs(
  inputPath: string,
  outputPath: string,
  theme: MermaidTheme,
): string[] {
  return ['-i', inputPath, '-o', outputPath, '-t', theme];
}

function resolveMermaidCli(): string {
  try {
    let packageDirectory = dirname(require.resolve('@mermaid-js/mermaid-cli'));
    while (true) {
      const packageJsonPath = join(packageDirectory, 'package.json');
      try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
          name?: string;
          bin?: string | Record<string, string>;
        };
        if (packageJson.name === '@mermaid-js/mermaid-cli') {
          const bin =
            typeof packageJson.bin === 'string' ? packageJson.bin : packageJson.bin?.mmdc;
          if (!bin) {
            throw new Error('The @mermaid-js/mermaid-cli package has no mmdc executable.');
          }
          return resolve(packageDirectory, bin);
        }
      } catch (error) {
        if (!isMissingPath(error)) {
          throw error;
        }
      }

      const parentDirectory = dirname(packageDirectory);
      if (parentDirectory === packageDirectory) {
        break;
      }
      packageDirectory = parentDirectory;
    }
    throw new Error('Could not locate the @mermaid-js/mermaid-cli package root.');
  } catch (error) {
    throw new Error(
      'Mermaid CLI is unavailable. Install it with "npm install @mermaid-js/mermaid-cli".',
      { cause: error },
    );
  }
}

function isExecutableMissing(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error.code === 'ENOENT' || error.code === 'EACCES')
  );
}

function isMissingPath(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ENOENT'
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
