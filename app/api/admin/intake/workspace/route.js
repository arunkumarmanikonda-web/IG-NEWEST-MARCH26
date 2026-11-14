import { queueDraftHero } from "../../../../../lib/draft-hero";
import { isStaff } from "../../../../../lib/sign-in.mjs";
import { accountContext } from "../../../../../lib/supabase/server";
import {
  readJson,
  privateJson,
  errorJson,
  HttpError,
} from "../../../../../lib/http.mjs";
import { intakeContent } from "../../../../../lib/content-intake.mjs";

export async function POST(request) {
  try {
    const p = await readJson(request, 12000);
    const { client, user, profile, staffVerified } = await accountContext();
    if (
      !user ||
      profile?.status !== "active" ||
      profile.must_change_password ||
      !isStaff(profile) ||
      !staffVerified
    )
      throw new HttpError("Staff sign-in required", 403);
    if (p.action === "hero") {
      const { data: workspace } = await client.from("ig_content_intakes").select("actor_id,content_id,media_id,job_id").eq("id",p.id).maybeSingle();
      if (!workspace || workspace.actor_id !== user.id || !workspace.job_id || p.approved !== true) throw new HttpError("Completed authorised intake required.",403);
      if (workspace.media_id) return privateJson({status:"existing"});
      const {data: record}=await client.from("ig_content").select("id,kind,practice,title,body,summary,public_data").eq("id",workspace.content_id).single();
      if (!record) throw new HttpError("Saved draft unavailable.",409);
      try { return privateJson({status:await queueDraftHero(client,record)}); }
      catch(error){ throw new HttpError(error.message,409); }
    }
    if (!["begin", "source", "finish", "media", "room"].includes(p.action))
      throw new HttpError("Unsupported action");
    if (p.action === "finish") {
      const { data: workspace } = await client
        .from("ig_content_intakes")
        .select("content_id,actor_id")
        .eq("id", p.id)
        .maybeSingle();
      if (!workspace || workspace.actor_id !== user.id)
        throw new HttpError("Workspace permission required", 403);
      const [{ data: job }, { data: record }] = await Promise.all([
        client
          .from("ig_ai_jobs")
          .select("draft,context")
          .eq("id", p.job_id)
          .eq("actor_id", user.id)
          .eq("status", "ready")
          .maybeSingle(),
        client
          .from("ig_content")
          .select("id,slug,kind,version,public_data")
          .eq("id", workspace.content_id)
          .maybeSingle(),
      ]);
      if (!record || !job || job.context?.workspace_id !== p.id)
        throw new HttpError("Completed AI draft unavailable", 409);
      p.content = intakeContent(job, record);
    }
    const { data, error } = await client.rpc("ig_content_intake", { p });
    if (error)
      throw new HttpError(error.message, error.code === "42501" ? 403 : 409);
    return privateJson(data);
  } catch (e) {
    return errorJson(e);
  }
}
