import { redirect } from "next/navigation";
import Link from "next/link";
import { accountContext } from "../../../lib/supabase/server";
import { published } from "../../../lib/cms";
import ProjectRequest from "./project";
import AuthForm from "../../login/auth-form";
import PolicyUnavailable from "../../policy-unavailable";
import { currentPolicies } from "../../../lib/policies";
import NdaAccount from "./requests";
import "../../portal.css";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "My NDA & information requests",
  robots: { index: false, follow: false },
};
export default async function Page({ searchParams }) {
  const query = await searchParams;
  const { client, user, profile, policiesAccepted } = await accountContext();
  const kind=query.project?"project":"opportunity";
  const slug=typeof query[kind]==="string"?query[kind]:"";
  const destination="/account/nda?"+kind+"="+encodeURIComponent(slug);
  const options=await client.rpc("ig_room_listing_slugs",{content_kind:kind});
  if(options.error) return <main className="auth-page"><p role="alert">Project access is temporarily unavailable.</p></main>;
  if(slug && !options.data.includes(slug)) return <main className="auth-page"><div className="portal-form"><h1>Data Room Unavailable</h1><p>This property currently has no active data room.</p><Link href="/opportunities">Return to real estate listings</Link></div></main>;
  if(!user && slug) {
    const item=(await published(kind))?.find(x=>x.slug===slug);
    if(!item || !await currentPolicies()) return <PolicyUnavailable/>;
    return <main id="main" className="auth-page"><AuthForm register returnTo={destination} projectTitle={item.title}/></main>;
  }
  if(!user || !profile) redirect("/login");
  if(profile.status!=="active" || !policiesAccepted) redirect("/account"+(slug?"?next="+encodeURIComponent(destination):""));
  const [{ data: requests, error }, { data: templates, error: te }, items] =
    await Promise.all([
      client
        .from("ig_nda_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      client.from("ig_nda_templates").select("*").eq("status", "active"),
      published(kind),
    ]);
  const projects=(items||[]).filter(item=>options.data.includes(item.slug));
  if(slug) {
    const item=projects.find(x=>x.slug===slug);
    const identities=await client.from("ig_legal_entities").select("*").eq("user_id",user.id).order("consent_at");
    return <main id="main" className="auth-page"><div className="nda-account">
      <Link href={(kind==="project"?"/our-work/":"/opportunities/")+slug}>← Back to listing</Link>
      {error||te||identities.error||!item?<p role="alert">This request could not be loaded. Try again.</p>:
        <ProjectRequest item={{title:item.title,slug,kind}} template={templates.find(t=>t.content_id===item.id)||null}
          request={requests.find(r=>r.content_id===item.id)} entities={identities.data} offline={!!process.env.UIDAI_OFFLINE_SIGNING_CERT}/>}
    </div></main>;
  }
  const showcaseRooms=await client.rpc("ig_room_listing_slugs",{content_kind:"project"});
  if(showcaseRooms.error) throw new Error("Project rooms are temporarily unavailable");
  const showcases=(await published("project")||[]).filter(x=>showcaseRooms.data.includes(x.slug));
  const allRooms=[...projects,...showcases];
  return (
    <main id="main" className="auth-page">
      <div className="nda-account">
        <Link href="/account">← Your account</Link>
        <h1>Confidential information.</h1>
        <p>Your requests, agreements and disclosure decisions in one place.</p>
        {error || te ? (
          <p role="alert">
            Requests are temporarily unavailable. Please try again.
          </p>
        ) : (
          <><h2>Request a Project Data Room</h2>{allRooms.map(x=><p key={x.id}><Link className="text-link" href={"/account/nda?"+x.kind+"="+x.slug}>{x.title} →</Link></p>)}<NdaAccount
            requests={requests || []}
            template={templates?.find(t=>!t.content_id) || null}
            opportunities={(items || []).filter(x=>!options.data.includes(x.slug)).map((x) => ({
              slug: x.slug,
              title: x.title,
            }))}
            selected={query.opportunity || ""}
            profile={profile}
            roomProjects={allRooms.map(x=>({id:x.id,slug:x.slug,kind:x.kind}))}
          /></>
        )}
      </div>
    </main>
  );
}
