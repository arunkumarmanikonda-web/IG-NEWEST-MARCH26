import {timingSafeEqual} from 'node:crypto';
import {dispatchProviderJobs} from '../../../../lib/provider-workflows';
import {dispatchEmailQueue} from '../../../../lib/delivery';
export const maxDuration = 120;
export async function POST(request) {
  const expected = process.env.EMAIL_WORKER_SECRET;
  const supplied = request.headers.get('authorization') || '';
  const suppliedBytes = Buffer.from(supplied), expectedBytes = Buffer.from('Bearer ' + (expected || ''));
  if (!expected || suppliedBytes.length !== expectedBytes.length ||
      !timingSafeEqual(suppliedBytes, expectedBytes))
    return new Response('Unauthorised', {status: 401});
  try { const outcomes=await Promise.allSettled([dispatchEmailQueue(),dispatchProviderJobs()]); return Response.json({email:outcomes[0].status==='fulfilled'?outcomes[0].value:{error:'Email worker unavailable'},providers:outcomes[1].status==='fulfilled'?outcomes[1].value:{error:'Provider worker unavailable'}}, {headers: {'Cache-Control':'no-store'}}); }
  catch { return new Response('Worker unavailable', {status: 503}); }
}
