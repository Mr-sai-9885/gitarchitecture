import type { ArchitectureGraph } from '../types.js';

export function generateDot(graph: ArchitectureGraph): string {
  const lines = ['digraph Architecture {', '  rankdir=TB;'];
  for (const node of graph.nodes) {
    lines.push(`  "${escapeDot(node.id)}" [label="${escapeDot(node.path)}"];`);
  }
  for (const edge of graph.edges) {
    lines.push(`  "${escapeDot(edge.from)}" -> "${escapeDot(edge.to)}";`);
  }
  lines.push('}');
  return `${lines.join('\n')}\n`;
}

function escapeDot(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('"', '\\"').replaceAll('\n', '\\n');
}
