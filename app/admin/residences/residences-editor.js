"use client";
import {useState} from "react";
import Link from "next/link";
import {residencesDefaults,residencePlacements,validateResidences,publicResidences} from "../../../lib/residences.mjs";
import ResidencesLaunch from "../../residences/launch";
import BrandLogoField from "../cms/site/brand-logo-field";
import MediaLibrary from "../media-library";
import "./studio.css";

const indiaInput = value => value ? new Date(Date.parse(value)+330*60000).toISOString().slice(0,16) : "";
const indiaDate = value => value ? new Date(value+":00+05:30").toISOString() : "";
const readable = value => new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(new Date(value))+" IST";

export default function ResidencesEditor({record,live,media,mediaError,scheduling}) {
  const [value,setValue] = useState(record?.content || residencesDefaults);
  const [version,setVersion] = useState(record?.version || 0);
  const [liveVersion,setLiveVersion] = useState(live?.version || 0);
  const [scheduled,setScheduled] = useState(live?.scheduled_at || "");
  const [liveContent,setLiveContent] = useState(live?.content || null);
  const [reviewed,setReviewed] = useState(false);
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState("");
  const [failure,setFailure] = useState(false);
  const [preview,setPreview] = useState("home");
  const [dirty,setDirty] = useState(false);
  function edit(patch) {setValue(old=>({...old,...patch}));setReviewed(false);setDirty(true);setMessage("");}
  let previewValue = null, previewError = "";
  try { previewValue=validateResidences(value); } catch (error) {previewError=error.message;}
  const active = publicResidences(liveContent);
  async function save(event) {
    event.preventDefault();
    const action = event.nativeEvent.submitter?.value || "save";
    setBusy(true);setMessage("");setFailure(false);
    try {
      const content=validateResidences(value);
      const future=action==="publish" && content.enabled && content.startsAt && Date.parse(content.startsAt)>Date.now();
      if (future && !scheduling) throw Error("Scheduled publication is unavailable. Save this draft and ask an administrator to configure the publication encryption key.");
      const response=await fetch("/api/admin/website",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({section:"residences-launch",action,version,content,reviewed,effective_at:future ? content.startsAt : null})});
      const result=await response.json();
      if (!response.ok) throw Error(result.error || "The launch could not be saved.");
      setValue(content);setVersion(result.version);setDirty(false);setReviewed(false);
      if (action==="publish") {
        setScheduled(future ? content.startsAt : "");
        if (!future) {setLiveVersion(result.version);setLiveContent(content);}
      }
      setMessage(action==="save" ? "Draft saved. Public pages have not changed." : future ? "Launch scheduled for "+readable(content.startsAt)+". The homepage and Residences page update together." : publicResidences(content) ? "Published. The Residences page and selected homepage placement are updated together." : "Published as hidden. The launch is not visible on public pages.");
    } catch (error) {setFailure(true);setMessage(error.message || "The request did not complete. Reload to check the saved revision before trying again.");}
    finally {setBusy(false);}
  }
  const textField=(key,label,maxLength,required=false)=> <label>{label}<input value={value[key]} maxLength={maxLength} required={required} onChange={event=>edit({[key]:event.target.value})}/></label>;
  return <div className="residences-studio">
    <header className="module-heading"><div><span className="eyebrow">OUR OWN RESIDENTIAL PROJECT</span><h2>India Gully Residences</h2><p>Prepare the launch once. Publish its project page and homepage introduction together.</p></div>{active && <Link className="module-link" href="/residences" target="_blank" rel="noreferrer">View public page ↗</Link>}</header>
    <div className="residence-status"><strong>{active ? "Live" : scheduled ? "Scheduled" : "Hidden from public pages"}</strong><span>Draft revision {version} · Live revision {liveVersion || "none"}{dirty ? " · Unsaved changes" : ""}</span>{scheduled && <span>Next publication: {readable(scheduled)}</span>}</div>
    <form onSubmit={save} className="workspace-card residence-form">
      <fieldset disabled={busy}><legend>Launch settings</legend>
        <div className="residence-field-grid"><label className="check"><input type="checkbox" checked={value.enabled} onChange={event=>edit({enabled:event.target.checked})}/>Enable the published launch</label><label className="check"><input type="checkbox" checked={value.homepage} onChange={event=>edit({homepage:event.target.checked})}/>Show on the homepage</label>
          <label>Homepage placement<select value={value.placement} onChange={event=>edit({placement:event.target.value})}>{Object.entries(residencePlacements).map(([key,label])=><option value={key} key={key}>{label}</option>)}</select></label>
          <div className="residence-field-note">Keep the launch disabled while preparing. To hide it later, clear “Enable” and publish the change.</div>
          <label>Launch starts (optional, India time)<input type="datetime-local" value={indiaInput(value.startsAt)} onChange={event=>edit({startsAt:indiaDate(event.target.value)})}/></label>
          <label>Launch ends (optional, India time)<input type="datetime-local" value={indiaInput(value.endsAt)} onChange={event=>edit({endsAt:indiaDate(event.target.value)})}/></label>
        </div><p className="residence-field-note">A future start schedules publication. At the end, the homepage introduction, project page and discovery links disappear automatically. Leave dates empty for an ongoing launch.</p>
      </fieldset>
      <fieldset disabled={busy}><legend>Project introduction</legend><div className="residence-field-grid">
        {textField("name","Project name",100,true)}{textField("kicker","Small heading (optional)",100)}{textField("headline","Main headline",180,true)}{textField("location","Location",180,true)}
        <label className="wide">Project description<textarea rows={5} value={value.description} maxLength={6000} required onChange={event=>edit({description:event.target.value})}/><small>Separate paragraphs with a blank line. Add only approved project information.</small></label>
        <label className="wide">Approved highlights (optional)<textarea rows={3} value={value.highlights.join("\n")} onChange={event=>edit({highlights:event.target.value ? event.target.value.split("\n") : []})}/><small>One per line, up to eight. Leave empty until project details are confirmed.</small></label>
        {textField("ctaLabel","Enquiry button label",80,true)}{textField("ctaHref","Enquiry destination",2000,true)}
      </div></fieldset>
      <fieldset disabled={busy}><legend>Approved project media</legend><p>Use the actual project photography or approved architectural renders. With no image, the launch uses a simple brand panel.</p>
        <div className="residence-field-grid">{textField("image","Hero image path on India Gully (optional)",2000)}{textField("imageAlt","Image description",250,Boolean(value.image))}
        {textField("video","Project film path on India Gully (optional, MP4 or WebM)",2000)}<div className="residence-field-note">Upload and release a photograph in the media library below, then choose “Use image”. Films must already be hosted on India Gully, for example /videos/residences.mp4. External image, logo and film links must first be imported to the website.</div>
        <div className="wide"><BrandLogoField value={value.logo} onChange={logo=>edit({logo})}/></div>
      </div></fieldset>
      <label className="check residence-review"><input type="checkbox" checked={reviewed} disabled={busy} onChange={event=>setReviewed(event.target.checked)}/>I have reviewed the project facts, media rights and privacy for publication.</label>
      <div className="workspace-actions"><button value="save" disabled={busy}>Save draft</button><button className="primary" value="publish" disabled={busy || !reviewed}>{value.enabled && value.startsAt && Date.parse(value.startsAt)>Date.now() ? "Schedule launch" : "Publish launch settings"}</button></div>
      <p role={failure ? "alert" : "status"} aria-live="polite">{message}</p>
    </form>
    <section className="residence-preview" aria-label="Launch preview"><div className="residence-preview-heading"><div><h3>Preview before publishing</h3><p>This private preview uses your current edits.</p></div><div className="workspace-actions"><button type="button" aria-pressed={preview==="home"} onClick={()=>setPreview("home")}>Homepage</button><button type="button" aria-pressed={preview==="page"} onClick={()=>setPreview("page")}>Project page</button></div></div>
      {previewValue ? <ResidencesLaunch config={previewValue} detail={preview==="page"} preview /> : <p role="status">Complete the preview fields: {previewError}</p>}
    </section>
    {mediaError ? <p role="alert">The media library could not be loaded. Refresh to try again. Your project text can still be edited.</p> : <MediaLibrary assets={media} onChoose={(image,imageAlt)=>edit({image,imageAlt})} />}
  </div>;
}
