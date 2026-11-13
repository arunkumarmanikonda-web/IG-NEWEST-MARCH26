import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
export async function serverClient() {
  const jar = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key)
    throw new Error("Authentication is not configured for this environment.");
  return createServerClient(url, key, {
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
    cookies: {
      getAll: () => jar.getAll(),
      setAll(values) {
        try {
          values.forEach(({ name, value, options }) =>
            jar.set(name, value, options),
          );
        } catch {
          /* Proxy persists refreshed cookies for server components. */
        }
      },
    },
  });
}
export async function accountContext() {
  const client = await serverClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) return { client, user: null, profile: null, aal: "aal1" };
  const [{ data: profile }, { data: claims }] = await Promise.all([
    client.from("ig_profiles").select("*").eq("id", user.id).maybeSingle(),
    client.auth.getClaims(),
  ]);
  return { client, user, profile, aal: claims?.claims?.aal || "aal1" };
}
