import { MathNode } from "@empradb/schema";

interface SearchResult {
  node: MathNode;
  score: number;
  matchedFields: string[];
}

export class MathSearchEngine {
  private nodes: Map<string, MathNode>;
  private titleIndex: Map<string, Set<string>>;
  private descriptionIndex: Map<string, Set<string>>;
  private domainIndex: Map<string, Set<string>>;
  private tagIndex: Map<string, Set<string>>;
  private latexIndex: Map<string, Set<string>>;

  constructor() {
    this.nodes = new Map();
    this.titleIndex = new Map();
    this.descriptionIndex = new Map();
    this.domainIndex = new Map();
    this.tagIndex = new Map();
    this.latexIndex = new Map();
  }

  addNode(node: MathNode): void {
    this.nodes.set(node.id, node);
    this.indexNode(node);
  }

  private indexNode(node: MathNode): void {
    const titleTokens = this.tokenize(node.title);
    const descriptionTokens = this.tokenize(node.description);

    for (const token of titleTokens) {
      if (!this.titleIndex.has(token)) {
        this.titleIndex.set(token, new Set());
      }
      this.titleIndex.get(token)!.add(node.id);
    }

    for (const token of descriptionTokens) {
      if (!this.descriptionIndex.has(token)) {
        this.descriptionIndex.set(token, new Set());
      }
      this.descriptionIndex.get(token)!.add(node.id);
    }

    for (const domain of node.domains) {
      const domainKey = domain.toLowerCase();
      if (!this.domainIndex.has(domainKey)) {
        this.domainIndex.set(domainKey, new Set());
      }
      this.domainIndex.get(domainKey)!.add(node.id);
    }

    for (const tag of node.tags) {
      const tagKey = tag.toLowerCase();
      if (!this.tagIndex.has(tagKey)) {
        this.tagIndex.set(tagKey, new Set());
      }
      this.tagIndex.get(tagKey)!.add(node.id);
    }

    if (node.latex) {
      const latexTokens = this.tokenize(node.latex);
      for (const token of latexTokens) {
        if (!this.latexIndex.has(token)) {
          this.latexIndex.set(token, new Set());
        }
        this.latexIndex.get(token)!.add(node.id);
      }
    }
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter(t => t.length > 0);
  }

  search(query: string, limit: number = 20): SearchResult[] {
    const tokens = this.tokenize(query);
    if (tokens.length === 0) return [];

    const candidates = new Map<string, { score: number; fields: Set<string> }>();

    for (const token of tokens) {
      const titleMatches = this.titleIndex.get(token) || new Set();
      const descriptionMatches = this.descriptionIndex.get(token) || new Set();
      const latexMatches = this.latexIndex.get(token) || new Set();

      for (const id of titleMatches) {
        if (!candidates.has(id)) {
          candidates.set(id, { score: 0, fields: new Set() });
        }
        const entry = candidates.get(id)!;
        entry.score += 10;
        entry.fields.add("title");
      }

      for (const id of descriptionMatches) {
        if (!candidates.has(id)) {
          candidates.set(id, { score: 0, fields: new Set() });
        }
        const entry = candidates.get(id)!;
        entry.score += 3;
        entry.fields.add("description");
      }

      for (const id of latexMatches) {
        if (!candidates.has(id)) {
          candidates.set(id, { score: 0, fields: new Set() });
        }
        const entry = candidates.get(id)!;
        entry.score += 5;
        entry.fields.add("latex");
      }
    }

    const results: SearchResult[] = [];
    for (const [id, data] of candidates) {
      const node = this.nodes.get(id);
      if (node) {
        results.push({
          node,
          score: data.score,
          matchedFields: Array.from(data.fields)
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }

  searchByDomain(domain: string): MathNode[] {
    const domainKey = domain.toLowerCase();
    const ids = this.domainIndex.get(domainKey);
    if (!ids) return [];
    return Array.from(ids).map(id => this.nodes.get(id)!).filter(Boolean);
  }

  searchByTag(tag: string): MathNode[] {
    const tagKey = tag.toLowerCase();
    const ids = this.tagIndex.get(tag);
    if (!ids) return [];
    return Array.from(ids).map(id => this.nodes.get(id)!).filter(Boolean);
  }

  searchByType(type: MathNode["type"]): MathNode[] {
    return Array.from(this.nodes.values()).filter(n => n.type === type);
  }

  advancedSearch(options: {
    query?: string;
    domains?: string[];
    tags?: string[];
    types?: MathNode["type"][];
    minComplexity?: number;
    maxComplexity?: number;
    limit?: number;
  }): SearchResult[] {
    let candidates = new Set<string>(this.nodes.keys());

    if (options.domains && options.domains.length > 0) {
      const domainSet = new Set<string>();
      for (const domain of options.domains) {
        const ids = this.domainIndex.get(domain.toLowerCase());
        if (ids) ids.forEach(id => domainSet.add(id));
      }
      candidates = new Set([...candidates].filter(id => domainSet.has(id)));
    }

    if (options.tags && options.tags.length > 0) {
      const tagSet = new Set<string>();
      for (const tag of options.tags) {
        const ids = this.tagIndex.get(tag.toLowerCase());
        if (ids) ids.forEach(id => tagSet.add(id));
      }
      candidates = new Set([...candidates].filter(id => tagSet.has(id)));
    }

    if (options.types && options.types.length > 0) {
      candidates = new Set([...candidates].filter(id => {
        const node = this.nodes.get(id);
        return node && options.types!.includes(node.type);
      }));
    }

    if (options.minComplexity !== undefined || options.maxComplexity !== undefined) {
      candidates = new Set([...candidates].filter(id => {
        const node = this.nodes.get(id);
        if (!node) return false;
        if (options.minComplexity !== undefined && node.complexity < options.minComplexity) return false;
        if (options.maxComplexity !== undefined && node.complexity > options.maxComplexity) return false;
        return true;
      }));
    }

    if (options.query) {
      const queryResults = this.search(options.query, 1000);
      const queryIds = new Set(queryResults.map(r => r.node.id));
      candidates = new Set([...candidates].filter(id => queryIds.has(id));

      const resultMap = new Map(queryResults.map(r => [r.node.id, r]));
      return Array.from(candidates)
        .map(id => resultMap.get(id)!)
        .filter(Boolean)
        .slice(0, options.limit || 20);
    }

    return Array.from(candidates)
      .map(id => ({
        node: this.nodes.get(id)!,
        score: 1,
        matchedFields: []
      }))
      .slice(0, options.limit || 20);
  }

  getSuggestions(prefix: string, limit: number = 10): string[] {
    const prefixLower = prefix.toLowerCase();
    const suggestions = new Set<string>();

    for (const node of this.nodes.values()) {
      if (node.title.toLowerCase().startsWith(prefixLower)) {
        suggestions.add(node.title);
      }
      if (suggestions.size >= limit) break;
    }

    return Array.from(suggestions).slice(0, limit);
  }

  getStats(): {
    totalNodes: number;
    byType: Record<string, number>;
    byDomain: Record<string, number>;
  } {
    const byType: Record<string, number> = {};
    const byDomain: Record<string, number> = {};

    for (const node of this.nodes.values()) {
      byType[node.type] = (byType[node.type] || 0) + 1;
      for (const domain of node.domains) {
        byDomain[domain] = (byDomain[domain] || 0) + 1;
      }
    }

    return {
      totalNodes: this.nodes.size,
      byType,
      byDomain
    };
  }
}
