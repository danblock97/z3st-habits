'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link2, ArrowRight, Lock, Sparkles, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DependencyTreeNode } from '../habits/types';

type DependencyGraphProps = Record<string, never>;

type GraphNode = {
  id: string;
  title: string;
  emoji: string | null;
  x: number;
  y: number;
  level: number;
  children: string[];
  parents: string[];
};

type GraphEdge = {
  from: string;
  to: string;
  type: 'enables' | 'requires' | 'suggests';
};

export function DependencyGraph() {
  const [dependencyTree, setDependencyTree] = useState<DependencyTreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nodes, setNodes] = useState<Map<string, GraphNode>>(new Map());
  const [edges, setEdges] = useState<GraphEdge[]>([]);

  useEffect(() => {
    loadDependencyTree();
  }, []);

  const loadDependencyTree = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/habits/dependency-tree');
      const data = await response.json();

      if (data.success) {
        setDependencyTree(data.tree);
        processGraph(data.tree);
      }
    } catch (error) {
      console.error('Failed to load dependency tree:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const processGraph = (tree: DependencyTreeNode[]) => {
    if (tree.length === 0) {
      setNodes(new Map());
      setEdges([]);
      return;
    }

    // Build adjacency lists
    const nodeMap = new Map<string, GraphNode>();
    const edgeList: GraphEdge[] = [];

    // Initialize nodes
    for (const edge of tree) {
      if (!nodeMap.has(edge.parentId)) {
        nodeMap.set(edge.parentId, {
          id: edge.parentId,
          title: edge.parentTitle,
          emoji: edge.parentEmoji,
          x: 0,
          y: 0,
          level: 0,
          children: [],
          parents: [],
        });
      }
      if (!nodeMap.has(edge.childId)) {
        nodeMap.set(edge.childId, {
          id: edge.childId,
          title: edge.childTitle,
          emoji: edge.childEmoji,
          x: 0,
          y: 0,
          level: 0,
          children: [],
          parents: [],
        });
      }

      const parent = nodeMap.get(edge.parentId)!;
      const child = nodeMap.get(edge.childId)!;

      parent.children.push(edge.childId);
      child.parents.push(edge.parentId);

      edgeList.push({
        from: edge.parentId,
        to: edge.childId,
        type: edge.dependencyType,
      });
    }

    // Calculate levels using BFS from root nodes
    const rootNodes = Array.from(nodeMap.values()).filter(
      (node) => node.parents.length === 0
    );

    const visited = new Set<string>();
    const queue: Array<{ id: string; level: number }> = rootNodes.map((node) => ({
      id: node.id,
      level: 0,
    }));

    while (queue.length > 0) {
      const { id, level } = queue.shift()!;

      if (visited.has(id)) continue;
      visited.add(id);

      const node = nodeMap.get(id)!;
      node.level = level;

      for (const childId of node.children) {
        if (!visited.has(childId)) {
          queue.push({ id: childId, level: level + 1 });
        }
      }
    }

    // Handle orphaned nodes (cycles or disconnected components)
    for (const node of nodeMap.values()) {
      if (!visited.has(node.id)) {
        node.level = 0;
      }
    }

    // Group nodes by level
    const levelGroups = new Map<number, GraphNode[]>();
    for (const node of nodeMap.values()) {
      if (!levelGroups.has(node.level)) {
        levelGroups.set(node.level, []);
      }
      levelGroups.get(node.level)!.push(node);
    }

    // Calculate positions
    const levelHeight = 150;
    const nodeSpacing = 200;

    for (const [level, nodesInLevel] of levelGroups.entries()) {
      const totalWidth = nodesInLevel.length * nodeSpacing;
      const startX = -totalWidth / 2;

      nodesInLevel.forEach((node, index) => {
        node.x = startX + (index * nodeSpacing) + nodeSpacing / 2;
        node.y = level * levelHeight;
      });
    }

    setNodes(nodeMap);
    setEdges(edgeList);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Dependency Graph
          </CardTitle>
          <CardDescription>
            Visualize how your habits are connected
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (nodes.size === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Dependency Graph
          </CardTitle>
          <CardDescription>
            Visualize how your habits are connected
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-3 mb-4">
              <Link2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">No Dependencies Yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Create habit dependencies to build habit stacks and see them visualized
              here. Dependencies help you build momentum by chaining related habits
              together.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate viewBox based on node positions
  const allNodes = Array.from(nodes.values());
  const minX = Math.min(...allNodes.map((n) => n.x)) - 100;
  const maxX = Math.max(...allNodes.map((n) => n.x)) + 100;
  const minY = Math.min(...allNodes.map((n) => n.y)) - 50;
  const maxY = Math.max(...allNodes.map((n) => n.y)) + 100;
  const width = maxX - minX;
  const height = maxY - minY;

  const edgeTypeColors = {
    enables: 'stroke-green-500 dark:stroke-green-400',
    requires: 'stroke-red-500 dark:stroke-red-400',
    suggests: 'stroke-blue-500 dark:stroke-blue-400',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Dependency Graph
        </CardTitle>
        <CardDescription>
          Visualize how your habits are connected. Arrows show the flow from parent
          to child habits.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-green-500" />
            <span className="text-sm">Enables</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-red-500" />
            <span className="text-sm">Requires</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-blue-500" />
            <span className="text-sm">Suggests</span>
          </div>
        </div>

        {/* Graph SVG */}
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`${minX} ${minY} ${width} ${height}`}
            className="w-full"
            style={{ minHeight: '400px', maxHeight: '600px' }}
          >
            {/* Draw edges */}
            <defs>
              <marker
                id="arrowhead-enables"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 10 3, 0 6" className="fill-green-500 dark:fill-green-400" />
              </marker>
              <marker
                id="arrowhead-requires"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 10 3, 0 6" className="fill-red-500 dark:fill-red-400" />
              </marker>
              <marker
                id="arrowhead-suggests"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 10 3, 0 6" className="fill-blue-500 dark:fill-blue-400" />
              </marker>
            </defs>

            {edges.map((edge, idx) => {
              const fromNode = nodes.get(edge.from);
              const toNode = nodes.get(edge.to);
              if (!fromNode || !toNode) return null;

              return (
                <line
                  key={idx}
                  x1={fromNode.x}
                  y1={fromNode.y + 20}
                  x2={toNode.x}
                  y2={toNode.y - 20}
                  className={cn('stroke-2', edgeTypeColors[edge.type])}
                  markerEnd={`url(#arrowhead-${edge.type})`}
                />
              );
            })}

            {/* Draw nodes */}
            {allNodes.map((node) => (
              <g key={node.id}>
                {/* Node background */}
                <rect
                  x={node.x - 60}
                  y={node.y - 15}
                  width="120"
                  height="40"
                  rx="8"
                  className="fill-card stroke-border stroke-2"
                />
                {/* Node content */}
                <text
                  x={node.x}
                  y={node.y + 8}
                  textAnchor="middle"
                  className="fill-foreground text-sm font-medium"
                >
                  <tspan fontSize="18">{node.emoji || '🍋'}</tspan>
                  <tspan x={node.x} dy="14" fontSize="11">
                    {node.title.length > 15
                      ? `${node.title.substring(0, 15)}...`
                      : node.title}
                  </tspan>
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Statistics */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">{nodes.size}</div>
            <div className="text-xs text-muted-foreground mt-1">Total Habits</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">{edges.length}</div>
            <div className="text-xs text-muted-foreground mt-1">Connections</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {Array.from(nodes.values()).filter((n) => n.parents.length === 0).length}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Root Habits</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {Math.max(...Array.from(nodes.values()).map((n) => n.level)) + 1}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Levels Deep</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
