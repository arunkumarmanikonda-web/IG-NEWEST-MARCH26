import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { cache } from 'react';
import { CAREER_SETTINGS_DEFAULTS } from './careers.mjs';

export const readPublicCareers = cache(async function () {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return { settings: { ...CAREER_SETTINGS_DEFAULTS }, jobs: [] };
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (u, options) => fetch(u, { ...options, cache: 'no-store' }) } });
  const { data, error } = await client.rpc('ig_careers_public');
  if (error || !data) throw new Error('Careers information is temporarily unavailable. Please try again shortly.');
  return data;
});
