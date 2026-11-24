'use client';
import {useState} from 'react';
import {useShortlist} from './store';
export default function ShortlistButton({id,allowAdd=true}){const {ids,ready,change}=useShortlist(),[error,setError]=useState(''),[busy,setBusy]=useState(false);if(!id)return null;const saved=ids.includes(id);if(!allowAdd&&!saved)return null;return <div className="shortlist-control"><button type="button" className="shortlist-save" disabled={!ready||busy} aria-pressed={saved} onClick={async()=>{setBusy(true);setError('');try{await change(saved?'remove':'add',id);}catch(e){setError(e.message);}finally{setBusy(false);}}}>{saved?'♥ Saved to shortlist':'♡ Save to shortlist'}</button>{error&&<p role="alert">{error}</p>}</div>;}
