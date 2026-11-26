import 'server-only';
import { accountContext } from './supabase/server';
import { HttpError } from './http.mjs';

export async function careersAdminContext() {
  const ctx = await accountContext();
  if (!ctx.user || ctx.profile?.status !== 'active' || ctx.profile.must_change_password || !ctx.staffVerified || !ctx.policiesAccepted || !ctx.profile.roles?.some(role => ['owner', 'administrator'].includes(role))) throw new HttpError('Verified administrator access is required for Careers.', 403);
  return ctx;
}
export async function careersAdminRpc(client, p) {
  const { data, error } = await client.rpc('ig_careers_admin', { p });
  if (error) throw new HttpError(error.code === '42501' ? 'Verified administrator access is required for Careers.' : error.message, error.code === '42501' ? 403 : ['40001', '23505'].includes(error.code) ? 409 : error.code === 'P0002' ? 404 : 400);
  return data;
}
