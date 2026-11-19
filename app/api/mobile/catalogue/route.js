import { cmsConfigured, published } from '../../../../lib/cms';
import { livePractices, siteSection } from '../../../../lib/website';
import { mobileCatalogue } from '../../../../lib/mobile-catalogue.mjs';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;
const headers = { 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*', 'X-Content-Type-Options': 'nosniff' };
export async function GET() {
  try {
    if (!cmsConfigured()) throw new Error('Public catalogue is not configured');
    const [records, practices, collections, residences] = await Promise.all([
      published(['opportunity', 'retail_space', 'retail_requirement', 'product', 'article']),
      livePractices(), siteSection('horeca-collections'), siteSection('residences-launch'),
    ]);
    return Response.json(mobileCatalogue({ records, practices, collections, residences }), { headers });
  } catch {
    return Response.json({ error: 'India Gully’s catalogue is temporarily unavailable. Please try again shortly.' }, { status: 503, headers });
  }
}
