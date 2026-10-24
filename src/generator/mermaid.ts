import type { ArchitectureGraph } from '../types.js';

export function generateMermaid(graph: ArchitectureGraph): string {
  const lines = ['graph TD'];
  for (const node of graph.nodes) {
    lines.push(`  ${node.id}["${escapeLabel(node.path)}"]`);
  }
  for (const edge of graph.edges) {
    lines.push(`  ${edge.from} --> ${edge.to}`);
  }
  return `${lines.join('\n')}\n`;
}

function escapeLabel(label: string): string {
  return label.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('\n', ' ');
}
