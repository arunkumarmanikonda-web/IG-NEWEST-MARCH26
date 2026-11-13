// Each section is a separate authenticated request. Completed sections are
// retained server-side and reused when the same files and brief are retried.
export async function processIntakeDraft({
  sourceIds,
  input,
  fetcher = fetch,
  onProgress = () => {},
  shouldPause = () => false,
  wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
}) {
  async function post(payload) {
    for (let retry = 0; retry < 2; retry++) {
      const r = await fetcher("/api/admin/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, ...payload }),
      });
      const d = await r.json();
      if (r.ok) return d;
      if (
        r.status === 429 &&
        /Wait 30 seconds/i.test(d.error || "") &&
        !retry
      ) {
        onProgress(
          "Keeping to your AI request rate. Processing resumes shortly…",
        );
        await wait(31000);
        if (shouldPause())
          throw new Error(
            "Processing paused. Use the same files and brief to resume; completed sections are retained.",
          );
        continue;
      }
      throw new Error(d.error || "Source processing unavailable.");
    }
  }
  if (!sourceIds.length) return post({ files: [] });
  const jobs = [],
    candidates = [],
    notes = [];
  for (const [index, id] of sourceIds.entries()) {
    onProgress(
      "Reading source " + (index + 1) + " of " + sourceIds.length + "…",
    );
    const plan = await post({ action: "plan", source_id: id });
    for (let section = 0; section < plan.count; section++) {
      if (shouldPause())
        throw new Error(
          "Processing paused. Use the same files and brief to resume; completed sections are retained.",
        );
      onProgress(
        "Source " +
          (index + 1) +
          " of " +
          sourceIds.length +
          " · preparing section " +
          (section + 1) +
          " of " +
          plan.count +
          "…",
      );
      const result = await post({ action: "section", source_id: id, section });
      jobs.push(result.id);
      candidates.push(
        ...(result.candidates || []).slice(
          0,
          Math.max(0, 6 - candidates.length),
        ),
      );
      notes.push(...(result.notes || []));
    }
  }
  if (shouldPause())
    throw new Error(
      "Processing paused. Resume to combine the completed sections.",
    );
  onProgress(
    "All sections read. Combining the facts and preparing the final review draft…",
  );
  const result = await post({ action: "merge", source_ids: sourceIds, jobs });
  return { ...result, candidates, notes: [...new Set(notes)] };
}
