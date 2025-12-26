import { ExamProfile, CurriculumSystem, DepthLevel, MathNode } from "@empradb/schema";
import { MathGraph } from "@empradb/graph";

export class ExamEngine {
  private profiles: Map<string, ExamProfile>;

  constructor() {
    this.profiles = new Map();
  }

  addProfile(profile: ExamProfile): void {
    this.profiles.set(profile.id, profile);
  }

  getProfile(examId: string): ExamProfile | undefined {
    return this.profiles.get(examId);
  }

  getExamsBySystem(system: CurriculumSystem): ExamProfile[] {
    return Array.from(this.profiles.values()).filter(p => p.system === system);
  }

  getExamsByYearLevel(yearLevel: number): ExamProfile[] {
    return Array.from(this.profiles.values()).filter(p => p.year_level === yearLevel);
  }

  getAllRequiredConcepts(examId: string): string[] {
    const profile = this.getProfile(examId);
    return profile ? profile.required_concepts : [];
  }

  getConceptDepthForExam(conceptId: string, examId: string): DepthLevel | null {
    const profile = this.getProfile(examId);
    if (!profile) return null;
    return profile.typical_depth[conceptId] || null;
  }

  isConceptRequired(conceptId: string, examId: string): boolean {
    const profile = this.getProfile(examId);
    return profile ? profile.required_concepts.includes(conceptId) : false;
  }

  isConceptOptional(conceptId: string, examId: string): boolean {
    const profile = this.getProfile(examId);
    return profile ? profile.optional_concepts.includes(conceptId) : false;
  }

  isConceptExcluded(conceptId: string, examId: string): boolean {
    const profile = this.getProfile(examId);
    return profile ? profile.excluded_concepts.includes(conceptId) : false;
  }

  getExamSubgraph(graph: MathGraph, examId: string, includeOptional: boolean = false): MathGraph {
    const profile = this.getProfile(examId);
    if (!profile) return new MathGraph();

    const conceptSet = new Set<string>(profile.required_concepts);
    
    if (includeOptional) {
      profile.optional_concepts.forEach(c => conceptSet.add(c));
    }

    const allPrereqs = new Set<string>();
    for (const conceptId of conceptSet) {
      const prereqs = graph.getAllPrerequisites(conceptId);
      prereqs.forEach(p => allPrereqs.add(p));
    }
    allPrereqs.forEach(p => conceptSet.add(p));

    const filtered = Array.from(conceptSet).filter(
      id => !profile.excluded_concepts.includes(id)
    );

    return graph.getSubgraph(filtered);
  }

  getStudyPlan(
    graph: MathGraph,
    examId: string,
    knownConcepts: Set<string> = new Set(),
    includeOptional: boolean = false
  ): {
    ordered: string[];
    required: string[];
    optional: string[];
    gaps: string[];
    totalConcepts: number;
  } {
    const profile = this.getProfile(examId);
    if (!profile) {
      return { ordered: [], required: [], optional: [], gaps: [], totalConcepts: 0 };
    }

    const requiredSet = new Set(profile.required_concepts);
    const optionalSet = new Set(profile.optional_concepts);
    
    const allConcepts = new Set<string>();
    profile.required_concepts.forEach(c => allConcepts.add(c));
    
    if (includeOptional) {
      profile.optional_concepts.forEach(c => allConcepts.add(c));
    }

    const allPrereqs = new Set<string>();
    for (const conceptId of allConcepts) {
      const prereqs = graph.getAllPrerequisites(conceptId);
      prereqs.forEach(p => {
        if (!profile.excluded_concepts.includes(p)) {
          allPrereqs.add(p);
        }
      });
    }

    const studySet = new Set([...allConcepts, ...allPrereqs]);
    const toStudy = Array.from(studySet).filter(id => !knownConcepts.has(id));

    const ordered = graph.topologicalSort(toStudy);
    const required = ordered.filter(id => requiredSet.has(id));
    const optional = ordered.filter(id => optionalSet.has(id));
    const gaps = ordered.filter(id => !requiredSet.has(id) && !optionalSet.has(id));

    return {
      ordered,
      required,
      optional,
      gaps,
      totalConcepts: ordered.length
    };
  }

  compareExams(
    examId1: string,
    examId2: string
  ): {
    shared: string[];
    only1: string[];
    only2: string[];
    depthDifferences: Array<{ conceptId: string; depth1: DepthLevel | null; depth2: DepthLevel | null }>;
  } {
    const profile1 = this.getProfile(examId1);
    const profile2 = this.getProfile(examId2);

    if (!profile1 || !profile2) {
      return { shared: [], only1: [], only2: [], depthDifferences: [] };
    }

    const concepts1 = new Set([...profile1.required_concepts, ...profile1.optional_concepts]);
    const concepts2 = new Set([...profile2.required_concepts, ...profile2.optional_concepts]);

    const shared: string[] = [];
    const only1: string[] = [];
    const only2: string[] = [];
    const depthDifferences: Array<{ conceptId: string; depth1: DepthLevel | null; depth2: DepthLevel | null }> = [];

    for (const c of concepts1) {
      if (concepts2.has(c)) {
        shared.push(c);
        const depth1 = profile1.typical_depth[c] || null;
        const depth2 = profile2.typical_depth[c] || null;
        if (depth1 !== depth2) {
          depthDifferences.push({ conceptId: c, depth1, depth2 });
        }
      } else {
        only1.push(c);
      }
    }

    for (const c of concepts2) {
      if (!concepts1.has(c)) {
        only2.push(c);
      }
    }

    return { shared, only1, only2, depthDifferences };
  }

  estimateExamReadiness(
    examId: string,
    knownConcepts: Set<string>
  ): {
    requiredCoverage: number;
    optionalCoverage: number;
    missingRequired: string[];
    missingOptional: string[];
  } {
    const profile = this.getProfile(examId);
    if (!profile) {
      return { requiredCoverage: 0, optionalCoverage: 0, missingRequired: [], missingOptional: [] };
    }

    const missingRequired = profile.required_concepts.filter(c => !knownConcepts.has(c));
    const missingOptional = profile.optional_concepts.filter(c => !knownConcepts.has(c));

    const requiredCoverage = profile.required_concepts.length > 0
      ? ((profile.required_concepts.length - missingRequired.length) / profile.required_concepts.length) * 100
      : 100;

    const optionalCoverage = profile.optional_concepts.length > 0
      ? ((profile.optional_concepts.length - missingOptional.length) / profile.optional_concepts.length) * 100
      : 100;

    return {
      requiredCoverage: Math.round(requiredCoverage * 10) / 10,
      optionalCoverage: Math.round(optionalCoverage * 10) / 10,
      missingRequired,
      missingOptional
    };
  }

  exportProfiles(): string {
    return JSON.stringify(Array.from(this.profiles.values()), null, 2);
  }

  static fromJSON(json: string): ExamEngine {
    const profiles = JSON.parse(json);
    const engine = new ExamEngine();
    
    for (const profile of profiles) {
      engine.addProfile(profile);
    }
    
    return engine;
  }
}
