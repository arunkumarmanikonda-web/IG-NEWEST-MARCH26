import { accountContext } from "../../lib/supabase/server";
export default async function Dashboard() {
  const { client } = await accountContext();
  const { data, error } = await client.rpc("ig_admin_overview");
  if (error)
    return (
      <p role="alert">Your current permissions do not allow this overview.</p>
    );
  return (
    <>
      <div className="workspace-grid">
        {Object.entries(data || {})
          .filter(([, v]) => v !== null)
          .map(([k, v]) => (
            <div className="workspace-card" key={k}>
              <span>{k.charAt(0).toUpperCase() + k.slice(1)}</span>
              <strong>{v}</strong>
            </div>
          ))}
      </div>
      <section className="workspace-card">
        <h2>Publish with a clear record.</h2>
        <p>
          Create a draft, check its facts and public disclosure, then publish
          the exact revision. Each save creates a revision and an audit record.
          Concurrent changes require a reload.
        </p>
        <p className="workspace-note">
          This is the preview environment. Email delivery, AI generation,
          payments and NDA signing are not activated merely by creating a
          record.
        </p>
      </section>
    </>
  );
}
