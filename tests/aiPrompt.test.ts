import { describe, expect, it } from 'vitest';
import { generateArchitectureImagePrompt } from '../src/generator/aiPrompt.js';

describe('generateArchitectureImagePrompt', () => {
  it('reports a missing Gemini API key without making a request', async () => {
    await expect(
      generateArchitectureImagePrompt({ nodes: [], edges: [] }, ''),
    ).rejects.toThrow('GEMINI_API_KEY is not set.');
  });
});
