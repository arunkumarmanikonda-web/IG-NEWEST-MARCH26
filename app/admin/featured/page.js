import Link from "next/link";
import {redirect} from "next/navigation";
import { accountContext } from "../../../lib/supabase/server";
import { publishedListingCard } from "../../../lib/cms";
import FeatureManager from "../content/[id]/feature-manager";
import SwapPositions from "./swap-positions";
import { effectiveEnd, formatIst, placementStatus, positionLabels, studioHref } from "./placements.mjs";
import "./studio.css";

export const metadata = {title:"Carousel & priority listings"};
const uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
const firstArg = value => typeof value === "string" ? value : "";

export default async function PlacementStudio({searchParams}) {
  const params = await searchParams;
  const kind = params.kind === "product" ? "product" : "opportunity";
  const isProduct = kind === "product";
  const q = firstArg(params.q).trim().slice(0,100);
  const rawOffset = Number(params.offset);
  const offset = Number.isSafeInteger(rawOffset) && rawOffset>=0 && rawOffset<=2147483647 ? rawOffset : 0;
  const requestedSlot = [1,2,3].includes(Number(params.slot)) ? Number(params.slot) : null;
  const record = uuid.test(firstArg(params.record)) ? params.record : null;
  const requestedPlacement = uuid.test(firstArg(params.placement)) ? params.placement : null;
  const {client} = await accountContext();
  const {data,error} = await client.rpc("ig_priority_workspace",{p:{kind,q,offset,record}});
  if (!params.kind && !error && !data?.can_manage) {
    const productAccess = await client.rpc("ig_priority_workspace",{p:{kind:"product",q:"",offset:0}});
    if (productAccess.data?.can_manage) redirect(studioHref({kind:"product"}));
  }
  const sections = [["opportunity","Property & leasing carousel"],["product","HORECA priority listings"]];
  const scope = {kind,q,offset,slot:requestedSlot};
  const canManage = data?.can_manage === true;
  const labels = positionLabels[kind];
  const rows = (data?.placements || []).filter(p => ["Live","Scheduled"].includes(placementStatus(p)));
  const current = rows.filter(p => placementStatus(p) === "Live");
  const scheduled = rows.filter(p => placementStatus(p) === "Scheduled").sort((a,b)=>Date.parse(a.starts_at)-Date.parse(b.starts_at));
  const items = data?.items || [];
  const firstOpen = labels.findIndex((label,index) => index>0 && !current.some(row => row.slot===index));
  const selectionSlot = requestedSlot || (firstOpen>0 ? firstOpen : 1);
  let selected = null, history = [], selectionFailed = false;
  if (canManage && record && data.selected) {
    const [report, publication] = await Promise.all([
      client.rpc(isProduct ? "ig_manage_product_priority" : "ig_manage_listing_feature", {p:{content_id:record,action:"report"}}),
      isProduct ? {data:data.selected} : publishedListingCard(client,record),
    ]);
    selectionFailed = Boolean(report.error || publication.error);
    if (!selectionFailed) {
      selected = publication.data;
      history = report.data || [];
    }
  }
  function editLink(row) {
    return <Link className="priority-action" href={studioHref({...scope,record:row.content_id,placement:row.id},"placement-editor")}>Edit placement<span className="visually-hidden"> for {row.title}</span></Link>;
  }
  return <div className="priority-studio">
    <header className="module-heading"><div><h2>Carousel &amp; priority listings</h2>
      <p>Promote sale opportunities, spaces for lease, brand requirements and HORECA products. Choose the position and schedule here.</p></div>
      <Link className="module-link" href={isProduct ? "/horeca#catalogue" : "/#real-estate-listings"}>View on website ↗</Link>
    </header>
    <nav className="priority-tabs" aria-label="Priority listing areas">{sections.map(([id,label])=>
      <Link href={studioHref({kind:id})} aria-current={kind===id?"page":undefined} key={id}>{label}</Link>)}
      <Link href="/admin/cms/site?section=disciplines">Practice banner</Link></nav>
    {error ? <section className="workspace-card" role="alert"><h3>Unable to load placements</h3><p>Refresh the page to try again.</p></section> :
     !canManage ? <p className="workspace-card">Your account needs publication access for this area.</p> : <>
      <section className="workspace-card" aria-labelledby="current-placements">
        <h3 id="current-placements">Live placements</h3>
        <ol className="priority-slots">{labels.slice(1).map((label,index)=>{
          const slot=index+1, row=current.find(x=>x.slot===slot);
          return <li key={slot}>
            <h4>{label}</h4>
            {row ? <><strong>{row.headline || row.title}</strong><small>Until {formatIst(effectiveEnd(row))} IST</small>{editLink(row)}</>
                 : <><span>Available</span><Link className="priority-action" href={studioHref({kind,slot},"published-selector")}>Choose {isProduct ? "product" : "listing"}</Link></>}
          </li>;
        })}</ol>
        {current.length>1 && <SwapPositions key={current.map(p=>p.id).sort().join(":")} kind={kind} placements={current}/>}
        {scheduled.length>0 && <><h3>Upcoming placements</h3><div className="table-scroll"><table className="workspace-table">
          <thead><tr><th>Position</th><th>{isProduct?"Product":"Property"}</th><th>Starts (IST)</th><th>Ends (IST)</th><th>Manage</th></tr></thead>
          <tbody>{scheduled.map(row=><tr key={row.id}><td>{labels[row.slot]}</td><td>{row.headline || row.title}</td><td>{formatIst(row.starts_at)}</td>
            <td>{formatIst(effectiveEnd(row))}</td><td>{editLink(row)}</td></tr>)}</tbody></table></div></>}
      </section>
      <section className="workspace-card" id="published-selector"><h3>{isProduct ? "Choose a published product" : "Choose a published property or leasing mandate"}</h3>
        <form action="/admin/featured#published-selector" method="get" className="priority-search"><input type="hidden" name="kind" value={kind}/>
          {requestedSlot && <input type="hidden" name="slot" value={requestedSlot}/>}
          <label>{isProduct?"Product, brand or SKU":"Property, brand or location"}<input key={q} name="q" defaultValue={q} maxLength={100} type="search"/></label>
          <button type="submit">Search</button>{q && <Link href={studioHref({kind,slot:requestedSlot},"published-selector")}>Clear search</Link>}
        </form>
        {items.length>0 ? <ul className="priority-results">{items.map(item=><li key={item.id}><div><strong>{item.title}</strong>
          <small>{(isProduct?[item.public_data?.brand,item.public_data?.sku]:[{retail_space:"For lease",retail_requirement:"Brand requirement",opportunity:"Opportunity"}[item.kind],item.public_data?.markets || item.public_data?.city,item.public_data?.region]).filter(Boolean).join(" · ")}</small></div>
          <Link className="priority-action" href={studioHref({...scope,record:item.id},"placement-editor")}>Configure<span className="visually-hidden"> {item.title}</span></Link></li>)}</ul> :
          <p>{q ? "No published records match this search." : "No published records are available on this page."}</p>}
        {(offset>0 || data.has_more) && <nav className="priority-pager" aria-label="Search result pages">
          {offset>0 && <Link href={studioHref({...scope,offset:Math.max(0,offset-(data.page_size || 24))},"published-selector")}>← Previous</Link>}
          {data.has_more && <Link href={studioHref({...scope,offset:offset+items.length},"published-selector")}>Next →</Link>}
        </nav>}
      </section>
      {record && <div id="placement-editor">{selected ? <FeatureManager key={[record,requestedPlacement,requestedSlot].join(":")}
        central kind={kind} contentId={record} card={selected} initial={history} requestedPlacement={requestedPlacement} defaultSlot={selectionSlot}/>
        : <p role="alert" className="workspace-card">{selectionFailed ? "Could not open this placement. Refresh the page to try again." : "This published record is unavailable."}</p>}</div>}
    </>}
  </div>;
}
