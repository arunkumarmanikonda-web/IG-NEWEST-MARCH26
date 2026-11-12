import ProcurementManager from '../procurement-manager';
import MediaLibrary from "../media-library";
import OperationsWorkspace from "../operations/workspace";
import ContentRegister from "../content-register";
import IntakeStudio from "../intake-studio";
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
  if(module==='procurement'){
    const r=await Promise.all([client.from('ig_procurement_requests').select('*').order('created_at',{ascending:false}).limit(500),client.from('ig_operations').select('*').in('kind',['vendor','rfq']).eq('archived',false).limit(2000),client.from('ig_vendor_contacts').select('*').limit(1000),client.from('ig_vendor_assignments').select('*').order('created_at',{ascending:false}).limit(1000)]);
    if(r.some(x=>x.error))return <p role="alert">Procurement portal records could not be loaded.</p>;
    return <ProcurementManager requests={r[0].data} vendors={r[1].data.filter(x=>x.kind==='vendor'&&x.status==='active')} rfqs={r[1].data.filter(x=>x.kind==='rfq'&&x.status==='open')} contacts={r[2].data} assignments={r[3].data}/>;
  }
  if (['horeca','pmc'].includes(module)) {
    const practice=module==='horeca'?'horeca':'hospitality';
    const r=await Promise.all([client.from('ig_operations').select('*').eq('practice',practice).order('updated_at',{ascending:false}).limit(2000),client.rpc('ig_client_directory'),client.from('ig_engagements').select('*').eq('active',true).limit(1000),client.from('ig_content').select('id,title,public_data').eq('kind','product').limit(1000)]);
    if(r.some(x=>x.error))return <p role="alert">Operational records could not be loaded. Check your assigned practice rights.</p>;
    return <OperationsWorkspace mode={module} practice={practice} records={r[0].data} clients={r[1].data} engagements={r[2].data} products={r[3].data}/>;
  }
  if (module==='intake') return <IntakeStudio/>;
  if (['cms','listings','catalogue','projects','content'].includes(module)) {
    let query=client.from('ig_content').select('id,kind,practice,title,status,version,published_version,public_data,updated_at').order('updated_at',{ascending:false}).limit(1000);
    if(module==='listings')query=query.eq('kind','opportunity');
    else if(module==='catalogue')query=query.eq('kind','product');
    else if(module==='projects')query=query.eq('kind','project');
    else query=query.in('kind',['page','practice','article','person','faq']);
    const {data,error}=await query;
    return error?<p role="alert">Your permissions do not allow these records.</p>:<ContentRegister module={module==='content'?'cms':module} items={data||[]}/>;
  }
  if(module==='creative') {
    const {data,error}=await client.from('ig_provider_jobs').select('*').order('created_at',{ascending:false}).limit(50);
    const smsAllowed=profile.roles.includes('owner');let template='';
    if(smsAllowed){const config=await client.rpc('ig_config_list');template=config.data?.find(c=>c.id==='fast2sms')?.settings?.template_text||'';}
    const {data:media}=await client.from('ig_source_media').select('*').order('created_at',{ascending:false}).limit(100);
    return error?<p>Creative operations are temporarily unavailable.</p>:<><MediaLibrary assets={media||[]}/><ProviderStudio jobs={data||[]} smsAllowed={smsAllowed} template={template} sourceMedia={media||[]}/></>;
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
    const roomSearch=await searchParams;
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
        initialRoom={roomSearch?.room || results[0].data.find(r=>r.engagement_id===roomSearch?.engagement)?.id}
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
              ["HORECA procurement engine", "Dedicated SKU catalogue, CSV imports, RFQ schedules, vendor comparison, purchase-order awards, receipts, dispatches, returns and delivery acknowledgement."],
              ["PMC delivery engine", "Dedicated projects, dependency programmes, approved budgets, variations, measured progress, RFIs, risks and client engagement links."],
              [
                "OpenAI / creative generation",
                "OpenAI source-assisted drafts and SEO; Runway image/video jobs and approved reference-image adaptation. Private media preparation, evidence review and publication controls. Check provider job results for live acceptance.",
              ],
              ["SMS / Fast2SMS", "Deferred by owner. Email OTP remains the default. SMS is disabled until DLT approval and delivery acceptance."],
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
                "Razorpay sandbox checkout verified; payment/refund reconciliation and capture audit available. Live activation and Vyapar sync remain pending; operational procurement inventory is available.",
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
