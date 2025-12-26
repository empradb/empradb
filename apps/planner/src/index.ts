import { MathGraph } from "@empradb/graph";
import { CurriculumEngine } from "@empradb/curriculum";
import { ExamEngine } from "@empradb/exams";
import { DiagnosticsEngine } from "@empradb/diagnostics";
import { StudyPath } from "@empradb/schema";

export class StudyPlanner {
  private graph: MathGraph;
  private curriculumEngine: CurriculumEngine;
  private examEngine: ExamEngine;
  private diagnosticsEngine: DiagnosticsEngine;

  constructor(
    graph: MathGraph,
    curriculumEngine: CurriculumEngine,
    examEngine: ExamEngine,
    diagnosticsEngine: DiagnosticsEngine
  ) {
    this.graph = graph;
    this.curriculumEngine = curriculumEngine;
    this.examEngine = examEngine;
    this.diagnosticsEngine = diagnosticsEngine;
  }

  generateExamStudyPath(
    userId: string,
    examId: string,
    timeRemainingDays: number,
    includeOptional: boolean = false
  ): StudyPath | null {
    const examProfile = this.examEngine.getProfile(examId);
    if (!examProfile) return null;

    const knownConcepts = this.diagnosticsEngine.getKnownConcepts(userId, 0.7);
    
    const studyPlan = this.examEngine.getStudyPlan(
      this.graph,
      examId,
      knownConcepts,
      includeOptional
    );

    return this.diagnosticsEngine.generateStudyPath(
      userId,
      this.graph,
      studyPlan.ordered,
      timeRemainingDays,
      examId,
      examProfile.system,
      examProfile.year_level
    );
  }

  generateCurriculumStudyPath(
    userId: string,
    system: string,
    yearLevel: number,
    timeRemainingDays: number
  ): StudyPath | null {
    const mapping = this.curriculumEngine.getMapping(system as any, yearLevel);
    if (!mapping) return null;

    const knownConcepts = this.diagnosticsEngine.getKnownConcepts(userId, 0.7);
    const toStudy = mapping.concepts.filter(c => !knownConcepts.has(c));

    return this.diagnosticsEngine.generateStudyPath(
      userId,
      this.graph,
      toStudy,
      timeRemainingDays,
      `${system}_year${yearLevel}`,
      system as any,
      yearLevel
    );
  }

  optimizeStudyOrder(
    userId: string,
    targetConcepts: string[],
    prioritizeWeakPrereqs: boolean = true
  ): string[] {
    const knownConcepts = this.diagnosticsEngine.getKnownConcepts(userId, 0.7);
    const weakConcepts = new Set<string>();

    for (const conceptId of targetConcepts) {
      const confidence = this.diagnosticsEngine.getConfidence(userId, conceptId);
      if (confidence > 0 && confidence < 0.7) {
        weakConcepts.add(conceptId);
      }
    }

    const allRequired = new Set<string>(targetConcepts);
    for (const conceptId of targetConcepts) {
      const prereqs = this.graph.getAllPrerequisites(conceptId);
      prereqs.forEach(p => allRequired.add(p));
    }

    const toStudy = Array.from(allRequired).filter(c => !knownConcepts.has(c));
    const ordered = this.graph.topologicalSort(toStudy);

    if (prioritizeWeakPrereqs) {
      return ordered.sort((a, b) => {
        const aWeak = weakConcepts.has(a);
        const bWeak = weakConcepts.has(b);
        if (aWeak && !bWeak) return -1;
        if (!aWeak && bWeak) return 1;
        return 0;
      });
    }

    return ordered;
  }

  estimateDailyLoad(
    studyPath: StudyPath,
    maxDailyHours: number = 2
  ): {
    dailyHours: number;
    conceptsPerDay: number;
    weeksRequired: number;
    feasible: boolean;
  } {
    const totalHours = studyPath.estimated_total_hours;
    const days = studyPath.time_remaining_days;
    const dailyHours = totalHours / days;

    const conceptsPerDay = Math.ceil(studyPath.ordered_concepts.length / days);
    const weeksRequired = Math.ceil(days / 7);
    const feasible = dailyHours <= maxDailyHours;

    return {
      dailyHours: Math.round(dailyHours * 10) / 10,
      conceptsPerDay,
      weeksRequired,
      feasible,
    };
  }

  identifyCriticalPath(
    targetConcepts: string[]
  ): {
    criticalConcepts: string[];
    depth: number;
    totalPrerequisites: number;
  } {
    const allPrereqs = new Set<string>();
    let maxDepth = 0;

    for (const conceptId of targetConcepts) {
      const prereqs = this.graph.getAllPrerequisites(conceptId);
      prereqs.forEach(p => allPrereqs.add(p));

      let depth = 0;
      let current = new Set([conceptId]);
      while (current.size > 0) {
        const next = new Set<string>();
        for (const c of current) {
          const p = this.graph.getPrerequisites(c);
          p.forEach(pr => next.add(pr));
        }
        if (next.size > 0) depth++;
        current = next;
      }
      maxDepth = Math.max(maxDepth, depth);
    }

    const criticalConcepts = this.graph.topologicalSort([
      ...targetConcepts,
      ...Array.from(allPrereqs),
    ]);

    return {
      criticalConcepts,
      depth: maxDepth,
      totalPrerequisites: allPrereqs.size,
    };
  }

  suggestReviewSchedule(
    userId: string,
    studyPath: StudyPath
  ): Array<{ date: Date; concepts: string[] }> {
    const schedule: Array<{ date: Date; concepts: string[] }> = [];
    const startDate = new Date();
    const conceptsPerSession = Math.ceil(
      studyPath.ordered_concepts.length / studyPath.time_remaining_days
    );

    for (let day = 0; day < studyPath.time_remaining_days; day++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + day);

      const startIdx = day * conceptsPerSession;
      const endIdx = Math.min(
        startIdx + conceptsPerSession,
        studyPath.ordered_concepts.length
      );

      const concepts = studyPath.ordered_concepts.slice(startIdx, endIdx);

      if (concepts.length > 0) {
        schedule.push({ date, concepts });
      }
    }

    return schedule;
  }

  compareStudyPaths(
    userId: string,
    examId1: string,
    examId2: string
  ): {
    exam1Only: string[];
    exam2Only: string[];
    shared: string[];
    exam1Hours: number;
    exam2Hours: number;
  } | null {
    const path1 = this.generateExamStudyPath(userId, examId1, 90);
    const path2 = this.generateExamStudyPath(userId, examId2, 90);

    if (!path1 || !path2) return null;

    const set1 = new Set(path1.ordered_concepts);
    const set2 = new Set(path2.ordered_concepts);

    const exam1Only = path1.ordered_concepts.filter(c => !set2.has(c));
    const exam2Only = path2.ordered_concepts.filter(c => !set1.has(c));
    const shared = path1.ordered_concepts.filter(c => set2.has(c));

    return {
      exam1Only,
      exam2Only,
      shared,
      exam1Hours: path1.estimated_total_hours,
      exam2Hours: path2.estimated_total_hours,
    };
  }
}

export default StudyPlanner;
