import { propertyReference } from "../../../../../lib/property-photo";
import { listingVisualStyle } from "../../../../../lib/listing-images.mjs";
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

export const maxDuration=60;

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
      const { data: workspace } = await client.from("ig_content_intakes").select("actor_id,content_id,media_id,job_id,creative:review->>creative_brief").eq("id",p.id).maybeSingle();
      if (!workspace || workspace.actor_id !== user.id || !workspace.job_id || p.approved !== true) throw new HttpError("Completed authorised intake required.",403);
      const {data: record}=await client.from("ig_content").select("id,kind,practice,title,body,summary,public_data").eq("id",workspace.content_id).single();
      if (!record) throw new HttpError("Saved draft unavailable.",409);
      try {
        if(record.kind!=="opportunity")return privateJson({status:workspace.media_id?"existing":await queueDraftHero(client,record)});
        const style=listingVisualStyle(p.style,p.direction,workspace.creative);
        if(style==="photo" && (workspace.media_id || record.public_data?.image))return privateJson({status:"existing"});
        const reference=workspace.media_id || await propertyReference(client,record);
        if(reference && !workspace.media_id && !record.public_data?.image){
          const attached=await client.rpc("ig_content_intake",{p:{action:"media",id:p.id,media_id:reference}});
          if(attached.error)throw Error(attached.error.message);
        }
        if(reference && style==="photo")return privateJson({status:"existing"});
        return privateJson({status:await queueDraftHero(client,record,reference,style)});
      }
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
    if (p.action === "finish" && p.receipt === true) {
      const { id, content_id, room_id, version, media_id } = data;
      return privateJson({ id, content_id, room_id, version, media_id });
    }
    return privateJson(data);
  } catch (e) {
    return errorJson(e);
  }
}
