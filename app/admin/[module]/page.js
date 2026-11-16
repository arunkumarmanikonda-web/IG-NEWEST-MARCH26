import { published } from "../../../lib/cms";
import IdentityReviews from "../identity-reviews";
import { readRegister } from "../../../lib/registers.mjs";
import { siteRecordSlugs } from "../../../lib/site-cms-records.mjs";
import ProcurementManager from "../procurement-manager";
import MediaLibrary from "../media-library";
import OperationsWorkspace from "../operations/workspace";
import ContentRegister from "../content-register";
import IntakeStudio from "../intake-studio";
import { providerCredentialPresence } from "../../../lib/provider-credentials.mjs";
import ProviderStudio from "../provider-studio";
import PaymentsManager from "../payments-manager";
import ClientsManager from "../clients-manager";
import AIManager from "../ai-manager";
import SettingsManager from "../settings-manager";
import PrivacyRequests from "../../account/privacy/requests";
import { currentPolicies } from "../../../lib/policies";
import Link from "next/link";
import RoomsManager from "../rooms-manager";
import NdaManager from "../nda-manager";
import { isCirpProject } from "../../../lib/project-nda.mjs";
import { notFound, redirect } from "next/navigation";
import { accountContext } from "../../../lib/supabase/server";
import { TaxonomyManager, UserManager, EnquiryManager } from "../managers";
const date = (value) =>
  new Date(value).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
