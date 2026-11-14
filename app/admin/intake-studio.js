"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { practiceOptions } from "../../lib/business.mjs";
import {
  intakeWorkspace,
  uploadContentSources,
} from "../../lib/content-intake-upload.mjs";
import { processIntakeDraft } from "../../lib/intake-process.mjs";
import { validateSourceSelection } from "../../lib/intake-source-spec.mjs";
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
const defaultPractice = (kind) =>
  kind === "product"
    ? "horeca"
    : kind === "opportunity"
      ? "real-estate"
      : kind === "project"
        ? "hospitality"
        : "corporate";
export default function IntakeStudio({
  initialKind,
  initialPractice,
  initialWorkspace = null,
  existingSources = [],
  initialSourceText = "",
  initialBrief = "",
}) {
  const params = useSearchParams(),
    router = useRouter();
  const selectedKind = initialKind || params.get("kind") || "opportunity";
  const [kind, setKind] = useState(
    kinds.some((k) => k[0] === selectedKind) ? selectedKind : "opportunity",
  );
  const [practice, setPractice] = useState(
    initialPractice || defaultPractice(kind),
  );
  const [files, setFiles] = useState([]),
    [sourceIds, setSourceIds] = useState(existingSources.map((s) => s.id));
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const [workspace, setWorkspace] = useState(initialWorkspace),
    [step, setStep] = useState(0);
  const workspaceRef = useRef(initialWorkspace),
    requestId = useRef(null),
    prepared = useRef(new Map()),
    pause = useRef(false);
  async function generate(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (
      !files.length &&
      !sourceIds.length &&
      !String(form.get("text") || "").trim() &&
      !form.get("location")
    ) {
      setMessage(
        "Upload source material, paste your approved details or add a location link to begin.",
      );
      return;
    }
    if (files.length + sourceIds.length > 8) {
      setMessage(
        "Select up to eight sources for this AI draft. Additional documents can remain in the data room.",
      );
      return;
    }
    setBusy(true);
    pause.current = false;
    try {
      setStep(1);
      setMessage("Creating your private source room…");
      if (!workspaceRef.current) {
        requestId.current ||= crypto.randomUUID();
        workspaceRef.current = await intakeWorkspace({
          action: "begin",
          request_id: requestId.current,
          kind,
          practice,
        });
        setWorkspace(workspaceRef.current);
      }
      const current = workspaceRef.current;
      const uploaded = await uploadContentSources({
        files,
        workspace: current,
        prepared: prepared.current,
        projectUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        onProgress: setMessage,
      });
      const sources = [...new Set([...sourceIds, ...uploaded])];
      setStep(2);
      const result = await processIntakeDraft({
        sourceIds: sources,
        input: {
          workspace_id: current.id,
          kind,
          practice,
          text: [
            form.get("text"),
            form.get("location")
              ? "Location source: " + form.get("location")
              : "",
          ]
            .filter(Boolean)
            .join("\n"),
          brief: form.get("brief"),
          approved: true,
        },
        onProgress: setMessage,
        shouldPause: () => pause.current,
      });
      setStep(3);
      setMessage("Filling the complete form and saving the review draft…");
      const saved = await intakeWorkspace({
        action: "finish",
        id: current.id,
        version: current.version,
        job_id: result.id,
      });
      workspaceRef.current = saved;
      setWorkspace(saved);
      // Extracted imagery remains private until an administrator reviews its identity and rights.
      let hasImage = Boolean(saved.media_id);
      if (result.candidates?.length && !hasImage) {
        try {
          const candidate = result.candidates[0];
          const response = await fetch("/api/admin/source-media", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              practice,
              data: candidate.data,
              source_name: candidate.name,
              alt: result.draft.title,
              preset: kind === "product" ? "square" : "landscape",
              rights_reference:
                "Administrator-authorised source material in private room " +
                current.room_id,
              rights_confirmed: true,
            }),
          });
          const media = await response.json();
          if (response.ok) {
            await intakeWorkspace({
              action: "media",
              id: current.id,
              media_id: media.id,
            });
            hasImage = true;
          }
        } catch {
          /* The saved draft remains available; the editor can retry image selection. */
        }
      }
      let imageState = "";
      if (!hasImage && ["product","opportunity"].includes(kind) && form.get("auto_image")) {
        setMessage("Draft saved. Preparing its illustrative image…");
        try {
          const hero = await intakeWorkspace({action:"hero",id:current.id,approved:true});
          imageState = hero.status === "existing" ? "" : "&image=" + (["failed","cancelled"].includes(hero.status) ? "review" : "queued");
        } catch { imageState = "&image=review"; }
      }
      router.replace("/admin/content/" + saved.content_id + "?generated=1" + imageState);
      router.refresh();
    } catch (error) {
      setMessage(error.message);
      setBusy(false);
    }
  }
  return (
    <>
      <div className="module-heading">
        <div>
          <span className="eyebrow">AI CONTENT CREATION</span>
          <h2>Start with your source material.</h2>
          <p>
            Upload once. AI prepares the complete form. You review, refine and
            publish.
          </p>
        </div>
        {workspace ? (
          <Link
            className="module-link"
            href={
              "/admin/data-rooms?room=" + workspace.room_id + "#room-access"
            }
          >
            Data room & access ↗
          </Link>
        ) : (
          <Link
            className="module-link"
            href={"/admin/content/new?kind=" + kind + "&manual=1"}
          >
            Start a manual draft instead ↗
          </Link>
        )}
      </div>
      <div className="intake-steps">
        {[
          ["Source room", "Private files, images & location"],
          ["AI draft", "Copy, specifications & search metadata"],
          ["Review & publish", "Your approval controls publication"],
        ].map(([title, description], index) => (
          <div key={title} className={step === index + 1 ? "active" : ""}>
            <strong>{title}</strong>
            <small>{description}</small>
          </div>
        ))}
      </div>
      <section className="workspace-card">
        <form className="workspace-form" onSubmit={generate}>
          <label>
            Content type
            <select
              value={kind}
              disabled={busy || !!workspace}
              onChange={(e) => {
                setKind(e.target.value);
                setPractice(defaultPractice(e.target.value));
              }}
            >
              {kinds.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Responsible practice
            <select
              value={practice}
              disabled={busy || !!workspace}
              onChange={(e) => setPractice(e.target.value)}
            >
              {practiceOptions.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          {kind === "product" && (
            <p className="wide workspace-note">
              Creating many products from a brand catalogue?{" "}
              <Link href="/admin/catalogue/import">
                Open catalogue import →
              </Link>{" "}
              Individual products can be created here with an automatic,
              editable SKU.
            </p>
          )}
          <label className="wide source-drop">
            Upload to the private data room
            <input
              type="file"
              multiple
              disabled={busy}
              accept=".pdf,.docx,.xlsx,.pptx,.csv,.txt,.jpg,.jpeg,.png,.webp"
              onChange={(e) => {
                try {
                  const selected = [...e.target.files];
                  validateSourceSelection(selected);
                  setFiles(selected);
                  setMessage("");
                } catch (error) {
                  setMessage(error.message);
                  e.target.value = "";
                  setFiles([]);
                }
              }}
            />
            <span>
              PDF, Word, Excel, PowerPoint, CSV, text and images. No
              website-imposed MB cap. Large uploads are resumable;
              storage-provider allowances apply.
            </span>
            {files.map((file, i) => (
              <small key={i}>{file.name}</small>
            ))}
          </label>
          {!!existingSources.length && (
            <fieldset className="wide">
              <legend>Sources already in this room</legend>
              {existingSources.map((source) => (
                <label className="check" key={source.id}>
                  <input
                    type="checkbox"
                    checked={sourceIds.includes(source.id)}
                    disabled={busy}
                    onChange={(e) =>
                      setSourceIds((ids) =>
                        e.target.checked
                          ? [...ids, source.id]
                          : ids.filter((id) => id !== source.id),
                      )
                    }
                  />
                  {source.name}
                </label>
              ))}
            </fieldset>
          )}
          <label className="wide">
            Additional source details (optional)
            <textarea
              name="text"
              defaultValue={initialSourceText}
              maxLength={18000}
              disabled={busy}
              placeholder="Paste approved property information, product specifications, a biography or any details not in the files."
            />
          </label>
          <label className="wide">
            Location or map link (optional)
            <input
              name="location"
              type="url"
              maxLength={1500}
              disabled={busy}
              placeholder="https://maps.google.com/…"
            />
          </label>
          <details className="wide">
            <summary>AI writing direction</summary>
            <label>
              Instructions
              <textarea
                name="brief"
                required
                minLength={10}
                maxLength={2000}
                disabled={busy}
                defaultValue={initialBrief || "Create the entire India Gully listing or content form from these sources. Write polished, substantive corporate copy with a clear client call to action. Extract all supported specifications, location and commercial facts. Prepare the SEO title, meta description, relevant search keywords and SEM headline and description suggestions. Preserve factual accuracy and flag missing or conflicting information for administrator review. Never invent availability, prices, measurements, credentials or legal facts."}
              />
            </label>
          </details>
          <p className="wide workspace-small">
            Originals remain in the linked private room. AI creates the title,
            introduction, detailed content, relevant fields and SEO copy.
            Unknown facts stay flagged for review. Search-ad suggestions are
            saved for review; no advertising is launched. Clients receive access
            only after approval.
          </p>
          <label className="check wide">
            <input name="approved" type="checkbox" required disabled={busy} />I
            am authorised to process these sources with OpenAI and prepare
            public-facing drafts.
          </label>
          {["product","opportunity"].includes(kind) && <label className="check wide"><input name="auto_image" type="checkbox" defaultChecked disabled={busy} />When no source photo is available, use the draft description to generate an illustrative image with Runway for review (estimated 5 credits).</label>}
          <div className="workspace-actions wide">
            <button className="primary" disabled={busy}>
              {busy
                ? "Preparing your draft…"
                : "Generate complete draft with AI"}
            </button>
            {busy && (
              <button
                type="button"
                onClick={() => {
                  pause.current = true;
                  setMessage(
                    "Pausing after the current section. Completed uploads and sections are retained.",
                  );
                }}
              >
                Pause after this section
              </button>
            )}
          </div>
        </form>
        <p className="portal-message" role="status" aria-live="polite">
          {message}
        </p>
        {workspace && !busy && (
          <p>
            Your source room and draft are saved.{" "}
            <Link href={"/admin/content/" + workspace.content_id}>
              Open saved draft →
            </Link>
          </p>
        )}
      </section>
    </>
  );
}
