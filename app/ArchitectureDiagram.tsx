import {
  createDiagramLayout,
  diagramDimensions,
  type DiagramNode,
} from '../src/web/diagram';

interface ArchitectureDiagramProps {
  repository: string;
  filePaths: string[];
}

export default function ArchitectureDiagram({
  repository,
  filePaths,
}: ArchitectureDiagramProps) {
  const layout = createDiagramLayout(repository, filePaths);
  const { nodeWidth, nodeHeight, columnGap } = diagramDimensions;

  return (
    <div className="diagram-viewport" role="region" aria-label="Repository architecture diagram">
      <svg
        className="architecture-diagram"
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        role="img"
        aria-label={`File structure diagram for ${repository}`}
      >
        <defs>
          <marker
            id="architecture-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
          </marker>
        </defs>
        {layout.nodes.map((node) =>
          node.parentId ? (
            <path
              key={`edge-${node.id}`}
              className="diagram-edge"
              d={edgePath(layout.nodes, node, nodeWidth, columnGap)}
              markerEnd="url(#architecture-arrow)"
            />
          ) : null,
        )}
        {layout.nodes.map((node) => {
          const x = 40 + node.depth * (nodeWidth + columnGap);
          const y = node.y - nodeHeight / 2;
          return (
            <g key={node.id} className={`diagram-node diagram-node-${node.kind}`}>
              <title>{node.path || repository}</title>
              <rect x={x} y={y} width={nodeWidth} height={nodeHeight} rx="12" />
              <text x={x + 16} y={node.y + 5} textLength={Math.min(node.label.length * 8, nodeWidth - 32)} lengthAdjust="spacingAndGlyphs">
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function edgePath(
  nodes: DiagramNode[],
  node: DiagramNode,
  nodeWidth: number,
  columnGap: number,
): string {
  const parent = nodes.find((candidate) => candidate.id === node.parentId);
  if (!parent) {
    return '';
  }

  const startX = 40 + parent.depth * (nodeWidth + columnGap) + nodeWidth;
  const endX = 40 + node.depth * (nodeWidth + columnGap);
  const bendX = (startX + endX) / 2;
  return `M ${startX} ${parent.y} C ${bendX} ${parent.y}, ${bendX} ${node.y}, ${endX} ${node.y}`;
}
