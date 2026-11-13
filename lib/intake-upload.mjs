import {
  INTAKE_BUCKET,
  sourceTypes,
  validateSourceSelection,
} from "./intake-source-spec.mjs";

export async function hashSourceFile(file, progress = () => {}) {
  const { createSHA256 } = await import("hash-wasm");
  const hash = await createSHA256();
  hash.init();
  const step = 6 * 1024 * 1024;
  for (let start = 0; start < file.size; start += step) {
    hash.update(
      new Uint8Array(await file.slice(start, start + step).arrayBuffer()),
    );
    progress(Math.round((Math.min(start + step, file.size) / file.size) * 100));
  }
  return hash.digest("hex");
}
export async function resumableSourceUpload({
  file,
  upload,
  source,
  projectUrl,
  bucket = INTAKE_BUCKET,
  contentType,
  onProgress = () => {},
  UploadClass,
}) {
  const Upload = UploadClass || (await import("tus-js-client")).Upload;
  const origin = new URL(projectUrl);
  if (origin.protocol !== "https:" || !origin.hostname.endsWith(".supabase.co"))
    throw new Error("Private storage address is unavailable.");
  origin.hostname = origin.hostname.replace(
    /\.supabase\.co$/,
    ".storage.supabase.co",
  );
  return new Promise((resolve, reject) => {
    const transfer = new Upload(file, {
      endpoint: origin.origin + "/storage/v1/upload/resumable/sign",
      headers: { "x-signature": upload.token },
      retryDelays: [0, 1500, 3000, 6000, 12000],
      chunkSize: 6 * 1024 * 1024,
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      fingerprint: async () =>
        [
          "ig-private-source-signed-v2",
          origin.host,
          bucket,
          source.id,
          source.sha256,
        ].join("/"),
      metadata: {
        bucketName: bucket,
        objectName: upload.path,
        contentType:
          contentType || sourceTypes[file.name.split(".").pop().toLowerCase()],
        cacheControl: "0",
      },
      onProgress: (sent, total) => onProgress(Math.round((sent / total) * 100)),
      onSuccess: resolve,
      onError: (error) => reject(new Error(uploadFailure(file.name, error))),
    });
    transfer
      .findPreviousUploads()
      .then((previous) => {
        if (previous.length) transfer.resumeFromPreviousUpload(previous[0]);
        transfer.start();
      })
      .catch(reject);
  });
}
export function uploadFailure(name, error) {
  const response = error?.originalResponse;
  const status = response?.getStatus?.() || 0;
  let code = "";
  try {
    const body = JSON.parse(response?.getBody?.() || "{}");
    code = String(body.error || body.code || body.message || "");
  } catch {
    /* No provider body. */
  }
  const reason =
    status === 401 ||
    status === 403 ||
    /AccessDenied|Unauthorized|JWT|JWS/i.test(code)
      ? "The private upload authorisation was rejected. Refresh the page and retry to renew it."
      : status === 413
        ? "Storage rejected this file under the account’s current upload allowance. Contact the administrator to increase that allowance."
        : status === 409
          ? "Another upload is using this file destination. Wait for it to finish, then retry."
          : status === 429
            ? "Storage is temporarily rate limited. Retry shortly."
            : status >= 500
              ? "The storage service is temporarily unavailable. Retry the same file to resume."
              : status
                ? "Storage did not accept this upload. Retry the same file; contact the administrator if this continues."
                : "The connection to private storage was interrupted. Check your connection and retry the same file to resume.";
  // Never include raw provider errors: they may contain signed URLs or tokens.
  return `Upload paused for ${name}. ${reason}${status ? ` (Storage ${status})` : ""}`;
}
export async function uploadIntakeSources({
  files,
  practice,
  approved,
  projectUrl,
  fetcher = fetch,
  onProgress = () => {},
  uploadFile = resumableSourceUpload,
}) {
  validateSourceSelection(files);
  if (!approved)
    throw new Error("Confirm permission to process these sources.");
  const ids = [];
  for (const [index, file] of files.entries()) {
    const prefix =
      "Source " + (index + 1) + " of " + files.length + ": " + file.name;
    const sha256 = await hashSourceFile(file, (percent) =>
      onProgress("Checking " + prefix + " · " + percent + "%"),
    );
    const response = await fetcher("/api/admin/intake/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: file.name,
        size: file.size,
        sha256,
        practice,
        approved,
      }),
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error || "Source upload could not be prepared.");
    if (result.upload)
      await uploadFile({
        file,
        upload: result.upload,
        source: result.source,
        projectUrl,
        onProgress: (percent) =>
          onProgress("Uploading " + prefix + " · " + percent + "%"),
      });
    ids.push(result.source.id);
  }
  return ids;
}
