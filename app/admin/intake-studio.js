"use client";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { practiceOptions } from "../../lib/business.mjs";
import { portalAction } from "../account/profile";
const kinds = [
  ["opportunity", "Real estate opportunity"],
  ["product", "HORECA product"],
  ["project", "Project showcase"],
  ["page", "Website page"],
  ["article", "Insight / article"],
  ["practice", "Practice page"],
  ["person", "Leadership profile"],
  ["faq", "FAQ"],
];
const base64 = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1]);
    r.onerror = () => reject(new Error("File could not be read"));
    r.readAsDataURL(file);
  });
export default function IntakeStudio() {
  const params = useSearchParams();
  const [kind, setKind] = useState(
      kinds.some((k) => k[0] === params.get("kind"))
        ? params.get("kind")
        : "opportunity",
    ),
    [practice, setPractice] = useState(
      params.get("kind") === "product" ? "horeca" : "real-estate",
    ),
    [files, setFiles] = useState([]),
    [result, setResult] = useState(null),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [media, setMedia] = useState(null),
    [chosen, setChosen] = useState(0);
  async function generate(e) {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    setMessage(
      "Reading the supplied material and preparing a structured draft…",
    );
    try {
      const f = new FormData(e.currentTarget);
      const attachments = await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          data: await base64(file),
        })),
      );
      const r = await fetch("/api/admin/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          practice,
          text: [
            f.get("text"),
            f.get("location") ? "Location source: " + f.get("location") : "",
          ]
            .filter(Boolean)
            .join("\n"),
          brief: f.get("brief"),
          files: attachments,
          approved: f.get("approved") === "on",
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setResult({ ...d, kind, practice });
      setMedia(null);
      setChosen(0);
      setMessage(
        "Draft prepared. Review the extracted facts, imagery and missing information before creating the record.",
      );
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function saveImage(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const f = new FormData(e.currentTarget),
        candidate = result.candidates[chosen];
      const r = await fetch("/api/admin/source-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          practice: result.practice,
          data: candidate.data,
          source_name: candidate.name,
          alt: f.get("alt"),
          preset: f.get("preset"),
          rights_reference: f.get("rights"),
          rights_confirmed: f.get("approved") === "on",
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setMedia({ ...d, alt: f.get("alt") });
      setMessage(
        "Image prepared and stored privately. Review it below before public release.",
      );
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function releaseImage() {
    setBusy(true);
    try {
      await portalAction("source_media", {
        action: "publish",
        id: media.id,
        reviewed: true,
      });
      setMedia({ ...media, published: true });
      setMessage(
        "Reviewed media released. It can now be attached to the draft.",
      );
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
          <span className="eyebrow">SOURCE → STRUCTURE → REVIEW → PUBLISH</span>
          <h2>AI creation studio</h2>
          <p>
            Bring your project material. Build a useful draft, a clear fact base
            and a publication-ready image set.
          </p>
        </div>
        <Link href="/admin/creative" className="module-link">
          Runway creatives ↗
        </Link>
      </div>
      <div className="intake-steps">
        {[
          ["01", "Supply", "Files, text & images"],
          ["02", "Extract", "Facts with source references"],
          ["03", "Review", "Fill gaps & approve imagery"],
          ["04", "Publish", "Release the reviewed revision"],
        ].map(([n, t, d]) => (
          <div key={n}>
            <span>{n}</span>
            <strong>{t}</strong>
            <small>{d}</small>
          </div>
        ))}
      </div>
      <section className="workspace-card">
        <form className="workspace-form" onSubmit={generate}>
          <label>
            Create
            <select
              value={kind}
              onChange={(e) => {
                setKind(e.target.value);
                if (e.target.value === "product") setPractice("horeca");
                if (e.target.value === "project") setPractice("hospitality");
              }}
            >
              {kinds.map(([k, l]) => (
                <option value={k} key={k}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label>
            Responsible practice
            <select
              value={practice}
              onChange={(e) => setPractice(e.target.value)}
            >
              {practiceOptions.map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="wide">
            What should we prepare?
            <textarea
              name="brief"
              required
              minLength={10}
              maxLength={2000}
              defaultValue="Prepare a concise, professional India Gully profile from the supplied material. Extract the relevant facts and create clear website copy and SEO metadata. Flag missing information."
            />
          </label>
          <label className="wide">
            Source details
            <textarea
              name="text"
              maxLength={18000}
              placeholder="Project details, product specifications, approved facts, a location link with coordinates, source references…"
            />
          </label>
          <label className="wide">
            Location / map link (optional)
            <input
              name="location"
              type="url"
              maxLength={1500}
              placeholder="https://www.google.com/maps/@latitude,longitude,..."
            />
            <small>
              A full map link with coordinates can be extracted. Short links and
              place names are flagged for review.
            </small>
          </label>
          <label className="wide source-drop">
            Attach source material
            <input
              type="file"
              multiple
              accept=".pdf,.docx,.xlsx,.pptx,.csv,.txt,.jpg,.jpeg,.png,.webp"
              onChange={(e) => {
                const list = [...e.target.files];
                if (
                  list.length > 8 ||
                  list.reduce((n, f) => n + f.size, 0) > 2500000
                ) {
                  setMessage(
                    "Attach up to eight files, with a combined size of 2.5 MB.",
                  );
                  e.target.value = "";
                  setFiles([]);
                } else {
                  setFiles(list);
                  setMessage("");
                }
              }}
            />
            <span>
              PDF · Word · Excel · PowerPoint · CSV · text · JPEG · PNG · WebP.
              Up to 8 files / 2.5 MB total.
            </span>
            {files.map((f) => (
              <small key={f.name}>
                {f.name} · {Math.round(f.size / 1024)} KB
              </small>
            ))}
          </label>
          <p className="workspace-small wide">
            Office text and tables are analysed. PDF visuals can be read; source
            photographs are gathered from supported images and embedded document
            media. Unknown measurements, prices, legal facts and coordinates
            remain unanswered. Do not upload private data-room or client
            material without the required authority.
          </p>
          <label className="check wide">
            <input name="approved" required type="checkbox" />I am authorised to
            send these sources to OpenAI for processing and use them to prepare
            public-facing drafts.
          </label>
          <div className="workspace-actions wide">
            <button disabled={busy} className="primary">
              {busy ? "Preparing…" : "Generate from supplied sources"}
            </button>
          </div>
        </form>
      </section>
      <p role="status" className="portal-message">
        {message}
      </p>
      {result && (
        <>
          <section className="workspace-card">
            <div className="module-heading">
              <div>
                <span className="eyebrow">DRAFT / NOT PUBLISHED</span>
                <h3>{result.draft.title}</h3>
                <p>{result.draft.summary}</p>
              </div>
            </div>
            <p className="preserve-lines">{result.draft.body}</p>
            <div className="extracted-fields">
              {Object.entries(result.draft.fields)
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k}>
                    <span>{k.replaceAll("_", " ")}</span>
                    <strong>{v}</strong>
                  </div>
                ))}
            </div>
            <details>
              <summary>Source evidence</summary>
              <div className="table-scroll">
                <table className="workspace-table">
                  <thead>
                    <tr>
                      <th>Field</th>
                      <th>Extracted value</th>
                      <th>Source</th>
                      <th>Supporting excerpt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.draft.evidence.map((e, i) => (
                      <tr key={i}>
                        <td>{e.field}</td>
                        <td>{e.value}</td>
                        <td>{e.source}</td>
                        <td>{e.excerpt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
            <div className="workspace-note">
              <h4>Search & campaign copy</h4>
              <p>
                <strong>SEO title:</strong> {result.draft.seo_title}
              </p>
              <p>{result.draft.seo_description}</p>
              <p>
                <strong>Suggested phrases:</strong>{" "}
                {(result.draft.keywords || []).join(" · ")}
              </p>
              {result.draft.ad_headlines?.map((s, i) => (
                <p key={i}>{s}</p>
              ))}
              {result.draft.ad_descriptions?.map((s, i) => (
                <p key={i}>{s}</p>
              ))}
              <small>
                Review suggestions before use. No paid campaign is activated.
              </small>
            </div>
            <div className="review-questions">
              <h4>Resolve before publication</h4>
              {result.draft.review_questions.length ? (
                <ul>
                  {result.draft.review_questions.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              ) : (
                <p>
                  No gaps were flagged by the model. Factual and rights review
                  is still required.
                </p>
              )}
            </div>
            <div className="workspace-actions">
              <Link
                className="primary"
                href={
                  "/admin/content/new?kind=" +
                  result.kind +
                  "&ai=" +
                  result.id +
                  (media?.published ? "&media=" + media.id : "")
                }
              >
                Review in{" "}
                {result.kind === "product"
                  ? "product"
                  : result.kind === "opportunity"
                    ? "listing"
                    : "content"}{" "}
                editor →
              </Link>
            </div>
          </section>
          {!!result.candidates.length && (
            <section className="workspace-card">
              <h3>Images gathered from your sources</h3>
              <p className="workspace-small">
                Choose an image for the listing. The formatter preserves the
                image content, fits it within the selected frame and removes
                metadata. It does not manufacture property features.
              </p>
              <div className="source-image-grid">
                {result.candidates.map((c, i) => (
                  <button
                    aria-pressed={chosen === i}
                    key={i}
                    onClick={() => setChosen(i)}
                  >
                    <img
                      src={"data:" + c.mime + ";base64," + c.data}
                      alt={"Source candidate " + (i + 1)}
                    />
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
              <form className="workspace-form" onSubmit={saveImage}>
                <label>
                  Posting format
                  <select name="preset">
                    <option value="landscape">
                      Landscape · listing / project
                    </option>
                    <option value="square">Square · product / social</option>
                    <option value="portrait">Portrait · teaser</option>
                  </select>
                </label>
                <label>
                  Image description
                  <input
                    name="alt"
                    required
                    minLength={5}
                    maxLength={250}
                    defaultValue={result.draft.title}
                  />
                </label>
                <label className="wide">
                  Image rights / permission reference
                  <input
                    name="rights"
                    required
                    minLength={5}
                    maxLength={500}
                    placeholder="Owner-supplied material; approval date / source reference"
                  />
                </label>
                <label className="check wide">
                  <input name="approved" type="checkbox" required />I confirm
                  usage rights and that this image accurately represents the
                  stated subject.
                </label>
                <button disabled={busy}>Prepare & save image</button>
              </form>
              {media && (
                <div className="prepared-media">
                  <img
                    src={"/api/admin/source-media/" + media.id}
                    alt={media.alt}
                  />
                  {!media.published ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        releaseImage();
                      }}
                    >
                      <label className="check">
                        <input required type="checkbox" />I approve this
                        prepared image for public use, including identity and
                        confidentiality.
                      </label>
                      <button disabled={busy}>Release reviewed image</button>
                    </form>
                  ) : (
                    <p>
                      Image approved. Use the editor link above to attach it.
                    </p>
                  )}
                </div>
              )}
            </section>
          )}
          {result.notes?.map((n, i) => (
            <p className="workspace-note" key={i}>
              {n}
            </p>
          ))}
          <section className="workspace-card">
            <h3>Creative direction</h3>
            <p className="preserve-lines">{result.draft.creative_brief}</p>
            <p className="workspace-small">
              Illustrative concepts are labelled and reviewed separately from
              actual property photographs.
            </p>
            <div className="workspace-actions">
              <Link
                href={
                  "/admin/creative?brief=" +
                  encodeURIComponent(
                    result.draft.creative_brief.slice(0, 900),
                  ) +
                  "&practice=" +
                  result.practice
                }
              >
                Use this brief in Runway →
              </Link>
            </div>
          </section>
        </>
      )}
    </>
  );
}
