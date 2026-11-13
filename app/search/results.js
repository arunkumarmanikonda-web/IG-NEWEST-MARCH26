"use client";
import { useState } from "react";
import Link from "next/link";
import { filterSearch, searchTypes } from "../../lib/site-search.mjs";
import { practiceOptions } from "../../lib/business.mjs";
import { Arrow } from "../components";
export default function Results({ items, initialQuery = "" }) {
  const [q, setQ] = useState(initialQuery),
    [kind, setKind] = useState(""),
    [practice, setPractice] = useState(""),
    [location, setLocation] = useState(""),
    [limit, setLimit] = useState(20);
  const results = filterSearch(items, { q, kind, practice, location });
  function change(fn, v) {
    fn(v);
    setLimit(20);
  }
  return (
    <>
      <div className="global-search-controls">
        <label className="search-main">
          Search India Gully
          <input
            type="search"
            value={q}
            onChange={(e) => change(setQ, e.target.value)}
            placeholder="Try hotel, Gurugram, feasibility or a product SKU"
          />
        </label>
        <label>
          Content type
          <select
            value={kind}
            onChange={(e) => change(setKind, e.target.value)}
          >
            <option value="">Everything</option>
            {Object.entries(searchTypes).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label>
          Practice
          <select
            value={practice}
            onChange={(e) => change(setPractice, e.target.value)}
          >
            <option value="">All practices</option>
            {practiceOptions.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label>
          Location
          <select
            value={location}
            onChange={(e) => change(setLocation, e.target.value)}
          >
            <option value="">All locations</option>
            {[...new Set(items.map((r) => r.location).filter(Boolean))]
              .sort()
              .map((x) => (
                <option key={x}>{x}</option>
              ))}
          </select>
        </label>
        <button
          className="button"
          onClick={() => {
            setQ("");
            setKind("");
            setPractice("");
            setLocation("");
            setLimit(20);
          }}
        >
          Clear filters
        </button>
      </div>
      <p className="search-count" role="status">
        {results.length} {results.length === 1 ? "result" : "results"}
        {q ? " for “" + q + "”" : ""}
      </p>
      <div className="search-results">
        {results.slice(0, limit).map((r, i) => (
          <Link href={r.href} key={r.href + i} className="search-result">
            <div>
              <span className="eyebrow">
                {searchTypes[r.kind] || "Website"}
                {r.location ? " / " + r.location : ""}
              </span>
              <h2>{r.title}</h2>
              <p>{r.summary}</p>
            </div>
            <Arrow />
          </Link>
        ))}
      </div>
      {!results.length && (
        <div className="empty-state">
          <h2>Let us help you find it.</h2>
          <p>
            Try a broader phrase or clear a filter. Our team can also work from
            a specific investment or procurement brief.
          </p>
          <Link
            href={
              "/contact?interest=" + encodeURIComponent(q || "General enquiry")
            }
            className="text-link"
          >
            Discuss your requirement <Arrow />
          </Link>
        </div>
      )}
      {results.length > limit && (
        <button className="button" onClick={() => setLimit(limit + 20)}>
          Show more results
        </button>
      )}
    </>
  );
}
