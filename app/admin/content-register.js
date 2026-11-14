"use client";
import {staffPhoto} from "../../lib/staff-photo.mjs";
import CataloguePhotoImport from "./catalogue-photo-import";
import { visibleInRegister } from "../../lib/registers.mjs";
import { contentPath } from "../../lib/content-routes.mjs";
import { useRef, useState } from "react";
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
    [state, setState] = useState("active"),
    [practice, setPractice] = useState(""),
    [selected, setSelected] = useState([]),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [results, setResults] = useState([]);
  const inFlight = useRef(false);
  const [title, description, kind] = labels[module];
  const rows = items.filter(
    (r) =>
      visibleInRegister(r, state) &&
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
  const missingUnit = chosen.filter(row => row.kind === "product" && !row.public_data?.uom);
  async function changeDeletion(row, operation) {
    const messages = {
      trash: "Move “" + row.title + "” to Deleted? It will be removed from the website and active listings. Its data room and history are retained.",
      restore: "Restore “" + row.title + "” as a private draft?",
      delete: "Permanently delete “" + row.title + "” and its revision history? This cannot be undone.",
    };
    if (!window.confirm(messages[operation])) return;
    setBusy(true);
    setResults([]);
    try {
      await portalAction("publication", {id:row.id,version:row.version,action:operation});
      setSelected(ids => ids.filter(id => id !== row.id));
      setMessage(operation === "trash" ? "Listing moved to Deleted." : operation === "restore" ? "Restored as a private draft." : "Listing permanently deleted.");
      router.refresh();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }
  async function run(action) {
    if (!chosen.length || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setResults([]);
    const count = chosen.length;
    setMessage(action === "publish" ? "Publishing " + count + "…" : "Taking " + count + " offline…");
    try {
      const outcomes = await publishSelection(
        chosen, action, payload => portalAction("bulk_publication", payload),
        (done, total) => setMessage("Processed " + done + " of " + total + "…"),
      );
      const successful = outcomes.filter(row => row.ok).length;
      const failed = outcomes.filter(row => !row.ok);
      setResults(outcomes.map(row => ({ ...row, action })));
      setSelected(failed.map(row => row.id));
      setMessage(successful + " of " + count + (action === "publish" ? " confirmed live." : " confirmed offline.") +
        (failed.length ? " " + failed.length + " need attention below." : ""));
      router.refresh();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
      inFlight.current = false;
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
          {module === "cms" && <Link className="primary" href="/admin/cms/site">Edit website pages & menus</Link>}
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
      {module === "catalogue" && <CataloguePhotoImport/>}
      <div className="metric-grid">
        {[
          ["Active records", items.filter(r => visibleInRegister(r, "active")).length],
          ["Live", items.filter((r) => r.live_version).length],
          ["Not live", items.filter(r => visibleInRegister(r, "unlive")).length],
          ["Draft revisions", items.filter((r) => !r.deleted_at && r.status === "draft").length],
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
              onChange={(e) => {setSearch(e.target.value);setSelected([]);}}
              type="search"
              placeholder="Title, city, SKU, brand or category"
            />
          </label>
          <label>
            Visibility / revision
            <select
              disabled={busy}
              value={state}
              onChange={(e) => {setState(e.target.value);setSelected([]);}}
            >
              {[
                ["active", "Active records"],
                ["live", "Live on website"],
                ["unlive", "Not live"],
                ["draft", "Draft revisions"],
                ["published", "Published revisions"],
                ["archived", "Archived"],
                ["deleted", "Deleted"],
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
              onChange={(e) => {setPractice(e.target.value);setSelected([]);}}
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
          <p id="publish-review" className="publish-review">Make selected live publishes the checked revisions immediately. By publishing, you confirm the facts, availability, media rights and approval for public release.</p>
          {missingUnit.length > 0 && <p className="publish-review">
            {missingUnit.length} selected {missingUnit.length === 1 ? "product needs" : "products need"} an order unit before publication.
          </p>}
          <label className="check">
            <input
              type="checkbox"
              disabled={busy || !rows.length || state === "deleted"}
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
            type="button" className="publish-selected" aria-describedby="publish-review" onClick={() => run("publish")}
          >
            Make selected live
          </button>
          <button
            disabled={busy || !chosen.length}
            type="button" onClick={() => run("archive")}
          >
            Take selected offline
          </button>
          <button
            disabled={busy || !chosen.length}
            onClick={() => {
              setSelected([]);
            }}
          >
            Clear selection
          </button>
        </div>
        <div role="status" className={message ? "workspace-note" : undefined} aria-live="polite">{message}</div>
        {results.some(r => r.ok && r.action === "publish") && <details className="publication-receipt" open={results.filter(r => r.ok).length <= 5}>
          <summary>View published pages ({results.filter(r => r.ok).length})</summary>
          <ul>{results.filter(r => r.ok).map(r => <li key={r.id}><Link href={contentPath(r)}>{r.title} ↗</Link></li>)}</ul>
        </details>}
        {results.some((r) => !r.ok) && (
          <div role="alert" className="workspace-note">
            <h4>Records that need attention</h4>
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
                      disabled={busy || !!r.deleted_at}
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
                    {r.kind === "product" && (r.public_data.image
                      ? <img width="68" height="54" loading="lazy" style={{objectFit:"contain",display:"block"}} src={staffPhoto(r.public_data.image)} alt={r.public_data.image_alt || r.title}/>
                      : <Link href={"/admin/content/" + r.id + "#product-images"}>Add product photo</Link>)}
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
                    {!r.deleted_at && <Link href={"/admin/content/" + r.id}>Manage →</Link>}
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
                    <div className="workspace-actions">
                      {r.deleted_at ? <>
                        <button type="button" disabled={busy} onClick={() => changeDeletion(r,"restore")}>Restore</button>
                        <button type="button" disabled={busy} onClick={() => changeDeletion(r,"delete")}>Delete permanently</button>
                      </> : <button type="button" disabled={busy} aria-label={"Delete " + r.title} onClick={() => changeDeletion(r,"trash")}>Delete</button>}
                    </div>
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
