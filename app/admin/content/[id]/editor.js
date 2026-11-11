"use client";
import {practiceOptions} from "../../../../lib/business.mjs";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { portalAction } from "../../../account/profile";
const kinds = [
  "page",
  "practice",
  "opportunity",
  "product",
  "project",
  "article",
  "person",
  "faq",
];
export default function Editor({ item, terms, selectedTerms, revisions }) {
  const router = useRouter(),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [dirty, setDirty] = useState(false);
  const data = item?.public_data || {};
  async function run(task) {
    setBusy(true);
    setMessage("");
    try {
      await task();
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function save(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await run(async () => {
      const public_data = {};
      [
        "city",
        "region",
        "sector",
        "asset_class",
        "transaction_type",
        "image",
        "image_alt",
        "price_label",
        "reference",
        "job_title",
        "expertise",
        "sort_order",
      ].forEach((k) => {
        if (f.get(k)) public_data[k] = f.get(k);
      });
      public_data.confidential = f.get("confidential") === "on";
      public_data.image_identity_reviewed =
        f.get("image_identity_reviewed") === "on";
      const saved = await portalAction("content", {
        id: item?.id,
        version: item?.version,
        kind: item?.kind || f.get("kind"),
        practice:f.get("practice"),
        slug: f.get("slug"),
        title: f.get("title"),
        summary: f.get("summary"),
        body: f.get("body"),
        seo_title: f.get("seo_title"),
        seo_description: f.get("seo_description"),
        public_data,
        term_ids: f.getAll("terms"),
      });
      setDirty(false);
      setMessage("Draft revision " + saved.version + " saved.");
      router.replace("/admin/content/" + saved.id);
      router.refresh();
    });
  }
  async function action(a, p = {}) {
    if (dirty) {
      setMessage("Save your changes before performing a publication action.");
      return;
    }
    await run(async () => {
      await portalAction("publication", {
        action: a,
        id: item.id,
        version: item.version,
        ...p,
      });
      setMessage(
        a === "publish" ? "Published this revision." : "Content updated.",
      );
      if (a === "delete") router.replace("/admin/content");
      router.refresh();
    });
  }
  return (
    <section className="workspace-card">
      <Link href="/admin/content">← Content & listings</Link>
      <h2>{item ? "Edit content" : "Create content"}</h2>
      {item && (
        <p>
          Revision {item.version} · {item.status}{" "}
          {item.published_version &&
            "· Last published revision " + item.published_version}
        </p>
      )}
      <form
        className="workspace-form"
        onSubmit={save}
        onChange={() => setDirty(true)}
      >
        <label>Responsible practice<select name="practice" defaultValue={item?.practice||'corporate'}>{practiceOptions.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
        <label>
          Content type
          <select
            name="kind"
            defaultValue={item?.kind || "opportunity"}
            disabled={!!item}
          >
            {kinds.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          URL slug
          <input
            name="slug"
            defaultValue={item?.slug || ""}
            required
            maxLength={120}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            placeholder="ig-opp-reference for confidential assets"
          />
        </label>
        <label className="wide">
          Public title
          <input
            name="title"
            defaultValue={item?.title || ""}
            required
            maxLength={180}
          />
        </label>
        <label className="wide">
          Summary
          <textarea
            name="summary"
            defaultValue={item?.summary || ""}
            maxLength={500}
          />
        </label>
        <label className="wide">
          Body
          <textarea
            name="body"
            className="body-editor"
            defaultValue={item?.body || ""}
            maxLength={100000}
            placeholder="Plain text. Separate paragraphs with blank lines. Lines beginning with ## become headings."
          />
        </label>
        <p className="wide workspace-note">
          These fields are public when published. Do not enter exact addresses,
          personal contacts or restricted financial documents. Confidential
          listings must use an opaque reference, non-identifying title and
          approved imagery.
        </p>
        {[
          ["job_title", "Leadership role / job title"],
          ["expertise", "Expertise (separate with semicolons)"],
          ["sort_order", "Display order (number)"],
          ["city", "City"],
          ["region", "State / region"],
          ["sector", "Sector"],
          ["asset_class", "Asset class"],
          ["transaction_type", "Transaction type"],
          ["price_label", "Approved price label"],
          ["reference", "Public reference"],
          ["image", "Approved image path"],
          ["image_alt", "Image description"],
        ].map(([k, label]) => (
          <label key={k}>
            {label}
            <input
              name={k}
              defaultValue={data[k] || ""}
              maxLength={k === "image_alt" ? 250 : 180}
              placeholder={k === "image" ? "/images/city.jpg" : undefined}
            />
          </label>
        ))}
        <div>
          <label className="check">
            <input
              type="checkbox"
              name="confidential"
              defaultChecked={data.confidential === true}
            />
            Confidential teaser
          </label>
          <label className="check">
            <input
              type="checkbox"
              name="image_identity_reviewed"
              defaultChecked={data.image_identity_reviewed === true}
            />
            Image reviewed for identifying details
          </label>
        </div>
        <fieldset className="wide role-grid">
          <legend>Classification tags</legend>
          {terms
            .filter((t) => t.active || selectedTerms.includes(t.id))
            .map((t) => (
              <label className="check" key={t.id}>
                <input
                  name="terms"
                  type="checkbox"
                  value={t.id}
                  defaultChecked={selectedTerms.includes(t.id)}
                />
                {t.label}
                {!t.active ? " (retired: remove before saving)" : ""}
              </label>
            ))}
        </fieldset>
        <label>
          SEO title
          <input
            name="seo_title"
            defaultValue={item?.seo_title || ""}
            maxLength={90}
          />
        </label>
        <label>
          Search description
          <textarea
            name="seo_description"
            defaultValue={item?.seo_description || ""}
            maxLength={200}
          />
        </label>
        <div className="workspace-actions wide">
          <button className="primary" disabled={busy}>
            Save draft
          </button>
        </div>
      </form>
      <p role="status" className="portal-message">
        {message}
      </p>
      {item && (
        <>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              action("publish", {
                factsConfirmed: true,
                rightsConfirmed: true,
                privacyConfirmed: true,
              });
            }}
          >
            <h3>Publication check</h3>
            <label className="check">
              <input required type="checkbox" />
              Facts, availability and claims are verified.
            </label>
            <label className="check">
              <input required type="checkbox" />
              Media rights and permissions are confirmed.
            </label>
            <label className="check">
              <input required type="checkbox" />
              The public disclosure contains no restricted information.
            </label>
            <div className="workspace-actions">
              <button disabled={busy || dirty} className="primary">
                Publish revision {item.version}
              </button>
              <button
                type="button"
                disabled={busy || dirty}
                onClick={() => {
                  if (confirm("Withdraw this content from public view?"))
                    action("archive");
                }}
              >
                Archive / unpublish
              </button>
              {item.status === "archived" && (
                <>
                  <button
                    type="button"
                    disabled={busy || dirty}
                    onClick={() => action("restore")}
                  >
                    Restore draft
                  </button>
                  <button
                    type="button"
                    disabled={busy || dirty}
                    onClick={() => {
                      if (
                        confirm(
                          "Permanently delete this archived record and its revisions?",
                        )
                      )
                        action("delete");
                    }}
                  >
                    Delete permanently
                  </button>
                </>
              )}
            </div>
          </form>
          <p>
            <Link
              href={"/published/" + item.kind + "/" + item.slug}
              target="_blank"
            >
              Open published view
            </Link>
          </p>
          <details>
            <summary>Revision history</summary>
            <ul>
              {revisions.map((x) => (
                <li key={x.version}>
                  Revision {x.version} ·{" "}
                  {new Date(x.created_at).toLocaleString("en-IN")}
                </li>
              ))}
            </ul>
          </details>
        </>
      )}
    </section>
  );
}
