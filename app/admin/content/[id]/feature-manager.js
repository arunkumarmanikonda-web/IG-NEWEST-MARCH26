"use client";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {browserClient} from "../../../../lib/supabase/browser";
import PriorityProducts from "../../../horeca/priority-products";
import FeaturedBanner from "../../../opportunities/featured-banner";
import {effectiveEnd, formatIst, placementStatus, positionLabels, studioHref} from "../../featured/placements.mjs";

const fields = [["impressions","Banner views"],["opens","Brief opens"],["enquiries","Enquiries"],["qualified","Qualified"],["room_requests","Room requests"]];
const localDate = value => value ? new Date(new Date(value).getTime()+19800000).toISOString().slice(0,16) : "";
const instant = value => value ? new Date(value+":00+05:30").toISOString() : null;
const editable = row => ["Live","Scheduled"].includes(placementStatus(row));

export default function FeatureManager({contentId,card,initial,kind="opportunity",central=false,requestedPlacement=null,defaultSlot=1}) {
  const router = useRouter();
  const product = kind==="product";
  const [selection,setSelection] = useState(requestedPlacement || initial.find(editable)?.id || "");
  const [updates,setUpdates] = useState(null);
  const history = central ? initial : updates || initial;
  const active = history.find(row => row.id===selection && editable(row));
  const [busy,setBusy] = useState(false), [notice,setNotice] = useState("");
  async function action(payload) {
    if (busy) return;
    setBusy(true); setNotice("");
    try {
      const client = browserClient();
      const call = async data => {
        const {data:result,error} = await client.rpc(product ? "ig_manage_product_priority" : "ig_manage_listing_feature",{p:{content_id:contentId,...data}});
        if (error) throw Error(error.message);
        return result;
      };
      const result = await call(payload);
      setSelection(payload.action==="stop" ? "" : result.id);
      setNotice(payload.action==="stop" ? "Placement stopped." : "Placement saved.");
      if (central) router.refresh();
      else {
        try {setUpdates(await call({action:"report"}));}
        catch {setNotice("Placement updated. Refresh to see the latest schedule.");}
      }
    } catch(error) {setNotice(error.message || "Could not save the placement. Refresh and try again.");}
    finally {setBusy(false);}
  }
  const content = <>
    {card ? <FeatureForm key={active?.id+":"+active?.version} card={card} kind={kind} central={central} contentId={contentId}
      row={active} defaultSlot={defaultSlot} busy={busy} action={action}/> : <p>Publish this {product ? "product" : "listing"} to feature it.</p>}
    {notice && <p role="status" className="portal-message">{notice}</p>}
    {history.length>0 && <><h3>{product ? "Placement history" : "Campaign performance"}</h3>
      <p>Times are in India Standard Time.{!product && " Views and opens count interactions. Qualified enquiries are marked by staff in Enquiries & leads."}</p>
      <div className="table-scroll"><table className="workspace-table"><thead><tr><th>Placement</th><th>Period (IST)</th>{!product && fields.map(([key,label])=><th key={key}>{label}</th>)}<th>Status</th></tr></thead>
      <tbody>{history.map(row=><tr key={row.id}><td>{positionLabels[kind][row.slot]}</td><td>{formatIst(row.starts_at)} to {formatIst(row.stopped_at || effectiveEnd(row))}</td>
        {!product && fields.map(([key])=><td key={key}>{row[key]}</td>)}<td>{placementStatus(row)} {editable(row) && row.id!==selection && <button type="button" disabled={busy} onClick={()=>{setSelection(row.id);setNotice("");}}>Edit</button>}</td></tr>)}</tbody></table></div>
      {active && <button type="button" disabled={busy} onClick={()=>{setSelection("");setNotice("");}}>Schedule another placement</button>}
    </>}
  </>;
  return central ? <section className="workspace-card"><h3>{card?.title || "Configure placement"}</h3>{content}</section> :
    <details className="workspace-card" id="feature-this-listing">
      <summary><strong>Feature this listing</strong></summary>
      <p><Link href={studioHref({kind,record:contentId},"placement-editor")}>Open carousel &amp; priority listings</Link></p>{content}
    </details>;
}

function FeatureForm({card,kind,central,contentId,row,defaultSlot,busy,action}) {
  const product = kind==="product";
  const [headline,setHeadline] = useState(row?.headline || "");
  const [slot,setSlot] = useState(row?.slot || defaultSlot);
  const running = row && new Date(row.starts_at)<=new Date();
  function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    action({action:"save",id:row?.id,version:row?.version,slot:Number(slot),
      starts_at:running ? row.starts_at : instant(form.get("start")), ends_at:instant(form.get("end")),
      ...(!product && {headline,deadline:instant(form.get("deadline"))})});
  }
  return <><form className="workspace-form" onSubmit={submit}>
    <label>Position<select value={slot} onChange={event=>setSlot(Number(event.target.value))}>{positionLabels[kind].slice(1).map((name,i)=><option key={name} value={i+1}>{name}</option>)}</select></label>
    {!product && <label>Short name from published title<input maxLength={100} value={headline} onChange={event=>setHeadline(event.target.value)} placeholder={card.title}/></label>}
    <label>Start (IST){running ? <span>{formatIst(row.starts_at)}</span> : <input type="datetime-local" name="start" defaultValue={localDate(row?.starts_at)}/>}
    {!row && <small>Leave blank to start immediately.</small>}</label>
    <label>Campaign end (IST)<input type="datetime-local" required name="end" defaultValue={localDate(row?.ends_at || new Date(Date.now()+14*86400000))}/></label>
    {!product && <><label>Verified transaction deadline (IST, if applicable)<input type="datetime-local" name="deadline" defaultValue={localDate(row?.deadline)}/></label>
      <p className="wide">The earlier end time controls when promotion stops. To prepare a Runway sketch, open the <a href={central ? "/admin/content/"+contentId+"#listing-images" : "#listing-images"}>listing image studio</a>, review the result and publish the updated listing.</p></>}
    <div className="workspace-actions wide"><button type="submit" className="primary" disabled={busy}>{row ? "Save placement" : product ? "Set product priority" : "Feature this listing"}</button>
    {row && <button type="button" disabled={busy} onClick={()=>action({action:"stop",id:row.id,version:row.version})}>Stop placement</button>}</div>
  </form>
  <details><summary>{product ? "Preview product" : "Preview banner"}</summary>
    {product ? <PriorityProducts preview products={[card]}/> :
      <FeaturedBanner preview items={[{...card,feature:{slot,headline}}]}/>}
  </details></>;
}
