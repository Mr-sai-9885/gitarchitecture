import { describe, expect, it } from 'vitest';
import { createMermaidCliArgs, renderMermaidToImage } from '../src/generator/image.js';

describe('createMermaidCliArgs', () => {
  it('builds safe Mermaid CLI arguments with the selected theme', () => {
    expect(createMermaidCliArgs('input file.mmd', 'architecture.svg', 'forest')).toEqual([
      '-i',
      'input file.mmd',
      '-o',
      'architecture.svg',
      '-t',
      'forest',
    ]);
  });
});

describe('renderMermaidToImage', () => {
  it('rejects output paths whose extension does not match the image format', async () => {
    await expect(
      renderMermaidToImage('graph TD\n', 'architecture.svg', {
        format: 'png',
        theme: 'dark',
      }),
    ).rejects.toThrow('The output path must use the .png extension.');
  });
});
