import Link from "next/link";
import { notFound } from "next/navigation";
import { accountContext } from "../../../lib/supabase/server";
import { TaxonomyManager, UserManager, EnquiryManager } from "../managers";
const date = (value) =>
  new Date(value).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
export default async function Module({ params }) {
  const { module } = await params,
    { client, profile } = await accountContext();
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
                "Awaiting verified sender and delivery test",
              ],
              ["Google Workspace user mail", "Awaiting OAuth integration"],
              [
                "OpenAI / creative generation",
                "Awaiting provider connection and controlled draft workflow",
              ],
              ["SMS / Fast2SMS", "Awaiting provider and approved templates"],
              [
                "NDA signing & data rooms",
                "Awaiting signature workflow and access tests",
              ],
              [
                "Marketing & remarketing",
                "Consent capture active; campaign delivery not activated",
              ],
              [
                "Payments, inventory & Vyapar",
                "Pending commerce implementation and connector verification",
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
