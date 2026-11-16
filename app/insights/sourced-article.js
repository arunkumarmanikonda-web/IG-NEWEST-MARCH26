import { PerspectiveDate } from "./perspective-date";

export default function SourcedArticle({ sections, sources }) {
  const references = new Map();
  sources.forEach((source, index) => {
    if (source && typeof source.title === "string" && /^https:\/\/[^\s]+$/i.test(source.url))
      references.set(index + 1, source);
  });
  return <>
    {sections.map((section, index) => {
      const numbers = [...new Set(section.sourceIndexes || [])].filter(n => references.has(n));
      return <section key={index} className="perspective-passage">
        <h2>{section.heading}</h2>
        {section.text.split(/\n\s*\n/).filter(Boolean).map((text,i) => <p key={i}>{text}</p>)}
        {numbers.length > 0 && <div className="perspective-notes" aria-label={"Sources for " + section.heading}>
          <span>{numbers.length === 1 ? "Source" : "Sources"}</span>
          {numbers.map(n => <a key={n} href={"#source-" + n} aria-label={"Source " + n + ", " + references.get(n).title}>[{n}]</a>)}
        </div>}
      </section>;
    })}
    {references.size > 0 && <section className="perspective-sources" aria-labelledby="sources-heading">
      <h2 id="sources-heading">Sources</h2>
      <ol>{[...references].map(([n,source]) => <li key={n} id={"source-" + n} value={n}>
        <a href={source.url} rel="external">{source.title}</a> <PerspectiveDate value={source.date} />
      </li>)}</ol>
    </section>}
  </>;
}
