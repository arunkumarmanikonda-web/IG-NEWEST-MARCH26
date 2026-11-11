import {timingSafeEqual} from 'node:crypto';
import {dispatchEmailQueue} from '../../../../lib/delivery';
export const maxDuration = 120;
export async function POST(request) {
  const expected = process.env.EMAIL_WORKER_SECRET;
  const supplied = request.headers.get('authorization') || '';
  const suppliedBytes = Buffer.from(supplied), expectedBytes = Buffer.from('Bearer ' + (expected || ''));
  if (!expected || suppliedBytes.length !== expectedBytes.length ||
      !timingSafeEqual(suppliedBytes, expectedBytes))
    return new Response('Unauthorised', {status: 401});
  try { return Response.json(await dispatchEmailQueue(), {headers: {'Cache-Control':'no-store'}}); }
  catch { return new Response('Worker unavailable', {status: 503}); }
}
