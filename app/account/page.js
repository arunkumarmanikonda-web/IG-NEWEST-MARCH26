import {portalReturn} from "../../lib/portal-return.mjs";
import { recentUpdates } from "../../lib/practice-updates.mjs";
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
  const returnTo=portalReturn((await searchParams)?.next);
  const release=await currentPolicies();
  if (!release && !policiesAccepted) return <PolicyUnavailable/>;
  const policyVersion=release?.version;
  const destination = accountDestination(profile, signInStatus);
  if ((await searchParams)?.profile !== "1" && ["/admin", "/login/verify", "/account/security"].includes(destination)) redirect(destination);
  if (returnTo && policiesAccepted && destination==="/account" && profile.status==="active") redirect(returnTo);
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
  const {data:mandates,error:mandateError}=policiesAccepted && !profile.must_change_password ? await client.rpc("ig_retail_dashboard") : {};
  const preferences = policiesAccepted ? await client.from("ig_consents").select("granted,practices")
    .eq("user_id",user.id).eq("purpose","personalisation").order("created_at",{ascending:false}).order("id",{ascending:false}).limit(1).maybeSingle() : {};
  const updates = preferences.data?.granted ? await recentUpdates(client,preferences.data.practices || []) : [];
  return (
    <main id="main" className="auth-page account-dashboard">
      <div>
        <nav className="journey-dashboard-nav" aria-label="Your work"><Link href="/shortlist">Saved listings & comparison</Link><Link href="/account/enquiries">Enquiries & follow-up</Link><Link href="/account/nda">NDAs & access requests</Link><Link href="/account/procurement">Procurement requests</Link></nav>
        <Account returnTo={returnTo} profile={profile} email={user.email} policyVersion={policyVersion} policiesAccepted={policiesAccepted} pendingInvitation={signInStatus?.pending_invitation} />
        {mandateError && <p role="alert">Your retail mandates could not be loaded. Refresh to retry.</p>}
        {!!mandates?.length && <section className="shared-rooms"><h2>Your retail mandates</h2>{mandates.map(m=><article className="workspace-card" key={m.room_id}><h3>{m.title}</h3><p>{m.side}</p>{m.room_open?<Link href={"/account/data-rooms/"+m.room_id}>Open mandate room →</Link>:<p>Your mandate is on your dashboard. The team controls document access.</p>}</article>)}</section>}
        {updates.length > 0 && <section className="shared-rooms">
          <h2>Latest from your selected practices</h2>
          {updates.slice(0,6).map(item=><Link key={item.id} className="workspace-card" href={item.path}><strong>{item.title}</strong><p>{item.summary}</p></Link>)}
          <Link href="/account/preferences">Edit your interests</Link>
        </section>}
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
