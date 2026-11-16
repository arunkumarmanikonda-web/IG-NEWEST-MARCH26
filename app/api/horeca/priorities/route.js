import { featuredProducts } from "../../../../lib/featured-products";

export const dynamic = "force-dynamic";

export async function GET() {
  const { revision } = await featuredProducts();
  return Response.json({ revision }, { headers: { "Cache-Control": "no-store" } });
}
