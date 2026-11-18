import {horecaCatalogue} from "../../../lib/horeca-catalogue";
import {horecaCategories} from "../../../lib/horeca-categories.mjs";
import Link from "next/link";
import { accountContext } from "../../../lib/supabase/server";
import Rehearsal from "./rehearsal";
import Schedule from "./schedule";
import "./workspace.css";

export const metadata = { title: "Perspectives & Gullu" };
const dates = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });
function formatDate(value, withTime = true) {
  const date = new Date(value);
  if (!value || !Number.isFinite(date.getTime())) return "Pending";
  return withTime ? dates.format(date) + " IST" : date.toLocaleDateString("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" });
}

function ConversationHistory({ turns }) {
  const sessions = new Map();
  for (const turn of turns) {
    if (!sessions.has(turn.session_id)) sessions.set(turn.session_id, []);
    sessions.get(turn.session_id).push(turn);
  }
  return <section className="workspace-card">
    <h3>Gullu conversations</h3>
    <p>Gullu is your India Gully buddy. Recent exchanges appear below. Open a daily workbook for guest details, summaries and complete conversations.</p>
    <Link className="module-link" href="/admin/enquiries">Open enquiries &amp; leads</Link>
    {!sessions.size && <p>No saved conversations yet.</p>}
    {[...sessions].map(([id, messages]) => {
      const ordered = messages.slice().sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
      const last = ordered.at(-1);
      return <details key={id} className="intelligence-log">
        <summary>{formatDate(last.created_at)} · {last.practice_interest || "Website enquiry"}
          {ordered.some(turn => turn.follow_up) && " · Follow-up requested"}</summary>
        {ordered.map((turn, index) => <div key={turn.turn_id || index}>
          <p><strong>Visitor</strong><br/>{turn.question}</p><p><strong>Gullu</strong><br/>{turn.answer}</p>
        </div>)}
      </details>;
    })}
  </section>;
}

export default async function IntelligencePage({searchParams}) {
  const selected=(await searchParams)?.day;
  const defaultDay=new Date(Date.now()+19800000).toISOString().slice(0,10);
  const day=/^\d{4}-\d{2}-\d{2}$/.test(selected||"")?selected:defaultDay;
  const { client, staffVerified, policiesAccepted } = await accountContext();
  const { data, error } = staffVerified && policiesAccepted ?
    await client.rpc("ig_intelligence_admin", { p: { action: "status" } }) : { error: { code: "42501" } };
  if (error || !data?.settings) return <section className="workspace-card">
    <h2>Perspectives &amp; Gullu</h2>
    <p>{error?.code === "42501" ? "Your account needs permission to open this workspace." : "The workspace is temporarily unavailable. Reload the page to try again."}</p>
  </section>;

  const { settings, runs = [], reports = [], conversations = [] } = data;
  const health=await client.rpc("ig_worker_status");
  const catalogue=await horecaCatalogue().catch(()=>null);
  const topics = [...new Set(runs.flatMap(run => (run.candidates || []).map(item => item.topic)).filter(Boolean))];
  return <div className="intelligence-workspace">
    <header className="module-heading"><div><h2>Perspectives &amp; Gullu</h2>
      <p>Manage publication, review the research behind each article and track client follow-up.</p></div>
      <Link className="module-link" href="/insights">View published Perspectives ↗</Link></header>
    <Schedule key={[settings.enabled, settings.cadence_days, settings.preferred_topic].join("|")}
      settings={settings} nextRun={formatDate(settings.next_at)} topics={topics} />
    <section className="workspace-card"><h3>Background processing health</h3>
      {health.error?<p role="alert">Worker monitoring is unavailable. A scheduler response alone does not confirm completion.</p>:<div className="table-scroll"><table className="workspace-table"><thead><tr><th>Component</th><th>Status</th><th>Last completed</th><th>Details</th></tr></thead><tbody>{(health.data||[]).map(w=><tr key={w.component}><td>{w.component.replaceAll('_',' ')}</td><td>{w.status}</td><td>{formatDate(w.last_success)}</td><td>{w.detail}</td></tr>)}</tbody></table></div>}
    </section>
    <section className="workspace-card"><h3>Catalogue coverage</h3><p>Publish only verified supplier SKUs and signed mandates. Empty categories remain available for sourcing enquiries.</p>
      {catalogue?<ul>{horecaCategories.filter(c=>c.id!=='other'||catalogue.counts.other).map(c=><li key={c.id}>{c.label}: {catalogue.counts[c.id]||0} published SKUs{!catalogue.counts[c.id]?' · approved supplier data needed':''}</li>)}</ul>:<p>Catalogue coverage is temporarily unavailable.</p>}
      <Link href="/admin/catalogue/import">Import approved supplier catalogue →</Link> <Link href="/admin/retail">Manage leasing mandates →</Link>
    </section>
    <section className="workspace-card"><h3>Editorial runs</h3>
      {!runs.length && <p>The first research run will appear here.</p>}
      {runs.map((run, index) => <details className="intelligence-log" key={run.id || index}>
        <summary>{formatDate(run.started_at)} · {run.title || "Perspective research"} · {run.status}</summary>
        {run.selection_reason && <p>{run.selection_reason}</p>}
        {run.error && <p>{run.error}</p>}
        {run.diagnostics?.stage && <p>Last stage: {run.diagnostics.stage} · {run.diagnostics.model}</p>}
        {run.diagnostics?.initialVerificationReport && <details><summary>Review before revision</summary><p style={{whiteSpace:'pre-wrap'}}>{run.diagnostics.initialVerificationReport}</p></details>}
        {run.diagnostics?.verificationReport && <details><summary>Independent review</summary><p style={{whiteSpace:'pre-wrap'}}>{run.diagnostics.verificationReport}</p></details>}
        {run.diagnostics?.researchReport && <details><summary>Research record</summary><p style={{whiteSpace:'pre-wrap'}}>{run.diagnostics.researchReport}</p></details>}
        {Boolean(run.candidates?.length) && <><h4>Topics considered</h4><ul>{run.candidates.map((item, i) =>
          <li key={i}><strong>{item.topic}</strong>{item.reason && <p>{item.reason}</p>}</li>)}</ul></>}
      </details>)}
    </section>
    <section className="workspace-card"><h3>Daily guest workbook</h3><p>Guest summaries and full transcripts for conversations active on the selected date in India. The daily report is scheduled for 9:00 a.m. IST the next morning.</p><form action="/api/admin/intelligence/report" method="get"><label>Conversation date <input type="date" name="day" defaultValue={day} required/></label> <button type="submit">Download Excel report</button></form></section>
    <Rehearsal />
    <ConversationHistory turns={conversations} />
    <section className="workspace-card"><h3>Gullu report delivery</h3>
      <p>Delivery history for the reports to Arun, Amit and Pavan.</p>
      {reports.length ? <div className="table-scroll"><table className="workspace-table">
        <thead><tr><th>Period starting</th><th>Recipient</th><th>Status</th></tr></thead>
        <tbody>{reports.map((report, i) => <tr key={i}><td>{formatDate(report.period_start, false)}</td>
          <td>{report.recipient}</td><td>{report.status}</td></tr>)}</tbody>
      </table></div> : <p>No report deliveries yet.</p>}
    </section>
  </div>;
}
