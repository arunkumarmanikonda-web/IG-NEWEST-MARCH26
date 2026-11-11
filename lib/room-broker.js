import { HttpError } from "./http.mjs";
export async function roomBroker(client, payload) {
  const { data } = await client.auth.getSession();
  if (!data.session) throw new HttpError("Sign-in required", 401);
  const secret = process.env.DATAROOM_BROKER_SECRET;
  if (!secret)
    throw new HttpError("Private file delivery is not configured", 503);
  const res = await fetch(
    process.env.NEXT_PUBLIC_SUPABASE_URL + "/functions/v1/ig-room-broker",
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + data.session.access_token,
        "Content-Type": "application/json",
        "x-room-broker": secret,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(55000),
    },
  );
  if (!res.ok) {
    const result = await res.json().catch(() => ({}));
    throw new HttpError(
      result.error || "File operation unavailable",
      res.status,
    );
  }
  return res;
}
