"use client";

import { useState } from "react";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    console.log("Searching for:", query);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4">🖤 EmpraDB</h1>
        <p className="text-xl text-gray-400 mb-2">
          The World's Largest Math Database
        </p>
        <p className="text-gray-600">
          Every formula. Every concept. Every curriculum. One system.
        </p>
      </div>

      <div className="mb-12">
        <div className="flex gap-3">
          <input
            type="text"
            className="search-input flex-1"
            placeholder="Search concepts, formulas, theorems..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button onClick={handleSearch} className="button-primary">
            Search
          </button>
        </div>
      </div>

      {results.length > 0 ? (
        <div className="space-y-4">
          {results.map((result, idx) => (
            <div key={idx} className="concept-card">
              <h3 className="font-semibold mb-2">{result.title}</h3>
              <p className="text-sm text-gray-400">{result.description}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-semibold mb-2">Complete Math Graph</h3>
            <p className="text-sm text-gray-400">
              Every mathematical concept mapped with prerequisites and
              relationships
            </p>
          </div>

          <div className="card">
            <div className="text-3xl mb-3">🎓</div>
            <h3 className="font-semibold mb-2">Curriculum Aware</h3>
            <p className="text-sm text-gray-400">
              Aligned with VCE, IB, AP, GCSE, SAT and more education systems
            </p>
          </div>

          <div className="card">
            <div className="text-3xl mb-3">📝</div>
            <h3 className="font-semibold mb-2">Exam Intelligence</h3>
            <p className="text-sm text-gray-400">
              Know exactly what concepts appear in your exams and at what depth
            </p>
          </div>

          <div className="card">
            <div className="text-3xl mb-3">🧭</div>
            <h3 className="font-semibold mb-2">Smart Study Paths</h3>
            <p className="text-sm text-gray-400">
              Generated learning sequences based on prerequisites and your goals
            </p>
          </div>

          <div className="card">
            <div className="text-3xl mb-3">🔍</div>
            <h3 className="font-semibold mb-2">Math-Aware Search</h3>
            <p className="text-sm text-gray-400">
              Search by concept, formula, domain, or LaTeX notation instantly
            </p>
          </div>

          <div className="card">
            <div className="text-3xl mb-3">🖤</div>
            <h3 className="font-semibold mb-2">Zero Stress</h3>
            <p className="text-sm text-gray-400">
              No ads, no scores, no streaks. Just pure mathematical knowledge
            </p>
          </div>
        </div>
      )}

      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold mb-4">What EmpraDB Is</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-3xl mx-auto">
          <div>
            <h3 className="font-semibold mb-2 text-green-400">✓ Is</h3>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• A complete graph of mathematical knowledge</li>
              <li>• Curriculum and exam-aware</li>
              <li>• Search-first and distraction-free</li>
              <li>• Open source and community-driven</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-red-400">✗ Is Not</h3>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Not a calculator</li>
              <li>• Not a gamified app</li>
              <li>• Not a course platform</li>
              <li>• Not about scores or streaks</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Philosophy</h2>
        <div className="max-w-2xl mx-auto text-gray-400 space-y-3">
          <p>Math is universal.</p>
          <p>Curricula are overlays.</p>
          <p>Tests are filters.</p>
          <p>Study paths are generated, not hardcoded.</p>
          <p className="text-white font-semibold pt-4">
            EmpraDB separates truth from teaching.
          </p>
        </div>
      </div>
    </div>
  );
}
