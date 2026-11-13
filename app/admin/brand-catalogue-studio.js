"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  hashSourceFile,
  resumableSourceUpload,
} from "../../lib/intake-upload.mjs";
async function post(payload) {
  const r = await fetch("/api/admin/brand-catalogue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
    d = await r.json();
  if (!r.ok) throw new Error(d.error);
  return d;
}
export default function BrandCatalogueStudio({
  catalogues = [],
  pages = [],
  reviews = [],
  items = [],
  initialId = "",
}) {
  const router = useRouter(),
    stop = useRef(false),
    [selected, setSelected] = useState(initialId || catalogues[0]?.id || ""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [file, setFile] = useState(null);
  useEffect(
    () => () => {
      stop.current = true;
    },
    [],
  );
  const itemMap = new Map(items.map((i) => [i.page_id + ":" + i.item_no, i]));
  const catalogue = catalogues.find((x) => x.id === selected),
    results = pages
      .filter((x) => x.catalogue_id === selected)
      .sort((a, b) => a.page_number - b.page_number);
  async function processPages(id, start = 1, last = 500) {
    if (last < start) {
      setNotice("The final page must be after the starting page.");
      return;
    }
    stop.current = false;
    setBusy(true);
    let created = 0,
      completed = 0;
    try {
      for (let page = start; page <= last && !stop.current; page++) {
        setNotice(
          "Reading catalogue page " + page + " and creating product drafts…",
        );
        const d = await post({ action: "process", id, page });
        created += d.created;
        completed++;
        if (d.page_count) last = Math.min(last, d.page_count);
        router.refresh();
        if (page < last && !stop.current) {
          setNotice(
            "Page " +
              page +
              " saved. " +
              created +
              " new drafts created. Continuing with page " +
              (page + 1) +
              " shortly…",
          );
          for (let second = 0; second < 31 && !stop.current; second++)
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
      setNotice(
        (stop.current ? "Paused. " : "Finished selected pages. ") +
          completed +
          " pages processed; " +
          created +
          " new product drafts created. Review product specifications and image matches before publication.",
      );
    } catch (e) {
      setNotice(
        e.message +
          " Completed pages are saved. Resume from the next unfinished page.",
      );
    } finally {
      setBusy(false);
      router.refresh();
    }
  }
  return (
    <section className="workspace-card catalogue-studio">
      <div className="module-heading">
        <div>
          <span className="eyebrow">BRAND CATALOGUE → PRODUCT DRAFTS</span>
          <h3>Turn a catalogue into your product range.</h3>
          <p>
            Upload a brand PDF, including scanned catalogues. AI reads each
            page, separates products and variants, extracts specifications and
            prepares matching image crops.
          </p>
        </div>
      </div>
      <form
        className="workspace-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setNotice("Uploading the catalogue securely…");
          try {
            if (!file || !file.size || !/^.+\.pdf$/i.test(file.name))
              throw new Error("Choose a non-empty PDF catalogue");
            const f = new FormData(e.currentTarget),
              sha256 = await hashSourceFile(file, (p) =>
                setNotice("Checking catalogue · " + p + "%"),
              );
            const d = await post({
              action: "prepare",
              name: file.name,
              size: file.size,
              brand: f.get("brand"),
              rights_reference: f.get("rights"),
              approved: f.get("approved") === "on",
              sha256,
            });
            if (d.upload)
              await resumableSourceUpload({
                file,
                upload: d.upload,
                source: d.catalogue,
                bucket: "ig-brand-catalogues",
                projectUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
                onProgress: (p) =>
                  setNotice("Uploading catalogue · " + p + "%"),
              });
            setSelected(d.catalogue.id);
            router.replace(
              "/admin/catalogue/import?catalogue=" + d.catalogue.id,
            );
            await processPages(d.catalogue.id);
          } catch (e) {
            setNotice(e.message);
            setBusy(false);
          }
        }}
      >
        <label>
          Brand name
          <input
            name="brand"
            required
            minLength={2}
            maxLength={100}
            placeholder="Ariane, Ankur Lighting…"
          />
        </label>
        <label>
          Brand catalogue PDF
          <input
            type="file"
            required
            accept="application/pdf,.pdf"
            onChange={(e) => setFile(e.target.files[0])}
          />
          <small>
            No website-imposed MB cap. Interrupted uploads resume. AI processes
            catalogues of up to 500 pages; completed pages are retained.
          </small>
        </label>
        <label className="wide">
          Catalogue / image permission reference
          <input
            name="rights"
            required
            minLength={5}
            maxLength={500}
            placeholder="Brand-supplied catalogue and permission to use product imagery"
          />
        </label>
        <label className="check wide">
          <input type="checkbox" name="approved" required />I am authorised to
          send this catalogue to OpenAI and use its product text and images.
        </label>
        <div className="workspace-actions wide">
          <button className="primary" disabled={busy}>
            Upload & create product drafts
          </button>
        </div>
        <p className="workspace-small wide">
          SKUs are assigned automatically and can be edited in each product.
          Manufacturer codes are retained separately. Keep this page open while
          processing; pause or resume at any time. Your configured daily AI
          limit applies.
        </p>
      </form>
      <p role="status" aria-live="polite" className="portal-message">
        {notice}
      </p>
      {busy && (
        <button
          type="button"
          onClick={() => {
            stop.current = true;
            setNotice("Pausing after the current page finishes…");
          }}
        >
          Pause after this page
        </button>
      )}
      {!!catalogues.length && (
        <>
          <div className="catalogue-resume">
            <label>
              Uploaded catalogues
              <select
                value={selected}
                disabled={busy}
                onChange={(e) => {
                  setSelected(e.target.value);
                  router.replace(
                    "/admin/catalogue/import?catalogue=" + e.target.value,
                  );
                }}
              >
                <option value="">Select catalogue</option>
                {catalogues.map((c) => (
                  <option value={c.id} key={c.id}>
                    {c.brand} · {c.name}
                  </option>
                ))}
              </select>
            </label>
            {catalogue && (
              <p>
                {results.filter((p) => p.status === "ready").length} pages
                prepared
                {catalogue.page_count ? " of " + catalogue.page_count : ""}.
                Products and source images remain drafts until reviewed.
              </p>
            )}
            <form
              key={selected + results.length}
              className="workspace-form"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                processPages(
                  selected,
                  Number(f.get("start")),
                  Number(f.get("end")) || catalogue?.page_count || 500,
                );
              }}
            >
              <label>
                From page
                <input
                  type="number"
                  name="start"
                  min={1}
                  max={catalogue?.page_count || 500}
                  defaultValue={
                    Array.from(
                      { length: catalogue?.page_count || 500 },
                      (_, i) => i + 1,
                    ).find(
                      (n) =>
                        !results.some(
                          (p) => p.page_number === n && p.status === "ready",
                        ),
                    ) || 1
                  }
                  required
                />
              </label>
              <label>
                Through page
                <input
                  type="number"
                  name="end"
                  min={1}
                  max={catalogue?.page_count || 500}
                  placeholder={
                    catalogue?.page_count
                      ? String(catalogue.page_count)
                      : "Last page"
                  }
                />
              </label>
              <button disabled={busy || !selected}>
                Resume selected pages
              </button>
            </form>
          </div>
          <p className="workspace-small">
            The most recently processed pages appear below. Choose a page to
            inspect earlier products.
          </p>
          <div className="workspace-actions">
            {results.map((p) => (
              <Link
                key={p.id}
                href={
                  "/admin/catalogue/import?catalogue=" +
                  selected +
                  "&review=" +
                  p.page_number
                }
              >
                Page {p.page_number}
                {p.status === "failed"
                  ? " · retry"
                  : p.complete === false
                    ? " · review"
                    : ""}
              </Link>
            ))}
          </div>
          <div className="catalogue-page-results">
            {reviews
              .filter((p) => p.catalogue_id === selected)
              .map((page) => (
                <details
                  key={page.id}
                  open={
                    page.status === "failed" || page.result?.complete === false
                  }
                >
                  <summary>
                    Page {page.page_number} ·{" "}
                    {page.status === "ready"
                      ? (page.result?.products.length || 0) + " products"
                      : page.status}
                    {page.result?.complete === false
                      ? " · additional review required"
                      : ""}
                  </summary>
                  {page.note && <p role="alert">{page.note}</p>}
                  {page.result?.notes && <p>{page.result.notes}</p>}
                  <div className="catalogue-product-grid">
                    {page.result?.products.map((p, index) => {
                      const link = itemMap.get(page.id + ":" + index);
                      return (
                        <article
                          key={index}
                          className="catalogue-product-review"
                        >
                          {link?.media_id ? (
                            <img
                              loading="lazy"
                              src={"/api/admin/source-media/" + link.media_id}
                              alt={p.title + " · extracted source image"}
                            />
                          ) : (
                            <div className="catalogue-no-image">
                              Image needs review / upload
                            </div>
                          )}
                          <strong>{p.title}</strong>
                          {p.reference && (
                            <small>Manufacturer code: {p.reference}</small>
                          )}
                          <p className="preserve-lines">{p.specifications}</p>
                          {p.review_notes && (
                            <p className="workspace-note">{p.review_notes}</p>
                          )}
                          <details>
                            <summary>Source evidence</summary>
                            <p>{p.evidence}</p>
                          </details>
                          {link?.content_id && (
                            <Link href={"/admin/content/" + link.content_id}>
                              Review product & SKU →
                            </Link>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </details>
              ))}
          </div>
        </>
      )}
    </section>
  );
}
