import { redirect } from 'next/navigation';
import { accountContext } from '../../../lib/supabase/server';
import { accountDestination, isStaff } from '../../../lib/sign-in.mjs';
import { authenticatorFactors } from '../../../lib/auth-factors.mjs';
import VerificationChoice from './verification-choice';
import '../../portal.css';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Verify your sign-in', robots: { index: false, follow: false } };
export default async function VerificationPage() {
  const { client, user, profile, signInStatus } = await accountContext();
  if (!user || !profile) redirect('/login');
  const destination = accountDestination(profile, signInStatus);
  if (destination !== '/login/verify') redirect(destination);
  const { data } = await client.auth.mfa.listFactors();
  const factors = authenticatorFactors(data).filter(factor => factor.status === 'verified');
  return <main id="main" className="auth-page"><VerificationChoice email={user.email} factors={factors} /></main>;
}
