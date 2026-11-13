"use client";
import { useState } from "react";
import { prepareMediaUpload } from "../../lib/media-upload.mjs";
import { useRouter } from "next/navigation";
import { portalAction } from "../account/profile";
import { practiceOptions } from "../../lib/business.mjs";
export default function MediaLibrary({
  assets = [],
  onChoose,
  defaultPractice = "corporate",
  productMode = false,
  onEnhance,
}) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [file, setFile] = useState(null);
  const router = useRouter();
  async function action(id, operation) {
    setBusy(true);
    try {
      await portalAction("source_media", {
        id,
        action: operation,
        reviewed: true,
      });
      router.refresh();
      setMessage(
        operation === "publish"
          ? "Image released for public use."
          : "Public access withdrawn.",
      );
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="workspace-card">
      <div className="module-heading">
        <div>
          <span className="eyebrow">APPROVED SOURCE IMAGERY</span>
          <h3>Media library</h3>
          <p>
            Upload actual property or product photographs, prepare the posting
            frame and approve them for publication. No upload size cap is
            imposed here. Your browser prepares an optimised publication image;
            keep the original for your records.
          </p>
        </div>
      </div>
      <details open={productMode || undefined}>
        <summary>Upload & prepare an image</summary>
        <form
          className="workspace-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              if (!file)
                throw new Error("Select a JPEG, PNG or WebP photograph");
              const f = new FormData(e.currentTarget);
              setMessage("Preparing your photograph for publication…");
              const data = await prepareMediaUpload(file, f.get("preset"));
              const r = await fetch("/api/admin/source-media", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  data,
                  source_name: file.name,
                  practice: productMode ? "horeca" : f.get("practice"),
                  preset: f.get("preset"),
                  alt: f.get("alt"),
                  rights_reference: f.get("rights"),
                  rights_confirmed: f.get("rights_confirmed") === "on",
                }),
              });
              const d = await r.json();
              if (!r.ok) throw new Error(d.error);
              router.refresh();
              setMessage("Image saved privately. Review and release it below.");
            } catch (e) {
              setMessage(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Practice
            <select
              name="practice"
              defaultValue={defaultPractice}
              disabled={productMode}
            >
              {practiceOptions.map(([k, l]) => (
                <option value={k} key={k}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label>
            Format
            <select
              name="preset"
              defaultValue={productMode ? "square" : "landscape"}
            >
              <option value="landscape">Landscape</option>
              <option value="square">Square</option>
              <option value="portrait">Portrait</option>
            </select>
          </label>
          <label className="wide">
            Source image
            <input
              type="file"
              required
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </label>
          <label className="wide">
            Description
            <input name="alt" required minLength={5} maxLength={250} />
          </label>
          <label className="wide">
            Usage permission / rights reference
            <input name="rights" required minLength={5} maxLength={500} />
          </label>
          <label className="check wide">
            <input type="checkbox" name="rights_confirmed" required />I have
            permission to process and use this image for India Gully.
          </label>
          <button disabled={busy}>Prepare image</button>
        </form>
      </details>
      <p role="status">{message}</p>
      <div className="source-image-grid">
        {assets
          .filter((m) => m.state === "ready")
          .map((m) => (
            <article className="media-card" key={m.id}>
              <img src={"/api/admin/source-media/" + m.id} alt={m.alt} />
              <p>{m.alt}</p>
              <small>
                {m.source_name} · {m.preset} ·{" "}
                {m.published ? "Public" : "Private"}
              </small>
              <div className="workspace-actions">
                {onEnhance && (
                  <button type="button" onClick={() => onEnhance(m)}>
                    Enhance this photo with AI
                  </button>
                )}
                {m.published ? (
                  <>
                    <button
                      disabled={busy}
                      onClick={() => action(m.id, "withdraw")}
                    >
                      Withdraw
                    </button>
                    {onChoose && (
                      <button
                        type="button"
                        onClick={() =>
                          onChoose("/images/library/" + m.id + ".jpg", m.alt)
                        }
                      >
                        Use image
                      </button>
                    )}
                  </>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      action(m.id, "publish");
                    }}
                  >
                    <label className="check">
                      <input required type="checkbox" />
                      Quality, rights, identity and disclosure reviewed.
                    </label>
                    <button disabled={busy}>Release image</button>
                  </form>
                )}
              </div>
              {m.published && <code>/images/library/{m.id}.jpg</code>}
            </article>
          ))}
      </div>
    </section>
  );
}
