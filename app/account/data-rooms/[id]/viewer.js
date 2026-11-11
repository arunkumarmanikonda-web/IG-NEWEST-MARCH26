"use client";
import { useState, useEffect, useRef } from "react";
export default function RoomViewer({ room, email }) {
  const [folder, setFolder] = useState(""),
    [search, setSearch] = useState(""),
    [file, setFile] = useState(null),
    [pages, setPages] = useState(0),
    [page, setPage] = useState(1),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  const dialog = useRef(null);
  useEffect(() => {
    if (!file) return;
    const ac = new AbortController();
    dialog.current?.showModal();
    setLoading(true);
    setPages(0);
    setError("");
    setPage(1);
    fetch("/api/data-room/file?id=" + file.id + "&mode=info", {
      cache: "no-store",
      signal: ac.signal,
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Preview unavailable");
        setPages(d.pages);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [file]);
  function close() {
    dialog.current?.close();
    setFile(null);
    setError("");
  }
  const files = room.files.filter((f) =>
    search
      ? (f.folder + "/" + f.name).toLowerCase().includes(search.toLowerCase())
      : f.folder === folder,
  );
  return (
    <>
      <div className="room-browser">
        <aside className="room-folder-nav">
          <button
            onClick={() => {
              setFolder("");
              setSearch("");
            }}
            aria-current={!folder ? "page" : undefined}
          >
            Room root
          </button>
          {room.folders.map((f) => (
            <button
              key={f.id}
              style={{ paddingLeft: 12 + f.path.split("/").length * 12 }}
              onClick={() => {
                setFolder(f.path);
                setSearch("");
              }}
              aria-current={folder === f.path ? "page" : undefined}
            >
              ▱ {f.path.split("/").at(-1)}
            </button>
          ))}
        </aside>
        <section>
          <label className="room-search">
            Search all files
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="File or folder name"
            />
          </label>
          <div className="breadcrumb">
            {search ? "Search results" : folder || "Room root"}
          </div>
          <div className="room-file-list">
            {files.map((f) => (
              <article key={f.id}>
                <div>
                  <h2>{f.name}</h2>
                  <p>
                    {search && f.folder ? f.folder + " · " : ""}
                    {(f.bytes / 1024 / 1024).toFixed(2)} MB ·{" "}
                    {f.can_download ? "Download permitted" : "View only"}
                  </p>
                </div>
                <div className="workspace-actions">
                  {f.has_preview ? (
                    <button onClick={() => setFile(f)}>Open preview</button>
                  ) : (
                    <span className="workspace-small">
                      {f.mime === "application/zip"
                        ? "Archive: download only"
                        : "Preview is being prepared"}
                    </span>
                  )}
                  {f.can_download && (
                    <a
                      className="primary"
                      href={"/api/data-room/file?id=" + f.id + "&mode=download"}
                    >
                      Download original
                    </a>
                  )}
                </div>
              </article>
            ))}
            {!files.length && (
              <p className="workspace-note">
                No files in this view. Choose a subfolder or search the room.
              </p>
            )}
          </div>
        </section>
      </div>
      <dialog className="room-viewer" ref={dialog} onCancel={close}>
        <div className="viewer-toolbar">
          <strong>{file?.name}</strong>
          <button onClick={close}>Close ×</button>
        </div>
        <p className="viewer-identity">
          PRIVATE · {email} · Use is governed by your project NDA.
        </p>
        {loading && <p role="status">Preparing protected preview…</p>}
        {error && <p role="alert">{error}</p>}
        {file && pages > 0 && !error && (
          <>
            <div className="viewer-pagination">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <span>
                Page {page} of {pages}
              </span>
              <button
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
            <img
              key={file.id + "-" + page}
              className="protected-page"
              src={
                "/api/data-room/file?id=" +
                file.id +
                "&mode=preview&page=" +
                page
              }
              alt={"Watermarked document preview, page " + page}
              onError={() =>
                setError(
                  "This page is unavailable. Access may have changed; close and reopen the preview.",
                )
              }
            />
            {file.can_download && (
              <a
                href={"/api/data-room/file?id=" + file.id + "&mode=download"}
                className="text-link"
              >
                Download permitted original ↗
              </a>
            )}
          </>
        )}
      </dialog>
    </>
  );
}
