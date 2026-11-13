"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { practiceOptions } from "../../lib/business.mjs";
import {
  selectVisible,
  publishSelection,
} from "../../lib/bulk-publication.mjs";
import { portalAction } from "../account/profile";
import CatalogueImport from "./catalogue-import";
const labels = {
  cms: [
    "Website CMS",
    "Pages, leadership, practice content, perspectives and FAQs.",
    "page",
  ],
  listings: [
    "Real estate listings",
    "Property opportunities, CIRP, strategic investments and special situations.",
    "opportunity",
  ],
  catalogue: [
    "HORECA product catalogue",
    "SKUs, specifications, pricing labels and approved product imagery.",
    "product",
  ],
  projects: [
    "Project showcases",
    "Project profiles, delivery references and hospitality case studies.",
    "project",
  ],
};
export default function ContentRegister({ module, items }) {
  const router = useRouter(),
    [search, setSearch] = useState(""),
    [state, setState] = useState("all"),
    [practice, setPractice] = useState(""),
    [selected, setSelected] = useState([]),
    [action, setAction] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [results, setResults] = useState([]);
  const [title, description, kind] = labels[module];
  const rows = items.filter(
    (r) =>
      (state === "all" ||
        (state === "live"
          ? !!r.live_version
          : state === "unlive"
            ? !r.live_version
            : r.status === state)) &&
      (!practice || r.practice === practice) &&
      [
        r.title,
        r.public_data.sku,
        r.public_data.city,
        r.public_data.brand,
        r.public_data.category,
        r.kind,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const chosen = items.filter((r) => selected.includes(r.id)),
    allVisible = rows.length > 0 && rows.every((r) => selected.includes(r.id));
  async function run(e) {
    e.preventDefault();
    setBusy(true);
    setResults([]);
    const snapshot = chosen.map((r) => ({ ...r }));
    try {
      const result = await publishSelection(
        snapshot,
        action,
        (p) => portalAction("publication", p),
        (n, total) =>
          setMessage("Updating " + n + " of " + total + " records…"),
      );
      setResults(result);
      setSelected(result.filter((x) => !x.ok).map((x) => x.id));
      setMessage(
        result.filter((x) => x.ok).length +
          " updated; " +
          result.filter((x) => !x.ok).length +
          " need attention.",
      );
      setAction("");
      router.refresh();
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="module-heading">
        <div>
          <span className="eyebrow">
            {module === "cms"
              ? "EDITORIAL & BRAND"
              : module === "catalogue"
                ? "PRODUCT INFORMATION"
                : "PORTFOLIO PUBLISHING"}
          </span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <div className="workspace-actions">
          {module === "catalogue" && (
            <Link className="primary" href="/admin/catalogue/import">
              Upload brand catalogue
            </Link>
          )}
          <Link className="module-link" href={"/admin/intake?kind=" + kind}>
            {module === "listings"
              ? "Upload property files + create with AI"
              : "Create with AI"}{" "}
            →
          </Link>
        </div>
      </div>
      <div className="metric-grid">
        {[
          ["Total", items.length],
          ["Live", items.filter((r) => r.live_version).length],
          ["Not live", items.filter((r) => !r.live_version).length],
          ["Draft revisions", items.filter((r) => r.status === "draft").length],
        ].map(([k, v]) => (
          <div key={k}>
            <span>{k}</span>
            <strong>{v}</strong>
          </div>
        ))}
      </div>
      <section className="workspace-card">
        <div className="register-toolbar">
          <label>
            Search
            <input
              disabled={busy}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="search"
              placeholder="Title, city, SKU, brand or category"
            />
          </label>
          <label>
            Visibility / revision
            <select
              disabled={busy}
              value={state}
              onChange={(e) => setState(e.target.value)}
            >
              {[
                ["all", "All records"],
                ["live", "Live on website"],
                ["unlive", "Not live"],
                ["draft", "Draft revisions"],
                ["published", "Published revisions"],
                ["archived", "Archived"],
              ].map(([v, l]) => (
                <option value={v} key={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label>
            Practice
            <select
              disabled={busy}
              value={practice}
              onChange={(e) => setPractice(e.target.value)}
            >
              <option value="">All practices</option>
              {practiceOptions.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <Link
            className="button primary"
            href={"/admin/content/new?kind=" + kind}
          >
            + Create with AI ·{" "}
            {module === "listings"
              ? "listing"
              : module === "catalogue"
                ? "product"
                : "content"}
          </Link>
        </div>
        <div className="bulk-toolbar">
          <label className="check">
            <input
              type="checkbox"
              disabled={busy || !rows.length}
              checked={allVisible}
              onChange={(e) =>
                setSelected(selectVisible(selected, rows, e.target.checked))
              }
            />
            Select all {rows.length} filtered records
          </label>
          <span>
            {chosen.length} selected
            {chosen.length > rows.filter((r) => selected.includes(r.id)).length
              ? " (including hidden by filters)"
              : ""}
          </span>
          <button
            disabled={busy || !chosen.length}
            onClick={() => setAction("publish")}
          >
            Make selected live
          </button>
          <button
            disabled={busy || !chosen.length}
            onClick={() => setAction("archive")}
          >
            Take selected offline
          </button>
          <button
            disabled={busy || !chosen.length}
            onClick={() => {
              setSelected([]);
              setAction("");
            }}
          >
            Clear selection
          </button>
        </div>
        {action && (
          <form
            key={action + chosen.map((r) => r.id + ":" + r.version).join("|")}
            onSubmit={run}
            className="bulk-review"
          >
            <h3>
              {action === "publish" ? "Publish" : "Unpublish"} {chosen.length}{" "}
              selected records
            </h3>
            <p>
              {action === "publish"
                ? "This releases each selected saved revision to the website."
                : "This removes the selected records from public view and search. Their saved content remains in the admin register."}
            </p>
            <ul>
              {chosen.map((r) => (
                <li key={r.id}>
                  {r.title} · revision {r.version}
                </li>
              ))}
            </ul>
            {action === "publish" && (
              <>
                <label className="check">
                  <input required type="checkbox" />I have reviewed facts,
                  availability and claims for every selected revision.
                </label>
                <label className="check">
                  <input required type="checkbox" />
                  Media rights and public disclosure are approved for every
                  selected record.
                </label>
              </>
            )}
            <div className="workspace-actions">
              <button className="primary" disabled={busy || !chosen.length}>
                {busy
                  ? "Updating…"
                  : action === "publish"
                    ? "Confirm publish"
                    : "Confirm unpublish"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setAction("")}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
        <p role="status" className="portal-message">
          {message}
        </p>
        {results.some((r) => !r.ok) && (
          <div role="alert" className="workspace-note">
            <h4>These records were not changed</h4>
            <ul>
              {results
                .filter((r) => !r.ok)
                .map((r) => (
                  <li key={r.id}>
                    <Link href={"/admin/content/" + r.id}>{r.title}</Link>:{" "}
                    {r.error}
                  </li>
                ))}
            </ul>
          </div>
        )}
        <div className="table-scroll">
          <table className="workspace-table">
            <thead>
              <tr>
                <th>Select</th>
                <th>{module === "catalogue" ? "Product / SKU" : "Title"}</th>
                <th>Practice</th>
                <th>Website</th>
                <th>Revision</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <input
                      type="checkbox"
                      disabled={busy}
                      aria-label={"Select " + r.title}
                      checked={selected.includes(r.id)}
                      onChange={(e) =>
                        setSelected(
                          selectVisible(selected, [r], e.target.checked),
                        )
                      }
                    />
                  </td>
                  <td>
                    <strong>{r.title}</strong>
                    <small>
                      {r.public_data.sku || r.public_data.city || r.kind}
                    </small>
                  </td>
                  <td>
                    {practiceOptions.find((p) => p[0] === r.practice)?.[1]}
                  </td>
                  <td>
                    <span
                      className={
                        "status-chip " +
                        (r.live_version ? "published" : "draft")
                      }
                    >
                      {r.live_version ? "Live" : "Not live"}
                    </span>
                  </td>
                  <td>
                    {r.version} · {r.status}
                    {r.live_version && (
                      <small>Live revision {r.live_version}</small>
                    )}
                  </td>
                  <td>
                    <Link href={"/admin/content/" + r.id}>Manage →</Link>
                    <br />
                    <Link href={"/admin/content/" + r.id + "/teaser"}>
                      Branded PDF brief ↗
                    </Link>
                    <br />
                    <Link
                      href={
                        "/admin/data-rooms?content=" + r.id + "#room-access"
                      }
                    >
                      Data room & access ↗
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && (
          <div className="empty-state">
            <h3>
              {items.length
                ? "No matching records."
                : "Create your first draft."}
            </h3>
            <p>
              Upload source material and let AI prepare the complete draft for
              review.
            </p>
          </div>
        )}
      </section>
      {module === "catalogue" && <CatalogueImport />}
      <p className="workspace-small">
        Changes to a draft do not affect the live revision until you publish.
        Bulk actions retain individual permissions and revision checks. Failed
        records stay selected for review.
      </p>
    </>
  );
}
