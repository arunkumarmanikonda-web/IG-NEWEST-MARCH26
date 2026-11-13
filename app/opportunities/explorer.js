"use client";
import { useState } from "react";
import Link from "next/link";
import { opportunityContexts } from "../../lib/taxonomy.mjs";
import { collectionItems } from "../../lib/property-collection.mjs";
import PropertyCard from "../property-card";
import { Arrow } from "../components";
const empty = {
  q: "",
  sector: "",
  city: "",
  type: "",
  context: "",
  sort: "featured",
};
export default function Explorer({
  items,
  contexts = opportunityContexts,
  initialFilters = {},
}) {
  const [filters, setFilters] = useState({ ...empty, ...initialFilters });
  const [copied, setCopied] = useState("");
  function update(patch) {
    const next = { ...filters, ...patch };
    setFilters(next);
    setCopied("");
    const params = new URLSearchParams();
    Object.entries(next).forEach(([k, v]) => {
      if (v && v !== "featured") params.set(k, v);
    });
    window.history.replaceState(
      null,
      "",
      "/opportunities" + (params.size ? "?" + params.toString() : ""),
    );
  }
  const filtered = collectionItems(items, { ...filters, query: filters.q });
  const active = Object.entries(filters).filter(([k, v]) => k !== "sort" && v);
  return (
    <>
      <form
        className="collection-filters"
        role="search"
        onSubmit={(e) => e.preventDefault()}
      >
        <label className="collection-search">
          Find your property
          <input
            type="search"
            placeholder="Property, city or keyword"
            value={filters.q}
            onChange={(e) => update({ q: e.target.value })}
            maxLength={200}
          />
        </label>
        {[
          [
            "city",
            "Location",
            "All locations",
            [...new Set(items.map((x) => x.location))].sort(),
          ],
          [
            "sector",
            "Asset class",
            "All asset classes",
            [...new Set(items.map((x) => x.sector))].sort(),
          ],
          [
            "type",
            "Property / transaction",
            "All property types",
            [...new Set(items.map((x) => x.type))].sort(),
          ],
        ].map(([k, label, all, values]) => (
          <label key={k}>
            {label}
            <select
              value={filters[k]}
              onChange={(e) => update({ [k]: e.target.value })}
            >
              <option value="">{all}</option>
              {values.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
        ))}
        {!!contexts.length && (
          <label>
            Investment context
            <select
              value={filters.context}
              onChange={(e) => update({ context: e.target.value })}
            >
              <option value="">All contexts</option>
              {contexts.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </form>
      {!!active.length && (
        <div className="collection-active-filters">
          <span>Refine your view</span>
          {active.map(([k, v]) => (
            <button
              key={k}
              onClick={() => update({ [k]: "" })}
              aria-label={"Remove " + k + " filter: " + v}
            >
              {k === "context"
                ? contexts.find((x) => x.id === v)?.label || v
                : v}{" "}
              ×
            </button>
          ))}
          <button onClick={() => update(empty)}>Clear all</button>
        </div>
      )}
      <div className="collection-results-bar">
        <p role="status" aria-live="polite">
          <strong>{filtered.length}</strong>{" "}
          {filtered.length === 1 ? "property" : "properties"} in view
        </p>
        <div>
          <button
            className="collection-share"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(window.location.href);
                setCopied("Collection link copied");
              } catch {
                setCopied(
                  "Copy the address from your browser to share this collection.",
                );
              }
            }}
          >
            Share this view ↗
          </button>
          <label>
            Sort by
            <select
              value={filters.sort || "featured"}
              onChange={(e) => update({ sort: e.target.value })}
            >
              <option value="featured">Featured</option>
              <option value="location">Location</option>
              <option value="title">Property name</option>
            </select>
          </label>
        </div>
      </div>
      {copied && (
        <p className="collection-share-status" role="status">
          {copied}
        </p>
      )}
      <div className="property-grid">
        {filtered.map((x) => (
          <PropertyCard item={x} key={x.slug} />
        ))}
      </div>
      {!filtered.length && (
        <div className="collection-empty">
          <h2>A more personal search.</h2>
          <p>
            There are no published properties matching this selection. Broaden
            your filters or share your brief with our real estate team.
          </p>
          <div>
            <button className="button" onClick={() => update(empty)}>
              Clear filters
            </button>
            <Link
              className="text-link"
              href="/contact?interest=Real%20Estate%20Listings%20%26%20Advisory"
            >
              Share your property brief <Arrow />
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
