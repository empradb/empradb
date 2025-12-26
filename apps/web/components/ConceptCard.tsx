interface ConceptCardProps {
  id: string;
  title: string;
  type: string;
  description?: string;
  latex?: string;
  domains: string[];
  tags: string[];
  complexity: number;
  confidence?: number;
  onClick?: () => void;
}

export default function ConceptCard({
  id,
  title,
  type,
  description,
  latex,
  domains,
  tags,
  complexity,
  confidence,
  onClick,
}: ConceptCardProps) {
  return (
    <div
      className="concept-card"
      onClick={onClick}
      data-concept-id={id}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase text-gray-500">{type}</span>
            <span className="text-xs text-gray-600">•</span>
            <span className="text-xs text-gray-500">
              Complexity: {complexity}/10
            </span>
          </div>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
      </div>

      {latex && (
        <div className="bg-gray-800 p-3 rounded mb-3 font-mono text-sm overflow-x-auto">
          {latex}
        </div>
      )}

      {description && (
        <p className="text-sm text-gray-400 mb-3 line-clamp-2">
          {description}
        </p>
      )}

      {domains.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {domains.slice(0, 3).map((domain) => (
            <span key={domain} className="domain-tag">
              {domain}
            </span>
          ))}
        </div>
      )}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.slice(0, 4).map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
      )}

      {confidence !== undefined && (
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-500">Confidence</span>
            <span className="text-xs text-gray-400">
              {Math.round(confidence * 100)}%
            </span>
          </div>
          <div className="confidence-bar">
            <div
              className="confidence-fill"
              style={{ width: `${confidence * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
