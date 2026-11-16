import {portalReturn} from "../../../lib/portal-return.mjs";
import VerifyForm from './verify-form';
import '../../portal.css';
export const metadata = { title: 'Verify your email', robots: { index: false, follow: false } };
export default async function Page({ searchParams }) {
  const { purpose,next } = await searchParams;
  return <main id="main" className="auth-page"><VerifyForm returnTo={portalReturn(next)} purpose={['recovery','login'].includes(purpose) ? purpose : 'email'} /></main>;
}
