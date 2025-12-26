# EmpraDB Data Model

## Core Entities

### MathNode

The atomic unit of mathematical knowledge.

```typescript
{
  id: string                    // Unique identifier (snake_case)
  type: MathNodeType           // Node classification
  title: string                // Human-readable name
  latex?: string               // LaTeX representation
  description: string          // Explanation
  domains: string[]            // Subject areas
  tags: string[]              // Keywords
  complexity: number           // 0-10 difficulty scale
  requires: string[]           // Prerequisite node IDs
  generalizes: string[]        // More abstract concepts
  special_cases: string[]      // More specific instances
  used_in: string[]           // Application contexts
  appears_in: ExamRef[]       // Exam appearances
  created_at: number          // Unix timestamp
  updated_at: number          // Unix timestamp
}
```

**Node Types:**
- `concept`: Abstract mathematical idea (e.g., "derivative")
- `formula`: Mathematical expression (e.g., "product rule")
- `theorem`: Proven statement (e.g., "Pythagorean theorem")
- `definition`: Formal definition (e.g., "limit definition")
- `identity`: Mathematical equality (e.g., "sin²x + cos²x = 1")
- `proof`: Proof technique or structure
- `symbol`: Mathematical notation (e.g., "∑", "∫")

**Complexity Scale:**
- 0-2: Elementary (basic arithmetic, simple algebra)
- 3-4: Intermediate (algebra, basic geometry)
- 5-6: Advanced secondary (calculus, trigonometry)
- 7-8: Undergraduate (analysis, abstract algebra)
- 9-10: Graduate (topology, advanced theory)

### GraphEdge

Represents relationships between nodes.

```typescript
{
  from: string          // Source node ID
  to: string           // Target node ID
  type: EdgeType       // Relationship type
  weight: number       // Edge importance (typically 1)
  metadata?: object    // Optional additional data
}
```

**Edge Types:**
- `REQUIRES`: A → B means B requires A as prerequisite
- `GENERALIZES`: A → B means A is more general than B
- `SPECIAL_CASE_OF`: A → B means A is special case of B
- `USED_IN`: A → B means A is used in context B
- `APPEARS_WITH`: A → B means A and B often appear together

### CurriculumMapping

Maps concepts to specific year levels within education systems.

```typescript
{
  id: string                    // Unique identifier
  system: CurriculumSystem     // Education system
  year_level: number           // Grade/year number
  name: string                 // Human-readable name
  description: string          // Overview
  concepts: string[]           // Required concepts
  optional_concepts: string[]  // Optional concepts
  excluded_concepts: string[]  // Explicitly excluded
  estimated_hours: number      // Total study time
}
```

**Supported Systems:**
- `VCE`: Victorian Certificate of Education (Australia)
- `GCSE`: General Certificate of Secondary Education (UK)
- `A_LEVEL`: A-Level (UK)
- `IB`: International Baccalaureate
- `AP`: Advanced Placement (USA)
- `SAT`: SAT standardized test (USA)
- `ACT`: ACT standardized test (USA)
- `UNIVERSITY`: University-level courses
- `OLYMPIAD`: Mathematical olympiad tracks

### ExamProfile

Defines concept requirements for specific exams.

```typescript
{
  id: string                      // Unique identifier
  system: CurriculumSystem       // Education system
  name: string                   // Exam name
  year_level: number             // Typical grade level
  required_concepts: string[]    // Must know
  optional_concepts: string[]    // Sometimes tested
  excluded_concepts: string[]    // Never tested
  typical_depth: {               // Depth per concept
    [conceptId]: DepthLevel
  }
  time_limit_minutes: number     // Exam duration
}
```

**Depth Levels:**
- `intro`: Surface-level understanding
- `core`: Standard examination depth
- `advanced`: Deep understanding required
- `olympiad`: Competition-level mastery

### ExamRef

Links nodes to specific exam appearances.

```typescript
{
  system: CurriculumSystem
  exam: string           // Exam identifier
  year_level: number     // Grade level
  depth: DepthLevel      // Required depth
  required: boolean      // Is it mandatory?
}
```

