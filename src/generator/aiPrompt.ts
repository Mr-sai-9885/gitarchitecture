import { GoogleGenAI } from '@google/genai';
import type { ArchitectureGraph } from '../types.js';

const SYSTEM_INSTRUCTION = `You are an expert information designer who writes image-generation prompts for software architecture diagrams.
Transform the supplied dependency graph into one detailed, production-ready prompt for a visual architecture diagram.
Preserve the graph's components and dependency direction accurately. Group related components by directory where appropriate.
Describe a clear layout, legible labels, arrows, and visual hierarchy. Use a polished cyberpunk-inspired style with a dark backdrop, restrained neon glow, and luminous node accents.
Do not invent components or relationships. Return only the prompt text, with no preamble or markdown fences.`;

export async function generateArchitectureImagePrompt(
  graph: ArchitectureGraph,
  apiKey = process.env.GEMINI_API_KEY,
): Promise<string> {
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not set. Configure it in the environment to use --ai-prompt.',
    );
  }

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Create an image-generation prompt for this architecture graph:\n${JSON.stringify(graph)}`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
    },
  });

  const prompt = response.text?.trim();
  if (!prompt) {
    throw new Error('Gemini returned an empty architecture image prompt.');
  }
  return prompt;
}
