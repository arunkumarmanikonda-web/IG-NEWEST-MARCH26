// Suggestions are private editorial aids. Only a checked, saved tag is published.
const labels = new Map([
  ["corporate insolvency resolution process","cirp"],
  ["joint development agreement","joint-venture"],
  ["jda","joint-venture"],
]);

export function suggestedClassifications(evidence, terms) {
  const suggestions = new Map();
  for (const fact of evidence || []) {
    if (!fact.source?.trim() || !fact.excerpt?.trim()) continue;
    const value = String(fact.value || "").trim().toLowerCase();
    if (value.length < 3) continue;
    const excerpt = fact.excerpt.toLowerCase();
    if (!excerpt.includes(value) || /\b(no|not|never|possible|potential|proposed|pending|unconfirmed|withdrawn|concluded|closed|exited)\b/.test(excerpt)) continue;
    const term = terms.find(t => t.active && ["opportunity-context","asset-class","transaction-type"].includes(t.dimension) &&
      (t.label.toLowerCase() === value || t.slug === value || t.slug === labels.get(value)));
    if (term && !suggestions.has(term.id)) suggestions.set(term.id, fact);
  }
  return suggestions;
}
