import PolicyUnavailable from '../policy-unavailable';
import {currentPolicies} from "../../lib/policies";
import Link from "next/link";
import { redirect } from "next/navigation";
import { accountContext } from "../../lib/supabase/server";
import Account from "./profile";
import { accountDestination } from "../../lib/sign-in.mjs";
import "../portal.css";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};
export default async function AccountPage({ searchParams }) {
  const { client, user, profile, signInStatus, policiesAccepted } = await accountContext();
  if (!user || !profile) redirect("/login");
  const release=await currentPolicies();
  if (!release && !policiesAccepted) return <PolicyUnavailable/>;
  const policyVersion=release?.version;
  const destination = accountDestination(profile, signInStatus);
  if ((await searchParams)?.profile !== "1" && ["/admin", "/login/verify", "/account/security"].includes(destination)) redirect(destination);
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
    policiesAccepted && !profile.must_change_password
      ? await client.rpc("ig_room_dashboard", { p: {} })
      : { data: [] };
  return (
    <main id="main" className="auth-page account-dashboard">
      <div>
        <Account profile={profile} email={user.email} policyVersion={policyVersion} policiesAccepted={policiesAccepted} pendingInvitation={signInStatus?.pending_invitation} />
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
