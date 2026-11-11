import {currentPolicies} from "../../lib/policies";
import Link from "next/link";
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
  const {version: policyVersion}=await currentPolicies();
  const { client, user, profile } = await accountContext();
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
  const { data: rooms } =
    profile.policy_version === policyVersion && !profile.must_change_password
      ? await client.rpc("ig_room_dashboard", { p: {} })
      : { data: [] };
  return (
    <main id="main" className="auth-page account-dashboard">
      <div>
        <Account profile={profile} email={user.email} policyVersion={policyVersion} />
        {rooms?.length > 0 && (
          <section className="shared-rooms">
            <div className="eyebrow">SHARED WITH YOU</div>
            <h2>Your project data rooms</h2>
            {rooms.map((r) => (
              <Link
                className="workspace-card"
                key={r.id}
                href={"/account/data-rooms/" + r.id}
              >
                <h3>{r.title}</h3>
                <p>{r.files.length} files · Open room ↗</p>
              </Link>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
