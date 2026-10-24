import { describe, expect, it } from 'vitest';
import { generateMermaid } from '../src/generator/mermaid.js';

describe('generateMermaid', () => {
  it('renders nodes and directed dependency edges', () => {
    expect(
      generateMermaid({
        nodes: [
          { id: 'src_main', path: 'src/main.ts' },
          { id: 'src_lib', path: 'src/lib.ts' },
        ],
        edges: [{ from: 'src_main', to: 'src_lib' }],
      }),
    ).toBe(
      'graph TD\n  src_main["src/main.ts"]\n  src_lib["src/lib.ts"]\n  src_main --> src_lib\n',
    );
  });

  it('escapes quotes in labels', () => {
    expect(
      generateMermaid({
        nodes: [{ id: 'quoted', path: 'a"b.ts' }],
        edges: [],
      }),
    ).toContain('quoted["a&quot;b.ts"]');
  });
});
