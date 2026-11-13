import { serverClient } from "../../../lib/supabase/server";
import { requestOrigin } from "../../../lib/http.mjs";
import { finishSignIn } from "../../../lib/sign-in.mjs";
export async function GET(request) {
  const url = new URL(request.url),
    code = url.searchParams.get("code");
  if (code) {
    const client = await serverClient();
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (!error) {
      const result = await finishSignIn(client);
      return Response.redirect(
        new URL(result.next, requestOrigin(request)),
        303,
      );
    }
  }
  return Response.redirect(
    new URL("/login?confirmation=failed", requestOrigin(request)),
    303,
  );
}
