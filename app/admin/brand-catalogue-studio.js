"use client";
import { adminResponse } from "../../lib/admin-response.mjs";
import { useEffect, useState } from "react";
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
    d = await adminResponse(r);
  if (!r.ok) throw new Error(d.error);
  return d;
}
export default function BrandCatalogueStudio({
  catalogues = [],
  pages = [],
  reviews = [],
  items = [],
  initialId = "",
  initialFile = null,
}) {
  const router = useRouter(),
    [run,setRun] = useState(null),
    [runRevision,setRunRevision] = useState(0),
    [selected, setSelected] = useState(initialId || catalogues[0]?.id || ""),
    [busy, setBusy] = useState(false),
    [autoImage,setAutoImage] = useState(true),
    [notice, setNotice] = useState(""),
    [file, setFile] = useState(initialFile);
  useEffect(() => {
    let cancelled=false, timer;
    setRun(null);
    async function refresh() {
      try {
        const {run}=await post({action:"status",id:selected});
        if(cancelled)return;
        setRun(run);
        if(run && ["queued","working","waiting"].includes(run.state)) {
          router.refresh();
          timer=setTimeout(refresh,30000);
        }
      } catch {
        if(!cancelled)timer=setTimeout(refresh,60000);
      }
    }
    if(selected)refresh();
    return ()=>{cancelled=true;clearTimeout(timer);};
  },[selected,router,runRevision]);
  const itemMap = new Map(items.map((i) => [i.page_id + ":" + i.item_no, i]));
  const catalogue = catalogues.find((x) => x.id === selected),
    results = pages
      .filter((x) => x.catalogue_id === selected)
      .sort((a, b) => a.page_number - b.page_number);
  async function processPages(id, first=1, last=500) {
    setBusy(true);
    try {
      if(last<first)throw Error("The final page must be on or after the starting page.");
      const {run}=await post({action:"queue",id,first,last,auto_images:autoImage});
      setRun(run);setRunRevision(value=>value+1);
      setNotice("Catalogue queued. You can close this page and return to review the product drafts.");
      router.refresh();
    }catch(error){setNotice(error.message);}
    finally{setBusy(false);}
  }
  async function pause() {
    try {
      const {run}=await post({action:"pause",id:selected});
      setRun(run);setRunRevision(value=>value+1);setNotice("Paused. Any page already in progress can finish.");
    }catch(error){setNotice(error.message);}
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
      <label className="check">
        <input type="checkbox" checked={autoImage} disabled={busy} onChange={e=>setAutoImage(e.target.checked)} />
        Use Runway to enhance small supplier photographs or create an illustrative image when a photograph is missing. Images are saved for review. Your configured credit limit applies.
      </label>
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
            required={!file}
            accept="application/pdf,.pdf"
            onChange={(e) => setFile(e.target.files[0])}
          />
          {initialFile && file && <small>Selected PDF: {file.name}</small>}
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
          Manufacturer codes are retained separately. Processing continues after you close the dashboard. If the daily AI allowance is reached, the import resumes after midnight India time.
        </p>
      </form>
      <p role="status" aria-live="polite" className="portal-message">
        {notice}
      </p>
      {run && <p role="status">Background import · {run.state}{run.note && " · "+run.note}</p>}
      {run && ["queued","working","waiting"].includes(run.state) && <button type="button" onClick={pause}>Pause after this page</button>}
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
                Review each source photograph against the original before publication.{" "}
                <a href={"/api/admin/brand-catalogue/" + selected + "/source"}>Download original catalogue</a>
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
                  <a href={"/api/admin/brand-catalogue/" + selected + "/source?page=" + page.page_number} target="_blank" rel="noreferrer">View original page artwork</a>
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
