import { opportunityContexts } from "../lib/taxonomy.mjs";

export default function PropertyTags({ tags, contexts = [] }) {
  const items = tags ? [...tags].sort((a, b) =>
    Number(b.dimension === "opportunity-context") - Number(a.dimension === "opportunity-context") || a.label.localeCompare(b.label)
  ) : opportunityContexts.filter(term => contexts.includes(term.id));
  if (!items.length) return null;
  return (
    <ul className="property-tags" aria-label="Property tags">
      {items.map(term => <li key={term.id}>{term.label}</li>)}
    </ul>
  );
}
