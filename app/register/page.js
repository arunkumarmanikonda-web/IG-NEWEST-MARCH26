import {currentPolicies} from '../../lib/policies';
import PolicyUnavailable from '../policy-unavailable';
import AuthForm from "../login/auth-form";
import "../portal.css";
export const metadata = {
  title: "Register",
  robots: { index: false, follow: false },
};
export default async function Register() {
  if (!await currentPolicies()) return <PolicyUnavailable/>;
  return (
    <main id="main" className="auth-page">
      <AuthForm register />
    </main>
  );
}
