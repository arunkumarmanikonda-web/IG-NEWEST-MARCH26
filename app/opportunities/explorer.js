"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Arrow } from "../components";
import { opportunityContexts } from "../../lib/taxonomy.mjs";
export default function Explorer({ items, contexts = opportunityContexts }) {
  const [query, setQuery] = useState(""),
    [sector, setSector] = useState("All sectors"),
    [context, setContext] = useState(""),
    [city, setCity] = useState(""),
    [type, setType] = useState("");
  const filtered = items.filter(
    (x) =>
      (!city || x.location === city) &&
      (!type || x.type === type) &&
      (sector === "All sectors" || x.sector === sector) &&
      (!context || x.contexts?.includes(context)) &&
      [x.title, x.location, x.type, x.description]
        .join(" ")
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  return (
    <>
      <div className="filter-bar">
        <label>
          Search the portfolio
          <input
            type="search"
            placeholder="Asset name, city or property type"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          Sector
          <select value={sector} onChange={(e) => setSector(e.target.value)}>
            <option>All sectors</option>
            {[...new Set(items.map((x) => x.sector))].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Location
          <select value={city} onChange={(e) => setCity(e.target.value)}>
            <option value="">All locations</option>
            {[...new Set(items.map((x) => x.location))].sort().map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Asset / transaction
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All types</option>
            {[...new Set(items.map((x) => x.type))].sort().map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Opportunity context
          <select value={context} onChange={(e) => setContext(e.target.value)}>
            <option value="">All contexts</option>
            {contexts.map((x) => (
              <option key={x.id} value={x.id}>
                {x.label}
              </option>
            ))}
          </select>
        </label>
        <p role="status">
          {filtered.length} {filtered.length === 1 ? "asset" : "assets"}
        </p>
      </div>
      <div className="opportunity-grid">
        {filtered.map((x) => (
          <Link
            className="opportunity-card"
            href={"/opportunities/" + x.slug}
            key={x.slug}
          >
            <div className="image-frame">
              {x.image ? (
                <Image
                  unoptimized={x.image.startsWith("/images/generated/")}
                  src={x.image}
                  alt={x.title}
                  fill
                  sizes="(max-width:760px) 100vw, 50vw"
                />
              ) : (
                <span className="confidential-visual">
                  Confidential opportunity
                </span>
              )}
              {x.image?.startsWith("/images/generated/") && (
                <span className="generated-badge">
                  Illustrative AI-generated concept
                </span>
              )}
            </div>
            <div className="card-meta">
              <span>
                {x.sector} / {x.location}
              </span>
              <span className="status-label">Portfolio reference</span>
            </div>
            <h3>{x.title}</h3>
            <p>{x.type}</p>
            <span className="read-link">
              View asset overview <Arrow />
            </span>
          </Link>
        ))}
        {!filtered.length && (
          <div className="empty-state">
            <h3>No published matches</h3>
            <p>
              There are no portfolio references under these filters. Contact our
              team to discuss the requirement.
            </p>
            <button
              onClick={() => {
                setQuery("");
                setSector("All sectors");
                setContext("");
                setCity("");
                setType("");
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </>
  );
}
