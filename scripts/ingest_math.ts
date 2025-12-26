import { MathNode, MathNodeType } from "../packages/schema/src";
import * as fs from "fs";
import * as path from "path";

interface IngestionStats {
  totalProcessed: number;
  successful: number;
  failed: number;
  byType: Record<MathNodeType, number>;
}

class MathIngestionEngine {
  private stats: IngestionStats;
  private outputDir: string;

  constructor(outputDir: string) {
    this.outputDir = outputDir;
    this.stats = {
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      byType: {
        concept: 0,
        formula: 0,
        theorem: 0,
        definition: 0,
        identity: 0,
        proof: 0,
        symbol: 0
      }
    };
  }

  async ingestFromCSV(filePath: string): Promise<void> {
    console.log(`Ingesting from CSV: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return;
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n").filter(l => l.trim());
    const headers = lines[0].split(",").map(h => h.trim());

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.trim());
      const row: Record<string, string> = {};
      
      headers.forEach((h, idx) => {
        row[h] = values[idx] || "";
      });

      await this.processRow(row);
    }
  }

  async ingestFromJSON(filePath: string): Promise<void> {
    console.log(`Ingesting from JSON: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return;
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(content);

    if (Array.isArray(data)) {
      for (const item of data) {
        await this.processNode(item);
      }
    } else {
      await this.processNode(data);
    }
  }

  private async processRow(row: Record<string, string>): Promise<void> {
    this.stats.totalProcessed++;

    try {
      const node: MathNode = {
        id: row.id || this.generateId(row.title || "unknown"),
        type: (row.type as MathNodeType) || "concept",
        title: row.title || "",
        latex: row.latex || undefined,
        description: row.description || "",
        domains: row.domains ? row.domains.split(";").map(d => d.trim()) : [],
        tags: row.tags ? row.tags.split(";").map(t => t.trim()) : [],
        complexity: parseInt(row.complexity || "5", 10),
        requires: row.requires ? row.requires.split(";").map(r => r.trim()) : [],
        generalizes: row.generalizes ? row.generalizes.split(";").map(g => g.trim()) : [],
        special_cases: row.special_cases ? row.special_cases.split(";").map(s => s.trim()) : [],
        used_in: row.used_in ? row.used_in.split(";").map(u => u.trim()) : [],
        appears_in: [],
        created_at: Date.now(),
        updated_at: Date.now()
      };

      this.validateNode(node);
      await this.saveNode(node);
      
      this.stats.successful++;
      this.stats.byType[node.type]++;
    } catch (error) {
      this.stats.failed++;
      console.error(`Failed to process row: ${error}`);
    }
  }

  private async processNode(data: any): Promise<void> {
    this.stats.totalProcessed++;

    try {
      const node: MathNode = {
        id: data.id || this.generateId(data.title || "unknown"),
        type: data.type || "concept",
        title: data.title || "",
        latex: data.latex,
        description: data.description || "",
        domains: data.domains || [],
        tags: data.tags || [],
        complexity: data.complexity || 5,
        requires: data.requires || [],
        generalizes: data.generalizes || [],
        special_cases: data.special_cases || [],
        used_in: data.used_in || [],
        appears_in: data.appears_in || [],
        created_at: data.created_at || Date.now(),
        updated_at: data.updated_at || Date.now()
      };

      this.validateNode(node);
      await this.saveNode(node);
      
      this.stats.successful++;
      this.stats.byType[node.type]++;
    } catch (error) {
      this.stats.failed++;
      console.error(`Failed to process node: ${error}`);
    }
  }

  private validateNode(node: MathNode): void {
    if (!node.id || node.id.trim() === "") {
      throw new Error("Node ID is required");
    }
    if (!node.title || node.title.trim() === "") {
      throw new Error("Node title is required");
    }
    if (node.complexity < 0 || node.complexity > 10) {
      throw new Error(`Invalid complexity: ${node.complexity}`);
    }
  }

  private async saveNode(node: MathNode): Promise<void> {
    const typeDir = this.getTypeDirectory(node.type);
    const outputPath = path.join(this.outputDir, typeDir);

    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    const fileName = `${node.id}.json`;
    const filePath = path.join(outputPath, fileName);

    fs.writeFileSync(filePath, JSON.stringify(node, null, 2));
  }

  private getTypeDirectory(type: MathNodeType): string {
    const typeMap: Record<MathNodeType, string> = {
      concept: "concepts",
      formula: "formulas",
      theorem: "theorems",
      definition: "concepts",
      identity: "formulas",
      proof: "theorems",
      symbol: "symbols"
    };
    return typeMap[type];
  }

  async bulkIngest(nodes: MathNode[]): Promise<void> {
    for (const node of nodes) {
      await this.processNode(node);
    }
  }

  async ingestDirectory(dirPath: string): Promise<void> {
    if (!fs.existsSync(dirPath)) {
      console.error(`Directory not found: ${dirPath}`);
      return;
    }

    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isFile()) {
        const ext = path.extname(file).toLowerCase();
        if (ext === '.json') {
          await this.ingestFromJSON(filePath);
        } else if (ext === '.csv') {
          await this.ingestFromCSV(filePath);
        }
      }
    }
  }

  private generateId(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .substring(0, 50);
  }

  getStats(): IngestionStats {
    return this.stats;
  }

  printStats(): void {
    console.log("\n=== Ingestion Statistics ===\n");
    console.log(`Total Processed: ${this.stats.totalProcessed}`);
    console.log(`Successful: ${this.stats.successful}`);
    console.log(`Failed: ${this.stats.failed}`);
    console.log("\nBy Type:");
    Object.entries(this.stats.byType).forEach(([type, count]) => {
      if (count > 0) {
        console.log(`  ${type}: ${count}`);
      }
    });
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log("Usage: npm run ingest:math <file1> [file2] ...");
    console.log("Supported formats: .json, .csv");
    process.exit(1);
  }

  const outputDir = path.join(process.cwd(), "data", "math");
  const engine = new MathIngestionEngine(outputDir);

  for (const filePath of args) {
    const fullPath = path.resolve(filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.error(`File not found: ${fullPath}`);
      continue;
    }

    const ext = path.extname(fullPath).toLowerCase();

    if (ext === ".json") {
      await engine.ingestFromJSON(fullPath);
    } else if (ext === ".csv") {
      await engine.ingestFromCSV(fullPath);
    } else {
      console.error(`Unsupported file format: ${ext}`);
    }
  }

  engine.printStats();
}

main();
