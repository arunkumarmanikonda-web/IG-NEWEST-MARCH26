import { adminResponse, InterruptedResponse } from "./admin-response.mjs";

async function requestIntake(input, payload, fetcher) {
  let response;
  try {
    response = await fetcher("/api/admin/intake", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, ...payload }),
    });
  } catch {
    throw new InterruptedResponse("The connection to the listing service was interrupted.");
  }
  return { response, data: await adminResponse(response) };
}

export async function firstIntakeImage(input, sections, fetcher = fetch) {
  for (const section of sections) {
    const { response, data } = await requestIntake(input, { ...section, action: "images" }, fetcher);
    if (!response.ok) throw new Error(data.error || "Source photo unavailable.");
    if (data.candidate) return data.candidate;
  }
  return null;
}
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
      const { response: r, data: d } = await requestIntake(input, payload, fetcher);
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
  async function runStage(payload) {
    if (!input.workspace_id) return post(payload);
    const stage = { ...payload, background: true };
    let receipt;
    try {
      receipt = await post(stage);
      if (receipt.status === "ready") return receipt;
    } catch (error) {
      if (!(error instanceof InterruptedResponse)) throw error;
      onProgress("Checking the saved result after the connection was interrupted…");
    }
    const jobId = receipt?.id;
    for (let poll = 0; poll < 80; poll++) {
      if (shouldPause()) throw new Error("Paused. The current job can finish and will be reused when you resume.");
      await wait(3000);
      try {
        receipt = await post({ ...stage, read_only: true, ...(jobId ? { job_id: jobId } : {}) });
      } catch (error) {
        if (error instanceof InterruptedResponse) continue;
        throw error;
      }
      if (receipt.status === "ready") return receipt;
      if (receipt.status === "failed") throw new Error(receipt.error || "This generation step failed.");
    }
    throw new Error("Could not confirm this step. Resume the saved draft to check its progress.");
  }
  if (!sourceIds.length) return post({ files: [] });
  const jobs = [],
    sections = [],
    candidates = [],
    notes = [];
  for (const [index, id] of sourceIds.entries()) {
    onProgress(
      "Reading source " + (index + 1) + " of " + sourceIds.length + "…",
    );
    const requestPlan = () => post({ action: "plan", source_id: id });
    const plan = await requestPlan().catch(error => {
      if (!(error instanceof InterruptedResponse) || shouldPause()) throw error;
      return requestPlan();
    });
    if (!Number.isSafeInteger(plan?.count) || plan.count < 1)
      throw new Error("The source page count was unavailable. Resume this draft to check the saved file.");
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
      const descriptor = { source_id: id, section };
      const result = await runStage({ action: "section", ...descriptor, section_count: plan.count });
      jobs.push(result.id);
      sections.push(descriptor);
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
  const result = await runStage({ action: "merge", source_ids: sourceIds, jobs });
  return { ...result, sections, candidates, notes: [...new Set(notes)] };
}
