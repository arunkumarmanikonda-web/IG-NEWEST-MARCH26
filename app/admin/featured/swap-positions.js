"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {browserClient} from "../../../lib/supabase/browser";
import {positionLabels} from "./placements.mjs";

export default function SwapPositions({kind,placements}) {
  const router=useRouter();
  const [firstId,setFirstId]=useState(placements[0].id);
  const [secondId,setSecondId]=useState(placements[1].id);
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState("");
  function changeFirst(id) {
    setFirstId(id);
    if (id===secondId) setSecondId(firstId);
    setNotice("");
  }
  async function swap(event) {
    event.preventDefault();
    const first=placements.find(row=>row.id===firstId), second=placements.find(row=>row.id===secondId);
    if (busy || !first || !second || first.id===second.id) return;
    setBusy(true);setNotice("");
    try {
      const {error} = await browserClient().rpc("ig_swap_priority_positions",{p:{
        kind,first_id:first.id,first_version:first.version,second_id:second.id,second_version:second.version,
      }});
      if (error) throw Error(error.message);
      setNotice("Positions swapped.");router.refresh();
    } catch(error) {setNotice(error.message || "Could not swap these positions. Refresh and try again.");}
    finally {setBusy(false);}
  }
  const option=row=><option key={row.id} value={row.id}>{positionLabels[kind][row.slot]} · {row.headline || row.title}</option>;
  return <details><summary>Swap two live positions</summary>
    <form className="workspace-form" onSubmit={swap}>
      <label>First placement<select value={firstId} onChange={e=>changeFirst(e.target.value)}>{placements.map(option)}</select></label>
      <label>Swap with<select value={secondId} onChange={e=>{setSecondId(e.target.value);setNotice("");}}>{placements.filter(row=>row.id!==firstId).map(option)}</select></label>
      <div className="workspace-actions wide"><button disabled={busy}>Swap positions</button></div>
    </form>{notice && <p role="status" className="portal-message">{notice}</p>}
  </details>;
}
