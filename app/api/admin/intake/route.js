import { createHash } from "node:crypto";
import { accountContext } from "../../../../lib/supabase/server";
import { runtimeConfigs, integrationRpc } from "../../../../lib/runtime-config";
import {
  readJson,
  privateJson,
  errorJson,
  HttpError,
} from "../../../../lib/http.mjs";
import { validateIntake, generateIntake } from "../../../../lib/intake.mjs";
import {
  loadIntakeSources,
  resolveIntakeSources,
} from "../../../../lib/intake-storage.mjs";
import {
  intakeBriefHash,
  describeSourceSections,
  readSourceSection,
  reviewCompletedSections,
  sectionSummaryFiles,
  reconcileMergedFacts,
} from "../../../../lib/intake-sections.mjs";
import { gatherImages } from "../../../../lib/source-media.mjs";
export const maxDuration = 180;
export async function POST(request) {
  let job;
  try {
    const p = await readJson(request, 3600000),
      { client, user, profile, aal } = await accountContext();
    if (
      !user ||
      profile?.status !== "active" ||
      profile.must_change_password ||
      aal !== "aal2"
    )
      throw new HttpError("Staff sign-in and MFA required", 403);
    if (p.approved !== true)
      throw new HttpError("Confirm permission to process these sources.");
    const staged = ["plan", "section", "merge"].includes(p.action);
    if (p.action && !staged) throw new HttpError("Unsupported intake action");
    if (p.source_ids !== undefined && !staged)
      throw new HttpError(
        "Process uploaded files in sections before creating the final draft.",
      );
    let context,
      metadata,
      mergeGroups,
      media = { candidates: [], notes: [] };
    if (p.action === "plan" || p.action === "section") {
      const [file] = await loadIntakeSources(client, [p.source_id], p.practice);
      // Validate brief and signatures before parsing any document or making a paid call.
      context = validateIntake({ ...p, files: [] }, [file]);
      if (p.action === "plan")
        return privateJson(await describeSourceSections(file));
      const part = await readSourceSection(file, p.section);
      context = validateIntake({ ...p, files: [] }, [part.file]);
      metadata = {
        kind: "intake_section",
        record_kind: p.kind,
        operation_kind: p.operation_kind,
        brief_hash: intakeBriefHash(p),
        source_id: file.source_id,
        section: p.section,
        section_count: part.count,
      };
      // Digest refers to the unchanged original, not the provider-sized processing copy.
      const [source] = await resolveIntakeSources(
        client,
        [p.source_id],
        p.practice,
      );
      metadata.source_sha256 = source.sha256;
      const { data: cached } = await client
        .from("ig_ai_jobs")
        .select("id,draft")
        .eq("actor_id", user.id)
        .eq("practice", p.practice)
        .eq("status", "ready")
        .contains("context", metadata)
        .order("created_at", { ascending: false })
        .limit(1);
      media = await gatherImages(context.files);
      media.notes.push(...part.notes);
      if (cached?.[0])
        return privateJson({
          id: cached[0].id,
          draft: cached[0].draft,
          section_count: part.count,
          ...media,
          reused: true,
        });
    } else if (p.action === "merge") {
      const sources = await resolveIntakeSources(
        client,
        p.source_ids,
        p.practice,
      );
      if (
        !Array.isArray(p.jobs) ||
        !p.jobs.length ||
        p.jobs.length > 1000 ||
        new Set(p.jobs).size !== p.jobs.length ||
        p.jobs.some(
          (id) =>
            !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(
              id,
            ),
        )
      )
        throw new HttpError("Select the completed source sections.");
      const { data: rows, error } = await client
        .from("ig_ai_jobs")
        .select("id,actor_id,practice,status,context,draft")
        .in("id", p.jobs)
        .eq("actor_id", user.id);
      if (error || rows.length !== p.jobs.length)
        throw new HttpError("Completed source sections are unavailable.", 403);
      const groups = reviewCompletedSections(
        rows,
        sources,
        intakeBriefHash(p),
        user.id,
      );
      mergeGroups = groups;
      context = validateIntake(
        { ...p, files: [] },
        sectionSummaryFiles(groups),
      );
      metadata = {
        kind: "intake",
        record_kind: context.kind,
        operation_kind: context.operation_kind,
        brief: context.brief,
        section_jobs_hash: createHash("sha256")
          .update(JSON.stringify([...p.jobs].sort()))
          .digest("hex"),
        section_count: p.jobs.length,
        sources: sources.map(({ id, name, mime, size, sha256 }) => ({
          source_id: id,
          name,
          mime,
          bytes: size,
          sha256,
        })),
      };
      const { data: cached } = await client
        .from("ig_ai_jobs")
        .select("id,draft")
        .eq("actor_id", user.id)
        .eq("practice", p.practice)
        .eq("status", "ready")
        .contains("context", {
          kind: "intake",
          brief_hash: intakeBriefHash(p),
          section_jobs_hash: createHash("sha256")
            .update(JSON.stringify([...p.jobs].sort()))
            .digest("hex"),
          section_count: p.jobs.length,
        })
        .order("created_at", { ascending: false })
        .limit(1);
      metadata.brief_hash = intakeBriefHash(p);
      if (cached?.[0])
        return privateJson({
          id: cached[0].id,
          draft: cached[0].draft,
          ...media,
          reused: true,
        });
    } else {
      context = validateIntake(p);
      metadata = {
        kind: "intake",
        record_kind: context.kind,
        operation_kind: context.operation_kind,
        brief: context.brief,
        text: context.text,
        sources: context.files.map(({ id, name, mime, sha256, bytes }) => ({
          id,
          name,
          mime,
          sha256,
          bytes: bytes.length,
        })),
      };
    }
    const config = (await runtimeConfigs()).openai;
    if (config.mode !== "enabled" || !config.secrets.api_key)
      throw new HttpError("Enable OpenAI in integration settings", 503);
    const prepared = await client.rpc("ig_ai_prepare", {
      p: { practice: context.practice, context: metadata },
    });
    if (prepared.error)
      throw new HttpError(
        prepared.error.message,
        prepared.error.code === "42501" ? 403 : 429,
      );
    job = prepared.data;
    const result = await generateIntake(config, context);
    if (mergeGroups)
      result.draft = reconcileMergedFacts(result.draft, mergeGroups);
    await integrationRpc("ig_ai_finish", {
      id: job.id,
      status: "ready",
      ...result,
    });
    if (!staged) media = await gatherImages(context.files);
    return privateJson({ id: job.id, draft: result.draft, ...media });
  } catch (e) {
    if (job)
      await integrationRpc("ig_ai_finish", {
        id: job.id,
        status: "failed",
      }).catch(() => {});
    return errorJson(
      e instanceof HttpError
        ? e
        : new HttpError(e.message || "Source intake unavailable", 503),
    );
  }
}