### StudyPath

Personalized learning sequence for a user.

```typescript
{
  user_id: string
  target_exam: string
  curriculum: CurriculumSystem
  year_level: number
  time_remaining_days: number
  ordered_concepts: string[]              // Topologically sorted
  confidence_map: {                       // Current confidence
    [conceptId]: number                   // 0.0 to 1.0
  }
  gaps: string[]                          // Missing concepts
  estimated_total_hours: number
}
```

### ConceptProgress

Tracks individual user progress on concepts.

```typescript
{
  user_id: string
  concept_id: string
  confidence: number          // 0.0 to 1.0
  last_reviewed: number       // Unix timestamp
  review_count: number        // Total reviews
  time_spent_seconds: number  // Cumulative time
}
```

**Confidence Scale:**
- 0.0: Not started
- 0.1-0.3: Weak understanding
- 0.4-0.6: Developing understanding
- 0.7-0.9: Strong understanding
- 1.0: Mastery

## Relationship Patterns

### Prerequisite Chains

```
Basic Algebra → Functions → Limits → Derivatives → Integrals
```

Each concept requires mastery of previous concepts.

### Generalization Hierarchies

```
Triangle → Right Triangle → 30-60-90 Triangle
Shape → Polygon → Triangle
```

More general concepts subsume specific cases.

### Application Networks

```
Derivative → Optimization
Derivative → Related Rates
Derivative → Physics (Kinematics)
```

Concepts applied in various contexts.

## Naming Conventions

### Node IDs
- Use snake_case
- Include domain prefix for clarity
- Examples: `calculus_derivative`, `algebra_quadratic`, `geometry_pythagorean`

### Domains
- Use Title Case
- Be specific: "Calculus" not "Math"
- Examples: "Linear Algebra", "Real Analysis", "Number Theory"

### Tags
- Use lowercase
- Single words or hyphenated
- Examples: "fundamental", "derivative-rule", "trigonometric"

## Data Validation Rules

### Required Fields
- Every node must have: `id`, `type`, `title`, `description`, `domains`
- Complexity must be 0-10
- All referenced node IDs must exist

### Graph Constraints
- No cycles in REQUIRES relationships
- All prerequisites must exist
- Generalizations should form DAG

### Curriculum Constraints
- Year levels must be positive integers
- Concepts must exist in graph
- No overlap between required and excluded

### Exam Constraints
- Required concepts must not be in excluded list
- Depth specifications must be valid
- Time limit must be positive

## File Format Standards

### JSON Structure
```json
{
  "id": "node_id",
  "type": "concept",
  "title": "Human Readable Title",
  "latex": "\\LaTeX{} code",
  "description": "Clear explanation...",
  "domains": ["Domain1", "Domain2"],
  "tags": ["tag1", "tag2"],
  "complexity": 5,
  "requires": ["prereq1", "prereq2"],
  "generalizes": [],
  "special_cases": [],
  "used_in": [],
  "appears_in": [],
  "created_at": 1735238400000,
  "updated_at": 1735238400000
}
```

### CSV Structure
```csv
id,type,title,latex,description,domains,tags,complexity,requires
node_id,concept,Title,"\\latex",Description,"Domain1;Domain2","tag1;tag2",5,"prereq1;prereq2"
```

Use semicolons for list separators within CSV fields.

## Query Patterns

### Find Prerequisites
```typescript
const prereqs = graph.getAllPrerequisites("calculus_derivative");
// Returns: ["calculus_limit", "function", "real_numbers"]
```

### Get Study Path
```typescript
const path = graph.topologicalSort(targetConcepts);
// Returns ordered learning sequence
```

### Search by Domain
```typescript
const nodes = searchEngine.searchByDomain("Calculus");
// Returns all calculus-related nodes
```

### Check Exam Coverage
```typescript
const readiness = examEngine.estimateExamReadiness(
  examId, 
  knownConcepts
);
// Returns coverage percentages
```
