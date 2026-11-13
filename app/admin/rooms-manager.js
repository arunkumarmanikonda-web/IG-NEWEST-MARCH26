"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { intakeWorkspace } from "../../lib/content-intake-upload.mjs";
import { portalAction } from "../account/profile";
import { resumableSourceUpload } from "../../lib/intake-upload.mjs";
import {
  FILE_ACCEPT,
  roomFileType,
  MAX_PREVIEW_BYTES,
  nativeRoomPreview,
} from "../../lib/data-room-formats.mjs";
const expiry = (x) => new Date(x).toISOString().slice(0, 10);
const size = (n) => (n / 1024 / 1024).toFixed(2) + " MB";
export default function RoomsManager({
  rooms,
  files,
  folders,
  grants,
  rules,
  requests,
  opportunities,
  engagements = [],
  contacts = [],
  initialRoom,
  initialContent,
}) {
  const router = useRouter(),
    [selected, setSelected] = useState(
      rooms.some((r) => r.id === initialRoom)
        ? initialRoom
        : initialContent
          ? ""
          : rooms[0]?.id || "",
    ),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [destination, setDestination] = useState(""),
    [allowDownloads, setAllowDownloads] = useState(false),
    [selectedContacts, setSelectedContacts] = useState([]),
    [jobs, setJobs] = useState([]),
    [progress, setProgress] = useState({});
  const prepared = useRef(new Map());
  const circulationKey = useRef(null);
  const room = rooms.find((x) => x.id === selected),
    roomFiles = files.filter((x) => x.room_id === selected && !x.preview_for),
    roomGrants = grants.filter((x) => x.room_id === selected),
    roomFolders = folders.filter((x) => x.room_id === selected);
  const engagement = engagements.find((e) => e.id === room?.engagement_id);
  const content = opportunities.find((o) => o.id === room?.content_id);
  const pendingContent = opportunities.find((o) => o.id === initialContent);
  const eligibleContacts = contacts.filter(
    (c) =>
      c.client_id === engagement?.client_id && c.active && c.portal_enabled,
  );
  async function copyLink(path) {
    try {
      await navigator.clipboard.writeText(window.location.origin + path);
      setMessage(
        "Secure link copied. Recipients must sign in; the link does not grant access.",
      );
    } catch {
      setMessage("Copy this secure link: " + window.location.origin + path);
    }
  }
  async function notifyContacts() {
    setBusy(true);
    setMessage("");
    try {
      if (!circulationKey.current || circulationKey.current.room !== room.id)
        circulationKey.current = { room: room.id, id: crypto.randomUUID() };
      const result = await portalAction("room_notify", {
        room_id: room.id,
        batch_id: circulationKey.current.id,
      });
      setMessage(
        result.queued +
          " separate secure-portal notices queued. Delivery is processed automatically.",
      );
      circulationKey.current = null;
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function run(p) {
    setBusy(true);
    setMessage("");
    try {
      const result = await portalAction("rooms", p);
      setMessage(
        p.action === "contact_grant_bulk"
          ? result.added +
              " contacts given access in one action. " +
              result.existing_unchanged +
              " existing grants left unchanged."
          : "Saved.",
      );
      router.refresh();
      return result;
    } catch (e) {
      setMessage(e.message);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }
  function queue(input, previewFor = null) {
    const list = [...input];
    if (list.length > 100) {
      setMessage("Choose up to 100 files per batch.");
      return;
    }
    const next = list.map((file) => ({
      key: crypto.randomUUID(),
      file,
      room_id: selected,
      folder: previewFor
        ? roomFiles.find((x) => x.id === previewFor)?.folder || ""
        : [
            destination,
            file.webkitRelativePath?.split("/").slice(0, -1).join("/"),
          ]
            .filter(Boolean)
            .join("/"),
      preview_for: previewFor,
    }));
    setJobs(next);
    setProgress({});
    prepared.current.clear();
    setMessage("");
  }
  async function uploadCall(p) {
    const res = await fetch("/api/data-room/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data;
  }
  async function startUpload() {
    setBusy(true);
    setMessage("");
    const pending = jobs.filter((j) => progress[j.key]?.state !== "complete");
    let cursor = 0;
    async function worker() {
      while (cursor < pending.length) {
        const job = pending[cursor++];
        const set = (state, text) =>
          setProgress((old) => ({ ...old, [job.key]: { state, text } }));
        try {
          const type = roomFileType(job.file.name);
          if (!type) throw new Error("Unsupported file extension");
          if (!Number.isSafeInteger(job.file.size) || job.file.size < 1)
            throw new Error("Select a nonempty file.");
          if (job.preview_for && type.mime !== "application/pdf")
            throw new Error("Companion preview must be a PDF");
          set("uploading", "Preparing private upload");
          let ready = prepared.current.get(job.key);
          if (!ready) {
            ready = await uploadCall({
              action: "prepare",
              room_id: job.room_id,
              name: job.file.name,
              folder: job.folder,
              mime: type.mime,
              bytes: job.file.size,
              download_enabled: allowDownloads,
              preview_for: job.preview_for,
            });
            prepared.current.set(job.key, ready);
          }
          if (!ready.uploaded) {
            set("uploading", "Uploading " + size(job.file.size));
            await resumableSourceUpload({
              file: job.file,
              upload: { path: ready.path, token: ready.token },
              source: {
                id: ready.id,
                sha256: String(job.file.size) + ":" + job.file.lastModified,
              },
              projectUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
              bucket: "ig-data-rooms",
              contentType: type.mime,
              onProgress: (percent) =>
                set(
                  "uploading",
                  "Uploading " + percent + "% · " + size(job.file.size),
                ),
            });
            ready.uploaded = true;
          }
          set("uploading", "Validating file");
          await uploadCall({
            action: "complete",
            id: ready.id,
            version: ready.version,
          });
          set("complete", "Uploaded and validated");
        } catch (e) {
          set("error", e.message);
        }
      }
    }
    await Promise.all([worker(), worker(), worker()]);
    setBusy(false);
    router.refresh();
    setMessage(
      "Batch finished. Any failed files can be retried individually or together.",
    );
  }
  return (
    <section className="workspace-card">
      <h2>Data rooms & client access</h2>
      <p>
        Opportunity rooms require a signed and approved project NDA. Client
        engagement rooms use the administrator-confirmed engagement and
        confidentiality terms. Originals are private; view-only previews are
        watermarked.
      </p>
      <p>
        <Link href="/admin/clients">
          Create clients, contacts and engagement report rooms →
        </Link>
      </p>
      <p role="status" className="portal-message">
        {message}
      </p>
      {initialContent && !room && (
        <div className="workspace-note">
          <h3>{pendingContent?.title || "Selected content"}</h3>
          <p>
            This record does not yet have a linked data room. Create it here to
            upload source material and manage access.
          </p>
          <button
            className="primary"
            disabled={busy || !pendingContent}
            onClick={async () => {
              setBusy(true);
              try {
                const created = await intakeWorkspace({
                  action: "room",
                  content_id: initialContent,
                });
                router.replace(
                  "/admin/data-rooms?room=" + created.id + "#room-access",
                );
                router.refresh();
              } catch (error) {
                setMessage(error.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            Create linked private data room
          </button>
        </div>
      )}
      <details open={!room && !initialContent}>
        <summary>Create another data room</summary>
        <form
          className="workspace-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            setBusy(true);
            try {
              const d = await intakeWorkspace({
                action: "room",
                content_id: f.get("content_id"),
              });
              router.replace("/admin/data-rooms?room=" + d.id);
              router.refresh();
            } catch (error) {
              setMessage(error.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <h3 className="wide">Create a project room</h3>
          <label>
            Listing, product or content record
            <select name="content_id" required>
              <option value="">Select a project</option>
              {opportunities
                .filter((o) => !rooms.some((r) => r.content_id === o.id))
                .map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.title}
                  </option>
                ))}
            </select>
          </label>
          <button disabled={busy} className="primary">
            Create private room
          </button>
        </form>
      </details>
      <label className="room-select">
        Manage room
        <select
          value={selected}
          disabled={busy}
          onChange={(e) => {
            setSelected(e.target.value);
            setSelectedContacts([]);
            setDestination("");
            setJobs([]);
            setProgress({});
          }}
        >
          <option value="">Select a room</option>
          {rooms.map((x) => (
            <option key={x.id} value={x.id}>
              {x.title}
              {x.active ? "" : " (paused)"}
            </option>
          ))}
        </select>
      </label>
      {room && (
        <>
          <section
            id="room-access"
            className="room-access-summary workspace-note"
          >
            <span className="eyebrow">PRIVATE DATA ROOM</span>
            <h3>{room.title}</h3>
            <p>
              {roomFiles.filter((f) => f.status === "ready").length} ready files
              ·{" "}
              {
                roomGrants.filter(
                  (g) => g.active && new Date(g.expires_at) > new Date(),
                ).length
              }{" "}
              active client grants
            </p>
            <div className="workspace-actions">
              <a className="module-link" href="#room-files">
                Files & uploads ↓
              </a>
              <a className="button primary" href="#room-permissions">
                Share access & permissions ↓
              </a>
              <button
                type="button"
                onClick={() => copyLink("/account/data-rooms/" + room.id)}
              >
                Copy secure room link
              </button>
              {content?.kind === "opportunity" && (
                <button
                  type="button"
                  onClick={() =>
                    copyLink(
                      "/account/nda?opportunity=" +
                        encodeURIComponent(content.slug),
                    )
                  }
                >
                  Copy NDA request link
                </button>
              )}
              <Link href="/admin/nda">Review NDA requests ↗</Link>
            </div>
            <p>
              For a property: share the NDA request link, approve the signed
              request, then activate the client’s access below. The secure room
              link works only for authorised recipients. Choose view-only or
              permitted downloads, set an expiry and revoke access here at any
              time.
            </p>
            {content && content.kind !== "opportunity" && (
              <p>
                This is a private source room for {content.kind} content. Client
                report circulation is managed through{" "}
                <Link href="/admin/clients">Clients & engagements</Link>;
                property NDA grants apply to real estate opportunities.
              </p>
            )}
          </section>
          <form
            key={room.id + "-" + room.version}
            className="workspace-form"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              run({
                action: "room_update",
                id: room.id,
                version: room.version,
                title: f.get("title"),
                active: f.get("active") === "on",
              });
            }}
          >
            <label>
              Room title
              <input
                name="title"
                defaultValue={room.title}
                maxLength={180}
                required
              />
            </label>
            <label className="check">
              <input
                name="active"
                type="checkbox"
                defaultChecked={room.active}
              />
              Room active for authorised clients
            </label>
            <button disabled={busy}>Save room settings</button>
            <Link href={"/account/data-rooms/" + room.id} target="_blank">
              Open room view ↗
            </Link>
          </form>
          <div id="room-files" className="room-upload workspace-card">
            <h3>Folders & bulk upload</h3>
            <form
              className="workspace-form"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                run({
                  action: "folder_create",
                  room_id: room.id,
                  path: [f.get("parent"), f.get("name")]
                    .filter(Boolean)
                    .join("/"),
                });
              }}
            >
              <label>
                Parent folder
                <select name="parent">
                  <option value="">Room root</option>
                  {roomFolders.map((f) => (
                    <option key={f.id} value={f.path}>
                      {f.path}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                New folder or nested path
                <input
                  name="name"
                  required
                  maxLength={200}
                  placeholder="Legal / title documents"
                />
              </label>
              <button disabled={busy || !room.active}>Create folder</button>
            </form>
            <div className="folder-inventory">
              {roomFolders.map((f) => (
                <div key={f.id}>
                  <span>▱ {f.path}</span>
                  <button
                    className="text-button"
                    disabled={busy}
                    onClick={() => {
                      if (
                        confirm(
                          "Delete this empty folder? Folders containing files or subfolders cannot be deleted.",
                        )
                      )
                        run({ action: "folder_delete", id: f.id });
                    }}
                  >
                    Remove empty folder
                  </button>
                </div>
              ))}
            </div>
            <div className="workspace-form">
              <label>
                Upload destination
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  disabled={busy}
                >
                  <option value="">Room root</option>
                  {roomFolders.map((f) => (
                    <option key={f.id} value={f.path}>
                      {f.path}
                    </option>
                  ))}
                </select>
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={allowDownloads}
                  onChange={(e) => setAllowDownloads(e.target.checked)}
                  disabled={busy}
                />
                Permit these originals to be downloadable, subject to each
                client’s grant
              </label>
              <label>
                Choose multiple files
                <input
                  type="file"
                  multiple
                  accept={FILE_ACCEPT}
                  disabled={busy || !room.active}
                  onChange={(e) => queue(e.target.files)}
                />
              </label>
              <label>
                Upload a local folder
                <input
                  type="file"
                  multiple
                  webkitdirectory=""
                  directory=""
                  disabled={busy || !room.active}
                  onChange={(e) => queue(e.target.files)}
                />
              </label>
            </div>
            <p>
              Select up to 100 files per batch, without a website-imposed file
              or batch size cap. Resumable uploads preserve progress and
              subfolders. Storage-account capacity and provider allowances still
              apply. PDF, Word, Excel, PowerPoint, CSV, text, RTF, OpenDocument,
              common images and ZIP are supported.
            </p>
            <p>
              View-only Office, text, TIFF/GIF/BMP and large originals need a
              linked, optimised PDF preview (up to 20 MB for secure rendering).
              Originals can still be downloaded where authorised. ZIP files are
              download-only. Upload individual files when their access rules
              differ.
            </p>
            {!!jobs.length && (
              <>
                <div className="table-scroll">
                  <table className="workspace-table">
                    <thead>
                      <tr>
                        <th>File / folder</th>
                        <th>Size</th>
                        <th>Progress</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.map((j) => (
                        <tr key={j.key}>
                          <td>
                            {j.folder ? j.folder + "/" : ""}
                            {j.file.name}
                            {j.preview_for ? " (PDF preview)" : ""}
                          </td>
                          <td>{size(j.file.size)}</td>
                          <td>
                            {progress[j.key]?.text || "Queued"}
                            {progress[j.key]?.state === "error" && (
                              <button
                                disabled={busy}
                                onClick={() => {
                                  setJobs([j]);
                                  setProgress({});
                                }}
                              >
                                Retry this file
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  className="primary"
                  disabled={
                    busy ||
                    jobs.every((j) => progress[j.key]?.state === "complete")
                  }
                  onClick={startUpload}
                >
                  {busy ? "Uploading…" : "Upload / retry remaining files"}
                </button>
              </>
            )}
          </div>
          <h3>Files & original download controls</h3>
          <div className="table-scroll">
            <table className="workspace-table">
              <thead>
                <tr>
                  <th>File</th>
                  <th>State</th>
                  <th>Preview</th>
                  <th>Download permission</th>
                  <th>Visibility</th>
                </tr>
              </thead>
              <tbody>
                {roomFiles.map((f) => (
                  <tr key={f.id}>
                    <td>
                      {f.folder ? f.folder + "/" : ""}
                      {f.name}
                      <small>{size(f.bytes)}</small>
                    </td>
                    <td>{f.status}</td>
                    <td>
                      {nativeRoomPreview(f.mime) && f.bytes <= MAX_PREVIEW_BYTES
                        ? "Built-in"
                        : files.some(
                              (p) =>
                                p.preview_for === f.id && p.status === "ready",
                            )
                          ? "PDF linked"
                          : "PDF needed"}
                      {f.mime !== "application/zip" &&
                        (!nativeRoomPreview(f.mime) ||
                          f.bytes > MAX_PREVIEW_BYTES) &&
                        f.status === "ready" && (
                          <label className="preview-upload">
                            Upload PDF preview
                            <input
                              type="file"
                              accept=".pdf"
                              disabled={busy}
                              onChange={(e) => queue(e.target.files, f.id)}
                            />
                          </label>
                        )}
                    </td>
                    <td>
                      <label className="check">
                        <input
                          type="checkbox"
                          checked={f.download_enabled}
                          disabled={busy || f.status === "pending"}
                          onChange={(e) =>
                            run({
                              action: "file_update",
                              id: f.id,
                              version: f.version,
                              status: f.status,
                              download_enabled: e.target.checked,
                            })
                          }
                        />
                        Original may be downloaded
                      </label>
                    </td>
                    <td>
                      {f.status !== "pending" && (
                        <button
                          disabled={busy}
                          onClick={() =>
                            run({
                              action: "file_update",
                              id: f.id,
                              version: f.version,
                              status:
                                f.status === "archived" ? "ready" : "archived",
                              download_enabled: f.download_enabled,
                            })
                          }
                        >
                          {f.status === "archived"
                            ? "Restore file"
                            : "Archive file"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3 id="room-permissions">
            {engagement
              ? "Share with authorised client contacts"
              : "Share access after NDA approval"}
          </h3>
          {engagement && (
            <p>
              Engagement: {engagement.reference}.{" "}
              {engagement.confidentiality_confirmed
                ? "Confidentiality authority recorded."
                : "Confirm the executed confidentiality terms in Clients & engagements before granting access."}{" "}
              Each contact signs in with its own verified email.
            </p>
          )}
          <form
            className="workspace-form"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              run({
                action: engagement ? "contact_grant_bulk" : "grant",
                room_id: room.id,
                ...(engagement
                  ? { contact_ids: f.getAll("contact_id") }
                  : { nda_request_id: f.get("nda") }),
                download_mode: f.get("mode"),
                expires_at: new Date(
                  f.get("expiry") + "T23:59:59+05:30",
                ).toISOString(),
              });
            }}
          >
            {engagement ? (
              <fieldset className="wide contact-picker">
                <legend>Share once with multiple client contacts</legend>
                <button
                  type="button"
                  className="text-button"
                  onClick={() =>
                    setSelectedContacts(
                      eligibleContacts
                        .filter(
                          (c) => !roomGrants.some((g) => g.contact_id === c.id),
                        )
                        .map((c) => c.id),
                    )
                  }
                >
                  Select all available contacts
                </button>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setSelectedContacts([])}
                >
                  Clear selection
                </button>
                <div className="contact-picker-list">
                  {eligibleContacts
                    .filter(
                      (c) => !roomGrants.some((g) => g.contact_id === c.id),
                    )
                    .map((c) => (
                      <label className="check" key={c.id}>
                        <input
                          type="checkbox"
                          name="contact_id"
                          value={c.id}
                          checked={selectedContacts.includes(c.id)}
                          onChange={(event) =>
                            setSelectedContacts((ids) =>
                              event.target.checked
                                ? [...ids, c.id]
                                : ids.filter((id) => id !== c.id),
                            )
                          }
                        />
                        <span>
                          <strong>{c.name}</strong>
                          <span>{c.email}</span>
                        </span>
                      </label>
                    ))}
                </div>
                <p>
                  One action activates this room separately for every selected
                  email. Existing grants and individual file overrides are
                  preserved.
                </p>
              </fieldset>
            ) : (
              <label>
                Client and project-specific NDA
                <select name="nda" required>
                  <option value="">Select an approved request</option>
                  {requests
                    .filter(
                      (n) =>
                        n.content_id === room.content_id &&
                        n.status === "approved" &&
                        !roomGrants.some((g) => g.user_id === n.user_id),
                    )
                    .map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.signed_name} ·{" "}
                        {n.agreement_snapshot?.recipient_email}
                      </option>
                    ))}
                </select>
              </label>
            )}
            <label>
              Download mode
              <select name="mode">
                <option value="none">View only: no original downloads</option>
                <option value="all">
                  All files permitted by file settings
                </option>
                <option value="selected">Only selected files</option>
              </select>
            </label>
            <label>
              Expires at end of day · IST
              <input
                name="expiry"
                type="date"
                required
                defaultValue={expiry(Date.now() + 30 * 86400000)}
              />
            </label>
            <button className="primary" disabled={busy || !room.active}>
              Activate in client dashboard
            </button>
          </form>
          {engagement && (
            <div className="workspace-note">
              <p>
                Circulation sends separate notices only to active contacts with
                circulation enabled and unexpired room access. Reports remain
                inside the portal. Changing a circulation preference never
                changes download rights.
              </p>
              <button
                type="button"
                disabled={busy || !room.active}
                onClick={notifyContacts}
              >
                Notify authorised circulation contacts
              </button>
            </div>
          )}
          {roomGrants.map((g) => {
            const n = requests.find((x) => x.id === g.nda_request_id);
            const contact = contacts.find((c) => c.id === g.contact_id);
            return (
              <article className="workspace-card" key={g.id + "-" + g.version}>
                <h3>{contact?.name || n?.signed_name || g.user_id}</h3>
                <p>
                  {contact?.email || n?.agreement_snapshot?.recipient_email} ·{" "}
                  {g.active ? "Active" : "Revoked"} ·{" "}
                  {contact
                    ? "Engagement access"
                    : "NDA " + n?.agreement_snapshot?.version}
                </p>
                <form
                  className="workspace-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    run({
                      action: "grant_update",
                      id: g.id,
                      version: g.version,
                      active: f.get("active") === "on",
                      download_mode: f.get("mode"),
                      expires_at: new Date(
                        f.get("expiry") + "T23:59:59+05:30",
                      ).toISOString(),
                    });
                  }}
                >
                  <label>
                    Download mode
                    <select name="mode" defaultValue={g.download_mode}>
                      <option value="none">None / view only</option>
                      <option value="all">All permitted files</option>
                      <option value="selected">Selected files only</option>
                    </select>
                  </label>
                  <label>
                    Expiry · IST
                    <input
                      name="expiry"
                      type="date"
                      defaultValue={expiry(g.expires_at)}
                      required
                    />
                  </label>
                  <label className="check">
                    <input
                      name="active"
                      type="checkbox"
                      defaultChecked={g.active}
                    />
                    Access active
                  </label>
                  <button disabled={busy}>Update access</button>
                </form>
                <details>
                  <summary>Set this client’s file permissions</summary>
                  <p>
                    View-only mode blocks every original download. A file with
                    its original download setting disabled also remains blocked
                    for everyone.
                  </p>
                  {roomFiles
                    .filter((f) => f.status === "ready")
                    .map((f) => {
                      const rule = rules.find(
                        (r) => r.grant_id === g.id && r.file_id === f.id,
                      );
                      return (
                        <label className="file-rule" key={f.id}>
                          {f.folder ? f.folder + "/" : ""}
                          {f.name}
                          {!f.download_enabled
                            ? " (original globally blocked)"
                            : ""}
                          <select
                            disabled={busy}
                            value={
                              rule
                                ? rule.allow_download
                                  ? "allow"
                                  : "deny"
                                : "inherit"
                            }
                            onChange={(e) =>
                              run({
                                action: "file_rule",
                                grant_id: g.id,
                                version: g.version,
                                file_id: f.id,
                                rule: e.target.value,
                              })
                            }
                          >
                            <option value="inherit">Follow room mode</option>
                            <option value="allow">
                              Allow original download
                            </option>
                            <option value="deny">
                              Block original download
                            </option>
                          </select>
                        </label>
                      );
                    })}
                </details>
              </article>
            );
          })}
        </>
      )}
    </section>
  );
}
