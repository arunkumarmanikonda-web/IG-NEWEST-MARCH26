import { accountContext } from "../../../../lib/supabase/server";
import { privateJson, HttpError, errorJson } from "../../../../lib/http.mjs";
import { roomBroker } from "../../../../lib/room-broker";
import { roomPreview } from "../../../../lib/render-room-preview.mjs";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(request) {
  try {
    const q = new URL(request.url).searchParams,
      id = q.get("id"),
      mode = q.get("mode") || "info",
      page = Number(q.get("page") || 1);
    if (
      !/^[0-9a-f-]{36}$/i.test(id || "") ||
      !["info", "preview", "download"].includes(mode) ||
      !Number.isInteger(page) ||
      page < 1 ||
      page > 500
    )
      throw new HttpError("Invalid file request");
    const { client, user, profile } = await accountContext();
    if (
      !user ||
      !profile ||
      profile.status !== "active" ||
      profile.must_change_password
    )
      throw new HttpError("Verified sign-in required", 401);
    const res = await roomBroker(client, {
      id,
      action: mode === "download" ? "download" : "preview_source",
    });
    if (mode === "download") {
      const { url } = await res.json();
      if (
        new URL(url).origin !==
        new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
      )
        throw new Error("Invalid storage origin");
      return new Response(null, {
        status: 303,
        headers: {
          Location: url,
          "Cache-Control": "private, no-store",
          "Referrer-Policy": "no-referrer",
        },
      });
    }
    const mime = res.headers.get("content-type")?.split(";")[0];
    const rendered = await roomPreview(
      await res.arrayBuffer(),
      mime,
      page,
      user.email,
      mode === "info",
    );
    if (mode === "info") return privateJson({ pages: rendered.pages });
    return new Response(new Uint8Array(rendered.data), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": 'inline; filename="protected-preview.jpg"',
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch (e) {
    return errorJson(e);
  }
}
