# EmpraDB Architecture

## Overview

EmpraDB is a monorepo containing a mathematical knowledge graph, curriculum mapping system, exam intelligence engine, and study planning tools.

## System Design

```
┌────────────────────┐
│   Math Knowledge    │
│   Graph (Truth)     │  ← Immutable mathematical relationships
└─────────┬──────────┘
          │
┌─────────┴──────────┐
│ Curriculum Mapping  │  ← Year-level overlays (VCE, IB, AP, etc.)
└─────────┬──────────┘
          │
┌─────────┴──────────┐
│  Exam Intelligence  │  ← Test-specific concept requirements
└─────────┬──────────┘
          │
┌─────────┴──────────┐
│   Study Hub UI      │  ← Generated learning paths
└────────────────────┘
```

## Core Packages

### @empradb/schema
Type definitions for all data structures.

- `MathNode`: Concepts, formulas, theorems, definitions
- `GraphEdge`: Typed relationships (REQUIRES, GENERALIZES, etc.)
- `CurriculumMapping`: Year-level concept selections
- `ExamProfile`: Test-specific requirements
- `StudyPath`: Personalized learning sequences

### @empradb/graph
Dependency graph engine for mathematical relationships.

**Key Operations:**
- `getAllPrerequisites()`: Transitive closure of dependencies
- `topologicalSort()`: Ordered learning sequences
- `detectCycles()`: Graph validation
- `getSubgraph()`: Extract concept subsets

### @empradb/curriculum
Maps concepts to education systems and year levels.

**Features:**
- Multi-system support (VCE, IB, AP, GCSE, SAT)
- Year-level filtering
- Optional vs required concept distinction
- Program comparison tools

### @empradb/exams
Exam-specific concept mapping and readiness analysis.

**Features:**
- Required/optional/excluded concept lists
- Depth specifications (intro, core, advanced)
- Study plan generation
- Readiness estimation

### @empradb/search
Fast, math-aware search with inverted indexing.

**Features:**
- Multi-field search (title, description, LaTeX)
- Domain and tag filtering
- Type filtering (concept, formula, theorem)
- Complexity range queries
- Autocomplete suggestions

### @empradb/diagnostics
User progress tracking and gap analysis.

**Features:**
- Confidence scoring (0.0-1.0)
- Prerequisite gap detection
- Personalized study paths
- Review scheduling
- Next concept recommendations

### @empradb/renderer
LaTeX and mathematical notation rendering.

**Features:**
- Formula rendering
- Theorem/definition formatting
- Concept cards with confidence bars
- Dependency graph visualization
- Dark/light themes

## Data Model

### Node Structure
```typescript
{
  id: string
  type: "concept" | "formula" | "theorem" | ...
  title: string
  latex?: string
  description: string
  domains: string[]
  requires: string[]        // Prerequisites
  generalizes: string[]     // More general concepts
  special_cases: string[]   // More specific cases
  appears_in: ExamRef[]
}
```

### Edge Types
- `REQUIRES`: Prerequisite relationship
- `GENERALIZES`: Abstraction relationship
- `SPECIAL_CASE_OF`: Specialization relationship
- `USED_IN`: Application relationship

## Data Storage

### File Organization
```
data/
├── math/
│   ├── concepts/       # Core mathematical concepts
│   ├── formulas/       # Mathematical formulas
│   ├── theorems/       # Theorems and proofs
│   └── symbols/        # Mathematical symbols
├── curricula/
│   ├── vce/
│   ├── ib/
│   ├── ap/
│   └── gcse/
└── exams/
    ├── vce_methods/
    └── ap_calculus/
```

### Index Files
Built by `scripts/build_index.ts`:
- `graph.json`: Complete knowledge graph
- `metadata.json`: Build info and statistics
- `index_stats.json`: Indexing metrics

## Build Pipeline

1. **Ingestion** (`scripts/ingest_math.ts`)
   - Load math data from JSON/CSV
   - Validate node structure
   - Organize by type

2. **Index Building** (`scripts/build_index.ts`)
   - Construct graph edges from node relationships
   - Build search indexes
   - Generate metadata

3. **Validation** (`scripts/validate_graph.ts`)
   - Check for cycles
   - Verify prerequisite completeness
   - Detect orphaned nodes

## Extensibility

### Adding New Curricula
1. Create JSON in `data/curricula/{system}/`
2. Define concept lists and year levels
3. Specify excluded concepts
4. Run index rebuild

### Adding New Exams
1. Create JSON in `data/exams/`
2. Map required/optional/excluded concepts
3. Define depth levels per concept
4. Run index rebuild

### Adding Math Content
1. Create node JSON in appropriate `data/math/` subdirectory
2. Define relationships (requires, generalizes, etc.)
3. Add exam references
4. Run ingestion and index build

## Philosophy

**Separation of Concerns:**
- Math knowledge is immutable and universal
- Curricula are temporary overlays on truth
- Exams are filters on curricula
- Study paths are generated, not hardcoded

**Zero Coupling:**
- Graph engine doesn't know about curricula
- Curriculum engine doesn't know about exams
- All layers compose independently

**Data-Driven:**
- No hardcoded learning paths
- All relationships explicit in data
- Algorithms operate on pure graph structure
