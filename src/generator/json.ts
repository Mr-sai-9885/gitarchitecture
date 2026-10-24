import type { ArchitectureGraph } from '../types.js';

export function generateJson(graph: ArchitectureGraph): string {
  return `${JSON.stringify(graph, null, 2)}\n`;
}
