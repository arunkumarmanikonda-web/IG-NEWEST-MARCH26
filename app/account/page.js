import { redirect } from "next/navigation";
import { accountContext } from "../../lib/supabase/server";
import Account from "./profile";
import "../portal.css";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};
export default async function AccountPage() {
  const { user, profile } = await accountContext();
  if (!user || !profile) redirect("/login");
  if (profile.status !== "active")
    return (
      <main id="main" className="auth-page">
        <div className="portal-form">
          <h1>Account unavailable</h1>
          <p>Contact hello@indiagully.com to discuss account access.</p>
        </div>
      </main>
    );
  return (
    <main id="main" className="auth-page">
      <Account profile={profile} email={user.email} />
    </main>
  );
}
