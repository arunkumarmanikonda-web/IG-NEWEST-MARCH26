import AuthForm from "./auth-form";
import "../portal.css";
export const metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};
export default function Login() {
  return (
    <main id="main" className="auth-page">
      <AuthForm />
    </main>
  );
}
