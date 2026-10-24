import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import fg from 'fast-glob';
import ignore from 'ignore';

const SOURCE_EXTENSIONS = ['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.mts', '.cts'];

export async function findSourceFiles(
  root: string,
  depth: number,
  exclude: string[],
): Promise<string[]> {
  const absoluteRoot = resolve(root);
  const gitignorePath = resolve(absoluteRoot, '.gitignore');
  let gitignoreContents = '';

  try {
    gitignoreContents = await readFile(gitignorePath, 'utf8');
  } catch (error) {
    if (!isMissingFile(error)) {
      throw error;
    }
  }

  const gitignore = ignore().add(gitignoreContents);
  const candidates = await fg(`**/*`, {
    cwd: absoluteRoot,
    onlyFiles: true,
    dot: true,
    ignore: exclude.map(toGlobPattern),
    followSymbolicLinks: false,
    deep: depth === 0 ? 1 : depth,
  });

  return candidates
    .filter((file) => SOURCE_EXTENSIONS.some((extension) => file.endsWith(extension)))
    .filter((file) => !gitignore.ignores(file.replaceAll('\\', '/')))
    .sort();
}

function toGlobPattern(pattern: string): string {
  const normalized = pattern.replaceAll('\\', '/').replace(/^\/+/, '');
  return normalized.includes('*') ? normalized : `**/${normalized}/**`;
}

function isMissingFile(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ENOENT'
  );
}
