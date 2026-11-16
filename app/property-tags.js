import { propertyTagTerms } from "../lib/taxonomy.mjs";

export default function PropertyTags({ tags, contexts = [] }) {
  const terms = propertyTagTerms({ tags, contexts });
  const items = tags ? [...terms].sort((a, b) =>
    Number(b.dimension === "opportunity-context") - Number(a.dimension === "opportunity-context") || a.label.localeCompare(b.label)
  ) : terms;
  if (!items.length) return null;
  return (
    <ul className="property-tags" aria-label="Property tags">
      {items.map(term => <li key={term.id}>{term.label}</li>)}
    </ul>
  );
}
