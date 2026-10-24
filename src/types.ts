export type DiagramFormat = 'mermaid' | 'dot' | 'json' | 'png' | 'svg';
export type MermaidTheme = 'dark' | 'default' | 'forest' | 'neutral';

export interface ImageRenderOptions {
  format: 'png' | 'svg';
  theme: MermaidTheme;
}

export interface ArchitectureNode {
  id: string;
  path: string;
}

export interface ArchitectureEdge {
  from: string;
  to: string;
}

export interface ArchitectureGraph {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
}

export interface AnalyzeOptions {
  depth: number;
  exclude: string[];
}

export interface GenerateOptions extends AnalyzeOptions {
  format: DiagramFormat;
  output?: string;
  theme: MermaidTheme;
  aiPrompt: boolean;
  promptOutput?: string;
}
