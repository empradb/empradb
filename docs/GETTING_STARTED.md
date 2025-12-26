# Getting Started with EmpraDB

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm 9+

### Installation

```bash
git clone https://github.com/empradb/empradb.git
cd empradb
npm install
```

### Build the Project

```bash
npm run build
```

### Run Development Server

```bash
npm run dev
```

The web interface will be available at `http://localhost:3000`  
The API will be available at `http://localhost:3001`

## Project Structure

```
EmpraDB/
├── apps/
│   ├── web/          # Next.js frontend
│   ├── api/          # Express backend
│   └── planner/      # Study path generator
├── packages/
│   ├── schema/       # TypeScript types
│   ├── graph/        # Graph engine
│   ├── curriculum/   # Curriculum mappings
│   ├── exams/        # Exam profiles
│   ├── search/       # Search engine
│   ├── diagnostics/  # Progress tracking
│   └── renderer/     # LaTeX rendering
├── data/
│   ├── math/         # Mathematical content
│   ├── curricula/    # Curriculum data
│   └── exams/        # Exam data
├── scripts/          # Build and validation
└── docs/             # Documentation
```

## Adding Content

### Add Mathematical Concepts

1. Create or edit files in `data/math/concepts/`
2. Use consolidated JSON arrays (see `calculus.json`, `algebra.json`)
3. Run validation:

```bash
npm run validate:graph
```

### Add Curricula

1. Create JSON in `data/curricula/{system}/`
2. Map concepts to year levels
3. Rebuild indexes:

```bash
npm run build:index
```

### Add Exam Profiles

1. Create JSON in `data/exams/`
2. Define required/optional concepts
3. Rebuild indexes:

```bash
npm run build:index
```

## Working with Data

### Ingest New Data

```bash
npm run ingest:math path/to/data.json
```

Supports JSON and CSV formats.

### Validate Graph

```bash
npm run validate:graph
```

Checks for:
- Cycles in prerequisites
- Missing nodes
- Orphaned concepts
- Data completeness

### Build Search Indexes

```bash
npm run build:index
```

Generates:
- `data/indexes/graph.json`
- `data/indexes/metadata.json`
- `data/indexes/index_stats.json`

## Development Workflow

### Working on Packages

Each package has its own build:

```bash
cd packages/graph
npm run dev
```

### Testing Changes

```bash
npm run test
npm run lint
```

### Hot Reload

The monorepo supports hot reload:

```bash
npm run dev
```

Changes to packages automatically rebuild.

## API Usage

### Search Concepts

```bash
curl http://localhost:3001/api/search?q=derivative&limit=10
```

### Get Node Details

```bash
curl http://localhost:3001/api/node/calculus_derivative
```

### Generate Study Path

```bash
curl -X POST http://localhost:3001/api/study-path \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "targetConcepts": ["optimization", "related_rates"],
    "timeRemainingDays": 30
  }'
```

## Common Tasks

### Add a New Concept

1. Edit `data/math/concepts/{domain}.json`
2. Add your concept to the array
3. Define prerequisites
4. Run validation and rebuild:

```bash
npm run validate:graph
npm run build:index
```

### Add a New Curriculum

1. Create `data/curricula/{system}/{subject}.json`
2. List required concepts
3. Rebuild indexes:

```bash
npm run build:index
```

### Update the Web Interface

1. Edit files in `apps/web/app/`
2. Changes hot-reload automatically
3. Build for production:

```bash
cd apps/web
npm run build
```

## Troubleshooting

### Build Fails

```bash
npm run clean
npm install
npm run build
```

### Graph Validation Errors

Check for:
- Missing prerequisite nodes
- Circular dependencies
- Incorrect node IDs

### Search Not Working

Ensure indexes are built:

```bash
npm run build:index
```

## Next Steps

- Read [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- Read [DATA_MODEL.md](./DATA_MODEL.md) for data structures
- Read [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines
- Check [ROADMAP.md](./ROADMAP.md) for future plans

## Getting Help

- GitHub Issues: Bug reports and feature requests
- GitHub Discussions: Questions and ideas
- Documentation: `docs/` directory

## Philosophy

Remember: Math is truth. Curricula are overlays. EmpraDB separates the two.

Build with care. This database will help students worldwide.
