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
  const { client, user, profile, aal } = await accountContext();
  if (!user || !profile) redirect("/login");
  if (profile.status !== "active" || profile.policy_version !== "2026-11-11")
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
          <h1>Operating workspace</h1>
        </div>
        <Link href="/account">{profile.display_name || user.email}</Link>
      </div>
      <div className="workspace-shell">
        <nav className="workspace-nav" aria-label="Staff workspace">
          {[
            ["", "Overview"],
            ["content", "Content & listings"],
            ["taxonomy", "Categories & tags"],
            ["users", "Users & invitations"],
            ["enquiries", "Enquiries"],
            ["nda", "NDA & access requests"],
            ["data-rooms", "Project data rooms"],
            ["audit", "Audit trail"],
            ["automation", "AI & automation"],
          ].map(([p, label]) => (
            <Link key={p} href={"/admin" + (p ? "/" + p : "")}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="workspace-main">{children}</div>
      </div>
    </main>
  );
}
