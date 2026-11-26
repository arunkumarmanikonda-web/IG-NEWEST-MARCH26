import { createHmac } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { readPublicCareers } from '../../../lib/careers-data';
import { validateCareerApplication } from '../../../lib/careers.mjs';
import { readJson, privateJson, errorJson, HttpError } from '../../../lib/http.mjs';

export const dynamic = 'force-dynamic';
export async function GET() {
  try { return privateJson(await readPublicCareers()); } catch { return errorJson(new HttpError('Careers information is temporarily unavailable. Please try again shortly.', 503)); }
}
export async function POST(request) {
  try {
    const payload = validateCareerApplication(await readJson(request, 2_850_000));
    const secret = process.env.ENQUIRY_INGEST_SECRET, url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!secret || !url || !key) throw new HttpError('Applications are temporarily unavailable. Please try again shortly.', 503);
    const ip = process.env.VERCEL ? request.headers.get('x-vercel-forwarded-for') || 'unknown' : 'local-preview';
    payload.rate_key = createHmac('sha256', secret).update(new Date().toISOString().slice(0, 10) + '|' + ip).digest('hex');
    const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await client.rpc('ig_careers_apply', { secret, p: payload });
    if (error) {
      if (error.code === 'P0429') throw new HttpError('Please wait before submitting another application.', 429);
      if (error.code === 'P0002') throw new HttpError('This role is no longer accepting applications.', 409);
      if (error.code === '23505') throw new HttpError('This application reference was already used. Refresh the page to begin another application.', 409);
      throw new HttpError('Your application could not be saved. Please try again shortly.', 503);
    }
    return privateJson({ ok: true, ...data });
  } catch (error) { return errorJson(error); }
}
