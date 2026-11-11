import {providerCredentialPresence} from '../../../lib/provider-credentials.mjs';
import ProviderStudio from "../provider-studio";
import PaymentsManager from "../payments-manager";
import ClientsManager from "../clients-manager";
import AIManager from "../ai-manager";
import SettingsManager from "../settings-manager";
import PrivacyRequests from "../../account/privacy/requests";
import {currentPolicies} from "../../../lib/policies";
import Link from "next/link";
import RoomsManager from "../rooms-manager";
import NdaManager from "../nda-manager";
import { notFound } from "next/navigation";
import { accountContext } from "../../../lib/supabase/server";
import { TaxonomyManager, UserManager, EnquiryManager } from "../managers";
const date = (value) =>
  new Date(value).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
export default async function Module({ params, searchParams }) {
  const { module } = await params,
    { client, profile } = await accountContext();
  if(module==='creative') {
    const {data,error}=await client.from('ig_provider_jobs').select('*').order('created_at',{ascending:false}).limit(50);
    const smsAllowed=profile.roles.includes('owner');let template='';
    if(smsAllowed){const config=await client.rpc('ig_config_list');template=config.data?.find(c=>c.id==='fast2sms')?.settings?.template_text||'';}
    return error?<p>Creative operations are temporarily unavailable.</p>:<ProviderStudio jobs={data||[]} smsAllowed={smsAllowed} template={template}/>;
  }
  if(module==='ai') {const {data,error}=await client.from('ig_ai_jobs').select('*').order('created_at',{ascending:false}).limit(50);return error?<p>AI drafting requires practice content permissions.</p>:<AIManager jobs={data||[]}/>;}
  if(module==='clients') {
    const tables=['ig_clients','ig_client_contacts','ig_engagements','ig_data_rooms'];
    const r=await Promise.all(tables.map(t=>client.from(t).select('*').order('created_at',{ascending:false}).limit(1000)));
    if(r.some(x=>x.error))return <p role="alert">Client records are unavailable. Check your practice permissions.</p>;
    return <ClientsManager clients={r[0].data} contacts={r[1].data} engagements={r[2].data} rooms={r[3].data} roomAdmin={profile.roles.some(x=>['owner','administrator'].includes(x))}/>;
  }
  if(module==='payments'){const [{data:users,error:ue},{data,error}]=await Promise.all([client.rpc('ig_admin_users'),client.from('ig_payment_requests').select('*').order('created_at',{ascending:false}).limit(250)]);return error||ue?<p>Payment administration requires administrator access.</p>:<PaymentsManager items={data||[]} users={users.users}/>;}
  if(module==='settings') {const [{data,error},release]=await Promise.all([client.rpc('ig_config_list'),currentPolicies()]);return error?<p>Super-user access is required.</p>:<SettingsManager configs={data.map(c=>({...c,environment_fields:providerCredentialPresence(c.id,process.env)}))} release={release}/>;}
  if(module==='privacy') {if(!profile.roles.includes('owner'))return <p>Super-user access is required.</p>;const {data,error}=await client.from('ig_privacy_requests').select('*').order('created_at',{ascending:false}).limit(250);return error?<p>Register unavailable.</p>:<PrivacyRequests items={data||[]} admin/>;}
  if (module === "data-rooms") {
    if (!profile.roles.some((x) => ["owner", "administrator"].includes(x)))
      return <p>Data rooms require owner or administrator access.</p>;
    const tables = [
      "ig_data_rooms",
      "ig_room_files",
      "ig_room_folders",
      "ig_room_grants",
      "ig_room_file_rules",
      "ig_nda_requests",
      "ig_engagements",
      "ig_client_contacts",
    ];
    const results = await Promise.all(
      tables.map((t) => client.from(t).select("*").limit(2000)),
    );
    const { data: opportunities, error } = await client
      .from("ig_content")
      .select("id,title")
      .eq("kind", "opportunity");
    if (error || results.some((r) => r.error))
      return (
        <p role="alert">Data room administration is temporarily unavailable.</p>
      );
    return (
      <RoomsManager
        rooms={results[0].data}
        files={results[1].data}
        folders={results[2].data}
        grants={results[3].data}
        rules={results[4].data}
        requests={results[5].data}
        engagements={results[6].data}
        contacts={results[7].data}
        initialRoom={(await searchParams)?.room}
        opportunities={opportunities || []}
      />
    );
  }
  if (module === "nda") {
    const [{ data: requests, error }, { data: templates, error: te }] =
      await Promise.all([
        client
          .from("ig_nda_requests")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(250),
        client
          .from("ig_nda_templates")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);
    if (error || te) return <p role="alert">NDA records unavailable.</p>;
    return (
      <NdaManager
        requests={requests || []}
        templates={templates || []}
        isOwner={profile.roles.includes("owner")}
      />
    );
  }
  if (module === "content") {
    const { data, error } = await client
      .from("ig_content")
      .select("id,kind,title,status,version,published_version,updated_at")
      .order("updated_at", { ascending: false })
      .limit(250);
    if (error)
      return <p role="alert">Content is not available to this account.</p>;
    return (
      <section className="workspace-card">
        <div className="workspace-actions">
          <Link className="primary" href="/admin/content/new">
            Create content
          </Link>
        </div>
        <h2>Content & listings</h2>
        <p>
          Up to 250 latest records. Saving a new draft leaves the last published
          revision visible until you publish or archive it.
        </p>
        <div className="table-scroll">
          <table className="workspace-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>State</th>
                <th>Revision</th>
                <th>Updated · IST</th>
              </tr>
            </thead>
            <tbody>
              {(data || []).map((x) => (
                <tr key={x.id}>
                  <td>
                    <Link href={"/admin/content/" + x.id}>{x.title}</Link>
                  </td>
                  <td>{x.kind}</td>
                  <td>{x.status}</td>
                  <td>
                    {x.version}{" "}
                    {x.published_version &&
                      "(published " + x.published_version + ")"}
                  </td>
                  <td>{date(x.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!data?.length && (
          <p className="workspace-empty">
            No content available. Create your first draft.
          </p>
        )}
      </section>
    );
  }
  if (module === "taxonomy") {
    const { data, error } = await client
      .from("ig_taxonomy")
      .select("*")
      .order("dimension")
      .order("label");
    return error ? (
      <p>Categories unavailable.</p>
    ) : (
      <TaxonomyManager items={data || []} />
    );
  }
  if (module === "users") {
    const { data, error } = await client.rpc("ig_admin_users");
    return error ? (
      <p role="alert">
        User administration requires an owner or administrator role and MFA.
      </p>
    ) : (
      <UserManager
        users={data.users}
        invitations={data.invitations}
        isOwner={profile.roles.includes("owner")}
      />
    );
  }
  if (module === "enquiries") {
    const [{ data, error }, { data: outbox }] = await Promise.all([
      client
        .from("ig_enquiries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(250),
      client
        .from("ig_outbox")
        .select("id,enquiry_id,recipient,kind,status,attempts")
        .order("created_at", { ascending: false })
        .limit(1000),
    ]);
    return error ? (
      <p>Enquiry access requires owner, administrator or sales permissions.</p>
    ) : (
      <EnquiryManager items={data || []} outbox={outbox || []} />
    );
  }
  if (module === "audit") {
    const { data, error } = await client
      .from("ig_audit")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(250);
    return (
      <section className="workspace-card">
        <h2>Audit trail</h2>
        <p>
          Latest 250 events. Records cannot be edited through the application.
        </p>
        {error ? (
          <p>
            Audit access requires owner, administrator or auditor permissions.
          </p>
        ) : (
          <div className="table-scroll">
            <table className="workspace-table">
              <thead>
                <tr>
                  <th>Time · IST</th>
                  <th>Action</th>
                  <th>Actor</th>
                  <th>Record</th>
                </tr>
              </thead>
              <tbody>
                {data?.map((x) => (
                  <tr key={x.id}>
                    <td>{date(x.created_at)}</td>
                    <td>{x.action}</td>
                    <td>{x.actor_id || "System"}</td>
                    <td>{x.entity_id || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    );
  }
  if (module === "automation")
    return (
      <section className="workspace-card">
        <h2>Automation readiness</h2>
        <p>
          Only verified integrations are shown as active. No campaigns or
          messages are sent from this screen.
        </p>
        <table className="workspace-table">
          <thead>
            <tr>
              <th>Capability</th>
              <th>Current state</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Database, accounts & MFA", "Connected to Supabase"],
              [
                "Content revision & publication",
                "Active, permission controlled",
              ],
              ["Consent preferences & audit", "Active"],
              [
                "Resend transactional delivery",
                "Resend is verified in preview: enquiry acknowledgements and internal notifications delivered; signed delivery events and recovery schedule active",
              ],
              ["Google Workspace user mail", "Awaiting per-user OAuth integration"],
              ["HORECA procurement engine", "Service pages and database product publishing available; RFQ/BOQ, vendor comparison, stock and fulfilment engine not complete."],
              ["PMC delivery engine", "Service pages, engagement records and private reports available; programme, budget, variations, RFI and site-progress registers not complete."],
              [
                "OpenAI / creative generation",
                "OpenAI editorial, SEO and advertising drafts; Runway image/video jobs, private storage and review controls implemented. Provider API keys and live workflow acceptance remain pending.",
              ],
              ["SMS / Fast2SMS", "DLT service-message queue, recipient permission reference and daily limits implemented. API key, approved DLT details and handset-delivery acceptance remain pending."],
              [
                "NDA signing & data rooms",
                "Project NDA requests, versioned acceptance, private rooms, watermarked previews and file permissions; legal template approval pending",
              ],
              [
                "Marketing & remarketing",
                "Consent capture active; campaign delivery not activated",
              ],
              [
                "Payments, inventory & Vyapar",
                "Razorpay sandbox checkout verified; payment/refund reconciliation and capture audit available. Live activation, Vyapar sync and full inventory/store remain pending.",
              ],
            ].map(([a, b]) => (
              <tr key={a}>
                <td>{a}</td>
                <td>{b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    );
  notFound();
}
