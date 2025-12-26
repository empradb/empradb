import { MathNode, GraphEdge, EdgeType } from "@empradb/schema";

export class MathGraph {
  private nodes: Map<string, MathNode>;
  private edges: Map<string, GraphEdge[]>;
  private reverseEdges: Map<string, GraphEdge[]>;

  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
    this.reverseEdges = new Map();
  }

  addNode(node: MathNode): void {
    this.nodes.set(node.id, node);
    if (!this.edges.has(node.id)) {
      this.edges.set(node.id, []);
    }
    if (!this.reverseEdges.has(node.id)) {
      this.reverseEdges.set(node.id, []);
    }
  }

  addEdge(edge: GraphEdge): void {
    if (!this.edges.has(edge.from)) {
      this.edges.set(edge.from, []);
    }
    if (!this.reverseEdges.has(edge.to)) {
      this.reverseEdges.set(edge.to, []);
    }
    this.edges.get(edge.from)!.push(edge);
    this.reverseEdges.get(edge.to)!.push(edge);
  }

  getNode(id: string): MathNode | undefined {
    return this.nodes.get(id);
  }

  getOutgoingEdges(nodeId: string): GraphEdge[] {
    return this.edges.get(nodeId) || [];
  }

  getIncomingEdges(nodeId: string): GraphEdge[] {
    return this.reverseEdges.get(nodeId) || [];
  }

  getPrerequisites(nodeId: string): string[] {
    const edges = this.getIncomingEdges(nodeId);
    return edges
      .filter(e => e.type === "REQUIRES")
      .map(e => e.from);
  }

  getAllPrerequisites(nodeId: string): Set<string> {
    const visited = new Set<string>();
    const queue = [nodeId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const prereqs = this.getPrerequisites(current);
      queue.push(...prereqs);
    }

    visited.delete(nodeId);
    return visited;
  }

  getDependents(nodeId: string): string[] {
    const edges = this.getOutgoingEdges(nodeId);
    return edges
      .filter(e => e.type === "REQUIRES")
      .map(e => e.to);
  }

  topologicalSort(nodeIds: string[]): string[] {
    const inDegree = new Map<string, number>();
    const graph = new Map<string, string[]>();
    
    for (const id of nodeIds) {
      inDegree.set(id, 0);
      graph.set(id, []);
    }

    for (const id of nodeIds) {
      const prereqs = this.getPrerequisites(id).filter(p => nodeIds.includes(p));
      for (const prereq of prereqs) {
        graph.get(prereq)!.push(id);
        inDegree.set(id, inDegree.get(id)! + 1);
      }
    }

    const queue: string[] = [];
    for (const [id, degree] of inDegree) {
      if (degree === 0) queue.push(id);
    }

    const result: string[] = [];
    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      for (const neighbor of graph.get(current)!) {
        inDegree.set(neighbor, inDegree.get(neighbor)! - 1);
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      }
    }

    return result;
  }

  detectCycles(): string[][] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[][] = [];

    const dfs = (nodeId: string, path: string[]): void => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const deps = this.getDependents(nodeId);
      for (const dep of deps) {
        if (!visited.has(dep)) {
          dfs(dep, [...path]);
        } else if (recursionStack.has(dep)) {
          const cycleStart = path.indexOf(dep);
          cycles.push(path.slice(cycleStart));
        }
      }

      recursionStack.delete(nodeId);
    };

    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId)) {
        dfs(nodeId, []);
      }
    }

    return cycles;
  }

  getSubgraph(nodeIds: string[]): MathGraph {
    const subgraph = new MathGraph();
    const nodeSet = new Set(nodeIds);

    for (const id of nodeIds) {
      const node = this.getNode(id);
      if (node) subgraph.addNode(node);
    }

    for (const id of nodeIds) {
      const edges = this.getOutgoingEdges(id);
      for (const edge of edges) {
        if (nodeSet.has(edge.to)) {
          subgraph.addEdge(edge);
        }
      }
    }

    return subgraph;
  }

  exportJSON(): string {
    return JSON.stringify({
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values()).flat()
    }, null, 2);
  }

  static fromJSON(json: string): MathGraph {
    const data = JSON.parse(json);
    const graph = new MathGraph();
    
    for (const node of data.nodes) {
      graph.addNode(node);
    }
    
    for (const edge of data.edges) {
      graph.addEdge(edge);
    }
    
    return graph;
  }
}
