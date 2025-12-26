"use client";

import { useState } from "react";

export default function GraphPage() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"tree" | "network">("tree");

  const sampleNodes = [
    { id: "calculus_limit", title: "Limit", type: "concept", level: 0 },
    { id: "calculus_derivative", title: "Derivative", type: "concept", level: 1 },
    { id: "product_rule", title: "Product Rule", type: "formula", level: 2 },
    { id: "chain_rule", title: "Chain Rule", type: "formula", level: 2 },
    { id: "optimization", title: "Optimization", type: "concept", level: 3 },
  ];

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId === selectedNode ? null : nodeId);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Knowledge Graph</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("tree")}
            className={viewMode === "tree" ? "button-primary" : "button-secondary"}
          >
            Tree View
          </button>
          <button
            onClick={() => setViewMode("network")}
            className={viewMode === "network" ? "button-primary" : "button-secondary"}
          >
            Network View
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <h2 className="subsection-title mb-4">Dependency Graph</h2>
          
          <div className="bg-gray-800 rounded-lg p-8 min-h-[500px] flex items-center justify-center">
            <div className="space-y-6 w-full">
              {sampleNodes.map((node) => (
                <div
                  key={node.id}
                  className="flex items-center gap-4"
                  style={{ marginLeft: `${node.level * 40}px` }}
                >
                  <div
                    className={`concept-card w-full max-w-md ${
                      selectedNode === node.id ? "border-white" : ""
                    }`}
                    onClick={() => handleNodeClick(node.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-gray-500 uppercase mb-1">
                          {node.type}
                        </div>
                        <div className="font-medium">{node.title}</div>
                      </div>
                      <div className="text-2xl">
                        {node.type === "concept" ? "📊" : "📐"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-400">
            Click on a node to view details and relationships
          </div>
        </div>

        <div className="card">
          <h2 className="subsection-title mb-4">Node Details</h2>

          {selectedNode ? (
            <div className="space-y-4">
              <div>
                <div className="text-xs text-gray-500 uppercase mb-1">Selected Node</div>
                <div className="text-lg font-semibold">
                  {sampleNodes.find((n) => n.id === selectedNode)?.title}
                </div>
              </div>

              <div className="divider" />

              <div>
                <div className="text-sm font-medium mb-2">Prerequisites</div>
                <div className="space-y-2">
                  {selectedNode === "calculus_derivative" && (
                    <div className="text-sm bg-gray-800 p-2 rounded">Limit</div>
                  )}
                  {selectedNode === "product_rule" && (
                    <div className="text-sm bg-gray-800 p-2 rounded">Derivative</div>
                  )}
                  {selectedNode === "chain_rule" && (
                    <div className="text-sm bg-gray-800 p-2 rounded">Derivative</div>
                  )}
                  {selectedNode === "optimization" && (
                    <>
                      <div className="text-sm bg-gray-800 p-2 rounded">Derivative</div>
                      <div className="text-sm bg-gray-800 p-2 rounded">Product Rule</div>
                    </>
                  )}
                  {selectedNode === "calculus_limit" && (
                    <div className="text-sm text-gray-500">No prerequisites</div>
                  )}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium mb-2">Used In</div>
                <div className="space-y-2">
                  {selectedNode === "calculus_limit" && (
                    <div className="text-sm bg-gray-800 p-2 rounded">Derivative</div>
                  )}
                  {selectedNode === "calculus_derivative" && (
                    <>
                      <div className="text-sm bg-gray-800 p-2 rounded">Product Rule</div>
                      <div className="text-sm bg-gray-800 p-2 rounded">Chain Rule</div>
                      <div className="text-sm bg-gray-800 p-2 rounded">Optimization</div>
                    </>
                  )}
                  {["product_rule", "chain_rule"].includes(selectedNode) && (
                    <div className="text-sm bg-gray-800 p-2 rounded">Optimization</div>
                  )}
                  {selectedNode === "optimization" && (
                    <div className="text-sm text-gray-500">Final application</div>
                  )}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium mb-2">Graph Stats</div>
                <div className="space-y-1 text-sm text-gray-400">
                  <div>Total Prerequisites: {
                    selectedNode === "calculus_limit" ? 0 :
                    selectedNode === "calculus_derivative" ? 1 :
                    selectedNode === "product_rule" ? 2 :
                    selectedNode === "chain_rule" ? 2 : 3
                  }</div>
                  <div>Depth Level: {
                    sampleNodes.find((n) => n.id === selectedNode)?.level
                  }</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-600 py-12">
              <p>Select a node to view details</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="card">
          <div className="text-3xl mb-2">📊</div>
          <div className="text-2xl font-bold mb-1">500+</div>
          <div className="text-sm text-gray-400">Total Concepts</div>
        </div>

        <div className="card">
          <div className="text-3xl mb-2">🔗</div>
          <div className="text-2xl font-bold mb-1">1,200+</div>
          <div className="text-sm text-gray-400">Relationships</div>
        </div>

        <div className="card">
          <div className="text-3xl mb-2">📚</div>
          <div className="text-2xl font-bold mb-1">12</div>
          <div className="text-sm text-gray-400">Domains</div>
        </div>
      </div>
    </div>
  );
}
