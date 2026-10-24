import { parse } from '@babel/parser';

export function extractRelativeImports(source: string, filename = 'source.ts'): string[] {
  const ast = parse(source, {
    sourceType: 'unambiguous',
    sourceFilename: filename,
    plugins: ['typescript', 'jsx', 'importAttributes', 'decorators-legacy'],
    errorRecovery: false,
  });
  const imports = new Set<string>();
  collectFromAst(ast.program, imports);

  return [...imports].sort();
}

function collectFromAst(value: unknown, imports: Set<string>): void {
  if (Array.isArray(value)) {
    for (const child of value) {
      collectFromAst(child, imports);
    }
    return;
  }

  if (!isAstNode(value)) {
    return;
  }

  const node = value as Record<string, unknown>;
  if (
    node.type === 'ImportDeclaration' ||
    node.type === 'ExportNamedDeclaration' ||
    node.type === 'ExportAllDeclaration'
  ) {
    const source = node.source as { value?: unknown } | null;
    if (isRelativeSpecifier(source?.value)) {
      imports.add(source.value);
    }
  }

  if (node.type === 'CallExpression') {
    const callee = node.callee as { type?: string; name?: string };
    const args = node.arguments as Array<{ value?: unknown }> | undefined;
    if (callee.type === 'Import' || callee.name === 'require') {
      const specifier = args?.[0]?.value;
      if (isRelativeSpecifier(specifier)) {
        imports.add(specifier);
      }
    }
  }

  if (node.type === 'ImportExpression') {
    const source = node.source as { value?: unknown } | undefined;
    if (isRelativeSpecifier(source?.value)) {
      imports.add(source.value);
    }
  }

  for (const [key, child] of Object.entries(node)) {
    if (key !== 'loc' && key !== 'leadingComments' && key !== 'trailingComments') {
      collectFromAst(child, imports);
    }
  }
}

function isAstNode(value: unknown): value is { type: string } {
  return typeof value === 'object' && value !== null && 'type' in value;
}

function isRelativeSpecifier(specifier: unknown): specifier is string {
  return typeof specifier === 'string' && (specifier.startsWith('./') || specifier.startsWith('../'));
}
