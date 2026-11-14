"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import MediaLibrary from "./media-library";
import { listingImageBrief } from "../../lib/listing-images.mjs";
export default function ListingImages({
  contentId,
  assets,
  jobs,
  practice,
  getListing,
  onChoose,
  image,
}) {
  const router = useRouter(),
    request = useRef(null),
    [mode, setMode] = useState("upload"),
    [source, setSource] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const sources = assets.filter(
      (x) => x.practice === practice && x.state === "ready",
    ),
    results = jobs.filter(
      (x) =>
        x.practice === practice &&
        x.kind === "image" &&
        !x.input.product_image_mode && (!x.input.content_id || x.input.content_id === contentId),
    ),
    pending = results.some((x) =>
      ["queued", "submitting", "pending"].includes(x.status),
    );
  useEffect(() => {
    if (!pending) return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 15000);
    return () => clearInterval(timer);
  }, [pending, router]);
  async function post(body) {
    const r = await fetch("/api/admin/provider-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
      d = await r.json();
    if (!r.ok) throw new Error(d.error);
    return d;
  }
  return (
    <section className="product-image-studio" id="listing-images">
      <h3>Listing hero image</h3>
      <p>
        Upload property photographs, professionally enhance a source image, or
        generate an illustrative hero from this listing’s description.
      </p>
      {image && (
        <div className="product-current-image">
          <img src={image} alt="Selected listing hero" />
          <button type="button" onClick={() => onChoose("", "")}>
            Remove selection
          </button>
        </div>
      )}
      <div
        className="image-methods"
        role="group"
        aria-label="Listing image method"
      >
        {[
          ["upload", "Upload a photograph"],
          ["enhance", "Enhance with AI"],
          ["generate", "Generate from description"],
        ].map(([v, l]) => (
          <button
            key={v}
            type="button"
            aria-pressed={mode === v}
            onClick={() => {
              setMode(v);
              request.current = null;
            }}
          >
            {l}
          </button>
        ))}
      </div>
      {mode === "upload" ? (
        <MediaLibrary
          assets={sources}
          defaultPractice={practice}
          onChoose={onChoose}
        />
      ) : (
        <form
          className="workspace-form"
          onChange={() => {
            request.current = null;
          }}
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              const f = new FormData(e.currentTarget),
                prompt = listingImageBrief(getListing(), {
                  mode,
                  direction: f.get("direction"),
                });
              request.current ??= crypto.randomUUID();
              await post({
                provider: "runway",
                kind: "image",
                practice,
                ratio: "1280:720",
                prompt,
                content_id: contentId,
                request_id: request.current,
                reference_media_id: mode === "enhance" ? source : undefined,
                public_approved: f.get("approved") === "on",
              });
              request.current = null;
              setMessage(
                "Hero image queued. Review the result below before attaching it to your listing.",
              );
              router.refresh();
            } catch (e) {
              setMessage(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {mode === "enhance" && (
            <label className="wide">
              Source photograph
              <select
                value={source}
                required
                onChange={(e) => setSource(e.target.value)}
              >
                <option value="">Select an uploaded photograph</option>
                {sources.map((s) => (
                  <option value={s.id} key={s.id}>
                    {s.alt}
                  </option>
                ))}
              </select>
              {!sources.length && (
                <small>
                  Upload a source photograph using the first option.
                </small>
              )}
            </label>
          )}
          <label className="wide">
            Visual direction
            <input
              name="direction"
              maxLength={120}
              placeholder="Daylight, architectural editorial composition, landscape"
            />
          </label>
          <label className="check wide">
            <input name="approved" type="checkbox" required />I approve sending
            the current description
            {mode === "enhance" ? " and selected photograph" : ""} to Runway,
            have the required rights and will review the result.
          </label>
          <button className="primary" disabled={busy}>
            {mode === "enhance"
              ? "Enhance photograph"
              : "Generate hero from listing"}{" "}
            · estimated 5 credits
          </button>
          <p className="workspace-small wide">
            Generated and enhanced options remain labelled as illustrative.
            Review structures and features against source material. Nothing is
            posted automatically.
          </p>
        </form>
      )}
      <p role="status" className="portal-message">
        {message}
      </p>
      <h4>Image options from this practice</h4>
      <div className="creative-grid">
        {results.map((j) => (
          <article key={j.id} className="creative-card">
            <strong>{j.status}</strong>
            <p>{j.input.prompt}</p>
            {j.status === "ready" && (
              <>
                <img
                  src={"/api/admin/media/" + j.id}
                  alt="Illustrative AI-generated concept"
                />
                {j.published ? (
                  <button
                    type="button"
                    onClick={() =>
                      onChoose(
                        "/images/generated/" + j.asset_key,
                        "Illustrative AI-generated concept · " +
                          getListing().title,
                      )
                    }
                  >
                    Use this hero
                  </button>
                ) : (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setBusy(true);
                      try {
                        await post({
                          action: "manage",
                          id: j.id,
                          operation: "publish",
                          reviewed: true,
                        });
                        onChoose(
                          "/images/generated/" + j.asset_key,
                          "Illustrative AI-generated concept · " +
                            getListing().title,
                        );
                        setMessage(
                          "Image approved and selected. Save the draft to retain it.",
                        );
                        router.refresh();
                      } catch (e) {
                        setMessage(e.message);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    <label className="check">
                      <input type="checkbox" required />I approve this
                      illustrative image and have checked it for misleading
                      property details.
                    </label>
                    <button disabled={busy}>Approve & use hero</button>
                  </form>
                )}
              </>
            )}
            {j.note && <p>{j.note}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}
