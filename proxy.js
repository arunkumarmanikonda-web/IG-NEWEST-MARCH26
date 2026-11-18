import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server.js";
import {randomBytes} from 'node:crypto';
import {contentSecurityPolicy} from './lib/content-security.mjs';
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
  const privatePath=/^\/(admin|account|login|register|auth)(\/|$)|^\/api\/portal(\/|$)/.test(request.nextUrl.pathname);
  const nonce=randomBytes(24).toString('base64');
  const csp=contentSecurityPolicy(nonce,{development:process.env.NODE_ENV==='development',supabaseUrl:process.env.NEXT_PUBLIC_SUPABASE_URL});
  const requestHeaders=new Headers(request.headers);
  requestHeaders.set('x-nonce',nonce);
  requestHeaders.set('Content-Security-Policy',csp);
  const next=()=>NextResponse.next({request:{headers:requestHeaders}});
  let response = next();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (privatePath && url && key) {
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
          requestHeaders.set('cookie',request.cookies.toString());
          response = next();
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
  response.headers.set('Content-Security-Policy',csp);
  response.headers.set("Cache-Control", "private, no-store");
  if(privatePath) response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}
export const config = {
  matcher: [
    '/((?!api|_next|images/|brand/|fonts/|favicon|apple-touch|mask-icon|manifest|robots.txt|sitemap.xml).*)',
    "/:path(.*%5[Cc].*)",
    "/admin/:path*",
    "/account/:path*",
    "/login",
    "/register",
    "/auth/:path*",
    "/api/portal/:path*",
  ],
};
