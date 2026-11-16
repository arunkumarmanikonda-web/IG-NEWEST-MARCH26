import { readRegister } from "../../../../lib/registers.mjs";
import { anonymousServerClient } from "../../../../lib/runtime-config";
import { listingRevision } from "../../../../lib/listing-revision.mjs";

export const dynamic = "force-dynamic";

export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  try {
    const client = anonymousServerClient();
    const { data, error } = await readRegister(() => client.from("ig_public_content")
      .select("id,version,published_at").eq("kind", "opportunity"));
    if (!error) return Response.json({ revision: listingRevision(data) }, { headers });
  } catch {}
  return new Response(null, { status: 503, headers });
}
