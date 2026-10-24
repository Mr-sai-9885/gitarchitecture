export type DiagramNodeKind = 'repository' | 'directory' | 'file';

export interface DiagramNode {
  id: string;
  label: string;
  path: string;
  kind: DiagramNodeKind;
  depth: number;
  y: number;
  parentId?: string;
}

export interface DiagramLayout {
  nodes: DiagramNode[];
  width: number;
  height: number;
}

interface TreeNode {
  id: string;
  label: string;
  path: string;
  kind: DiagramNodeKind;
  depth: number;
  y: number;
  parentId?: string;
  children: TreeNode[];
}

const NODE_WIDTH = 220;
const NODE_HEIGHT = 52;
const COLUMN_GAP = 100;
const ROW_GAP = 84;
const PADDING = 40;

export function createDiagramLayout(repository: string, paths: string[]): DiagramLayout {
  const root: TreeNode = {
    id: 'repository',
    label: repository,
    path: '',
    kind: 'repository',
    depth: 0,
    y: 0,
    children: [],
  };
  const nodesByPath = new Map<string, TreeNode>([['', root]]);

  for (const path of paths) {
    const segments = path.split('/').filter(Boolean);
    let parent = root;
    let currentPath = '';

    segments.forEach((segment, index) => {
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;
      let node = nodesByPath.get(currentPath);
      if (!node) {
        const isFile = index === segments.length - 1;
        node = {
          id: `node-${nodesByPath.size}`,
          label: segment,
          path: currentPath,
          kind: isFile ? 'file' : 'directory',
          depth: parent.depth + 1,
          y: 0,
          parentId: parent.id,
          children: [],
        };
        nodesByPath.set(currentPath, node);
        parent.children.push(node);
      }
      parent = node;
    });
  }

  let leafIndex = 0;
  const assignPositions = (node: TreeNode): number => {
    if (node.children.length === 0) {
      const y = PADDING + leafIndex * ROW_GAP;
      leafIndex += 1;
      node.y = y;
      return y;
    }

    const childY = node.children.map(assignPositions);
    const y = (childY[0]! + childY[childY.length - 1]!) / 2;
    node.y = y;
    return y;
  };

  assignPositions(root);
  const orderedNodes = [...nodesByPath.values()];
  const maxDepth = orderedNodes.reduce((maximum, node) => Math.max(maximum, node.depth), 0);
  const nodes: DiagramNode[] = orderedNodes.map((node) => ({
    id: node.id,
    label: node.label,
    path: node.path,
    kind: node.kind,
    depth: node.depth,
    y: node.y,
    ...(node.parentId ? { parentId: node.parentId } : {}),
  }));

  return {
    nodes,
    width: PADDING * 2 + maxDepth * (NODE_WIDTH + COLUMN_GAP) + NODE_WIDTH,
    height: Math.max(160, PADDING * 2 + Math.max(leafIndex - 1, 0) * ROW_GAP + NODE_HEIGHT),
  };
}

export const diagramDimensions = {
  nodeWidth: NODE_WIDTH,
  nodeHeight: NODE_HEIGHT,
  columnGap: COLUMN_GAP,
};
