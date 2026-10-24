import { describe, expect, it } from 'vitest';
import { extractRelativeImports } from '../src/parser/index.js';

describe('extractRelativeImports', () => {
  it('extracts unique relative imports, re-exports, require, and dynamic imports', () => {
    const source = `
      import value from './value.js';
      export { item } from '../shared/item';
      export * from './value.js';
      const dependency = require('./dependency');
      import('./lazy');
    `;

    expect(extractRelativeImports(source)).toEqual([
      '../shared/item',
      './dependency',
      './lazy',
      './value.js',
    ]);
  });

  it('finds dependencies nested inside declarations and functions', () => {
    const source = `
      const dependency = require('./dependency');
      function load() {
        return import('../lazy');
      }
    `;

    expect(extractRelativeImports(source)).toEqual(['../lazy', './dependency']);
  });

  it('does not include package imports', () => {
    expect(extractRelativeImports(`import React from 'react';`)).toEqual([]);
  });
});
