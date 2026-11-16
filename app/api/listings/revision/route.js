import { liveFeatures } from "../../../../lib/featured-listings";
import { readRegister } from "../../../../lib/registers.mjs";
import { anonymousServerClient } from "../../../../lib/runtime-config";
import { listingRevision } from "../../../../lib/listing-revision.mjs";
import { publishedWithTags } from "../../../../lib/cms";

export const dynamic = "force-dynamic";

export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  try {
    const client = anonymousServerClient();
    const [{ data, error }, features] = await Promise.all([
      readRegister(() => publishedWithTags(client, "opportunity", "id,version,published_at")),
      liveFeatures(),
    ]);
    if (!error) return Response.json({ revision: listingRevision(data, features) }, { headers });
  } catch {}
  return new Response(null, { status: 503, headers });
}
