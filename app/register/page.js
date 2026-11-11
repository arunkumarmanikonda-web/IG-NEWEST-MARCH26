import AuthForm from "../login/auth-form";
import "../portal.css";
export const metadata = {
  title: "Register",
  robots: { index: false, follow: false },
};
export default function Register() {
  return (
    <main id="main" className="auth-page">
      <AuthForm register />
    </main>
  );
}
