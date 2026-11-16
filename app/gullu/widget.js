"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import "./widget.css";

async function send(payload) {
  const response=await fetch("/api/gullu",{method:"POST",headers:{"Content-Type":"application/json"},
    cache:"no-store",body:JSON.stringify(payload)});
  const data=await response.json().catch(()=>({}));
  if (!response.ok) throw new Error(data.error || "Gullu could not connect. Please try again.");
  return data;
}

const starters=["What practices do you offer?", "What are your latest Perspectives?", "How can I source hotel supplies?"];

export default function Gullu() {
  const page=usePathname();
  const session=useRef(null),launcher=useRef(null),input=useRef(null),lastReply=useRef(null);
  const [open,setOpen]=useState(false),[question,setQuestion]=useState(""),[messages,setMessages]=useState([]);
  const [consent,setConsent]=useState(false),[working,setWorking]=useState(false),[error,setError]=useState("");
  const [follow,setFollow]=useState(null),[receipt,setReceipt]=useState(null);
  const last=messages.at(-1);

  useEffect(()=>{if(open) input.current?.focus();},[open]);
  useEffect(()=>{if(open && messages.length) lastReply.current?.scrollIntoView({block:"nearest"});},[messages]);
  function close(){setOpen(false);launcher.current?.focus();}
  function reset(){
    session.current=null;
    setMessages([]);setFollow(null);setReceipt(null);setQuestion("");setError("");setConsent(false);
    input.current?.focus();
  }
  async function ask(event) {
    event.preventDefault();
    if (!question.trim() || working) return;
    session.current??=crypto.randomUUID();
    setWorking(true);setError("");setFollow(null);
    try {
      const turn=await send({action:"ask",session_id:session.current,turn_id:crypto.randomUUID(),page,question,
        consent,history:messages.slice(-3).map(m=>({question:m.question,sources:m.sources.map(s=>s.href)}))});
      setMessages(items=>[...items,turn].slice(-24));setQuestion("");setReceipt(null);
      if (consent && !turn.recorded) setError("Your answer is ready, but this exchange could not be saved.");
    } catch(e){setError(e.message);}
    finally{setWorking(false);}
  }
  async function requestFollowup(event) {
    event.preventDefault();
    if (working || !follow) return;
    const form=new FormData(event.currentTarget);
    setWorking(true);setError("");
    try {
      const result=await send({...follow,action:"followup",consent:form.get("agree")==="on",
        name:form.get("name"),email:form.get("email")});
      setReceipt(result.reference);setFollow(null);
    } catch(e){setError(e.message);}
    finally{setWorking(false);}
  }
  return <div className="gullu">
    <button className="gullu-launch" ref={launcher} type="button" aria-label={open?"Close Gullu":"Ask Gullu"}
      aria-expanded={open} aria-controls="gullu-guide" onClick={()=>open?close():setOpen(true)}>
      <img src="/brand/mark.svg" width="17" height="25" alt=""/>Ask Gullu
    </button>
    {open && <section id="gullu-guide" className="gullu-panel" role="dialog" aria-labelledby="gullu-title"
      onKeyDown={e=>{if(e.key==="Escape"){e.stopPropagation();close();}}}>
      <header className="gullu-head"><div><h2 id="gullu-title">Gullu</h2><p>Your India Gully guide</p></div>
        <button type="button" aria-label="Close guide" onClick={close}>×</button></header>
      <div className="gullu-scroll">
        <p className="gullu-intro">Namaste, I’m Gullu, India Gully’s AI guide. I can help you explore properties, HORECA products, practices and Perspectives using India Gully’s published information.</p>
        {!messages.length && <div className="gullu-prompts">{starters.map(text=><button key={text} type="button"
          onClick={()=>{setQuestion(text);input.current?.focus();}}>{text}</button>)}</div>}
        <div role="log" aria-live="polite" aria-relevant="additions" className="gullu-log">{messages.map((m,i)=>
          <article key={m.turn_id} ref={i===messages.length-1?lastReply:null}>
            <p className="gullu-question"><strong>You</strong>{m.question}</p>
            <div className="gullu-reply"><strong>Gullu</strong><p>{m.answer}</p>
              {m.sources.length>0 && <ul aria-label="Published sources">{m.sources.map(s=><li key={s.href}>
                <Link href={s.href} onClick={()=>setOpen(false)}>{s.title}</Link></li>)}</ul>}</div>
          </article>)}</div>
        {last && !follow && !receipt && <button type="button" className="gullu-follow" disabled={working} onClick={()=>setFollow(last)}>Request a team follow-up</button>}
        {follow && <form className="gullu-follow-form" onSubmit={requestFollowup}>
          <h3>Ask our team to follow up</h3>
          <p>We’ll share your latest question, Gullu’s answer and your contact details with the advisory team. Your enquiry is kept separately in our client register.</p>
          <label>Name<input name="name" autoComplete="name" required minLength={2} maxLength={120}/></label>
          <label>Email<input name="email" type="email" autoComplete="email" required maxLength={254}/></label>
          <label className="gullu-check"><input type="checkbox" name="agree" required/>I agree to this enquiry being saved and to India Gully contacting me about it.</label>
          <div><button type="submit" disabled={working}>Send request</button><button type="button" disabled={working} onClick={()=>setFollow(null)}>Cancel</button></div>
        </form>}
        {receipt && <p role="status" className="gullu-receipt">Your follow-up is recorded. Reference {receipt}.</p>}
      </div>
      <form className="gullu-compose" onSubmit={ask}>
        <label htmlFor="gullu-message">Your question</label>
        <div className="gullu-entry"><textarea rows={2} ref={input} id="gullu-message" maxLength={700} value={question}
          placeholder="Ask about a property, product or service" onChange={e=>setQuestion(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter" && !e.shiftKey && !e.nativeEvent.isComposing){e.preventDefault();e.currentTarget.form.requestSubmit();}}}/>
          <button type="submit" disabled={working || !question.trim()}>{working?"Wait…":"Send"}</button></div>
        <label className="gullu-check"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>
          Save my next exchanges for up to 90 days for service improvement and internal reporting.</label>
        <p className="gullu-notice">OpenAI may process your questions. Please keep personal details out of chat. <Link href="/privacy">Privacy notice</Link></p>
        {error && <p role="alert" className="gullu-error">{error} <Link href="/contact">Contact the team</Link></p>}
        {messages.length>0 && <button type="button" disabled={working} className="gullu-new" onClick={reset}>Start a new chat</button>}
      </form>
    </section>}
  </div>;
}
