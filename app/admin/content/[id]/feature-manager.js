"use client";
import { useState } from "react";
import { browserClient } from "../../../../lib/supabase/browser";
import FeaturedBanner from "../../../opportunities/featured-banner";

const fields = [["impressions","Banner views"],["opens","Brief opens"],["enquiries","Enquiries"],["qualified","Qualified"],["room_requests","Room requests"]];
const positions = ["","Lead property","Supporting property 1","Supporting property 2"];
const localDate = value => value ? new Date(new Date(value).getTime()+19800000).toISOString().slice(0,16) : "";
const instant = value => value ? new Date(value+":00+05:30").toISOString() : null;
const format = value => new Date(value).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"});
const endOf = row => row.deadline && new Date(row.deadline)<new Date(row.ends_at) ? row.deadline : row.ends_at;
function status(row) {
  if (row.stopped_at) return "Stopped";
  if (new Date(endOf(row))<=new Date()) return "Ended";
  return new Date(row.starts_at)>new Date() ? "Scheduled" : "Live";
}

export default function FeatureManager({contentId,card,initial}) {
  const [rows,setRows] = useState(initial);
  const [id,setId] = useState(initial.find(row => ["Live","Scheduled"].includes(status(row)))?.id || "");
  const [busy,setBusy] = useState(false), [notice,setNotice] = useState("");
  const active = rows.find(row => row.id===id);
  async function action(payload) {
    if (busy) return;
    setBusy(true); setNotice("");
    try {
      const client = browserClient();
      const call = async data => {
        const {data:result,error} = await client.rpc("ig_manage_listing_feature",{p:{content_id:contentId,...data}});
        if (error) throw Error(error.message);
        return result;
      };
      const result = await call(payload);
      const history = await call({action:"report"});
      setRows(history); setId(payload.action==="stop" ? "" : result.id);
      setNotice(payload.action==="stop" ? "Placement stopped." : "Placement saved.");
    } catch(error) {setNotice(error.message || "Could not save the placement. Refresh and try again.");}
    finally {setBusy(false);}
  }
  return <details className="workspace-card" id="feature-this-listing">
    <summary><strong>Feature this listing</strong></summary>
    {card ? <FeatureForm key={active?.id+":"+active?.version} card={card} row={active} busy={busy} action={action}/> : <p>Publish this listing to feature it.</p>}
    {notice && <p role="status" className="portal-message">{notice}</p>}
    {rows.length>0 && <><h3>Campaign performance</h3>
      <p>Times are in India Standard Time. Views and opens count interactions. Qualified enquiries are marked by staff in Enquiries &amp; leads.</p>
      <div className="table-scroll"><table className="workspace-table"><thead><tr><th>Placement</th><th>Period (IST)</th>{fields.map(([key,label])=><th key={key}>{label}</th>)}<th>Status</th></tr></thead>
      <tbody>{rows.map(row=><tr key={row.id}><td>{positions[row.slot]}</td><td>{format(row.starts_at)} to {format(row.stopped_at || endOf(row))}</td>
        {fields.map(([key])=><td key={key}>{row[key]}</td>)}<td>{status(row)} {["Live","Scheduled"].includes(status(row)) && row.id!==id && <button onClick={()=>setId(row.id)}>Edit</button>}</td></tr>)}</tbody></table></div>
      {id && <button type="button" onClick={()=>{setId("");setNotice("");}}>Schedule another placement</button>}
    </>}
  </details>;
}

function FeatureForm({card,row,busy,action}) {
  const [headline,setHeadline] = useState(row?.headline || "");
  const [slot,setSlot] = useState(row?.slot || 1);
  const running = row && new Date(row.starts_at)<=new Date();
  function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    action({action:"save",id:row?.id,version:row?.version,slot:Number(slot),headline,
      starts_at:running ? row.starts_at : instant(form.get("start")), ends_at:instant(form.get("end")),deadline:instant(form.get("deadline"))});
  }
  return <><form className="workspace-form" onSubmit={submit}>
    <label>Placement<select value={slot} onChange={event=>setSlot(Number(event.target.value))}>{positions.slice(1).map((name,i)=><option key={name} value={i+1}>{name}</option>)}</select></label>
    <label>Short name from published title<input maxLength={100} value={headline} onChange={event=>setHeadline(event.target.value)} placeholder={card.title}/></label>
    <label>Start (IST){running ? <span>{format(row.starts_at)}</span> : <input type="datetime-local" name="start" defaultValue={localDate(row?.starts_at)}/>}
    {!row && <small>Leave blank to start immediately.</small>}</label>
    <label>Campaign end (IST)<input type="datetime-local" required name="end" defaultValue={localDate(row?.ends_at || new Date(Date.now()+14*86400000))}/></label>
    <label>Verified transaction deadline (IST, if applicable)<input type="datetime-local" name="deadline" defaultValue={localDate(row?.deadline)}/></label>
    <p className="wide">The earlier of the two end times controls when promotion stops. Cards use the published image and public property facts. To prepare a Runway sketch, open the <a href="#listing-images">listing image studio</a>, review the result and publish the updated listing.</p>
    <div className="workspace-actions wide"><button className="primary" disabled={busy}>{row ? "Save placement" : "Feature this listing"}</button>
    {row && <button type="button" disabled={busy} onClick={()=>action({action:"stop",id:row.id,version:row.version})}>Stop placement</button>}</div>
  </form>
  <details><summary>Preview banner</summary>
    <FeaturedBanner preview items={[{...card,feature:{slot,headline}}]}/>
  </details></>;
}
