export function selectVisible(selected, rows, checked) {
  const next = new Set(selected);
  for (const r of rows) checked ? next.add(r.id) : next.delete(r.id);
  return [...next];
}
export async function publishSelection(rows, action, send, onProgress = () => {}) {
  if (!rows.length) throw new Error("Select at least one record.");
  if (!["publish", "archive"].includes(action)) throw new Error("Invalid publication action.");
  const results = [];
  const batchSize = 25;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    try {
      const reply = await send({
        action,
        rows: batch.map(({ id, version, live_version, listing_archived, status }) => {
          // If the register already showed the requested state, verify it without writing.
          const alreadyInState = action === "publish"
            ? live_version === version && !listing_archived && status !== "archived"
            : live_version === null && !listing_archived;
          return alreadyInState ? { id, version, verify_only: true } : { id, version };
        }),
        ...(action === "publish" && { factsConfirmed: true, rightsConfirmed: true, privacyConfirmed: true }),
      });
      const outcomes = new Map(reply.map(outcome => [outcome.id, outcome]));
      for (const row of batch) {
        const outcome = outcomes.get(row.id);
        results.push({
          ...row, ok: outcome?.ok === true,
          error: outcome?.error || (outcome?.ok ? "" : "Result unconfirmed. Check the register before retrying."),
        });
      }
    } catch (error) {
      // A disconnected browser may have missed a committed response.
      for (const row of batch) results.push({ ...row, ok: false, error: error.message || "Result unconfirmed. Refresh to check visibility." });
      for (const row of rows.slice(i + batch.length)) results.push({ ...row, ok: false, error: "Not submitted. Retry the selection." });
      break;
    }
    onProgress(results.length, rows.length);
  }
  return results;
}
