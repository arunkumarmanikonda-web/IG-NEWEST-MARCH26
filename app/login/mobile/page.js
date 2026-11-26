import MobileStaffEntry from './staff-entry';
import '../../portal.css';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'App sign-in',
  robots: { index: false, follow: false },
};

// Rendering this page never changes authentication. Only the mounted entry
// component makes the same-origin POST; there is no GET sign-out or auto-login.
export default async function MobileStaffLogin({ searchParams }) {
  const audience = (await searchParams)?.audience === 'client' ? 'client' : 'staff';
  return <main id="main" className="auth-page"><MobileStaffEntry key={audience} audience={audience} /></main>;
}
