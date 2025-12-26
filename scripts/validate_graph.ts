import { MathGraph } from "../packages/graph/src";
import { MathNode } from "../packages/schema/src";
import * as fs from "fs";
import * as path from "path";

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalNodes: number;
    totalEdges: number;
    cyclesDetected: number;
    orphanedNodes: number;
    missingPrerequisites: number;
  };
}

class GraphValidator {
  private graph: MathGraph;
  private errors: string[];
  private warnings: string[];

  constructor(graph: MathGraph) {
    this.graph = graph;
    this.errors = [];
    this.warnings = [];
  }

  validate(): ValidationResult {
    this.checkCycles();
    this.checkOrphanedNodes();
    this.checkMissingPrerequisites();
    this.checkNodeCompleteness();
    this.checkDuplicateIds();

    const stats = this.calculateStats();

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      stats
    };
  }

  private checkCycles(): void {
    const cycles = this.graph.detectCycles();
    if (cycles.length > 0) {
      this.errors.push(`Detected ${cycles.length} cycles in dependency graph`);
      cycles.slice(0, 5).forEach((cycle, i) => {
        this.errors.push(`  Cycle ${i + 1}: ${cycle.join(" -> ")}`);
      });
      if (cycles.length > 5) {
        this.errors.push(`  ... and ${cycles.length - 5} more cycles`);
      }
    }
  }

  private checkOrphanedNodes(): void {
    const nodes = this.getAllNodeIds();
    let orphanCount = 0;

    for (const nodeId of nodes) {
      const incoming = this.graph.getIncomingEdges(nodeId);
      const outgoing = this.graph.getOutgoingEdges(nodeId);

      if (incoming.length === 0 && outgoing.length === 0) {
        orphanCount++;
        if (orphanCount <= 10) {
          this.warnings.push(`Orphaned node (no connections): ${nodeId}`);
        }
      }
    }

    if (orphanCount > 10) {
      this.warnings.push(`... and ${orphanCount - 10} more orphaned nodes`);
    }
  }

  private checkMissingPrerequisites(): void {
    const nodes = this.getAllNodeIds();
    let missingCount = 0;

    for (const nodeId of nodes) {
      const node = this.graph.getNode(nodeId);
      if (!node) continue;

      for (const prereqId of node.requires) {
        if (!this.graph.getNode(prereqId)) {
          missingCount++;
          if (missingCount <= 10) {
            this.errors.push(`Node ${nodeId} references missing prerequisite: ${prereqId}`);
          }
        }
      }
    }

    if (missingCount > 10) {
      this.errors.push(`... and ${missingCount - 10} more missing prerequisites`);
    }
  }

  private checkNodeCompleteness(): void {
    const nodes = this.getAllNodeIds();

    for (const nodeId of nodes) {
      const node = this.graph.getNode(nodeId);
      if (!node) continue;

      if (!node.title || node.title.trim() === "") {
        this.errors.push(`Node ${nodeId} has empty title`);
      }

      if (!node.description || node.description.trim() === "") {
        this.warnings.push(`Node ${nodeId} has empty description`);
      }

      if (node.domains.length === 0) {
        this.warnings.push(`Node ${nodeId} has no domains assigned`);
      }

      if (node.complexity < 0 || node.complexity > 10) {
        this.errors.push(`Node ${nodeId} has invalid complexity: ${node.complexity}`);
      }
    }
  }

  private checkDuplicateIds(): void {
    const nodes = this.getAllNodeIds();
    const seen = new Set<string>();
    const duplicates = new Set<string>();

    for (const nodeId of nodes) {
      if (seen.has(nodeId)) {
        duplicates.add(nodeId);
      }
      seen.add(nodeId);
    }

    if (duplicates.size > 0) {
      this.errors.push(`Found ${duplicates.size} duplicate node IDs`);
      Array.from(duplicates).slice(0, 10).forEach(id => {
        this.errors.push(`  Duplicate: ${id}`);
      });
    }
  }

  private calculateStats(): ValidationResult["stats"] {
    const nodes = this.getAllNodeIds();
    let edgeCount = 0;
    let orphanCount = 0;
    let missingPrereqCount = 0;

    for (const nodeId of nodes) {
      edgeCount += this.graph.getOutgoingEdges(nodeId).length;

      const incoming = this.graph.getIncomingEdges(nodeId);
      const outgoing = this.graph.getOutgoingEdges(nodeId);
      if (incoming.length === 0 && outgoing.length === 0) {
        orphanCount++;
      }

      const node = this.graph.getNode(nodeId);
      if (node) {
        for (const prereqId of node.requires) {
          if (!this.graph.getNode(prereqId)) {
            missingPrereqCount++;
          }
        }
      }
    }

    return {
      totalNodes: nodes.length,
      totalEdges: edgeCount,
      cyclesDetected: this.graph.detectCycles().length,
      orphanedNodes: orphanCount,
      missingPrerequisites: missingPrereqCount
    };
  }

  private getAllNodeIds(): string[] {
    const ids: string[] = [];
    const exportData = JSON.parse(this.graph.exportJSON());
    return exportData.nodes.map((n: MathNode) => n.id);
  }
}

async function loadGraphFromDirectory(dataDir: string): Promise<MathGraph> {
  const graph = new MathGraph();
  const mathDir = path.join(dataDir, "math");

  const subdirs = ["concepts", "formulas", "theorems", "symbols"];

  for (const subdir of subdirs) {
    const subdirPath = path.join(mathDir, subdir);
    if (!fs.existsSync(subdirPath)) continue;

    const files = fs.readdirSync(subdirPath).filter(f => f.endsWith(".json"));

    for (const file of files) {
      const filePath = path.join(subdirPath, file);
      const content = fs.readFileSync(filePath, "utf-8");
      const nodes: MathNode[] = JSON.parse(content);

      for (const node of nodes) {
        graph.addNode(node);
      }
    }
  }

  return graph;
}

async function main() {
  const dataDir = path.join(process.cwd(), "data");

  if (!fs.existsSync(dataDir)) {
    console.error("Error: data directory not found");
    process.exit(1);
  }

  console.log("Loading graph from data directory...");
  const graph = await loadGraphFromDirectory(dataDir);

  console.log("Validating graph...");
  const validator = new GraphValidator(graph);
  const result = validator.validate();

  console.log("\n=== Validation Results ===\n");
  console.log(`Status: ${result.valid ? "✓ VALID" : "✗ INVALID"}`);
  console.log(`\nStatistics:`);
  console.log(`  Total Nodes: ${result.stats.totalNodes}`);
  console.log(`  Total Edges: ${result.stats.totalEdges}`);
  console.log(`  Cycles Detected: ${result.stats.cyclesDetected}`);
  console.log(`  Orphaned Nodes: ${result.stats.orphanedNodes}`);
  console.log(`  Missing Prerequisites: ${result.stats.missingPrerequisites}`);

  if (result.errors.length > 0) {
    console.log(`\nErrors (${result.errors.length}):`);
    result.errors.forEach(err => console.log(`  ✗ ${err}`));
  }

  if (result.warnings.length > 0) {
    console.log(`\nWarnings (${result.warnings.length}):`);
    result.warnings.forEach(warn => console.log(`  ⚠ ${warn}`));
  }

  if (result.valid) {
    console.log("\n✓ Graph validation passed!");
    process.exit(0);
  } else {
    console.log("\n✗ Graph validation failed!");
    process.exit(1);
  }
}

main();
