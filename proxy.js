import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server.js";
export async function proxy(request) {
  // Malformed crawled links can contain an encoded backslash. Reject them
  // before Vercel's page launcher attempts to resolve a nonexistent module.
  if (/%5c/i.test(request.nextUrl.pathname)) {
    return new NextResponse("Not found", {
      status: 404,
      headers: {
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (url && key) {
    const client = createServerClient(url, key, {
      cookieOptions: {
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(values, headers) {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          values.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers || {}).forEach(([k, v]) =>
            response.headers.set(k, v),
          );
        },
      },
    });
    await client.auth.getClaims();
  }
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}
export const config = {
  matcher: [
    "/:path(.*%5[Cc].*)",
    "/admin/:path*",
    "/account/:path*",
    "/login",
    "/register",
    "/auth/:path*",
    "/api/portal/:path*",
  ],
};
