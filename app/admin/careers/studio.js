"use client";
import Link from "next/link";
import { useState } from "react";
import { workModes, employmentTypes, careerDate } from "../../careers/career-copy";

const jobStatuses = { draft: "Draft", published: "Published", closed: "Closed", archived: "Archived" };
const applicationStatuses = { new: "New", reviewing: "Reviewing", shortlisted: "Shortlisted", interview: "Interview", hired: "Hired", declined: "Declined", withdrawn: "Withdrawn" };
const blankJob = { id: null, slug: "", title: "", department: "", location: "", work_mode: "onsite", employment_type: "full-time", summary: "", description: "", responsibilities: "", requirements: "", salary_text: "", closes_at: null, status: "draft" };
const dateInput = value => value && Number.isFinite(Date.parse(value)) ? new Date(Date.parse(value) + 330 * 60000).toISOString().slice(0, 10) : "";
const endOfIndiaDay = value => value ? new Date(`${value}T23:59:59+05:30`).toISOString() : null;
const slugOf = value => value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100).replace(/-$/g, "");
const roleOpen = job => job.status === "published" && (!job.closes_at || Date.parse(job.closes_at) > Date.now());

function JobEditor({ job, busy, onSave, onCancel }) {
  const [value, setValue] = useState(job), [manualSlug, setManualSlug] = useState(Boolean(job.id));
  const edit = patch => setValue(previous => ({ ...previous, ...patch }));
  function titleChanged(title) { edit({ title, ...(!manualSlug && !job.id ? { slug: slugOf(title) } : {}) }); }
  return <form className="workspace-card career-admin-form" onSubmit={event => { event.preventDefault(); onSave(value); }}>
    <div className="career-admin-panel-heading"><div><h3>{job.id ? "Edit vacancy" : "Create a vacancy"}</h3><p>Drafts remain private. Publishing makes this role visible on the website and through the apps.</p></div><button type="button" onClick={onCancel} disabled={busy}>Close editor</button></div>
    <fieldset disabled={busy}><legend>Role details</legend><div className="career-admin-grid">
      <label className="career-admin-wide">Role title<input value={value.title} onChange={event => titleChanged(event.target.value)} required minLength={3} maxLength={160} /></label>
      <label>Department or practice<input value={value.department} onChange={event => edit({ department: event.target.value })} required minLength={2} maxLength={120} placeholder="For example, Retail Leasing" /></label>
      <label>Work location<input value={value.location} onChange={event => edit({ location: event.target.value })} required minLength={2} maxLength={160} placeholder="City or approved remote location" /></label>
      <label>Work mode<select value={value.work_mode} onChange={event => edit({ work_mode: event.target.value })}>{Object.entries(workModes).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label>Employment type<select value={value.employment_type} onChange={event => edit({ employment_type: event.target.value })}>{Object.entries(employmentTypes).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label className="career-admin-wide">Short introduction<textarea rows={3} value={value.summary} onChange={event => edit({ summary: event.target.value })} required minLength={20} maxLength={1000} /><small>20–1,000 characters. Appears on the vacancies list.</small></label>
      <label className="career-admin-wide">About the role<textarea rows={7} value={value.description} onChange={event => edit({ description: event.target.value })} required minLength={40} maxLength={15000} /><small>Separate paragraphs with a blank line. Minimum 40 characters.</small></label>
      <label className="career-admin-wide">Responsibilities <span>(optional)</span><textarea rows={5} value={value.responsibilities} onChange={event => edit({ responsibilities: event.target.value })} maxLength={10000} /><small>One responsibility per line.</small></label>
      <label className="career-admin-wide">Experience and requirements <span>(optional)</span><textarea rows={5} value={value.requirements} onChange={event => edit({ requirements: event.target.value })} maxLength={10000} /><small>One requirement per line. Include only criteria relevant to the role.</small></label>
      <label className="career-admin-wide">Compensation information <span>(optional)</span><input value={value.salary_text} onChange={event => edit({ salary_text: event.target.value })} maxLength={250} /><small>Leave blank if compensation should not appear publicly.</small></label>
    </div></fieldset>
    <fieldset disabled={busy}><legend>Publication</legend><div className="career-admin-grid">
      <label>Role URL<input value={value.slug} onChange={event => { setManualSlug(true); edit({ slug: event.target.value }); }} pattern="[a-z0-9]+(-[a-z0-9]+)*" required minLength={2} maxLength={100} /><small>/careers/{value.slug || "role-name"}. Keep the URL unchanged after sharing it.</small></label>
      <label>Applications close <span>(optional)</span><input type="date" value={dateInput(value.closes_at)} onChange={event => edit({ closes_at: endOfIndiaDay(event.target.value) })} /><small>Applications close at 11:59 p.m. India time on this date. Leave blank for no closing date.</small></label>
      <label>Status<select value={value.status} onChange={event => edit({ status: event.target.value })}>{Object.entries(jobStatuses).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <p className="career-admin-field-note">Closed and archived roles stop accepting applications and disappear from the public list. Existing applications remain in this workspace.</p>
    </div></fieldset>
    <div className="workspace-actions"><button className="primary" disabled={busy} type="submit">{busy ? "Saving…" : value.status === "published" ? "Save and publish vacancy" : "Save vacancy"}</button><button type="button" disabled={busy} onClick={onCancel}>Cancel</button></div>
  </form>;
}

function ApplicationEditor({ application, busy, onSave }) {
  const [status, setStatus] = useState(application.status), [notes, setNotes] = useState(application.notes || "");
  return <form className="career-app-review" onSubmit={event => { event.preventDefault(); onSave({ action: "update_application", id: application.id, version: application.version, status, notes }); }}>
    <div className="career-app-information"><div><strong>Email</strong><p><a href={`mailto:${application.email}`}>{application.email}</a></p></div>{application.phone && <div><strong>Phone</strong><p>{application.phone}</p></div>}{application.current_location && <div><strong>Current location</strong><p>{application.current_location}</p></div>}<div><strong>Application reference</strong><p className="career-admin-reference">{application.id}</p></div></div>
    <div className="career-app-intro"><strong>Candidate introduction</strong><p>{application.message}</p></div>
    <div className="career-app-attachments">{application.resume_name && <a className="module-link" href={`/api/admin/careers/resume?id=${encodeURIComponent(application.id)}`} target="_blank" rel="noreferrer">Download CV: {application.resume_name}</a>}{application.portfolio_url && <a className="module-link" href={application.portfolio_url} target="_blank" rel="noopener noreferrer">Open candidate’s profile or CV link</a>}</div>
    <fieldset disabled={busy}><legend className="visually-hidden">Review application</legend><div className="career-admin-grid"><label>Application status<select value={status} onChange={event => setStatus(event.target.value)}>{Object.entries(applicationStatuses).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label className="career-admin-wide">Internal recruitment notes<textarea rows={4} value={notes} maxLength={5000} onChange={event => setNotes(event.target.value)} /><small>Visible only to authorised Careers administrators.</small></label></div><button className="primary" type="submit" disabled={busy}>{busy ? "Saving…" : "Save review"}</button></fieldset>
  </form>;
}

export default function CareersStudio({ initial }) {
  const [data, setData] = useState(initial), [settings, setSettings] = useState(initial.settings), [tab, setTab] = useState("vacancies"), [editor, setEditor] = useState(null);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(""), [failure, setFailure] = useState(false), [jobFilter, setJobFilter] = useState(""), [applicationFilter, setApplicationFilter] = useState(""), [query, setQuery] = useState("");
  async function refresh() {
    const response = await fetch("/api/admin/careers", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "The latest careers records could not be loaded.");
    setData(result); setSettings(result.settings); return result;
  }
  async function save(payload, successMessage, closeEditor = false) {
    if (busy) return;
    setBusy(true); setFailure(false); setMessage("");
    try {
      const response = await fetch("/api/admin/careers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "The change could not be saved.");
      if (closeEditor) setEditor(null);
      try { await refresh(); setMessage(successMessage); } catch { setFailure(true); setMessage("Your change was saved, but the latest records could not be refreshed. Reload this page before making another change."); }
    } catch (error) { setFailure(true); setMessage(error.message || "The request did not complete. Reload to check the latest record before trying again."); }
    finally { setBusy(false); }
  }
  async function reload() {
    setBusy(true); setMessage(""); setFailure(false);
    try { await refresh(); setEditor(null); setMessage("Latest careers records loaded."); } catch (error) { setFailure(true); setMessage(error.message); } finally { setBusy(false); }
  }
  const jobs = data.jobs || [], applications = data.applications || [], recruitmentOpen = data.settings.enabled;
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const filteredApplications = applications.filter(item => (!jobFilter || item.job_id === jobFilter) && (!applicationFilter || item.status === applicationFilter) && words.every(word => [item.name, item.email, item.job_title].join(" ").toLowerCase().includes(word)));
  return <div className="career-admin">
    <header className="module-heading"><div><span className="eyebrow">PEOPLE & OPPORTUNITIES</span><h2>Careers &amp; applications</h2><p>Create vacancies, manage the public Careers page and review applications privately.</p></div><Link className="module-link" href="/careers" target="_blank" rel="noreferrer">View Careers page</Link></header>
    <div className="career-admin-overview"><div><strong>{recruitmentOpen ? jobs.filter(roleOpen).length : 0}</strong><span>Open roles</span></div><div><strong>{jobs.filter(job => job.status === "draft").length}</strong><span>Draft vacancies</span></div><div><strong>{applications.filter(application => application.status === "new").length}</strong><span>New applications</span></div><div><strong>{recruitmentOpen ? "Open" : "Paused"}</strong><span>Recruitment</span></div></div>
    <div className="career-admin-tabs" role="group" aria-label="Careers sections">{[["vacancies", "Vacancies"], ["applications", "Applications"], ["settings", "Page configuration"]].map(([id, label]) => <button key={id} type="button" aria-pressed={tab === id} onClick={() => { setTab(id); setMessage(""); }} disabled={busy}>{label}</button>)}<button className="career-admin-refresh" type="button" disabled={busy} onClick={reload}>Refresh records</button></div>
    {message && <p className={`career-admin-message ${failure ? "is-error" : ""}`} role={failure ? "alert" : "status"}>{message}</p>}
    {tab === "vacancies" && <>
      {!recruitmentOpen && <p className="career-admin-notice">Recruitment is paused. Published roles are hidden and new applications are not accepted. Reopen recruitment in Page configuration.</p>}
      {editor ? <JobEditor key={editor.id || "new"} job={editor} busy={busy} onCancel={() => setEditor(null)} onSave={job => save({ action: "save_job", job }, job.status === "published" ? "Vacancy saved. Public visibility follows the recruitment setting and closing date." : "Vacancy saved.", true)} /> : <section className="workspace-card"><div className="career-admin-panel-heading"><div><h3>Vacancies</h3><p>Publish approved roles when you are ready to receive applications.</p></div><button className="primary" type="button" onClick={() => { setEditor({ ...blankJob }); setMessage(""); }}>Create vacancy</button></div>
        {!jobs.length ? <div className="career-admin-empty"><h4>Your first vacancy starts here.</h4><p>There are no vacancies yet. The public page shows your configured message until you publish an open role.</p></div> : <div className="table-scroll"><table className="workspace-table"><thead><tr><th>Role</th><th>Location</th><th>Status</th><th>Closing date</th><th>Manage</th></tr></thead><tbody>{jobs.map(job => <tr key={job.id}><td><strong>{job.title}</strong><br /><small>{job.department}</small></td><td>{job.location}<br /><small>{workModes[job.work_mode]}</small></td><td>{jobStatuses[job.status]}{job.status === "published" && !roleOpen(job) && <><br /><small>Closing date passed</small></>}</td><td>{careerDate(job.closes_at) || "No closing date"}</td><td><div className="career-admin-row-actions"><button type="button" onClick={() => { setEditor({ ...job }); setMessage(""); }}>Edit</button>{recruitmentOpen && roleOpen(job) && <Link href={`/careers/${job.slug}`} target="_blank" rel="noreferrer">View public role</Link>}<button type="button" onClick={() => { setJobFilter(job.id); setTab("applications"); }}>Applications</button></div></td></tr>)}</tbody></table></div>}
      </section>}
    </>}
    {tab === "applications" && <section className="workspace-card"><h3>Applications</h3><p className="career-admin-subtitle">Candidate information and CVs are private. Status changes are internal and do not send emails.</p><div className="career-admin-filters"><label>Vacancy<select value={jobFilter} onChange={event => setJobFilter(event.target.value)}><option value="">All vacancies</option>{jobs.map(job => <option key={job.id} value={job.id}>{job.title}</option>)}</select></label><label>Status<select value={applicationFilter} onChange={event => setApplicationFilter(event.target.value)}><option value="">All statuses</option>{Object.entries(applicationStatuses).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label>Search candidates<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Name, email or role" maxLength={160} /></label></div>
      <p className="career-admin-result-count">{filteredApplications.length} {filteredApplications.length === 1 ? "application" : "applications"}</p>
      {!filteredApplications.length && <div className="career-admin-empty"><p>{applications.length ? "No applications match these filters." : "Applications will appear here when candidates submit them against a published role."}</p></div>}
      {filteredApplications.map(application => <details className="career-application-record" key={application.id}><summary><span><strong>{application.name}</strong><span>{application.job_title || jobs.find(job => job.id === application.job_id)?.title || "Role"}</span></span><span className="career-application-summary-status">{applicationStatuses[application.status]}<small>{careerDate(application.created_at)}</small></span></summary><ApplicationEditor key={`${application.id}-${application.version}`} application={application} busy={busy} onSave={payload => save(payload, "Application review saved.")} /></details>)}
    </section>}
    {tab === "settings" && <form className="workspace-card career-admin-form" onSubmit={event => { event.preventDefault(); save({ action: "save_settings", settings }, "Careers page configuration saved."); }}><h3>Public page configuration</h3><p className="career-admin-subtitle">These settings update the website and the Careers page opened from Android and iOS.</p><fieldset disabled={busy}><legend>Recruitment availability</legend><label className="career-admin-check"><input type="checkbox" checked={settings.enabled} onChange={event => setSettings(previous => ({ ...previous, enabled: event.target.checked }))} /><span>Accept applications for published, open vacancies</span></label><p className="career-admin-field-note">Turning this off hides all roles and pauses new applications. It preserves vacancies and previous applications.</p></fieldset><fieldset disabled={busy}><legend>Careers introduction</legend><div className="career-admin-grid">
      <label className="career-admin-wide">Page headline<input value={settings.headline} required minLength={5} maxLength={160} onChange={event => setSettings(previous => ({ ...previous, headline: event.target.value }))} /></label>
      <label className="career-admin-wide">Introduction<textarea value={settings.intro} rows={5} required minLength={20} maxLength={3000} onChange={event => setSettings(previous => ({ ...previous, intro: event.target.value }))} /><small>Separate paragraphs with a blank line. Use approved statements about working with India Gully.</small></label>
      <label className="career-admin-wide">Message when no roles are open<textarea value={settings.empty_message} rows={3} required minLength={10} maxLength={1000} onChange={event => setSettings(previous => ({ ...previous, empty_message: event.target.value }))} /></label>
      <label className="career-admin-wide">Application form introduction<textarea value={settings.application_intro} rows={3} required minLength={10} maxLength={1200} onChange={event => setSettings(previous => ({ ...previous, application_intro: event.target.value }))} /></label>
    </div></fieldset><button className="primary" type="submit" disabled={busy}>{busy ? "Saving…" : "Save page configuration"}</button></form>}
  </div>;
}
