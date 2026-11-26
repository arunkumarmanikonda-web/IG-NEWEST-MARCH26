import MobileStaffEntry from './staff-entry';
import '../../portal.css';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Staff sign-in',
  robots: { index: false, follow: false },
};

// Rendering this page never changes authentication. Only the mounted entry
// component makes the same-origin POST; there is no GET sign-out or auto-login.
export default function MobileStaffLogin() {
  return <main id="main" className="auth-page"><MobileStaffEntry /></main>;
}
