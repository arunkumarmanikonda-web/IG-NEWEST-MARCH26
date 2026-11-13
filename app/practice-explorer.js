"use client";
import { useState } from "react";
import Link from "next/link";
import { practices as basePractices } from "../lib/content.mjs";
const practices = [
  ...basePractices,
  {
    slug: "horeca",
    href: "/horeca",
    number: "07",
    title: "HORECA Procurement",
    line: "Every specification. Every delivery.",
    intro:
      "Build a coordinated procurement programme for hotels, restaurants and operating businesses. Translate your BOQ into comparable specifications, supplier proposals, approved quotations and tracked fulfilment.",
    services: [
      [
        "Product sourcing",
        "Source tableware, linen, equipment, housekeeping and operating supplies against an agreed product specification.",
      ],
      [
        "BOQ and supplier comparison",
        "Compare quantities, units, technical specifications and commercial inclusions on a consistent basis.",
      ],
      [
        "Samples and approvals",
        "Coordinate product information, available samples and decisions before placing an approved order.",
      ],
      [
        "Delivery coordination",
        "Plan lead times, dispatch dependencies and receipt against the project programme.",
      ],
    ],
    outputs: [
      "Reviewed procurement schedule",
      "Supplier comparison and approved quotation",
      "Order and delivery tracker",
    ],
  },
];
import { Arrow } from "./components";
export default function PracticeExplorer() {
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
              Explore the Property Collection <Arrow />
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
