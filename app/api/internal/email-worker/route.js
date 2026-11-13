import {timingSafeEqual} from 'node:crypto';
import {dispatchCampaignQueue} from '../../../../lib/campaign-delivery';
import {dispatchProviderJobs} from '../../../../lib/provider-workflows';
import {dispatchEmailQueue} from '../../../../lib/delivery';
import {reconcileCollections} from '../../../../lib/collection-reconciliation';
export const maxDuration = 120;
export async function POST(request) {
  const expected = process.env.EMAIL_WORKER_SECRET;
  const supplied = request.headers.get('authorization') || '';
  const suppliedBytes = Buffer.from(supplied), expectedBytes = Buffer.from('Bearer ' + (expected || ''));
  if (!expected || suppliedBytes.length !== expectedBytes.length ||
      !timingSafeEqual(suppliedBytes, expectedBytes))
    return new Response('Unauthorised', {status: 401});
  try { const outcomes=await Promise.allSettled([dispatchEmailQueue(),dispatchProviderJobs(),dispatchCampaignQueue(),reconcileCollections()]); return Response.json({email:outcomes[0].status==='fulfilled'?outcomes[0].value:{error:'Email worker unavailable'},campaigns:outcomes[2].status==='fulfilled'?outcomes[2].value:{error:'Campaign worker unavailable'},providers:outcomes[1].status==='fulfilled'?outcomes[1].value:{error:'Provider worker unavailable'},collections:outcomes[3].status==='fulfilled'?outcomes[3].value:{error:'Collection checks unavailable'}}, {headers: {'Cache-Control':'no-store'}}); }
  catch { return new Response('Worker unavailable', {status: 503}); }
}
