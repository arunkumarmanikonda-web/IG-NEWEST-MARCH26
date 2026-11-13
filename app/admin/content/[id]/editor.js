"use client";
import ListingImages from "../../listing-images";
import ProductImages from "../../product-images";
import MediaLibrary from "../../media-library";
import { coordinatesFromText } from "../../../../lib/coordinates.mjs";
import { contentPath, slugFromTitle } from "../../../../lib/content-routes.mjs";
import { practiceOptions } from "../../../../lib/business.mjs";
import { useState, useRef } from "react";
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
export default function Editor({
  item,
  terms,
  selectedTerms,
  revisions,
  initialKind,
  seed,
  mediaAssets = [],
  creativeJobs = [],
  catalogueSource = null,
}) {
  const editorForm = useRef(null);
  const router = useRouter(),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [dirty, setDirty] = useState(false);
  const initial = item || seed || {};
  const [kind, setKind] = useState(
    initial.kind || (kinds.includes(initialKind) ? initialKind : "page"),
  );
  const data = initial.public_data || {};
  const [selectedPractice, setSelectedPractice] = useState(
    initial.practice ||
      (kind === "product"
        ? "horeca"
        : kind === "opportunity"
          ? "real-estate"
          : kind === "project"
            ? "hospitality"
            : "corporate"),
  );
  const [slug, setSlug] = useState(
      initial.slug || slugFromTitle(initial.title),
    ),
    [customSlug, setCustomSlug] = useState(!!item),
    [editSku, setEditSku] = useState(false);
  const [image, setImage] = useState(data.image || ""),
    [imageAlt, setImageAlt] = useState(data.image_alt || "");
  const applicableTerms = terms.filter(
    (t) =>
      selectedTerms.includes(t.id) ||
      (kind === "product"
        ? ["product-category", "practice"].includes(t.dimension)
        : kind === "opportunity"
          ? t.dimension !== "product-category"
          : t.dimension === "practice"),
  );
  const section =
    kind === "opportunity"
      ? "listings"
      : kind === "product"
        ? "catalogue"
        : kind === "project"
          ? "projects"
          : "cms";
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
        "seo_keywords",
        "job_title",
        "expertise",
        "sort_order",
        "sku",
        "brand",
        "category",
        "uom",
        "hsn",
        "gst_pct",
        "moq",
        "pack_size",
        "lead_days",
        "latitude",
        "longitude",
        "location_source",
        "area",
        "area_unit",
        "keys",
        "tenure",
        "availability",
      ].forEach((k) => {
        if (f.get(k)) public_data[k] = f.get(k);
      });
      public_data.location_reviewed = f.get("location_reviewed") === "on";
      public_data.confidential = f.get("confidential") === "on";
      public_data.image_identity_reviewed =
        f.get("image_identity_reviewed") === "on";
      const saved = await portalAction("content", {
        id: item?.id,
        version: item?.version,
        kind: item?.kind || f.get("kind"),
        practice: f.get("practice"),
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
      if (a === "delete") router.replace("/admin/" + section);
      router.refresh();
    });
  }
  return (
    <section className="workspace-card">
      <Link href={"/admin/" + section}>← Back to {section}</Link>
      <p>
        <Link href={"/admin/intake?kind=" + kind}>
          Upload PDF, Word, Excel, images or a location link to create a
          reviewed draft →
        </Link>
      </p>
      <h2>
        {item
          ? "Edit " +
            (kind === "opportunity"
              ? "listing"
              : kind === "product"
                ? "product"
                : "content")
          : "Create " +
            (kind === "opportunity"
              ? "listing"
              : kind === "product"
                ? "product"
                : "content")}
      </h2>
      {item && (
        <p>
          <Link
            className="module-link"
            href={"/admin/content/" + item.id + "/teaser"}
          >
            Generate branded PDF brief ↗
          </Link>
        </p>
      )}
      {item && (
        <p>
          Revision {item.version} · {item.status}{" "}
          {item.published_version &&
            "· Last published revision " + item.published_version}
        </p>
      )}
      {!item && (
        <p className="workspace-note">
          Create from files, text and images in the{" "}
          <Link href={"/admin/intake?kind=" + kind}>AI creation studio</Link>,
          or complete this form manually.
        </p>
      )}
      {kind === "product" && (
        <p>
          <a href="#product-images">
            Upload, enhance or generate product images ↓
          </a>
        </p>
      )}
      {catalogueSource && (
        <aside className="catalogue-source-panel">
          <span className="eyebrow">IMPORTED FROM BRAND CATALOGUE</span>
          <h3>
            {catalogueSource.brand} · page {catalogueSource.page}
          </h3>
          {catalogueSource.media_id && (
            <img
              src={"/api/admin/source-media/" + catalogueSource.media_id}
              alt="Product image extracted from the catalogue"
            />
          )}
          <p>{catalogueSource.evidence}</p>
          {catalogueSource.review_notes && (
            <p className="workspace-note">{catalogueSource.review_notes}</p>
          )}
          <p>
            Specifications and an automatic SKU have been saved. Review this
            image against the source before using it publicly.
          </p>
          {catalogueSource.media_id && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                run(async () => {
                  await portalAction("source_media", {
                    action: "publish",
                    id: catalogueSource.media_id,
                    reviewed: true,
                  });
                  setImage(
                    "/images/library/" + catalogueSource.media_id + ".jpg",
                  );
                  setImageAlt(item.title + " · brand catalogue image");
                  setDirty(true);
                  setMessage(
                    "Catalogue image approved and selected. Save the product draft to retain it.",
                  );
                  router.refresh();
                });
              }}
            >
              <label className="check">
                <input type="checkbox" required />
                This image matches the product and its usage rights are
                confirmed.
              </label>
              <button disabled={busy}>Approve & use catalogue image</button>
            </form>
          )}
        </aside>
      )}
      {seed?.review_questions?.length > 0 && (
        <div className="review-questions">
          <h3>Source review</h3>
          <ul>
            {seed.review_questions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </div>
      )}
      <form
        ref={editorForm}
        className="workspace-form"
        onSubmit={save}
        onChange={() => setDirty(true)}
      >
        <label>
          Responsible practice
          <select
            name="practice"
            value={selectedPractice}
            onChange={(e) => setSelectedPractice(e.target.value)}
          >
            {practiceOptions.map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Content type
          <select
            name="kind"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            disabled={!!item}
          >
            {kinds.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Public address
          <input
            name="slug"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setCustomSlug(true);
            }}
            required
            maxLength={120}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            placeholder="ig-opp-reference for confidential assets"
          />
        </label>
        <p className="public-address">
          indiagully.com{contentPath({ kind, slug: slug || "product-name" })}
        </p>
        <label className="wide">
          Public title
          <input
            name="title"
            defaultValue={initial.title || ""}
            onChange={(e) => {
              if (!customSlug) setSlug(slugFromTitle(e.target.value));
            }}
            required
            maxLength={180}
          />
        </label>
        <label className="wide">
          Summary
          <textarea
            name="summary"
            defaultValue={initial.summary || ""}
            maxLength={500}
          />
        </label>
        <label className="wide">
          Body
          <textarea
            name="body"
            className="body-editor"
            defaultValue={initial.body || ""}
            maxLength={100000}
            placeholder="Plain text. Separate paragraphs with blank lines. Lines beginning with ## become headings."
          />
        </label>
        <p className="wide workspace-note">
          {kind === "product"
            ? "Product details become public only after publication. Verify the brand, manufacturer code, specifications and image match against your source."
            : "These fields are public when published. Do not enter exact addresses, personal contacts or restricted financial documents. Confidential listings need an opaque reference, a non-identifying title and approved imagery."}
        </p>
        {kind === "product" && (
          <div className="sku-control wide">
            <label className="check">
              <input
                type="checkbox"
                checked={editSku}
                onChange={(e) => setEditSku(e.target.checked)}
              />
              Set or edit SKU manually
            </label>
            <label>
              India Gully SKU
              <input
                name="sku"
                defaultValue={item ? data.sku || "" : ""}
                readOnly={!editSku}
                maxLength={80}
                pattern="[A-Za-z0-9][A-Za-z0-9._-]{1,79}"
                placeholder="Generated automatically when this product is saved"
              />
            </label>
            <p className="workspace-small">
              {data.sku
                ? "The existing SKU is retained unless you change it."
                : "An unused SKU is assigned automatically using the brand and a sequential reference."}{" "}
              Manufacturer model / article codes belong in Public reference.
            </p>
          </div>
        )}
        {[
          ...(kind === "person"
            ? [
                ["job_title", "Leadership role / job title"],
                ["expertise", "Expertise (separate with semicolons)"],
                ["sort_order", "Display order (number)"],
              ]
            : []),
          ...(kind === "product"
            ? [
                ["brand", "Brand"],
                ["category", "Category"],
                ["uom", "Unit of measure"],
                ["hsn", "HSN"],
                ["gst_pct", "GST %"],
                ["moq", "Minimum order quantity"],
                ["pack_size", "Pack size"],
                ["lead_days", "Lead time · days"],
              ]
            : []),
          ...(["opportunity", "project"].includes(kind)
            ? [
                ["city", "City"],
                ["region", "State / region"],
                ["sector", "Sector"],
                ["asset_class", "Asset class"],
                ["transaction_type", "Transaction type"],
                ["area", "Area / size"],
                ["area_unit", "Area unit"],
                ["keys", "Hotel keys"],
                ["tenure", "Tenure"],
                ["availability", "Availability"],
                ["latitude", "Verified latitude"],
                ["longitude", "Verified longitude"],
                ["location_source", "Location source / map reference"],
              ]
            : []),
          ["price_label", "Approved price label"],
          ["reference", "Public reference"],
          ["image", "Approved image path"],
          ["image_alt", "Image description"],
        ].map(([k, label]) =>
          kind === "product" && k === "image" ? (
            <input key={k} type="hidden" name="image" value={image} />
          ) : (
            <label key={k}>
              {label}
              <input
                name={k}
                defaultValue={
                  ["image", "image_alt"].includes(k) ? undefined : data[k] || ""
                }
                value={
                  k === "image"
                    ? image
                    : k === "image_alt"
                      ? imageAlt
                      : undefined
                }
                onChange={(e) => {
                  if (k === "image") setImage(e.target.value);
                  if (k === "image_alt") setImageAlt(e.target.value);
                }}
                maxLength={
                  k === "image_alt" ? 250 : k === "location_source" ? 500 : 180
                }
                placeholder={k === "image" ? "/images/city.jpg" : undefined}
              />
            </label>
          ),
        )}
        {["opportunity", "project"].includes(kind) && (
          <div className="wide workspace-actions">
            <button
              type="button"
              disabled={busy}
              onClick={async (e) => {
                const form = e.currentTarget.form;
                const source = form.elements.namedItem("location_source").value;
                setBusy(true);
                try {
                  let point = coordinatesFromText(source);
                  if (!point) {
                    const response = await fetch("/api/admin/location", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ source }),
                    });
                    const result = await response.json();
                    if (!response.ok) throw new Error(result.error);
                    point = result;
                    if (result.source.length <= 500)
                      form.elements.namedItem("location_source").value =
                        result.source;
                  }
                  for (const k of ["latitude", "longitude"])
                    form.elements.namedItem(k).value = point[k];
                  form.elements.namedItem("location_reviewed").checked = false;
                  setDirty(true);
                  setMessage(
                    "Coordinates extracted. Verify the map pin and approve location disclosure before publication.",
                  );
                } catch (error) {
                  setMessage(error.message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Extract coordinates from location link
            </button>
          </div>
        )}
        <div>
          {["opportunity", "project"].includes(kind) && (
            <label className="check">
              <input
                name="location_reviewed"
                type="checkbox"
                defaultChecked={data.location_reviewed === true}
              />
              Coordinates verified against the source; approved for public
              disclosure.
            </label>
          )}
          {["opportunity", "project"].includes(kind) && (
            <label className="check">
              <input
                type="checkbox"
                name="confidential"
                defaultChecked={data.confidential === true}
                onChange={(e) => {
                  if (e.target.checked && !item) {
                    setSlug(
                      "ig-opp-" +
                        crypto.randomUUID().replaceAll("-", "").slice(0, 16),
                    );
                    setCustomSlug(true);
                  }
                }}
              />
              Confidential teaser
            </label>
          )}
          <label className="check">
            <input
              type="checkbox"
              name="image_identity_reviewed"
              defaultChecked={data.image_identity_reviewed === true}
            />
            {kind === "product"
              ? "Image accurately represents the product"
              : "Image reviewed for identifying details"}
          </label>
        </div>
        {!!applicableTerms.length && (
          <fieldset className="wide role-grid">
            <legend>Classification tags</legend>
            {applicableTerms
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
        )}
        <label className="wide">
          Search keywords / phrases
          <input
            name="seo_keywords"
            defaultValue={data.seo_keywords || ""}
            maxLength={500}
            placeholder="Property type, location and relevant transaction phrases, separated by commas"
          />
          <small>
            Use relevant phrases naturally in the title, headings and
            description. Review AI suggestions against the actual asset.
          </small>
        </label>
        {seed?.ad_headlines?.length > 0 && (
          <div className="wide workspace-note">
            <h3>Advertising copy for review</h3>
            <p>{seed.ad_headlines.join(" · ")}</p>
            {seed.ad_descriptions?.map((s, i) => (
              <p key={i}>{s}</p>
            ))}
            <small>
              Draft suggestions only. No advertising campaign or spend is
              activated.
            </small>
          </div>
        )}
        <label>
          SEO title
          <input
            name="seo_title"
            defaultValue={initial.seo_title || ""}
            maxLength={90}
          />
        </label>
        <label>
          Search description
          <textarea
            name="seo_description"
            defaultValue={initial.seo_description || ""}
            maxLength={200}
          />
        </label>
        <div className="workspace-actions wide">
          <button className="primary" disabled={busy}>
            Save draft
          </button>
        </div>
      </form>
      {kind === "product" ? (
        <ProductImages
          assets={mediaAssets}
          jobs={creativeJobs}
          image={image}
          productId={item?.id}
          getProduct={() => {
            const f = new FormData(editorForm.current);
            return {
              title: f.get("title"),
              summary: f.get("summary"),
              body: f.get("body"),
              sku: f.get("sku"),
            };
          }}
          onChoose={(path, alt) => {
            setImage(path);
            setImageAlt(alt);
            setDirty(true);
            setMessage("Image selected. Save the product draft to retain it.");
          }}
        />
      ) : ["opportunity", "project"].includes(kind) ? (
        <ListingImages
          assets={mediaAssets}
          jobs={creativeJobs}
          practice={selectedPractice}
          image={image}
          getListing={() => {
            const f = new FormData(editorForm.current);
            return {
              title: f.get("title"),
              summary: f.get("summary"),
              body: f.get("body"),
            };
          }}
          onChoose={(path, alt) => {
            setImage(path);
            setImageAlt(alt);
            setDirty(true);
            setMessage("Hero selected. Save the draft to retain it.");
          }}
        />
      ) : (
        <details className="editor-media">
          <summary>Choose or upload a source image</summary>
          <MediaLibrary
            assets={mediaAssets}
            defaultPractice={
              initial.practice ||
              (kind === "product" ? "horeca" : "real-estate")
            }
            onChoose={(path, alt) => {
              setImage(path);
              setImageAlt(alt);
              setDirty(true);
              setMessage("Image selected. Save the draft to retain it.");
            }}
          />
        </details>
      )}
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
            <Link href={contentPath(item)} target="_blank">
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
