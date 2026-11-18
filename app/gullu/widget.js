"use client";
import {useEffect,useRef,useState} from "react";
import {usePathname} from "next/navigation";
import Link from "next/link";
import {contextualQuestions} from "../../lib/customer-experience.mjs";
import Avatar from "./animated-avatar";
import "./widget.css";

async function post(payload){
  const res=await fetch("/api/gullu",{method:"POST",cache:"no-store",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
  const data=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(data.error||"I couldn’t connect. Please try again.");return data;
}

export default function Gullu(){
  const page=usePathname(),starters=contextualQuestions(page),launcher=useRef(null),first=useRef(null),input=useRef(null),scroll=useRef(null),pending=useRef(null);
  const [open,setOpen]=useState(false),[guest,setGuest]=useState(null),[messages,setMessages]=useState([]),
    [question,setQuestion]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState(""),
    [language,setLanguage]=useState("auto"),[confirm,setConfirm]=useState(false),[receipt,setReceipt]=useState("");
  const [expression,setExpression]=useState("idle"),[restored,setRestored]=useState(false),[hasMore,setHasMore]=useState(false);
  const timer=useRef(null);
  function animate(mood){clearTimeout(timer.current);setExpression(mood);timer.current=setTimeout(()=>setExpression("idle"),1800);}
  useEffect(()=>{return ()=>clearTimeout(timer.current);},[]);
  const mood=busy?"thinking":expression!=="idle"?expression:question?"listening":"idle";
  useEffect(()=>{if(open)(guest?input:first).current?.focus();},[open,guest]);
  useEffect(()=>{const el=scroll.current;if(open&&el)el.scrollTop=el.scrollHeight;},[messages.length,busy,receipt,open]);
  function close(){setOpen(false);launcher.current?.focus();}
  useEffect(()=>{
    if(!open||restored)return;
    let cancelled=false;setBusy(true);
    fetch('/api/gullu',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(data=>{
      if(cancelled||!data?.session)return;
      setGuest({session_id:data.session.session_id,firstName:data.session.firstName});
      setMessages(data.session.messages);setHasMore(data.session.hasMore);
    }).catch(()=>{}).finally(()=>{if(!cancelled){setRestored(true);setBusy(false);}});
    return ()=>{cancelled=true;};
  },[open,restored]);
  async function older(){if(busy||!messages.length)return;setBusy(true);try{
    const r=await fetch('/api/gullu?before='+messages[0].turn_id,{cache:'no-store'});const d=await r.json();
    if(!d.session)throw new Error('This chat session expired. Start a new chat.');
    setMessages(items=>[...d.session.messages,...items]);setHasMore(d.session.hasMore);
  }catch(e){setError(e.message);}finally{setBusy(false);}}
  async function end(){if(busy)return;setBusy(true);try{await post({action:'end'});reset();}catch(e){setError(e.message);}finally{setBusy(false);}}
  function reset(){setHasMore(false);setGuest(null);setMessages([]);setQuestion("");setError("");setReceipt("");setConfirm(false);pending.current=null;}
  async function start(e){
    e.preventDefault();if(busy)return;const data=new FormData(e.currentTarget);setBusy(true);setError("");
    try{const result=await post({action:"start",name:data.get("name"),mobile:data.get("mobile"),email:data.get("email"),consent:data.has("consent")});
      animate("welcome");setGuest({...result,firstName:String(data.get("name")).trim().split(/\s+/)[0]});}
    catch(e){setError(e.message);}finally{setBusy(false);}
  }
  async function ask(text){
    const value=text.trim();if(!guest||!value||busy)return;
    if(pending.current?.question!==value)pending.current={question:value,turn_id:crypto.randomUUID()};
    setQuestion(value);setBusy(true);setError("");setConfirm(false);setReceipt("");
    try{const result=await post({action:"ask",session_id:guest.session_id,token:guest.token,...pending.current,language,page});
      animate("reply");setMessages(items=>[...items,result]);pending.current=null;setQuestion("");}
    catch(e){setError(e.message);}finally{setBusy(false);input.current?.focus();}
  }
  async function follow(){
    if(!guest||!messages.length||busy)return;setBusy(true);setError("");
    try{const result=await post({action:"followup",session_id:guest.session_id,token:guest.token,turn_id:messages.at(-1).turn_id,consent:true});
      setReceipt(result.reference);setConfirm(false);}
    catch(e){setError(e.message);}finally{setBusy(false);}
  }
  return <div className={"gullu"+(open?" g-open":"")}>
    <button className="g-launch" aria-label={open?"Close Gullu":"Ask Gullu"} aria-controls="gullu-chat" aria-expanded={open} onClick={()=>{if(open)close();else{setOpen(true);animate("welcome");}}} ref={launcher}><Avatar size={38} mood={open?mood:"idle"}/>Ask Gullu</button>
    {open&&<section id="gullu-chat" className="g-panel" role="dialog" aria-labelledby="g-title" onKeyDown={e=>{if(e.key==="Escape")close();}}>
      <header className="g-head"><button className="g-avatar-button" type="button" aria-label="Wave to Gullu" title="Wave to Gullu" onClick={()=>animate("wave")}><Avatar size={51} mood={mood}/></button><div><h2 id="g-title">Gullu</h2><p>Your India Gully buddy</p></div><button className="g-close" type="button" aria-label="Close chat" onClick={close}>×</button></header>
      {!guest?<div className="g-scroll g-welcome">
        <div className="g-hello"><Avatar size={72} mood={mood}/><h3>Namaste! I’m Gullu.</h3><p>Properties, hotel supplies, or a project on your mind? Let’s talk. English, Hindi or Hinglish works.</p></div>
        <div className="g-entry-context"><p>A few details help us keep your conversation together and connect you with the right India Gully colleague.</p><details><summary>Things we can explore together</summary><ul>{starters.map(t=><li key={t}>{t}</li>)}</ul></details></div>
        <form className="g-start" onSubmit={start}>
          <label>Your name<input name="name" autoComplete="name" ref={first} placeholder="First and last name" minLength={2} maxLength={100} required/></label>
          <label>Mobile number<input name="mobile" type="tel" autoComplete="tel" placeholder="With country code" maxLength={25} required/></label>
          <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" maxLength={254} required/></label>
          <label className="g-consent"><input type="checkbox" name="consent" required/><span>I agree that India Gully may save my details and chat for up to 90 days and share them with its advisory team for reporting and follow-up. <Link href="/privacy#gullu">Privacy notice</Link></span></label>
          {error&&<p role="alert" className="g-error">{error}</p>}
          <button className="g-primary" disabled={busy}>{busy?"Opening your chat…":"Let’s chat"} <span aria-hidden="true">↗</span></button>
        </form></div>:<>
        <div className="g-scroll" ref={scroll}>
          {!messages.length&&<p className="g-greeting">Namaste, {guest.firstName}! What’s on your mind?</p>}
          {!messages.length&&!busy&&<div className="g-starters">{starters.map(t=><button key={t} onClick={()=>ask(t)}>{t} <span>↗</span></button>)}</div>}
          {hasMore&&<button disabled={busy} onClick={older}>Read earlier messages</button>}
          <div className="g-log" role="log" aria-live="polite">{messages.map(m=><article key={m.turn_id}>
            <div className="g-question"><small>You</small><p>{m.question}</p></div>
            <div className="g-author"><strong>Gullu</strong></div>
            <div className="g-answer">{m.answer.split(/\n\s*\n/).map((p,i)=>p.startsWith("• ")?<ul key={i}>{p.split("\n").map(item=><li key={item}>{item.replace(/^• /,"")}</li>)}</ul>:<p key={i}>{p}</p>)}</div>
            {!!m.sources.length&&<details className="g-sources"><summary>Explore {m.sources.length===1?"this page":"these pages"} ({m.sources.length})</summary>{m.sources.map(s=><Link key={s.href} href={s.href} onClick={close}>{s.title} ↗</Link>)}</details>}
          </article>)}</div>
          {busy&&pending.current&&<div role="status" className="g-pending"><p>{pending.current.question}</p><span className="g-writing"><i/><i/><i/> <small>Gullu is writing</small></span></div>}
          {!!messages.length&&(messages.at(-1).practice_interest!=="General enquiry"||/team|टीम/i.test(messages.at(-1).answer))&&!receipt&&!busy&&<div className="g-team">{confirm?<><p>May our advisory team contact you about this question?</p><button onClick={follow}>Yes, contact me</button> <button onClick={()=>setConfirm(false)}>Cancel</button></>:<button onClick={()=>setConfirm(true)}>Ask the team to follow up ↗</button>}</div>}
          {receipt&&<div className="g-receipt" role="status">Your follow-up is with our team.<details><summary>View reference</summary>{receipt}</details></div>}
        </div>
        <div className="g-compose">{error&&<p role="alert" className="g-error">{error}</p>}
          <form onSubmit={e=>{e.preventDefault();ask(question);}}>
            <textarea ref={input} aria-label="Message Gullu" placeholder="Message Gullu…" maxLength={700} rows={1} value={question} onChange={e=>setQuestion(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();ask(question);}}}/>
            <button aria-label="Send message" disabled={busy||!question.trim()}>↑</button></form>
          <div className="g-tools"><select aria-label="Reply language" value={language} onChange={e=>setLanguage(e.target.value)}><option value="auto">Match my language</option><option>English</option><option>Hinglish</option><option value="Hindi">हिन्दी</option></select><button disabled={busy} onClick={end}>End chat</button></div>
        </div></>}
    </section>}
  </div>;
}
