import { createClient } from "npm:@supabase/supabase-js@2.119.0";
import {
  MAX_PREVIEW_BYTES,
  roomFileType,
} from "./formats.mjs";
import { inspectStoredRoomFile } from "./inspect-upload.mjs";
const bucket = "ig-data-rooms";
const headers = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};
Deno.serve(async (req) => {
  try {
    if (req.method !== "POST")
      return new Response("Method not allowed", { status: 405, headers });
    const token = (req.headers.get("authorization") || "").replace(
      /^Bearer /i,
      "",
    );
    if (!token)
      return new Response("Sign-in required", { status: 401, headers });
    const reader = req.body?.getReader();
    if (!reader)
      return new Response("Invalid request", { status: 400, headers });
    let total = 0,
      chunks = [];
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > 16000) {
        await reader.cancel();
        return new Response("Request too large", { status: 413, headers });
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const c of chunks) {
      bytes.set(c, offset);
      offset += c.length;
    }
    const p = JSON.parse(new TextDecoder().decode(bytes));
    const url = Deno.env.get("SUPABASE_URL")!;
    const publicKey =
      JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") || "{}").default ||
      Deno.env.get("SUPABASE_ANON_KEY")!;
    if (url !== "https://ehcqhoxiwmydipwfujuf.supabase.co" ||
        !["prepare", "complete", "preview_source"].includes(p.action)) {
      return Response.json({error: "Unavailable in this review workspace."}, {status: 403, headers});
    }
    const user = createClient(url, publicKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: "Bearer " + token } },
    });
    const {
      data: { user: identity },
      error: authError,
    } = await user.auth.getUser(token);
    if (authError || !identity)
      return new Response("Sign-in required", { status: 401, headers });
    const key =
      JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}").default ||
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const rpc = async (name: string, payload: unknown) => {
      const { data, error } = await user.rpc(name, { p: payload });
      if (error)
        throw Object.assign(new Error(error.message), {
          status: error.code === "42501" ? 403 : 400,
        });
      return data;
    };
    const broker = req.headers.get("x-room-broker") || "";
    const sample = p.workspace === "assigned-sample";
    if (p.action === "prepare") {
      const type = roomFileType(p.name);
      if (
        !type ||
        type.mime !== p.mime ||
        !Number.isSafeInteger(p.bytes) ||
        p.bytes < 1 || p.bytes > 20 * 1024 * 1024
      )
        throw Object.assign(new Error("Unsupported file type or size"), {
          status: 400,
        });
      const file = await rpc(sample ? "ig_review_sample_workflows" : "ig_room_manage", {
        ...p,
        action: "upload_prepare",
        ...(sample ? { broker_secret: broker } : {}),
      });
      const { data: existing, error: bucketError } =
        await admin.storage.getBucket(bucket);
      if (bucketError || !existing || existing.public || !existing.file_size_limit ||
          existing.file_size_limit > 20 * 1024 * 1024)
        throw new Error("Private review storage limit required");
      const { data, error } = await admin.storage
        .from(bucket)
        .createSignedUploadUrl(file.object_key, { upsert: false });
      if (error) throw new Error("Upload could not be prepared");
      return Response.json(
        {
          id: file.id,
          version: file.version,
          path: data.path,
          token: data.token,
        },
        { headers },
      );
    }
    if (p.action === "complete") {
      const file = await rpc(sample ? "ig_review_sample_workflows" : "ig_room_authorize", {
        action: sample ? "upload_inspect" : "upload",
        id: p.id,
        ...(sample ? { broker_secret: broker } : {}),
      });
      try {
        await inspectStoredRoomFile(admin.storage.from(bucket), file);
      } catch (e) {
        throw Object.assign(new Error(e.message), {status:400});
      }
      await rpc(sample ? "ig_review_sample_workflows" : "ig_room_manage", {
        action: sample ? "upload_validated" : "upload_complete",
        id: p.id,
        version: p.version,
        broker_secret: broker,
      });
      return Response.json({ ok: true }, { headers });
    }
    const file = await rpc("ig_room_authorize", {
      action: "preview_source", id: p.id, broker_secret: broker,
    });
    if (file.bytes > MAX_PREVIEW_BYTES) throw Object.assign(new Error("Ask the administrator to attach an optimised PDF preview. The original remains available to authorised downloaders."), {status:400});
    const { data, error } = await admin.storage
      .from(bucket)
      .download(file.object_key);
    if (error || !data) throw new Error("Preview source unavailable");
    if (data.size > MAX_PREVIEW_BYTES)
      throw new Error("Preview exceeds size limit");
    return new Response(data, {
      headers: {
        ...headers,
        "Content-Type": file.mime,
        "Content-Length": String(data.size),
      },
    });
  } catch (error) {
    const status = error?.status || 500;
    return Response.json(
      {
        error:
          status === 500
            ? "Data room service is temporarily unavailable."
            : error.message,
      },
      { status, headers },
    );
  }
});
