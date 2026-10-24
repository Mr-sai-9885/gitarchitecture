import { describe, expect, it } from 'vitest';
import { createDiagramLayout } from '../src/web/diagram.js';

describe('createDiagramLayout', () => {
  it('groups files by directory and includes parent edges', () => {
    const layout = createDiagramLayout('owner/repo', [
      'src/index.ts',
      'src/lib/util.ts',
      'README.md',
    ]);

    expect(layout.nodes.map(({ path, kind }) => [path, kind])).toEqual([
      ['', 'repository'],
      ['src', 'directory'],
      ['src/index.ts', 'file'],
      ['src/lib', 'directory'],
      ['src/lib/util.ts', 'file'],
      ['README.md', 'file'],
    ]);
    expect(layout.nodes.find((node) => node.path === 'src/lib/util.ts')?.parentId).toBe(
      layout.nodes.find((node) => node.path === 'src/lib')?.id,
    );
    expect(layout.width).toBeGreaterThan(0);
    expect(layout.height).toBeGreaterThan(0);
  });

  it('returns a valid empty-repository diagram', () => {
    const layout = createDiagramLayout('owner/repo', []);
    expect(layout.nodes).toHaveLength(1);
    expect(layout.nodes[0]?.kind).toBe('repository');
  });
});
