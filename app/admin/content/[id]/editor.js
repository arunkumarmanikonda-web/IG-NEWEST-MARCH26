"use client";
import ProductImages from "../../product-images";
import MediaLibrary from "../../media-library";
import {coordinatesFromText} from '../../../../lib/coordinates.mjs';
import {practiceOptions} from "../../../../lib/business.mjs";
import { useState,useRef } from "react";
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
export default function Editor({ item, terms, selectedTerms, revisions, initialKind, seed, mediaAssets=[],creativeJobs=[] }) {
  const editorForm=useRef(null);
  const router = useRouter(),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [dirty, setDirty] = useState(false);
  const initial=item||seed||{};
  const [kind,setKind]=useState(initial.kind||(kinds.includes(initialKind)?initialKind:"page"));
  const data = initial.public_data || {};
  const [image,setImage]=useState(data.image||""),[imageAlt,setImageAlt]=useState(data.image_alt||"");
  const section=kind==="opportunity"?"listings":kind==="product"?"catalogue":kind==="project"?"projects":"cms";
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
        "sku","brand","category","uom","hsn","gst_pct","moq","pack_size","lead_days","latitude","longitude","location_source","area","area_unit","keys","tenure","availability",
      ].forEach((k) => {
        if (f.get(k)) public_data[k] = f.get(k);
      });
      public_data.location_reviewed=f.get("location_reviewed")==="on";
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
      if (a === "delete") router.replace("/admin/"+section);
      router.refresh();
    });
  }
  return (
    <section className="workspace-card">
      <Link href={"/admin/"+section}>← Back to {section}</Link>
      <h2>{item ? "Edit "+(kind==="opportunity"?"listing":kind==="product"?"product":"content") : "Create "+(kind==="opportunity"?"listing":kind==="product"?"product":"content")}</h2>
      {item && (
        <p>
          Revision {item.version} · {item.status}{" "}
          {item.published_version &&
            "· Last published revision " + item.published_version}
        </p>
      )}
      {!item&&<p className="workspace-note">Create from files, text and images in the <Link href={"/admin/intake?kind="+kind}>AI creation studio</Link>, or complete this form manually.</p>}
      {seed?.review_questions?.length>0&&<div className="review-questions"><h3>Source review</h3><ul>{seed.review_questions.map((q,i)=><li key={i}>{q}</li>)}</ul></div>}
      <form
        ref={editorForm}
        className="workspace-form"
        onSubmit={save}
        onChange={() => setDirty(true)}
      >
        <label>Responsible practice<select name="practice" defaultValue={initial.practice||(kind==='product'?'horeca':kind==='opportunity'?'real-estate':kind==='project'?'hospitality':'corporate')}>{practiceOptions.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
        <label>
          Content type
          <select
            name="kind"
            value={kind}
            onChange={e=>setKind(e.target.value)}
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
            defaultValue={initial.slug || (seed?.title?seed.title.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,100):"")}
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
            defaultValue={initial.title || ""}
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
          These fields are public when published. Do not enter exact addresses,
          personal contacts or restricted financial documents. Confidential
          listings must use an opaque reference, non-identifying title and
          approved imagery.
        </p>
        {[...(kind==="person"?[
          ["job_title", "Leadership role / job title"],
          ["expertise", "Expertise (separate with semicolons)"],
          ["sort_order", "Display order (number)"],
        ]:[]), ...(kind==="product"?[
          ["sku","Unique SKU"],["brand","Brand"],["category","Category"],["uom","Unit of measure"],["hsn","HSN"],["gst_pct","GST %"],["moq","Minimum order quantity"],["pack_size","Pack size"],["lead_days","Lead time · days"]
        ]:[]), ...( ["opportunity","project"].includes(kind)?[
          ["city", "City"],
          ["region", "State / region"],
          ["sector", "Sector"],
          ["asset_class", "Asset class"],
          ["transaction_type", "Transaction type"],
          ["area","Area / size"],["area_unit","Area unit"],["keys","Hotel keys"],["tenure","Tenure"],["availability","Availability"],["latitude","Verified latitude"],["longitude","Verified longitude"],["location_source","Location source / map reference"]
        ]:[]),
          ["price_label", "Approved price label"],
          ["reference", "Public reference"],
          ["image", "Approved image path"],
          ["image_alt", "Image description"],
        ].map(([k, label]) => (
          <label key={k} hidden={kind==="product"&&k==="image"}>
            {label}
            <input
              name={k}
              defaultValue={["image","image_alt"].includes(k)?undefined:data[k] || ""}
              value={k==="image"?image:k==="image_alt"?imageAlt:undefined}
              onChange={e=>{if(k==="image")setImage(e.target.value);if(k==="image_alt")setImageAlt(e.target.value);}}
              maxLength={k === "image_alt" ? 250 : 180}
              placeholder={k === "image" ? "/images/city.jpg" : undefined}
            />
          </label>
        ))}
        {["opportunity","project"].includes(kind)&&<div className="wide workspace-actions"><button type="button" onClick={e=>{const form=e.currentTarget.form,source=form.elements.namedItem('location_source').value,coordinates=coordinatesFromText(source);if(!coordinates){setMessage('Paste a full Google Maps link containing @latitude,longitude or query=latitude,longitude in Location source. Short links and city names do not contain coordinates.');return;}for(const[k,v]of Object.entries(coordinates))form.elements.namedItem(k).value=v;setDirty(true);setMessage('Coordinates extracted from the supplied map link. Verify the location before public disclosure.');}}>Extract coordinates from location link</button></div>}
        <div>
          {["opportunity","project"].includes(kind)&&<label className="check"><input name="location_reviewed" type="checkbox" defaultChecked={data.location_reviewed===true}/>Coordinates verified against the source; approved for public disclosure.</label>}
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
      {kind==="product"?<ProductImages assets={mediaAssets} jobs={creativeJobs} image={image} productId={item?.id} getProduct={()=>{const f=new FormData(editorForm.current);return {title:f.get("title"),summary:f.get("summary"),body:f.get("body"),sku:f.get("sku")};}} onChoose={(path,alt)=>{setImage(path);setImageAlt(alt);setDirty(true);setMessage("Image selected. Save the product draft to retain it.");}}/>:<details className="editor-media"><summary>Choose or upload a source image</summary><MediaLibrary assets={mediaAssets} defaultPractice={initial.practice||(kind==="product"?"horeca":"real-estate")} onChoose={(path,alt)=>{setImage(path);setImageAlt(alt);setDirty(true);setMessage("Image selected. Save the draft to retain it.");}}/></details>}
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
