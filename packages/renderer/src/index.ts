import { MathNode } from "@empradb/schema";

export interface RenderOptions {
  displayMode?: boolean;
  throwOnError?: boolean;
  macros?: Record<string, string>;
  colorScheme?: "light" | "dark";
}

export class MathRenderer {
  private defaultMacros: Record<string, string>;

  constructor() {
    this.defaultMacros = {
      "\\R": "\\mathbb{R}",
      "\\N": "\\mathbb{N}",
      "\\Z": "\\mathbb{Z}",
      "\\Q": "\\mathbb{Q}",
      "\\C": "\\mathbb{C}",
      "\\diff": "\\mathrm{d}",
      "\\deriv": "\\frac{\\mathrm{d}#1}{\\mathrm{d}#2}",
      "\\pderiv": "\\frac{\\partial #1}{\\partial #2}",
      "\\abs": "\\left|#1\\right|",
      "\\norm": "\\left\\|#1\\right\\|",
      "\\set": "\\left\\{#1\\right\\}",
      "\\floor": "\\left\\lfloor#1\\right\\rfloor",
      "\\ceil": "\\left\\lceil#1\\right\\rceil"
    };
  }

  renderLatex(latex: string, options: RenderOptions = {}): string {
    const macros = { ...this.defaultMacros, ...options.macros };
    const displayMode = options.displayMode ?? false;
    
    const delimiters = displayMode 
      ? { left: "\\[", right: "\\]" }
      : { left: "\\(", right: "\\)" };

    return `${delimiters.left}${latex}${delimiters.right}`;
  }

  renderNode(node: MathNode, options: RenderOptions = {}): string {
    if (!node.latex) {
      return `<div class="math-node"><strong>${this.escapeHtml(node.title)}</strong><p>${this.escapeHtml(node.description)}</p></div>`;
    }

    const latex = this.renderLatex(node.latex, { ...options, displayMode: true });
    
    return `
      <div class="math-node">
        <h3>${this.escapeHtml(node.title)}</h3>
        <div class="math-formula">${latex}</div>
        <p class="math-description">${this.escapeHtml(node.description)}</p>
        ${this.renderMetadata(node)}
      </div>
    `.trim();
  }

  private renderMetadata(node: MathNode): string {
    const domains = node.domains.map(d => `<span class="domain-tag">${this.escapeHtml(d)}</span>`).join("");
    const tags = node.tags.map(t => `<span class="tag">${this.escapeHtml(t)}</span>`).join("");
    
    return `
      <div class="metadata">
        <div class="domains">${domains}</div>
        <div class="tags">${tags}</div>
        <div class="complexity">Complexity: ${node.complexity}/10</div>
      </div>
    `.trim();
  }

  renderFormula(latex: string, inline: boolean = false): string {
    return this.renderLatex(latex, { displayMode: !inline });
  }

  renderTheorem(title: string, statement: string, latex?: string): string {
    const formulaHtml = latex 
      ? `<div class="theorem-formula">${this.renderLatex(latex, { displayMode: true })}</div>`
      : "";

    return `
      <div class="theorem">
        <div class="theorem-title">${this.escapeHtml(title)}</div>
        ${formulaHtml}
        <div class="theorem-statement">${this.escapeHtml(statement)}</div>
      </div>
    `.trim();
  }

  renderDefinition(term: string, definition: string, latex?: string): string {
    const formulaHtml = latex 
      ? `<div class="definition-formula">${this.renderLatex(latex, { displayMode: true })}</div>`
      : "";

    return `
      <div class="definition">
        <div class="definition-term">${this.escapeHtml(term)}</div>
        ${formulaHtml}
        <div class="definition-text">${this.escapeHtml(definition)}</div>
      </div>
    `.trim();
  }

