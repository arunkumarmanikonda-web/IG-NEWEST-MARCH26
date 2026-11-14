import { accountContext } from "../../../../lib/supabase/server";
import { readJson, HttpError, privateJson, errorJson } from "../../../../lib/http.mjs";
import { writeSiteRecord } from "../../../../lib/site-cms-records.mjs";
import { validateSection } from "../../../../lib/site-editorial.mjs";
export async function POST(request) {
  try {
    const p = await readJson(request, 190000);
    if (!["save","publish"].includes(p.action)) throw new HttpError("Choose save or publish.");
    try { validateSection(p.section, p.content); } catch (error) { throw new HttpError(error.message); }
    if (p.action === "publish" && p.reviewed !== true) throw new HttpError("Review the text, media rights and privacy before publication.");
    const { client, staffVerified } = await accountContext();
    if (!staffVerified) throw new HttpError("Staff verification required.", 403);
    try { return privateJson(await writeSiteRecord(client, p)); }
    catch (error) { throw new HttpError(error.message,409); }
  } catch (error) { return errorJson(error); }
}
