export type MathNodeType = "concept" | "formula" | "theorem" | "definition" | "identity" | "proof" | "symbol";

export type EdgeType = "REQUIRES" | "GENERALIZES" | "SPECIAL_CASE_OF" | "USED_IN" | "APPEARS_WITH";

export type DepthLevel = "intro" | "core" | "advanced" | "olympiad";

export type CurriculumSystem = "VCE" | "GCSE" | "A_LEVEL" | "IB" | "AP" | "SAT" | "ACT" | "UNIVERSITY" | "OLYMPIAD";

export interface ExamRef {
  system: CurriculumSystem;
  exam: string;
  year_level: number;
  depth: DepthLevel;
  required: boolean;
}

export interface MathNode {
  id: string;
  type: MathNodeType;
  title: string;
  latex?: string;
  description: string;
  domains: string[];
  tags: string[];
  complexity: number;
  requires: string[];
  generalizes: string[];
  special_cases: string[];
  used_in: string[];
  appears_in: ExamRef[];
  created_at: number;
  updated_at: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  type: EdgeType;
  weight: number;
  metadata?: Record<string, unknown>;
}

export interface CurriculumMapping {
  id: string;
  system: CurriculumSystem;
  year_level: number;
  name: string;
  description: string;
  concepts: string[];
  optional_concepts: string[];
  excluded_concepts: string[];
  estimated_hours: number;
}

export interface ExamProfile {
  id: string;
  system: CurriculumSystem;
  name: string;
  year_level: number;
  required_concepts: string[];
  optional_concepts: string[];
  excluded_concepts: string[];
  typical_depth: Record<string, DepthLevel>;
  time_limit_minutes: number;
}

export interface StudyPath {
  user_id: string;
  target_exam: string;
  curriculum: CurriculumSystem;
  year_level: number;
  time_remaining_days: number;
  ordered_concepts: string[];
  confidence_map: Record<string, number>;
  gaps: string[];
  estimated_total_hours: number;
}

export interface ConceptProgress {
  user_id: string;
  concept_id: string;
  confidence: number;
  last_reviewed: number;
  review_count: number;
  time_spent_seconds: number;
}
