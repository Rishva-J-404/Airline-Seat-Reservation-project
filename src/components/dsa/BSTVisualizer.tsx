import { useMemo } from 'react';
import { BinarySearchTree } from '../../algorithms/BST';
import type { TreeNodeLayout } from '../../algorithms/BST';

interface BSTVisualizerProps {
  bst: BinarySearchTree;
  searchPath?: number[];
  highlightNode?: number | null;
  width?: number;
  snapshot?: number[];
}

const LEVEL_HEIGHT = 70;
const NODE_RADIUS = 22;

export function BSTVisualizer({
  bst,
  searchPath = [],
  highlightNode = null,
  width = 500,
  snapshot,
}: BSTVisualizerProps) {
  const snapshotKey = (snapshot || bst.inorderTraversal()).join(',');
  const layout = useMemo(
    () => bst.getLayout(width, LEVEL_HEIGHT),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bst, width, snapshotKey]
  );

  if (!layout || (layout.nodes.length === 0 && layout.edges.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-gray-400">
        <div className="text-4xl mb-2">&#8709;</div>
        <p className="text-sm font-medium">BST is empty</p>
        <p className="text-xs mt-1">Insert a value to build the tree</p>
      </div>
    );
  }

  const { nodes, edges } = layout as {
    nodes: TreeNodeLayout[];
    edges: { x1: number; y1: number; x2: number; y2: number; from?: number; to?: number }[];
  };

  const maxY = nodes.reduce((m, n) => Math.max(m, n.y), 0);
  const svgHeight = maxY + NODE_RADIUS * 2 + 24;
  const renderWidth = Math.max(width, layout.width || 0);

  return (
    <svg
      width={renderWidth}
      height={svgHeight}
      viewBox={`0 0 ${renderWidth} ${svgHeight}`}
      className="overflow-visible block mx-auto"
      aria-label="Binary Search Tree"
    >
      {/* Edges */}
      {edges.map((edge, idx) => {
        const inPath =
          edge.from !== undefined && edge.to !== undefined
            ? searchPath.includes(edge.from) && searchPath.includes(edge.to)
            : false;

        return (
          <line
            key={idx}
            x1={edge.x1}
            y1={edge.y1}
            x2={edge.x2}
            y2={edge.y2}
            stroke={inPath ? '#f97316' : '#fed7aa'}
            strokeWidth={inPath ? 2.5 : 1.5}
            strokeDasharray={inPath ? undefined : '4 3'}
          />
        );
      })}

      {/* Nodes */}
      {nodes.map((node: TreeNodeLayout) => {
        const isHighlighted = node.key === highlightNode;
        const inPath = searchPath.includes(node.key);

        let fill = '#fff7ed';       // default: very light orange
        let stroke = '#fdba74';
        let textColor = '#9a3412';

        if (isHighlighted) {
          fill = '#f97316';         // highlighted: orange
          stroke = '#ea580c';
          textColor = '#ffffff';
        } else if (inPath) {
          fill = '#fed7aa';         // in search path: light orange
          stroke = '#fb923c';
          textColor = '#7c2d12';
        }

        return (
          <g key={node.key} transform={`translate(${node.x}, ${node.y})`}>
            <circle
              r={NODE_RADIUS}
              fill={fill}
              stroke={stroke}
              strokeWidth={isHighlighted ? 3 : 2}
            />
            <text
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={node.key > 999 ? 9 : node.key > 99 ? 11 : 13}
              fontWeight="700"
              fontFamily="monospace"
              fill={textColor}
            >
              {node.key}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

