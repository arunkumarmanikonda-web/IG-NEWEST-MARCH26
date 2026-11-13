import { accountContext } from "../../../../lib/supabase/server";
import {
  readJson,
  privateJson,
  HttpError,
  errorJson,
} from "../../../../lib/http.mjs";
const methods = {
  procurement: "ig_procurement",
  vendor_portal: "ig_vendor_portal",
  catalogue_import: "ig_catalogue_import",
  source_media: "ig_source_media_manage",
  operations: "ig_ops_save",
  operations_action: "ig_ops_action",
  account: "ig_account_update",
  invitation: "ig_accept_invitation",
  invitation_revoke: "ig_revoke_invitation",
  content: "ig_save_content",
  publication: "ig_content_action",
  taxonomy: "ig_taxonomy_action",
  users: "ig_users_action",
  enquiry: "ig_enquiry_update",
  nda: "ig_nda_action",
  nda_admin: "ig_nda_admin",
  rooms: "ig_room_manage",
  privacy: "ig_privacy_request",
  policies: "ig_policy_publish",
  payments: "ig_payment_admin",
  clients: "ig_client_manage",
  room_notify: "ig_room_notify",
  ai_save: "ig_ai_save",
};
export async function POST(request) {
  try {
    const body = await readJson(request, 140000),
      rpc = methods[body.module];
    if (!rpc) throw new HttpError("Unknown operation");
    const { client, user, profile, aal } = await accountContext();
    if (!user || !profile || profile.status !== "active")
      throw new HttpError("Active sign-in required", 401);
    if (
      !["account", "invitation", "nda", "privacy", "procurement", "vendor_portal"].includes(body.module) &&
      aal !== "aal2"
    )
      throw new HttpError("Complete multi-factor authentication", 403);
    if (
      profile.must_change_password &&
      !["account", "nda", "privacy"].includes(body.module)
    )
      throw new HttpError(
        "Change your initial password before using staff operations",
        403,
      );
    const { data, error } = await client.rpc(
      rpc,
      body.module === "invitation" ? {} : { p: body.payload },
    );
    if (error) {
      const status =
        error.code === "42501"
          ? 403
          : error.code === "40001" ||
              error.code === "23503" ||
              error.code === "23505"
            ? 409
            : 400;
      throw new HttpError(
        error.code === "23503"
          ? "This record is still referenced. Reassign its references first."
          : error.code === "23505"
            ? "That reference already exists."
            : error.message,
        status,
      );
    }
    return privateJson({ ok: true, data });
  } catch (e) {
    return errorJson(e);
  }
}
