"use client";
import { useState } from "react";
import Link from "next/link";
import { Arrow } from "./components";
export default function PracticeExplorer({ practices }) {
  const [active, setActive] = useState(practices[0].slug);
  const p = practices.find((x) => x.slug === active);
  return (
    <div className="practice-explorer">
      <div
        className="practice-choices"
        role="group"
        aria-label="Explore our core practices"
      >
        {practices.map((x) => (
          <button
            key={x.slug}
            aria-pressed={active === x.slug}
            aria-controls="practice-detail"
            onClick={() => setActive(x.slug)}
          >
            <strong>{x.title}</strong>
            <Arrow />
          </button>
        ))}
      </div>
      <article id="practice-detail" className="practice-detail">
        <div className="eyebrow">{p.title}</div>
        <h3>{p.line}</h3>
        <p>{p.intro}</p>
        <div className="practice-services">
          {p.services.slice(0, 4).map(([t, d]) => (
            <div key={t}>
              <h4>{t}</h4>
              <p>{d}</p>
            </div>
          ))}
        </div>
        <div className="practice-deliverables">
          <strong>What you receive</strong>
          <p>{p.outputs.slice(0, 3).join(" · ")}</p>
        </div>
        <div className="workspace-actions">
          {p.slug === "real-estate" && (
            <Link
              className="button practice-collection-cta"
              href="/opportunities"
            >
              Browse real estate listings <Arrow />
            </Link>
          )}
          <Link href={p.href || "/practices/" + p.slug} className="text-link">
            Full practice & deliverables <Arrow />
          </Link>
          <Link
            href={"/contact?interest=" + encodeURIComponent(p.title)}
            className="button"
          >
            Discuss your brief <Arrow />
          </Link>
        </div>
      </article>
    </div>
  );
}
