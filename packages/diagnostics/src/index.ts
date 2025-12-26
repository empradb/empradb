import { ConceptProgress, StudyPath } from "@empradb/schema";
import { MathGraph } from "@empradb/graph";

export class DiagnosticsEngine {
  private progress: Map<string, Map<string, ConceptProgress>>;

  constructor() {
    this.progress = new Map();
  }

  updateProgress(userId: string, conceptId: string, update: Partial<ConceptProgress>): void {
    if (!this.progress.has(userId)) {
      this.progress.set(userId, new Map());
    }

    const userProgress = this.progress.get(userId)!;
    const existing = userProgress.get(conceptId);

    const now = Date.now();
    const newProgress: ConceptProgress = {
      user_id: userId,
      concept_id: conceptId,
      confidence: update.confidence ?? existing?.confidence ?? 0,
      last_reviewed: update.last_reviewed ?? now,
      review_count: (existing?.review_count ?? 0) + 1,
      time_spent_seconds: (existing?.time_spent_seconds ?? 0) + (update.time_spent_seconds ?? 0)
    };

    userProgress.set(conceptId, newProgress);
  }

  getProgress(userId: string, conceptId: string): ConceptProgress | null {
    return this.progress.get(userId)?.get(conceptId) || null;
  }

  getUserProgress(userId: string): ConceptProgress[] {
    const userProgress = this.progress.get(userId);
    return userProgress ? Array.from(userProgress.values()) : [];
  }

  getConfidence(userId: string, conceptId: string): number {
    const prog = this.getProgress(userId, conceptId);
    return prog ? prog.confidence : 0;
  }

  getKnownConcepts(userId: string, threshold: number = 0.7): Set<string> {
    const userProgress = this.getUserProgress(userId);
    return new Set(
      userProgress
        .filter(p => p.confidence >= threshold)
        .map(p => p.concept_id)
    );
  }

  detectGaps(
    userId: string,
    graph: MathGraph,
    targetConcepts: string[],
    confidenceThreshold: number = 0.7
  ): {
    missing: string[];
    weak: string[];
    strongPrereqs: string[];
  } {
    const known = this.getKnownConcepts(userId, confidenceThreshold);
    const missing: string[] = [];
    const weak: string[] = [];
    const allRequired = new Set<string>();

    for (const conceptId of targetConcepts) {
      const prereqs = graph.getAllPrerequisites(conceptId);
      prereqs.forEach(p => allRequired.add(p));
      allRequired.add(conceptId);
    }

    for (const conceptId of allRequired) {
      const confidence = this.getConfidence(userId, conceptId);
      
      if (confidence === 0) {
        missing.push(conceptId);
      } else if (confidence < confidenceThreshold) {
        weak.push(conceptId);
      }
    }

    const strongPrereqs = Array.from(allRequired).filter(
      id => known.has(id) && !targetConcepts.includes(id)
    );

    return { missing, weak, strongPrereqs };
  }

  generateStudyPath(
    userId: string,
    graph: MathGraph,
    targetConcepts: string[],
    timeRemainingDays: number,
    targetExam: string,
    curriculumSystem: string,
    yearLevel: number
  ): StudyPath {
    const gaps = this.detectGaps(userId, graph, targetConcepts);
    const toStudy = [...gaps.missing, ...gaps.weak];
    
    const ordered = graph.topologicalSort(toStudy);
    
    const confidenceMap: Record<string, number> = {};
    for (const conceptId of ordered) {
      confidenceMap[conceptId] = this.getConfidence(userId, conceptId);
    }

    let totalHours = 0;
    for (const conceptId of ordered) {
      const node = graph.getNode(conceptId);
      if (node) {
        const baseTime = 0.5;
        const complexityMultiplier = 1 + (node.complexity / 10);
        const confidenceDiscount = confidenceMap[conceptId] || 0;
        totalHours += baseTime * complexityMultiplier * (1 - confidenceDiscount * 0.5);
      }
    }

    return {
      user_id: userId,
      target_exam: targetExam,
      curriculum: curriculumSystem as any,
      year_level: yearLevel,
      time_remaining_days: timeRemainingDays,
      ordered_concepts: ordered,
      confidence_map: confidenceMap,
      gaps: gaps.missing,
      estimated_total_hours: Math.ceil(totalHours)
    };
  }

