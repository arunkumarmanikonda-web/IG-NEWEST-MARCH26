import { serverClient } from "../../../../lib/supabase/server";
import { readJson, privateJson, errorJson, HttpError } from "../../../../lib/http.mjs";

export async function POST(request) {
  try {
    const input = await readJson(request, 4500);
    if (!["overview", "edit", "payment", "share"].includes(input.action))
      throw new HttpError("Unknown sample action", 400);
    const client = await serverClient();
    const { data, error } = await client.rpc("ig_review_sample_workflows", { p: input });
    if (error) throw new HttpError(error.message, error.code === "42501" ? 403 : error.code === "40001" ? 409 : 400);
    return privateJson(data);
  } catch (error) {
    return errorJson(error);
  }
}
