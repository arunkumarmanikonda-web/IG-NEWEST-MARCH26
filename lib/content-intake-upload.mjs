import { hashSourceFile, resumableSourceUpload } from "./intake-upload.mjs";
import { sourceTypes, validateSourceSelection } from "./intake-source-spec.mjs";

export async function intakeWorkspace(payload, fetcher = fetch) {
  return post("/api/admin/intake/workspace", payload, fetcher);
}
async function post(url, payload, fetcher) {
  const response = await fetcher(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.error || "The request could not be completed.");
  return result;
}
export async function uploadContentSources({
  files,
  workspace,
  projectUrl,
  prepared = new Map(),
  onProgress = () => {},
  fetcher = fetch,
  uploadFile = resumableSourceUpload,
  hashFile = hashSourceFile,
}) {
  validateSourceSelection(files);
  const ids = [];
  for (const file of files) {
    const sha256 = await hashFile(file, (n) =>
      onProgress(`Checking ${file.name} · ${n}%`),
    );
    const key = workspace.id + ":" + sha256;
    let saved = prepared.get(key);
    if (!saved) {
      onProgress(`Preparing private data-room upload · ${file.name}`);
      saved = await post(
        "/api/data-room/upload",
        {
          action: "prepare",
          room_id: workspace.room_id,
          name: file.name,
          folder: "Source material",
          mime: sourceTypes[file.name.split(".").pop().toLowerCase()],
          bytes: file.size,
          download_enabled: false,
        },
        fetcher,
      );
      prepared.set(key, saved);
    }
    if (!saved.uploaded) {
      await uploadFile({
        file,
        upload: { path: saved.path, token: saved.token },
        source: { id: saved.id, sha256 },
        bucket: "ig-data-rooms",
        projectUrl,
        onProgress: (n) => onProgress(`Uploading ${file.name} · ${n}%`),
      });
      saved.uploaded = true;
    }
    if (!saved.complete) {
      onProgress(`Verifying ${file.name} in the private data room…`);
      await post(
        "/api/data-room/upload",
        { action: "complete", id: saved.id, version: saved.version },
        fetcher,
      );
      saved.complete = true;
    }
    const source = await intakeWorkspace(
      {
        action: "source",
        id: workspace.id,
        file_id: saved.id,
        sha256,
        approved: true,
      },
      fetcher,
    );
    ids.push(source.id);
  }
  return [...new Set(ids)];
}
