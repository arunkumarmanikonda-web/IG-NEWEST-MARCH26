import VerifyForm from './verify-form';
import '../../portal.css';
export const metadata = { title: 'Verify your email', robots: { index: false, follow: false } };
export default async function Page({ searchParams }) {
  const { purpose } = await searchParams;
  return <main id="main" className="auth-page"><VerifyForm purpose={purpose === 'recovery' ? 'recovery' : 'email'} /></main>;
}
