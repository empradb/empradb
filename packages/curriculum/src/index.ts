import { CurriculumMapping, CurriculumSystem, DepthLevel, MathNode } from "@empradb/schema";
import { MathGraph } from "@empradb/graph";

export class CurriculumEngine {
  private mappings: Map<string, CurriculumMapping>;

  constructor() {
    this.mappings = new Map();
  }

  addMapping(mapping: CurriculumMapping): void {
    const key = this.getMappingKey(mapping.system, mapping.year_level);
    this.mappings.set(key, mapping);
  }

  getMapping(system: CurriculumSystem, yearLevel: number): CurriculumMapping | undefined {
    const key = this.getMappingKey(system, yearLevel);
    return this.mappings.get(key);
  }

  private getMappingKey(system: CurriculumSystem, yearLevel: number): string {
    return `${system}:${yearLevel}`;
  }

  getAllConcepts(system: CurriculumSystem, yearLevel: number): string[] {
    const mapping = this.getMapping(system, yearLevel);
    return mapping ? [...mapping.concepts, ...mapping.optional_concepts] : [];
  }

  getRequiredConcepts(system: CurriculumSystem, yearLevel: number): string[] {
    const mapping = this.getMapping(system, yearLevel);
    return mapping ? mapping.concepts : [];
  }

  isConceptExcluded(conceptId: string, system: CurriculumSystem, yearLevel: number): boolean {
    const mapping = this.getMapping(system, yearLevel);
    return mapping ? mapping.excluded_concepts.includes(conceptId) : false;
  }

  getCurriculumSubgraph(
    graph: MathGraph,
    system: CurriculumSystem,
    yearLevel: number,
    includePrerequisites: boolean = true
  ): MathGraph {
    const mapping = this.getMapping(system, yearLevel);
    if (!mapping) return new MathGraph();

    const conceptSet = new Set<string>(mapping.concepts);
    
    if (includePrerequisites) {
      const allPrereqs = new Set<string>();
      for (const conceptId of mapping.concepts) {
        const prereqs = graph.getAllPrerequisites(conceptId);
        prereqs.forEach(p => allPrereqs.add(p));
      }
      allPrereqs.forEach(p => conceptSet.add(p));
    }

    const filtered = Array.from(conceptSet).filter(
      id => !mapping.excluded_concepts.includes(id)
    );

    return graph.getSubgraph(filtered);
  }

  getProgressionPath(
    graph: MathGraph,
    system: CurriculumSystem,
    startYear: number,
    endYear: number
  ): string[] {
    const allConcepts = new Set<string>();

    for (let year = startYear; year <= endYear; year++) {
      const concepts = this.getRequiredConcepts(system, year);
      concepts.forEach(c => allConcepts.add(c));
    }

    return graph.topologicalSort(Array.from(allConcepts));
  }

  comparePrograms(
    system1: CurriculumSystem,
    year1: number,
    system2: CurriculumSystem,
    year2: number
  ): {
    shared: string[];
    only1: string[];
    only2: string[];
  } {
    const concepts1 = new Set(this.getAllConcepts(system1, year1));
    const concepts2 = new Set(this.getAllConcepts(system2, year2));

    const shared: string[] = [];
    const only1: string[] = [];
    const only2: string[] = [];

    for (const c of concepts1) {
      if (concepts2.has(c)) {
        shared.push(c);
      } else {
        only1.push(c);
      }
    }

    for (const c of concepts2) {
      if (!concepts1.has(c)) {
        only2.push(c);
      }
    }

    return { shared, only1, only2 };
  }

  getConceptDepth(
    conceptId: string,
    system: CurriculumSystem,
    yearLevel: number
  ): DepthLevel | null {
    const mapping = this.getMapping(system, yearLevel);
    if (!mapping) return null;

    if (mapping.concepts.includes(conceptId)) return "core";
    if (mapping.optional_concepts.includes(conceptId)) return "intro";
    return null;
  }

  estimateStudyTime(
    graph: MathGraph,
    conceptIds: string[],
    knownConcepts: Set<string> = new Set()
  ): number {
    const toStudy = conceptIds.filter(id => !knownConcepts.has(id));
    
    let totalMinutes = 0;
    for (const conceptId of toStudy) {
      const node = graph.getNode(conceptId);
      if (node) {
        const baseTime = 30;
        const complexityMultiplier = 1 + (node.complexity / 10);
        totalMinutes += baseTime * complexityMultiplier;
      }
    }

    return Math.ceil(totalMinutes / 60);
  }

  exportMappings(): string {
    return JSON.stringify(Array.from(this.mappings.values()), null, 2);
  }

  static fromJSON(json: string): CurriculumEngine {
    const mappings = JSON.parse(json);
    const engine = new CurriculumEngine();
    
    for (const mapping of mappings) {
      engine.addMapping(mapping);
    }
    
    return engine;
  }
}
