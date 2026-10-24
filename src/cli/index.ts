import { Command } from 'commander';
import { resolve } from 'node:path';
import { analyzeRepository } from '../analyzer/index.js';
import { generateDot } from '../generator/dot.js';
import { generateJson } from '../generator/json.js';
import { generateMermaid } from '../generator/mermaid.js';
import { renderMermaidToImage } from '../generator/image.js';
import { generateArchitectureImagePrompt } from '../generator/aiPrompt.js';
import type { DiagramFormat, GenerateOptions, MermaidTheme } from '../types.js';

interface GenerateCommandOptions extends Omit<GenerateOptions, 'depth' | 'exclude'> {
  depth: string;
  exclude: string;
  promptOutput: string;
}

export function createProgram(): Command {
  const program = new Command();

  program
    .name('repo-arch')
    .description('Analyze a repository and generate a module architecture diagram.')
    .version('0.1.0');

  program
    .command('generate')
    .description('Analyze a directory and write an architecture diagram.')
    .argument('<target-dir>', 'Directory to analyze')
    .option('--depth <number>', 'Maximum directory depth to scan', '3')
    .option(
      '--exclude <patterns>',
      'Comma-separated glob patterns to exclude',
      'node_modules,.git,dist,build,coverage',
    )
    .option('--format <format>', 'Output format: mermaid, dot, json, png, or svg', 'mermaid')
    .option('--output <filepath>', 'Output file path')
    .option('--theme <theme>', 'Mermaid image theme: dark, default, forest, or neutral', 'dark')
    .option('--ai-prompt', 'Generate an architecture image prompt with Gemini')
    .option('--prompt-output <filepath>', 'Prompt output file path', './architecture_image_prompt.txt')
    .action(async (targetDir: string, options: GenerateCommandOptions) => {
      const depth = Number(options.depth);
      if (!Number.isInteger(depth) || depth < 0) {
        throw new Error('--depth must be a non-negative integer.');
      }

      const allowedFormats: DiagramFormat[] = ['mermaid', 'dot', 'json', 'png', 'svg'];
      if (!allowedFormats.includes(options.format)) {
        throw new Error(`Unsupported format "${options.format}". Use mermaid, dot, json, png, or svg.`);
      }
      const themes: MermaidTheme[] = ['dark', 'default', 'forest', 'neutral'];
      if (!themes.includes(options.theme)) {
        throw new Error(`Unsupported theme "${options.theme}". Use dark, default, forest, or neutral.`);
      }

      const graph = await analyzeRepository(resolve(targetDir), {
        depth,
        exclude: options.exclude.split(',').map((pattern) => pattern.trim()).filter(Boolean),
      });

      if (options.aiPrompt) {
        const prompt = await generateArchitectureImagePrompt(graph);
        const promptOutput = resolve(options.promptOutput);
        const { writeFile } = await import('node:fs/promises');
        await writeFile(promptOutput, `${prompt}\n`, 'utf8');
        console.log(`Wrote architecture image prompt to ${promptOutput}`);
        return;
      }

      const defaultOutput =
        options.format === 'png'
          ? './architecture.png'
          : options.format === 'svg'
            ? './architecture.svg'
            : './ARCHITECTURE.md';
      const output = resolve(options.output ?? defaultOutput);
      if (options.format === 'png' || options.format === 'svg') {
        await renderMermaidToImage(generateMermaid(graph), output, {
          format: options.format,
          theme: options.theme,
        });
        console.log(`Wrote ${options.format} architecture diagram to ${output}`);
        return;
      }

      const contents =
        options.format === 'dot'
          ? generateDot(graph)
          : options.format === 'json'
            ? generateJson(graph)
            : `\`\`\`mermaid\n${generateMermaid(graph)}\`\`\`\n`;

      const { writeFile } = await import('node:fs/promises');
      await writeFile(output, contents, 'utf8');
      console.log(`Wrote ${options.format} architecture diagram to ${output}`);
    });

  return program;
}

export function runCli(): void {
  createProgram().parseAsync(process.argv).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    process.exitCode = 1;
  });
}
