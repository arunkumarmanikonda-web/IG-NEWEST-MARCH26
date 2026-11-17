import { after } from "next/server";
import { dispatchEmailQueue } from "../../../../lib/delivery";
import { anonymousServerClient } from "../../../../lib/runtime-config";
import { isStaff } from "../../../../lib/sign-in.mjs";
import { accountContext } from "../../../../lib/supabase/server";
import {
  readJson,
  privateJson,
  HttpError,
  errorJson,
} from "../../../../lib/http.mjs";
export const maxDuration = 120;
const methods = {
  procurement: "ig_procurement",
  vendor_portal: "ig_vendor_portal",
  catalogue_import: "ig_catalogue_import",
  source_media: "ig_source_media_manage",
  operations: "ig_ops_save",
  operations_action: "ig_ops_action",
  account: "ig_account_update",
  invitation: "ig_accept_invitation",
  invitation_resend: "ig_invitation_recipient",
  invitation_revoke: "ig_revoke_invitation",
  retail_mandate: "ig_retail_manage",
  content: "ig_save_content",
  publication: "ig_content_action",
  bulk_publication: "ig_bulk_publication",
  taxonomy: "ig_taxonomy_action",
  users: "ig_users_action",
  enquiry: "ig_enquiry_update",
  identity: "ig_client_identity",
  project_signature: "ig_project_signature",
  nda: "ig_nda_action",
  nda_draft: "ig_edit_project_nda",
  nda_admin: "ig_nda_admin",
  rooms: "ig_room_manage",
  privacy: "ig_privacy_request",
  policies: "ig_policy_publish",
  payments: "ig_payment_admin",
  clients: "ig_client_manage",
  room_share: "ig_room_share",
  room_notify: "ig_room_notify",
  ai_save: "ig_ai_save",
};
export async function POST(request) {
  try {
    const body = await readJson(request, 140000),
      rpc = methods[body.module];
    if (!rpc) throw new HttpError("Unknown operation");
    const { client, user, profile, staffVerified } = await accountContext();
    if (!user || !profile || profile.status !== "active")
      throw new HttpError("Active sign-in required", 401);
    if (
      !["account", "identity", "project_signature", "invitation", "nda", "privacy", "procurement", "vendor_portal"].includes(body.module) &&
      (!isStaff(profile) || !staffVerified)
    )
      throw new HttpError("Staff access required", 403);
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
          ? (body.module === "publication" && body.payload?.action === "delete"
            ? "Permanent deletion is unavailable while linked records exist. Keep this listing in Deleted to preserve its data room and history."
            : "This record is still referenced. Reassign its references first.")
          : error.code === "23505"
            ? "That reference already exists."
            : error.message,
        status,
      );
    }
    if (body.module === "invitation_resend" || (body.module === "users" && body.payload?.action === "invite")) {
      const email = body.module === "invitation_resend" ? data.email : body.payload.email.trim().toLowerCase();
      const authClient = anonymousServerClient();
      const {data: eligible, error: lookupError} = await authClient.rpc("ig_client_login_eligible", {
        secret: process.env.INTEGRATION_MASTER_KEY, email_address: email,
      });
      if (lookupError || !eligible) throw new HttpError("The invitation was saved. Refresh the invitations list before sending a verification email.", 409);
      const {error: sendError} = await authClient.auth.signInWithOtp({email, options: {shouldCreateUser: true}});
      if (sendError) throw new HttpError(sendError.status === 429
        ? "The invitation is saved. Please wait before sending another verification code."
        : "The invitation is saved, but the verification email could not be sent. Use Resend verification email to retry.",
        sendError.status === 429 ? 429 : 503);
      return privateJson({ok: true, data: {notice: "Verification email requested for " + email + "."}});
    }
    if (body.module === "room_share" && body.payload?.action === "share" && data?.queued > 0) {
      after(async () => {
        try { await dispatchEmailQueue(undefined, data.batch_id); }
        catch { /* The scheduled worker retries queued notices. */ }
      });
    }
    return privateJson({ ok: true, data });
  } catch (e) {
    return errorJson(e);
  }
}