export default async function Module({ params, searchParams }) {
  const { module } = await params,
    { client, profile } = await accountContext();
  if (!profile) redirect("/login");
  if (module === "procurement") {
    const r = await Promise.all([
      readRegister(() => client.from("ig_procurement_requests").select("*"), "created_at"),
      readRegister(() => client.from("ig_operations").select("*").in("kind", ["vendor", "rfq"]).eq("archived", false)),
      readRegister(() => client.from("ig_vendor_contacts").select("*")),
      readRegister(() => client.from("ig_vendor_assignments").select("*"), "created_at"),
    ]);
    if (r.some((x) => x.error))
      return (
        <p role="alert">Procurement portal records could not be loaded.</p>
      );
    return (
      <ProcurementManager
        requests={r[0].data}
        vendors={r[1].data.filter(
          (x) => x.kind === "vendor" && x.status === "active",
        )}
        rfqs={r[1].data.filter((x) => x.kind === "rfq" && x.status === "open")}
        contacts={r[2].data}
        assignments={r[3].data}
      />
    );
  }
  if (["horeca", "pmc"].includes(module)) {
    const practice = module === "horeca" ? "horeca" : "hospitality";
    const r = await Promise.all([
      readRegister(() => client.from("ig_operations").select("*").eq("practice", practice), "updated_at"),
      client.rpc("ig_client_directory"),
      readRegister(() => client.from("ig_engagements").select("*").eq("active", true)),
      readRegister(() => client.from("ig_content").select("id,title,public_data").eq("kind", "product")
        .is("deleted_at", null).neq("status", "archived")),
    ]);
    if (r.some((x) => x.error))
      return (
        <p role="alert">
          Operational records could not be loaded. Check your assigned practice
          rights.
        </p>
      );
    return (
      <OperationsWorkspace
        mode={module}
        practice={practice}
        records={r[0].data}
        clients={r[1].data}
        engagements={r[2].data}
        products={r[3].data}
      />
    );
  }
  if (module === "intake") return <IntakeStudio />;
  if (
    ["cms", "listings", "catalogue", "projects", "content"].includes(module)
  ) {
    const kinds = {
      listings: ["opportunity"], catalogue: ["product"], projects: ["project"],
      cms: ["page", "practice", "article", "person", "faq"],
    };
    const register = module === "content" ? "cms" : module;
    const { data, error } = await readRegister(() => client.from("ig_content").select(
      "id,kind,slug,practice,title,status,version,public_data,updated_at,deleted_at,ig_public_content(version)"
    ).in("kind", kinds[register]), "updated_at");
    if (error) return <p role="alert">The publishing register could not be loaded. Refresh to retry.</p>;
    const items = data.filter(row => row.kind !== "page" || !siteRecordSlugs.includes(row.slug))
      .map(({ig_public_content: snapshot, ...row}) => ({
        ...row, live_version: snapshot?.version ?? snapshot?.[0]?.version ?? null,
      }));
    return <ContentRegister module={register} items={items}/>;
  }
  if (module === "creative") {
    const { data, error } = await client
      .from("ig_provider_jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    const smsAllowed = profile.roles.includes("owner");
    let template = "";
    if (smsAllowed) {
      const config = await client.rpc("ig_config_list");
      template =
        config.data?.find((c) => c.id === "fast2sms")?.settings
          ?.template_text || "";
    }
    const { data: media } = await client
      .from("ig_source_media")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    return error ? (
      <p>Creative operations are temporarily unavailable.</p>
    ) : (
      <>
        <MediaLibrary assets={media || []} />
        <ProviderStudio
          jobs={data || []}
          smsAllowed={smsAllowed}
          template={template}
          sourceMedia={media || []}
        />
      </>
    );
  }
  if (module === "ai") {
    const { data, error } = await client
      .from("ig_ai_jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    return error ? (
      <p>AI drafting requires practice content permissions.</p>
    ) : (
      <AIManager jobs={data || []} />
    );
  }
  if (module === "clients") {
    const tables = [
      "ig_clients",
      "ig_client_contacts",
      "ig_engagements",
      "ig_data_rooms",
    ];
    const r = await Promise.all(
      tables.map(t => readRegister(() => client.from(t).select("*"), "created_at")),
    );
    if (r.some((x) => x.error))
      return (
        <p role="alert">
          Client records are unavailable. Check your practice permissions.
        </p>
      );
    return (
      <ClientsManager
        clients={r[0].data}
        contacts={r[1].data}
        engagements={r[2].data}
        rooms={r[3].data}
        roomAdmin={profile.roles.some((x) =>
          ["owner", "administrator"].includes(x),
        )}
      />
    );
  }
  if (module === "payments") {
    const [{ data: users, error: ue }, { data, error }] = await Promise.all([
      client.rpc("ig_admin_users"),
      readRegister(() => client.from("ig_payment_requests").select("*"), "created_at"),
    ]);
    return error || ue ? (
      <p>Payment administration requires administrator access.</p>
    ) : (
      <PaymentsManager items={data || []} users={users.users} />
    );
  }
  if (module === "settings") {
    const [{ data, error }, release] = await Promise.all([
      client.rpc("ig_config_list"),
      currentPolicies(),
    ]);
    return error ? (
      <p>Super-user access is required.</p>
    ) : !release ? (
      <p>The initial policy release awaits owner review.</p>
    ) : (
      <SettingsManager
        configs={data.map((c) => ({
          ...c,
          environment_fields: providerCredentialPresence(c.id, process.env),
        }))}
        release={release}
        production={process.env.VERCEL_ENV === "production"}
      />
    );
  }
  if (module === "privacy") {
    if (!profile.roles.includes("owner"))
      return <p>Super-user access is required.</p>;
    const { data, error } = await readRegister(() => client.from("ig_privacy_requests").select("*"), "created_at");
    return error ? (
      <p>Register unavailable.</p>
    ) : (
      <PrivacyRequests items={data || []} admin />
    );
  }
  if (module === "data-rooms") {
    const roomSearch = await searchParams;
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
      tables.map(t => t === "ig_room_file_rules"
        ? readRegister(() => client.from(t).select("*"), null, ["grant_id", "file_id"])
        : readRegister(() => client.from(t).select("*"))),
    );
    const { data: opportunities, error } = await readRegister(() => client.from("ig_content").select("id,title,kind,slug").is("deleted_at",null));
    if (error || results.some((r) => r.error))
      return (
        <p role="alert">Data room administration is temporarily unavailable.</p>
      );
    return (
      <RoomsManager
        key={roomSearch?.content || roomSearch?.room || "rooms"}
        rooms={results[0].data}
        files={results[1].data}
        folders={results[2].data}
        grants={results[3].data}
        rules={results[4].data}
        requests={results[5].data}
        engagements={results[6].data}
        contacts={results[7].data}
        initialRoom={
          roomSearch?.room ||
          results[0].data.find((r) => r.content_id === roomSearch?.content)
            ?.id ||
          results[0].data.find(
            (r) => r.engagement_id === roomSearch?.engagement,
          )?.id
        }
        opportunities={opportunities || []}
        initialContent={roomSearch?.content}
      />
    );
  }
  if (module === "nda") {
    const [{ data: requests, error }, { data: templates, error: te }, projects, showcases, identities] =
      await Promise.all([
        readRegister(() => client.from("ig_nda_requests").select("*"), "created_at"),
        readRegister(() => client.from("ig_nda_templates").select("*"), "created_at"),
        client.rpc("ig_room_listing_slugs"),
        client.rpc("ig_room_listing_slugs",{content_kind:"project"}),
        readRegister(()=>client.from("ig_legal_entities").select("*").eq("status","submitted"),"consent_at"),
      ]);
    if (error || te || projects.error || showcases.error || identities.error) return <p role="alert">NDA records unavailable.</p>;
    const roomListings=[...(await published("opportunity") || []).filter(x=>projects.data.includes(x.slug)),...(await published("project")||[]).filter(x=>showcases.data.includes(x.slug))].map(x=>({id:x.id,title:x.title,cirp:isCirpProject(x.tags)}));
    return (
      <><IdentityReviews records={identities.data||[]}/><NdaManager projects={roomListings}
        requests={requests || []}
        templates={templates || []}
        isOwner={profile.roles.includes("owner")}
      /></>
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
        User administration requires an owner or administrator role.
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
    const [{ data, error }, { data: outbox, error: deliveryError }] = await Promise.all([
      readRegister(() => client.from("ig_enquiries").select("*"), "created_at"),
      readRegister(() => client.from("ig_outbox").select("id,enquiry_id,recipient,kind,status,attempts,created_at").not("enquiry_id","is",null), "created_at"),
    ]);
    return error || deliveryError ? (
      <p role="alert">The enquiry register or its delivery history could not be loaded. Refresh to retry.</p>
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
              ["Database & account access", "Connected to Supabase"],
              [
                "Content revision & publication",
                "Active, permission controlled",
              ],
              ["Consent preferences & audit", "Active"],
              [
                "Resend transactional delivery",
                "Resend is verified in preview: enquiry acknowledgements and internal notifications delivered; signed delivery events and recovery schedule active",
              ],
              [
                "Google Workspace user mail",
                "Awaiting per-user OAuth integration",
              ],
              [
                "HORECA procurement engine",
                "Dedicated SKU catalogue, CSV imports, RFQ schedules, vendor comparison, purchase-order awards, receipts, dispatches, returns and delivery acknowledgement.",
              ],
              [
                "PMC delivery engine",
                "Dedicated projects, dependency programmes, approved budgets, variations, measured progress, RFIs, risks and client engagement links.",
              ],
              [
                "OpenAI / creative generation",
                "OpenAI source-assisted drafts and SEO; Runway image/video jobs and approved reference-image adaptation. Private media preparation, evidence review and publication controls. Check provider job results for live acceptance.",
              ],
              [
                "SMS / Fast2SMS",
                "Deferred by owner. Email OTP remains the default. SMS is disabled until DLT approval and delivery acceptance.",
              ],
              [
                "NDA signing & data rooms",
                "Project NDA requests, versioned acceptance, private rooms, watermarked previews and file permissions; legal template approval pending",
              ],
              [
                "Marketing & remarketing",
                "Consent capture active; campaign delivery not activated",
              ],
              [
                "Payments & inventory",
                "Razorpay sandbox checkout verified; payment/refund reconciliation and capture audit available. Live activation requires production credentials and merchant verification. Operational procurement inventory is available.",
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