  getWeakestPrerequisites(
    userId: string,
    graph: MathGraph,
    conceptId: string,
    limit: number = 5
  ): Array<{ conceptId: string; confidence: number }> {
    const prereqs = graph.getAllPrerequisites(conceptId);
    const weakPrereqs: Array<{ conceptId: string; confidence: number }> = [];

    for (const prereqId of prereqs) {
      const confidence = this.getConfidence(userId, prereqId);
      weakPrereqs.push({ conceptId: prereqId, confidence });
    }

    weakPrereqs.sort((a, b) => a.confidence - b.confidence);
    return weakPrereqs.slice(0, limit);
  }

  recommendNextConcepts(
    userId: string,
    graph: MathGraph,
    targetConcepts: string[],
    limit: number = 5
  ): string[] {
    const known = this.getKnownConcepts(userId, 0.7);
    const studyPath = this.generateStudyPath(
      userId,
      graph,
      targetConcepts,
      30,
      "unknown",
      "UNKNOWN",
      0
    );

    const candidates: Array<{ id: string; priority: number }> = [];

    for (const conceptId of studyPath.ordered_concepts) {
      if (known.has(conceptId)) continue;

      const prereqs = graph.getPrerequisites(conceptId);
      const prereqsMet = prereqs.every(p => known.has(p));

      if (prereqsMet) {
        const confidence = this.getConfidence(userId, conceptId);
        const priority = (1 - confidence) * 10;
        candidates.push({ id: conceptId, priority });
      }
    }

    candidates.sort((a, b) => b.priority - a.priority);
    return candidates.slice(0, limit).map(c => c.id);
  }

  getStudyStats(userId: string): {
    totalConcepts: number;
    strongConcepts: number;
    weakConcepts: number;
    unstartedConcepts: number;
    totalTimeSpent: number;
    averageConfidence: number;
  } {
    const userProgress = this.getUserProgress(userId);
    
    const strong = userProgress.filter(p => p.confidence >= 0.7).length;
    const weak = userProgress.filter(p => p.confidence > 0 && p.confidence < 0.7).length;
    const unstarted = userProgress.filter(p => p.confidence === 0).length;
    const totalTime = userProgress.reduce((sum, p) => sum + p.time_spent_seconds, 0);
    const avgConfidence = userProgress.length > 0
      ? userProgress.reduce((sum, p) => sum + p.confidence, 0) / userProgress.length
      : 0;

    return {
      totalConcepts: userProgress.length,
      strongConcepts: strong,
      weakConcepts: weak,
      unstartedConcepts: unstarted,
      totalTimeSpent: Math.round(totalTime / 60),
      averageConfidence: Math.round(avgConfidence * 100) / 100
    };
  }

  needsReview(userId: string, conceptId: string, daysSinceLastReview: number = 7): boolean {
    const prog = this.getProgress(userId, conceptId);
    if (!prog || prog.confidence === 0) return false;

    const daysSince = (Date.now() - prog.last_reviewed) / (1000 * 60 * 60 * 24);
    return daysSince >= daysSinceLastReview;
  }

  getReviewList(userId: string, limit: number = 10): string[] {
    const userProgress = this.getUserProgress(userId);
    const needReview = userProgress.filter(p => this.needsReview(userId, p.concept_id));
    
    needReview.sort((a, b) => {
      const aDays = (Date.now() - a.last_reviewed) / (1000 * 60 * 60 * 24);
      const bDays = (Date.now() - b.last_reviewed) / (1000 * 60 * 60 * 24);
      return bDays - aDays;
    });

    return needReview.slice(0, limit).map(p => p.concept_id);
  }

  exportProgress(userId: string): string {
    const userProgress = this.getUserProgress(userId);
    return JSON.stringify(userProgress, null, 2);
  }

  importProgress(userId: string, json: string): void {
    const progressArray: ConceptProgress[] = JSON.parse(json);
    
    if (!this.progress.has(userId)) {
      this.progress.set(userId, new Map());
    }
    
    const userProgress = this.progress.get(userId)!;
    for (const prog of progressArray) {
      userProgress.set(prog.concept_id, prog);
    }
  }
}
