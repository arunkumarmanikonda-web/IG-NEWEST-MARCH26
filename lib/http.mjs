export class HttpError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
export function requestOrigin(request) {
  // Next's proxy can normalise request.url to its internal hostname. Host is
  // browser-controlled by the destination, unlike an arbitrary forwarded host.
  const url = new URL(request.url);
  const host = request.headers.get("host") || url.host;
  if (!/^[a-z0-9.:[\]-]+$/i.test(host))
    throw new HttpError("Invalid request host", 400);
  return (process.env.VERCEL ? "https:" : url.protocol) + "//" + host;
}
export async function readJson(request, limit = 65536) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== requestOrigin(request))
    throw new HttpError("Request origin not allowed", 403);
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new HttpError("JSON body required", 415);
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError("Request body required");
  let size = 0;
  const chunks = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      throw new HttpError("Request is too large", 413);
    }
    chunks.push(value);
  }
  let body;
  try {
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError("Invalid JSON");
  }
  if (!body || Array.isArray(body) || typeof body !== "object")
    throw new HttpError("JSON object required");
  return body;
}
export const privateJson = (data, status = 200) =>
  Response.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
export const errorJson = (error) =>
  privateJson(
    {
      error:
        error instanceof HttpError
          ? error.message
          : "The request could not be completed.",
    },
    error instanceof HttpError ? error.status : 500,
  );

export async function readRaw(request,limit=100000){const reader=request.body?.getReader();if(!reader)throw new HttpError('Body required');const chunks=[];let size=0;while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit){await reader.cancel();throw new HttpError('Body too large',413);}chunks.push(value);}return Buffer.concat(chunks).toString('utf8');}