  renderProof(steps: string[], latex?: string[]): string {
    const stepsHtml = steps.map((step, i) => {
      const stepLatex = latex && latex[i] 
        ? `<div class="proof-formula">${this.renderLatex(latex[i], { displayMode: true })}</div>`
        : "";
      return `<li class="proof-step">${this.escapeHtml(step)}${stepLatex}</li>`;
    }).join("");

    return `
      <div class="proof">
        <div class="proof-header">Proof:</div>
        <ol class="proof-steps">${stepsHtml}</ol>
        <div class="proof-qed">∎</div>
      </div>
    `.trim();
  }

  renderSymbol(symbol: string, meaning: string, latex?: string): string {
    const symbolDisplay = latex 
      ? this.renderLatex(latex, { displayMode: false })
      : this.escapeHtml(symbol);

    return `
      <div class="symbol">
        <span class="symbol-display">${symbolDisplay}</span>
        <span class="symbol-meaning">${this.escapeHtml(meaning)}</span>
      </div>
    `.trim();
  }

  renderConceptCard(node: MathNode, confidence?: number): string {
    const confidenceBar = confidence !== undefined
      ? `<div class="confidence-bar"><div class="confidence-fill" style="width: ${confidence * 100}%"></div></div>`
      : "";

    const latex = node.latex 
      ? `<div class="card-formula">${this.renderLatex(node.latex, { displayMode: true })}</div>`
      : "";

    return `
      <div class="concept-card" data-id="${node.id}">
        <div class="card-header">
          <span class="card-type">${node.type}</span>
          <h4 class="card-title">${this.escapeHtml(node.title)}</h4>
        </div>
        ${latex}
        ${confidenceBar}
      </div>
    `.trim();
  }

  renderDependencyGraph(nodes: MathNode[], edges: Array<{ from: string; to: string }>): string {
    const nodesJson = JSON.stringify(nodes.map(n => ({
      id: n.id,
      label: n.title,
      type: n.type
    })));

    const edgesJson = JSON.stringify(edges);

    return `
      <div class="dependency-graph" data-nodes='${nodesJson}' data-edges='${edgesJson}'>
        <svg class="graph-svg"></svg>
      </div>
    `.trim();
  }

  getStylesheet(colorScheme: "light" | "dark" = "dark"): string {
    const bg = colorScheme === "dark" ? "#000" : "#fff";
    const fg = colorScheme === "dark" ? "#fff" : "#000";
    const accent = colorScheme === "dark" ? "#333" : "#eee";

    return `
      .math-node { background: ${bg}; color: ${fg}; padding: 20px; margin: 10px 0; }
      .math-formula { font-size: 1.2em; margin: 15px 0; text-align: center; }
      .math-description { margin: 10px 0; line-height: 1.6; }
      .metadata { display: flex; gap: 15px; margin-top: 15px; font-size: 0.9em; }
      .domain-tag, .tag { background: ${accent}; padding: 4px 8px; border-radius: 4px; margin-right: 5px; }
      .theorem, .definition, .proof { background: ${accent}; padding: 15px; margin: 15px 0; border-left: 4px solid ${fg}; }
      .theorem-title, .definition-term { font-weight: bold; font-size: 1.1em; margin-bottom: 10px; }
      .proof-steps { list-style: decimal; padding-left: 20px; }
      .proof-step { margin: 10px 0; }
      .proof-qed { text-align: right; font-size: 1.2em; margin-top: 10px; }
      .symbol { display: inline-flex; align-items: center; gap: 10px; margin: 5px; }
      .symbol-display { font-size: 1.2em; font-weight: bold; }
      .concept-card { background: ${accent}; padding: 15px; border-radius: 8px; margin: 10px; cursor: pointer; }
      .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
      .card-type { font-size: 0.8em; text-transform: uppercase; opacity: 0.7; }
      .confidence-bar { height: 4px; background: ${accent}; border-radius: 2px; margin-top: 10px; }
      .confidence-fill { height: 100%; background: ${fg}; border-radius: 2px; transition: width 0.3s; }
      .dependency-graph { width: 100%; height: 500px; }
    `.trim();
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}
