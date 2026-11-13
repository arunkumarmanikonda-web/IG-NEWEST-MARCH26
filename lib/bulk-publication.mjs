export function selectVisible(selected, rows, checked) {
  const next = new Set(selected);
  for (const r of rows) checked ? next.add(r.id) : next.delete(r.id);
  return [...next];
}
export function publicationPayload(row, action) {
  if (
    !["publish", "archive"].includes(action) ||
    !row?.id ||
    !Number.isInteger(row.version)
  )
    throw new Error("Invalid publication selection");
  return {
    action,
    id: row.id,
    version: row.version,
    ...(action === "publish"
      ? { factsConfirmed: true, rightsConfirmed: true, privacyConfirmed: true }
      : {}),
  };
}
export async function publishSelection(
  rows,
  action,
  send,
  onProgress = () => {},
) {
  if (!rows.length || rows.length > 1000)
    throw new Error("Select between 1 and 1,000 records");
  const results = [];
  for (const row of rows) {
    try {
      await send(publicationPayload(row, action));
      results.push({ id: row.id, title: row.title, ok: true });
    } catch (e) {
      results.push({
        id: row.id,
        title: row.title,
        ok: false,
        error: e.message || "Unable to update this record",
      });
    }
    onProgress(results.length, rows.length);
  }
  return results;
}
