"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { portalAction } from "../account/profile";
import { browserClient } from "../../lib/supabase/browser";
import {
  FILE_ACCEPT,
  roomFileType,
  MAX_ROOM_BYTES,
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
}) {
  const router = useRouter(),
    [selected, setSelected] = useState(rooms[0]?.id || ""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [destination, setDestination] = useState(""),
    [allowDownloads, setAllowDownloads] = useState(false),
    [jobs, setJobs] = useState([]),
    [progress, setProgress] = useState({});
  const prepared = useRef(new Map());
  const room = rooms.find((x) => x.id === selected),
    roomFiles = files.filter((x) => x.room_id === selected && !x.preview_for),
    roomGrants = grants.filter((x) => x.room_id === selected),
    roomFolders = folders.filter((x) => x.room_id === selected);
  async function run(p) {
    setBusy(true);
    setMessage("");
    try {
      const result = await portalAction("rooms", p);
      setMessage("Saved.");
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
    if (list.reduce((n, f) => n + f.size, 0) > 250 * 1024 * 1024) {
      setMessage("Keep each batch within 250 MB.");
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
          if (job.file.size > MAX_ROOM_BYTES || job.file.size === 0)
            throw new Error("File must be between 1 byte and 20 MB");
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
            const { error } = await browserClient()
              .storage.from("ig-data-rooms")
              .uploadToSignedUrl(ready.path, ready.token, job.file, {
                contentType: type.mime,
                cacheControl: "0",
              });
            if (error) throw error;
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
      <h2>Project data rooms</h2>
      <p>
        Each room belongs to one opportunity. Client access requires a signed
        and approved NDA for that same project. Originals are private; view-only
        previews are watermarked.
      </p>
      <p role="status" className="portal-message">
        {message}
      </p>
      <form
        className="workspace-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const d = await run({
            action: "create",
            content_id: f.get("content_id"),
            title: f.get("title"),
          });
          if (d) setSelected(d.id);
        }}
      >
        <h3 className="wide">Create a project room</h3>
        <label>
          Opportunity
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
        <label>
          Room title
          <input name="title" required maxLength={180} />
        </label>
        <button disabled={busy} className="primary">
          Create private room
        </button>
      </form>
      <label className="room-select">
        Manage room
        <select
          value={selected}
          disabled={busy}
          onChange={(e) => {
            setSelected(e.target.value);
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
          <div className="room-upload workspace-card">
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
              Up to 100 files / 250 MB per batch, 20 MB per file. Folder uploads
              preserve subfolders. PDF, Word, Excel, PowerPoint, CSV, text, RTF,
              OpenDocument, common images and ZIP are supported.
            </p>
            <p>
              View-only Office, text and TIFF/GIF/BMP files need a linked PDF
              preview. ZIP files are download-only. Upload individual files when
              their access rules differ.
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
                      {nativeRoomPreview(f.mime)
                        ? "Built-in"
                        : files.some(
                              (p) =>
                                p.preview_for === f.id && p.status === "ready",
                            )
                          ? "PDF linked"
                          : "PDF needed"}
                      {f.mime !== "application/zip" &&
                        !nativeRoomPreview(f.mime) &&
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
          <h3>Share access after NDA approval</h3>
          <form
            className="workspace-form"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              run({
                action: "grant",
                room_id: room.id,
                nda_request_id: f.get("nda"),
                download_mode: f.get("mode"),
                expires_at: new Date(
                  f.get("expiry") + "T23:59:59+05:30",
                ).toISOString(),
              });
            }}
          >
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
                      {n.signed_name} · {n.agreement_snapshot?.recipient_email}
                    </option>
                  ))}
              </select>
            </label>
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
          {roomGrants.map((g) => {
            const n = requests.find((x) => x.id === g.nda_request_id);
            return (
              <article className="workspace-card" key={g.id + "-" + g.version}>
                <h3>{n?.signed_name || g.user_id}</h3>
                <p>
                  {n?.agreement_snapshot?.recipient_email} ·{" "}
                  {g.active ? "Active" : "Revoked"} · NDA{" "}
                  {n?.agreement_snapshot?.version}
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
