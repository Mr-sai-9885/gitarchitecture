import { readFile } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { extractRelativeImports } from '../parser/index.js';
import type { AnalyzeOptions, ArchitectureGraph } from '../types.js';
import { findSourceFiles } from '../utils/files.js';

const RESOLVABLE_EXTENSIONS = ['', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mts', '.cts'];

export async function analyzeRepository(
  root: string,
  options: AnalyzeOptions,
): Promise<ArchitectureGraph> {
  const absoluteRoot = resolve(root);
  const files = await findSourceFiles(absoluteRoot, options.depth, options.exclude);
  const fileSet = new Set(files);
  const nodeIds = createNodeIds(files);
  const edges = new Set<string>();

  for (const file of files) {
    const contents = await readFile(join(absoluteRoot, file), 'utf8');
    const imports = extractRelativeImports(contents, file);
    for (const specifier of imports) {
      const dependency = resolveLocalModule(dirname(file), specifier, fileSet);
      if (dependency) {
        edges.add(`${nodeIds.get(file)!}\0${nodeIds.get(dependency)!}`);
      }
    }
  }

  return {
    nodes: files.map((file) => ({ id: nodeIds.get(file)!, path: file })),
    edges: [...edges]
      .map((edge) => {
        const [from, to] = edge.split('\0');
        return { from: from!, to: to! };
      })
      .sort((left, right) => left.from.localeCompare(right.from) || left.to.localeCompare(right.to)),
  };
}

function resolveLocalModule(
  importerDirectory: string,
  specifier: string,
  fileSet: Set<string>,
): string | undefined {
  const basePath = join(importerDirectory, specifier).split(sep).join('/');
  const candidates = [basePath];
  const importedExtension = extname(basePath);
  if (['.js', '.jsx', '.mjs', '.cjs'].includes(importedExtension)) {
    const extensionlessPath = basePath.slice(0, -importedExtension.length);
    candidates.push(
      ...RESOLVABLE_EXTENSIONS.slice(1).map((extension) => `${extensionlessPath}${extension}`),
    );
  } else if (!importedExtension) {
    candidates.push(...RESOLVABLE_EXTENSIONS.slice(1).map((extension) => `${basePath}${extension}`));
  }

  for (const candidate of candidates) {
    if (fileSet.has(candidate)) {
      return candidate;
    }
  }

  const directoryCandidates = RESOLVABLE_EXTENSIONS.slice(1).map(
    (extension) => `${basePath}/index${extension}`,
  );
  for (const candidate of directoryCandidates) {
    if (fileSet.has(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

function createNodeIds(files: string[]): Map<string, string> {
  const ids = new Map<string, string>();
  const usedIds = new Set<string>();

  for (const file of files) {
    const baseId = `module_${file
      .replaceAll('\\', '/')
      .replace(extname(file), '')
      .replaceAll(/[^a-zA-Z0-9_]/g, '_')}`;
    let id = baseId;
    let suffix = 2;
    while (usedIds.has(id)) {
      id = `${baseId}_${suffix}`;
      suffix += 1;
    }
    ids.set(file, id);
    usedIds.add(id);
  }
  return ids;
}

export function relativePath(root: string, path: string): string {
  return relative(root, path);
}
