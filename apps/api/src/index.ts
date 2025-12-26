import express from "express";
import cors from "cors";
import { MathGraph } from "@empradb/graph";
import { MathSearchEngine } from "@empradb/search";
import { CurriculumEngine } from "@empradb/curriculum";
import { ExamEngine } from "@empradb/exams";
import { DiagnosticsEngine } from "@empradb/diagnostics";
import * as fs from "fs";
import * as path from "path";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

let graph: MathGraph;
let searchEngine: MathSearchEngine;
let curriculumEngine: CurriculumEngine;
let examEngine: ExamEngine;
let diagnosticsEngine: DiagnosticsEngine;

async function initializeEngines() {
  console.log("Initializing engines...");

  const dataPath = path.join(__dirname, "../../../data/indexes/graph.json");
  
  if (fs.existsSync(dataPath)) {
    const graphData = fs.readFileSync(dataPath, "utf-8");
    graph = MathGraph.fromJSON(graphData);
    console.log("Loaded graph from disk");
  } else {
    graph = new MathGraph();
    console.log("Created empty graph");
  }

  searchEngine = new MathSearchEngine();
  curriculumEngine = new CurriculumEngine();
  examEngine = new ExamEngine();
  diagnosticsEngine = new DiagnosticsEngine();

  const nodes = JSON.parse(graph.exportJSON()).nodes;
  nodes.forEach((node: any) => searchEngine.addNode(node));

  console.log("Engines initialized");
}

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

app.get("/api/search", (req, res) => {
  const { q, limit } = req.query;
  
  if (!q || typeof q !== "string") {
    return res.status(400).json({ error: "Query parameter 'q' is required" });
  }

  const results = searchEngine.search(q, parseInt(limit as string) || 20);
  res.json({ results, count: results.length });
});

app.get("/api/node/:id", (req, res) => {
  const { id } = req.params;
  const node = graph.getNode(id);

  if (!node) {
    return res.status(404).json({ error: "Node not found" });
  }

  const prerequisites = graph.getPrerequisites(id);
  const dependents = graph.getDependents(id);

  res.json({
    node,
    prerequisites,
    dependents,
  });
});

app.get("/api/prerequisites/:id", (req, res) => {
  const { id } = req.params;
  const allPrereqs = graph.getAllPrerequisites(id);

  res.json({
    conceptId: id,
    prerequisites: Array.from(allPrereqs),
    count: allPrereqs.size,
  });
});

app.post("/api/study-path", (req, res) => {
  const { userId, targetConcepts, timeRemainingDays, targetExam, curriculum, yearLevel } = req.body;

  if (!userId || !targetConcepts || !Array.isArray(targetConcepts)) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const studyPath = diagnosticsEngine.generateStudyPath(
    userId,
    graph,
    targetConcepts,
    timeRemainingDays || 30,
    targetExam || "unknown",
    curriculum || "UNKNOWN",
    yearLevel || 0
  );

  res.json(studyPath);
});

app.get("/api/exam/:examId", (req, res) => {
  const { examId } = req.params;
  const profile = examEngine.getProfile(examId);

  if (!profile) {
    return res.status(404).json({ error: "Exam not found" });
  }

  res.json(profile);
});

app.post("/api/exam/:examId/study-plan", (req, res) => {
  const { examId } = req.params;
  const { userId, includeOptional } = req.body;

  const knownConcepts = new Set<string>();
  if (userId) {
    const known = diagnosticsEngine.getKnownConcepts(userId, 0.7);
    known.forEach(c => knownConcepts.add(c));
  }

  const studyPlan = examEngine.getStudyPlan(
    graph,
    examId,
    knownConcepts,
    includeOptional || false
  );

  res.json(studyPlan);
});

app.get("/api/curriculum/:system/:year", (req, res) => {
  const { system, year } = req.params;
  const yearLevel = parseInt(year);

  const mapping = curriculumEngine.getMapping(system as any, yearLevel);

  if (!mapping) {
    return res.status(404).json({ error: "Curriculum mapping not found" });
  }

  res.json(mapping);
});

app.post("/api/progress/:userId", (req, res) => {
  const { userId } = req.params;
  const { conceptId, confidence, timeSpentSeconds } = req.body;

  if (!conceptId) {
    return res.status(400).json({ error: "conceptId is required" });
  }

  diagnosticsEngine.updateProgress(userId, conceptId, {
    confidence,
    time_spent_seconds: timeSpentSeconds,
  });

  const progress = diagnosticsEngine.getProgress(userId, conceptId);
  res.json(progress);
});

app.get("/api/progress/:userId", (req, res) => {
  const { userId } = req.params;
  const progress = diagnosticsEngine.getUserProgress(userId);
  const stats = diagnosticsEngine.getStudyStats(userId);

  res.json({ progress, stats });
});

app.get("/api/stats", (req, res) => {
  const stats = searchEngine.getStats();
  res.json(stats);
});

app.post("/api/validate-graph", (req, res) => {
  const cycles = graph.detectCycles();
  
  res.json({
    valid: cycles.length === 0,
    cycleCount: cycles.length,
    cycles: cycles.slice(0, 5),
  });
});

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

initializeEngines().then(() => {
  app.listen(PORT, () => {
    console.log(`EmpraDB API running on port ${PORT}`);
  });
});
