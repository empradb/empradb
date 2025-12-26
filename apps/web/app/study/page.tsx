"use client";

import { useState } from "react";

type CurriculumSystem = "VCE" | "IB" | "AP" | "GCSE" | "A_LEVEL" | "SAT" | "ACT";

export default function StudyPage() {
  const [system, setSystem] = useState<CurriculumSystem>("VCE");
  const [yearLevel, setYearLevel] = useState(11);
  const [examId, setExamId] = useState("");
  const [daysRemaining, setDaysRemaining] = useState(90);
  const [studyPath, setStudyPath] = useState<any>(null);

  const systems: CurriculumSystem[] = ["VCE", "IB", "AP", "GCSE", "A_LEVEL", "SAT", "ACT"];

  const exams = {
    VCE: ["Mathematical Methods", "Specialist Mathematics", "Further Mathematics"],
    IB: ["Mathematics HL", "Mathematics SL", "Mathematics Studies"],
    AP: ["AP Calculus AB", "AP Calculus BC", "AP Statistics"],
    GCSE: ["GCSE Mathematics", "GCSE Further Mathematics"],
    A_LEVEL: ["A-Level Mathematics", "A-Level Further Mathematics"],
    SAT: ["SAT Math"],
    ACT: ["ACT Math"],
  };

  const generatePath = () => {
    console.log("Generating study path:", { system, yearLevel, examId, daysRemaining });
    setStudyPath({
      totalConcepts: 42,
      requiredConcepts: 35,
      optionalConcepts: 7,
      estimatedHours: 87,
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-2">Study Hub</h1>
      <p className="text-gray-400 mb-8">
        Generate your personalized study path based on your curriculum and exam goals
      </p>

      <div className="card mb-8">
        <h2 className="subsection-title">Your Details</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Curriculum System</label>
            <select
              className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-white"
              value={system}
              onChange={(e) => setSystem(e.target.value as CurriculumSystem)}
            >
              {systems.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Year Level</label>
            <input
              type="number"
              className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-white"
              value={yearLevel}
              onChange={(e) => setYearLevel(parseInt(e.target.value))}
              min={7}
              max={13}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Target Exam</label>
            <select
              className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-white"
              value={examId}
              onChange={(e) => setExamId(e.target.value)}
            >
              <option value="">Select an exam</option>
              {exams[system]?.map((exam) => (
                <option key={exam} value={exam}>
                  {exam}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Days Until Exam</label>
            <input
              type="number"
              className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-white"
              value={daysRemaining}
              onChange={(e) => setDaysRemaining(parseInt(e.target.value))}
              min={1}
              max={365}
            />
          </div>
        </div>

        <button
          onClick={generatePath}
          className="button-primary w-full mt-6"
          disabled={!examId}
        >
          Generate Study Path
        </button>
      </div>

      {studyPath && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="subsection-title">Your Study Plan</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-3xl font-bold">{studyPath.totalConcepts}</div>
                <div className="text-sm text-gray-400">Total Concepts</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-400">
                  {studyPath.requiredConcepts}
                </div>
                <div className="text-sm text-gray-400">Required</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-400">
                  {studyPath.optionalConcepts}
                </div>
                <div className="text-sm text-gray-400">Optional</div>
              </div>
              <div>
                <div className="text-3xl font-bold">{studyPath.estimatedHours}h</div>
                <div className="text-sm text-gray-400">Est. Time</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="subsection-title">Study Sequence</h2>
            <p className="text-gray-400 mb-4">
              Concepts ordered by prerequisite relationships
            </p>
            <div className="space-y-3">
              {[
                { id: "calculus_limit", title: "Limit", confidence: 0.8 },
                { id: "calculus_derivative", title: "Derivative", confidence: 0.6 },
                { id: "product_rule", title: "Product Rule", confidence: 0.3 },
                { id: "chain_rule", title: "Chain Rule", confidence: 0.0 },
              ].map((concept) => (
                <div key={concept.id} className="concept-card">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">{concept.title}</h3>
                    <span className="text-sm text-gray-400">
                      {Math.round(concept.confidence * 100)}%
                    </span>
                  </div>
                  <div className="confidence-bar">
                    <div
                      className="confidence-fill"
                      style={{ width: `${concept.confidence * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="subsection-title">Time Management</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Total study time needed:</span>
                <span className="font-medium">{studyPath.estimatedHours} hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Days remaining:</span>
                <span className="font-medium">{daysRemaining} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Suggested daily study:</span>
                <span className="font-medium">
                  {Math.ceil((studyPath.estimatedHours * 60) / daysRemaining)} minutes/day
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {!studyPath && (
        <div className="text-center text-gray-600 py-12">
          <p>Select your exam and generate a personalized study path</p>
        </div>
      )}
    </div>
  );
}
