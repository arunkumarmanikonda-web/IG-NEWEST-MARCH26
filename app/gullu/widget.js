"use client";
import {useEffect,useRef,useState} from "react";
import {usePathname} from "next/navigation";
import Link from "next/link";
import "./widget.css";

async function post(payload){
  const res=await fetch("/api/gullu",{method:"POST",cache:"no-store",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
  const data=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(data.error||"I couldn’t connect. Please try again.");return data;
}
function Avatar({size=40}){return <img className="g-avatar" src="/brand/gullu.webp" width={size} height={size} alt=""/>;}
const starters=["Find a distressed property","What does India Gully do?","Hotel supplies chahiye"];
export default function Gullu(){
  const page=usePathname(),launcher=useRef(null),first=useRef(null),input=useRef(null),scroll=useRef(null),pending=useRef(null);
  const [open,setOpen]=useState(false),[guest,setGuest]=useState(null),[messages,setMessages]=useState([]),
    [question,setQuestion]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState(""),
    [language,setLanguage]=useState("auto"),[confirm,setConfirm]=useState(false),[receipt,setReceipt]=useState("");
  useEffect(()=>{if(open)(guest?input:first).current?.focus();},[open,guest]);
  useEffect(()=>{const el=scroll.current;if(open&&el)el.scrollTop=el.scrollHeight;},[messages.length,busy,receipt,open]);
  function close(){setOpen(false);launcher.current?.focus();}
  function reset(){setGuest(null);setMessages([]);setQuestion("");setError("");setReceipt("");setConfirm(false);pending.current=null;}
  async function start(e){
    e.preventDefault();if(busy)return;const data=new FormData(e.currentTarget);setBusy(true);setError("");
    try{const result=await post({action:"start",name:data.get("name"),mobile:data.get("mobile"),email:data.get("email"),consent:data.has("consent")});
      setGuest({...result,firstName:String(data.get("name")).trim().split(/\s+/)[0]});}
    catch(e){setError(e.message);}finally{setBusy(false);}
  }
  async function ask(text){
    const value=text.trim();if(!guest||!value||busy)return;
    if(pending.current?.question!==value)pending.current={question:value,turn_id:crypto.randomUUID()};
    setQuestion(value);setBusy(true);setError("");setConfirm(false);setReceipt("");
    try{const result=await post({action:"ask",session_id:guest.session_id,token:guest.token,...pending.current,language,page});
      setMessages(items=>[...items,result]);pending.current=null;setQuestion("");}
    catch(e){setError(e.message);}finally{setBusy(false);input.current?.focus();}
  }
  async function follow(){
    if(!guest||!messages.length||busy)return;setBusy(true);setError("");
    try{const result=await post({action:"followup",session_id:guest.session_id,token:guest.token,turn_id:messages.at(-1).turn_id,consent:true});
      setReceipt(result.reference);setConfirm(false);}
    catch(e){setError(e.message);}finally{setBusy(false);}
  }
  return <div className="gullu">
    <button className="g-launch" aria-label={open?"Close Gullu":"Ask Gullu"} aria-controls="gullu-chat" aria-expanded={open} onClick={()=>open?close():setOpen(true)} ref={launcher}><Avatar size={36}/>Ask Gullu</button>
    {open&&<section id="gullu-chat" className="g-panel" role="dialog" aria-labelledby="g-title" onKeyDown={e=>{if(e.key==="Escape")close();}}>
      <header className="g-head"><Avatar size={46}/><div><h2 id="g-title">Gullu</h2><p>Your India Gully buddy</p></div><button type="button" aria-label="Close chat" onClick={close}>×</button></header>
      {!guest?<div className="g-scroll g-welcome">
        <div className="g-hello"><Avatar size={68}/><h3>Namaste! I’m Gullu.</h3><p>Properties, hotel supplies, or a project on your mind? Let’s talk. English, Hindi or Hinglish works.</p></div>
        <form className="g-start" onSubmit={start}>
          <label>Your name<input name="name" autoComplete="name" ref={first} placeholder="First and last name" minLength={2} maxLength={100} required/></label>
          <label>Mobile number<input name="mobile" type="tel" autoComplete="tel" placeholder="With country code" maxLength={25} required/></label>
          <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" maxLength={254} required/></label>
          <label className="g-consent"><input type="checkbox" name="consent" required/><span>I agree that India Gully may save my details and chat for up to 90 days and share them with its advisory team for reporting and follow-up. <Link href="/privacy#gullu">Privacy notice</Link></span></label>
          {error&&<p role="alert" className="g-error">{error}</p>}
          <button className="g-primary" disabled={busy}>{busy?"Opening your chat…":"Let’s chat"} <span aria-hidden="true">↗</span></button>
        </form></div>:<>
        <div className="g-scroll" ref={scroll}>
          <p className="g-greeting">Namaste, {guest.firstName}! What would you like to explore?</p>
          {!messages.length&&!busy&&<div className="g-starters">{starters.map(t=><button key={t} onClick={()=>ask(t)}>{t} <span>↗</span></button>)}</div>}
          <div className="g-log" role="log" aria-live="polite">{messages.map(m=><article key={m.turn_id}>
            <div className="g-question"><small>You</small><p>{m.question}</p></div>
            <div className="g-author"><Avatar size={27}/><strong>Gullu</strong></div>
            <div className="g-answer">{m.answer.split(/\n\s*\n/).map((p,i)=>p.startsWith("• ")?<ul key={i}>{p.split("\n").map(item=><li key={item}>{item.replace(/^• /,"")}</li>)}</ul>:<p key={i}>{p}</p>)}</div>
            {!!m.sources.length&&<details className="g-sources"><summary>Explore {m.sources.length===1?"this page":"these pages"} ({m.sources.length})</summary>{m.sources.map(s=><Link key={s.href} href={s.href} onClick={close}>{s.title} ↗</Link>)}</details>}
          </article>)}</div>
          {busy&&pending.current&&<div role="status" className="g-pending"><p>{pending.current.question}</p><small>Gullu is writing…</small></div>}
          {!!messages.length&&!receipt&&!busy&&<div className="g-team">{confirm?<><p>May our advisory team contact you about this question?</p><button onClick={follow}>Yes, contact me</button> <button onClick={()=>setConfirm(false)}>Cancel</button></>:<button onClick={()=>setConfirm(true)}>Ask the team to follow up ↗</button>}</div>}
          {receipt&&<p role="status">Our team has your request. Reference {receipt}.</p>}
        </div>
        <div className="g-compose">{error&&<p role="alert" className="g-error">{error}</p>}
          <form onSubmit={e=>{e.preventDefault();ask(question);}}>
            <textarea ref={input} aria-label="Message Gullu" placeholder="Message Gullu…" maxLength={700} rows={1} value={question} onChange={e=>setQuestion(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();ask(question);}}}/>
            <button aria-label="Send message" disabled={busy||!question.trim()}>↑</button></form>
          <div className="g-tools"><select aria-label="Reply language" value={language} onChange={e=>setLanguage(e.target.value)}><option value="auto">Match my language</option><option>English</option><option>Hinglish</option><option value="Hindi">हिन्दी</option></select><button disabled={busy} onClick={reset}>End chat</button></div>
        </div></>}
    </section>}
  </div>;
}
