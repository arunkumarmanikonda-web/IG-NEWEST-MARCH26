import { isStaff } from "../../../../../lib/sign-in.mjs";
import { accountContext } from "../../../../../lib/supabase/server";
import {
  readJson,
  privateJson,
  errorJson,
  HttpError,
} from "../../../../../lib/http.mjs";
import {
  INTAKE_BUCKET,
  sourceTypes,
  validateSourceSelection,
} from "../../../../../lib/intake-source-spec.mjs";

export async function POST(request) {
  try {
    const p = await readJson(request, 4000);
    const { client, user, profile, staffVerified } = await accountContext();
    if (
      !user ||
      profile?.status !== "active" ||
      profile.must_change_password ||
      (!isStaff(profile) || !staffVerified)
    )
      throw new HttpError("Staff sign-in required", 403);
    try {
      validateSourceSelection([p]);
    } catch (e) {
      throw new HttpError(e.message);
    }
    if (p.approved !== true || !/^[a-f0-9]{64}$/.test(p.sha256 || ""))
      throw new HttpError("Confirm permission and select a valid source file.");
    const mime = sourceTypes[p.name.split(".").pop().toLowerCase()];
    const { data: source, error } = await client.rpc(
      "ig_intake_sources_manage",
      {
        p: {
          action: "prepare",
          name: p.name.replace(/[^\w. ()-]/g, "_").slice(-150),
          size: p.size,
          mime,
          sha256: p.sha256,
          practice: p.practice,
          approved: true,
        },
      },
    );
    if (error)
      throw new HttpError(error.message, error.code === "42501" ? 403 : 409);
    if (source.uploaded) return privateJson({ source });
    const { data, error: uploadError } = await client.storage
      .from(INTAKE_BUCKET)
      .createSignedUploadUrl(source.path);
    if (uploadError)
      throw new HttpError(
        "Private source upload could not be authorised.",
        503,
      );
    return privateJson({
      source,
      upload: { path: data.path, token: data.token },
    });
  } catch (e) {
    return errorJson(e);
  }
}
