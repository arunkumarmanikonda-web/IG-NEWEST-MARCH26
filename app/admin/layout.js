import AdminNavigation from "./navigation";
import {currentPolicies} from "../../lib/policies";
import Link from "next/link";
import { redirect } from "next/navigation";
import { accountContext } from "../../lib/supabase/server";
import "../portal.css";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Staff workspace",
  robots: { index: false, follow: false },
};
export default async function AdminLayout({ children }) {
  const {version: policyVersion}=await currentPolicies();
  const { client, user, profile, aal } = await accountContext();
  if (!user || !profile) redirect("/login");
  if (profile.status !== "active" || profile.policy_version !== policyVersion)
    redirect("/account");
  if (profile.must_change_password || aal !== "aal2")
    redirect("/account/security");
  const { error } = await client.rpc("ig_admin_overview");
  if (error)
    return (
      <main id="main" className="auth-page">
        <div className="portal-form">
          <h1>Staff access required</h1>
          <p>Your account does not have an active staff assignment.</p>
          <Link href="/account">Return to account</Link>
        </div>
      </main>
    );
  return (
    <main id="main" className="workspace">
      <div className="workspace-header">
        <div>
          <div className="eyebrow">INDIA GULLY / MANAGEMENT</div>
          <h1>Management suite</h1>
        </div>
        <Link href="/account">{profile.display_name || user.email}</Link>
      </div>
      <div className="workspace-shell">
        <AdminNavigation />
        <div className="workspace-main">{children}</div>
      </div>
    </main>
  );
}
