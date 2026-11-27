import Link from "next/link";
import "../brand-workspace.css";

export default function SampleStaffWorkspace({ record }) {
  return (
    <main id="main" className="auth-page account-dashboard">
      <div>
        <header className="portal-form">
          <div className="eyebrow">India Gully · Staff workspace</div>
          <h1>Hospitality records</h1>
          <p>Your reviewer account has read-only access to the sample assignment below.</p>
        </header>
        <section className="shared-rooms" aria-label="Assigned hospitality records">
          <article className="workspace-card">
            <h2>{record.title}</h2>
            <p>{record.summary}</p>
            <details>
              <summary>View assignment brief</summary>
              <p>{record.body}</p>
              <dl>
                <dt>Practice</dt><dd>Hospitality</dd>
                <dt>Listing status</dt><dd>{record.status}</dd>
                <dt>Version</dt><dd>{record.version}</dd>
              </dl>
            </details>
          </article>
        </section>
        <Link className="button secondary" href="/login/mobile">Sign out of this session</Link>
      </div>
    </main>
  );
}
