import { MathGraph } from "../packages/graph/src";
import { MathSearchEngine } from "../packages/search/src";
import { MathNode } from "../packages/schema/src";
import * as fs from "fs";
import * as path from "path";

interface IndexStats {
  nodesIndexed: number;
  edgesCreated: number;
  searchTerms: number;
  domains: Set<string>;
  tags: Set<string>;
  buildTime: number;
}

class IndexBuilder {
  private graph: MathGraph;
  private searchEngine: MathSearchEngine;
  private stats: IndexStats;

  constructor() {
    this.graph = new MathGraph();
    this.searchEngine = new MathSearchEngine();
    this.stats = {
      nodesIndexed: 0,
      edgesCreated: 0,
      searchTerms: 0,
      domains: new Set(),
      tags: new Set(),
      buildTime: 0
    };
  }

  async buildFromDirectory(dataDir: string): Promise<void> {
    const startTime = Date.now();

    console.log("Loading nodes from data directory...");
    await this.loadNodes(dataDir);

    console.log("Building graph edges...");
    await this.buildEdges();

    console.log("Building search index...");
    await this.buildSearchIndex();

    this.stats.buildTime = Date.now() - startTime;
  }

  private async loadNodes(dataDir: string): Promise<void> {
    const mathDir = path.join(dataDir, "math");
    const subdirs = ["concepts", "formulas", "theorems", "symbols"];

    for (const subdir of subdirs) {
      const subdirPath = path.join(mathDir, subdir);
      if (!fs.existsSync(subdirPath)) {
        console.warn(`Directory not found: ${subdirPath}`);
        continue;
      }

      const files = fs.readdirSync(subdirPath).filter(f => f.endsWith(".json"));

      for (const file of files) {
        const filePath = path.join(subdirPath, file);
        const content = fs.readFileSync(filePath, "utf-8");
        
        try {
          const node: MathNode = JSON.parse(content);
          this.graph.addNode(node);
          this.stats.nodesIndexed++;

          node.domains.forEach(d => this.stats.domains.add(d));
          node.tags.forEach(t => this.stats.tags.add(t));
        } catch (error) {
          console.error(`Failed to load ${file}: ${error}`);
        }
      }
    }

    console.log(`Loaded ${this.stats.nodesIndexed} nodes`);
  }

  private async buildEdges(): Promise<void> {
    const nodes = JSON.parse(this.graph.exportJSON()).nodes as MathNode[];

    for (const node of nodes) {
      for (const prereqId of node.requires) {
        this.graph.addEdge({
          from: prereqId,
          to: node.id,
          type: "REQUIRES",
          weight: 1
        });
        this.stats.edgesCreated++;
      }

      for (const generalizesId of node.generalizes) {
        this.graph.addEdge({
          from: node.id,
          to: generalizesId,
          type: "GENERALIZES",
          weight: 1
        });
        this.stats.edgesCreated++;
      }

      for (const specialCaseId of node.special_cases) {
        this.graph.addEdge({
          from: specialCaseId,
          to: node.id,
          type: "SPECIAL_CASE_OF",
          weight: 1
        });
        this.stats.edgesCreated++;
      }

      for (const usedInId of node.used_in) {
        this.graph.addEdge({
          from: node.id,
          to: usedInId,
          type: "USED_IN",
          weight: 1
        });
        this.stats.edgesCreated++;
      }
    }

    console.log(`Created ${this.stats.edgesCreated} edges`);
  }

  private async buildSearchIndex(): Promise<void> {
    const nodes = JSON.parse(this.graph.exportJSON()).nodes as MathNode[];

    for (const node of nodes) {
      this.searchEngine.addNode(node);
    }

    console.log(`Indexed ${nodes.length} nodes for search`);
  }

  async saveIndexes(outputDir: string): Promise<void> {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const graphPath = path.join(outputDir, "graph.json");
    fs.writeFileSync(graphPath, this.graph.exportJSON());
    console.log(`Saved graph to ${graphPath}`);

    const statsPath = path.join(outputDir, "index_stats.json");
    fs.writeFileSync(statsPath, JSON.stringify({
      ...this.stats,
      domains: Array.from(this.stats.domains),
      tags: Array.from(this.stats.tags)
    }, null, 2));
    console.log(`Saved stats to ${statsPath}`);

    const metadataPath = path.join(outputDir, "metadata.json");
    fs.writeFileSync(metadataPath, JSON.stringify({
      version: "0.1.0",
      built_at: new Date().toISOString(),
      node_count: this.stats.nodesIndexed,
      edge_count: this.stats.edgesCreated,
      domains: Array.from(this.stats.domains).sort(),
      tags: Array.from(this.stats.tags).sort()
    }, null, 2));
    console.log(`Saved metadata to ${metadataPath}`);
  }

  printStats(): void {
    console.log("\n=== Index Build Statistics ===\n");
    console.log(`Nodes Indexed: ${this.stats.nodesIndexed}`);
    console.log(`Edges Created: ${this.stats.edgesCreated}`);
    console.log(`Unique Domains: ${this.stats.domains.size}`);
    console.log(`Unique Tags: ${this.stats.tags.size}`);
    console.log(`Build Time: ${this.stats.buildTime}ms`);
    
    if (this.stats.domains.size > 0) {
      console.log("\nDomains:");
      Array.from(this.stats.domains).sort().forEach(d => {
        console.log(`  - ${d}`);
      });
    }
  }

  getGraph(): MathGraph {
    return this.graph;
  }

  getSearchEngine(): MathSearchEngine {
    return this.searchEngine;
  }
}

async function main() {
  const dataDir = path.join(process.cwd(), "data");
  const indexDir = path.join(process.cwd(), "data", "indexes");

  if (!fs.existsSync(dataDir)) {
    console.error("Error: data directory not found");
    console.log("Please create data/math directory and add math nodes");
    process.exit(1);
  }

  const builder = new IndexBuilder();

  console.log("Building indexes...\n");
  await builder.buildFromDirectory(dataDir);

  console.log("\nSaving indexes...");
  await builder.saveIndexes(indexDir);

  builder.printStats();

  console.log("\n✓ Index build complete!");
}

main();
