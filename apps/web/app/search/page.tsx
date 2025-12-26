"use client";

import { useState } from "react";

interface SearchResult {
  node: {
    id: string;
    type: string;
    title: string;
    latex?: string;
    description: string;
    domains: string[];
    tags: string[];
    complexity: number;
  };
  score: number;
  matchedFields: string[];
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState("");
  const [selectedType, setSelectedType] = useState("");

  const domains = ["Calculus", "Algebra", "Geometry", "Trigonometry", "Statistics", "Probability"];
  const types = ["concept", "formula", "theorem", "definition", "identity"];

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    console.log("Searching:", { query, domain: selectedDomain, type: selectedType });
    
    setTimeout(() => {
      setResults([
        {
          node: {
            id: "calculus_derivative",
            type: "concept",
            title: "Derivative",
            latex: "f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}",
            description: "The instantaneous rate of change of a function at a point.",
            domains: ["Calculus", "Analysis"],
            tags: ["fundamental", "calculus", "rate-of-change"],
            complexity: 7
          },
          score: 10,
          matchedFields: ["title"]
        }
      ]);
      setLoading(false);
    }, 500);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Search Mathematics</h1>

      <div className="card mb-8">
        <input
          type="text"
          className="search-input mb-4"
          placeholder="Search concepts, formulas, theorems..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Domain</label>
            <select
              className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-white"
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
            >
              <option value="">All Domains</option>
              {domains.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Type</label>
            <select
              className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-white"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="">All Types</option>
              {types.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSearch}
              className="button-primary w-full"
              disabled={loading}
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </div>
      </div>

      {results.length > 0 && (
        <div className="space-y-4">
          <div className="text-sm text-gray-400 mb-4">
            Found {results.length} result{results.length !== 1 ? "s" : ""}
          </div>

          {results.map((result, idx) => (
            <div key={idx} className="card hover:border-gray-700 transition cursor-pointer">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs uppercase text-gray-500">{result.node.type}</span>
                    <span className="text-xs text-gray-600">•</span>
                    <span className="text-xs text-gray-500">Complexity: {result.node.complexity}/10</span>
                  </div>
                  <h3 className="text-xl font-semibold">{result.node.title}</h3>
                </div>
              </div>

              {result.node.latex && (
                <div className="math-formula bg-gray-800 p-4 rounded mb-3 font-mono text-sm">
                  {result.node.latex}
                </div>
              )}

              <p className="text-gray-400 mb-3">{result.node.description}</p>

              <div className="flex flex-wrap gap-2 mb-3">
                {result.node.domains.map((domain) => (
                  <span key={domain} className="domain-tag">{domain}</span>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {result.node.tags.map((tag) => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>

              {result.matchedFields.length > 0 && (
                <div className="mt-3 text-xs text-gray-600">
                  Matched: {result.matchedFields.join(", ")}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && results.length === 0 && query && (
        <div className="text-center text-gray-600 py-12">
          <p>No results found for "{query}"</p>
          <p className="text-sm mt-2">Try different keywords or broader search terms</p>
        </div>
      )}

      {!query && !loading && (
        <div className="text-center text-gray-600 py-12">
          <p>Enter a search query to find mathematical concepts</p>
        </div>
      )}
    </div>
  );
}
