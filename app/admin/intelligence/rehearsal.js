"use client";
import {useState} from "react";
const examples=["KYA HORAHA HAI GULLU","What can we work on with India Gully?","I need to raise debt or equity for a hotel. Can you help?","Show me distressed hotel opportunities","How many keys does Jaisalkot have?","Tell me a joke"];
export default function Rehearsal(){
  const [question,setQuestion]=useState(""),[language,setLanguage]=useState("auto"),[turns,setTurns]=useState([]),[busy,setBusy]=useState(false),[error,setError]=useState("");
  async function ask(value){
    if(busy||!value.trim())return;setBusy(true);setError("");
    try{
      const response=await fetch("/api/admin/intelligence/rehearsal",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question:value,language,history:turns.slice(-6).map(t=>({question:t.question,answer:t.reply.answer,sources:t.reply.sources.map(s=>s.href)}))})});
      const data=await response.json();if(!response.ok)throw new Error(data.error||"Rehearsal unavailable.");
      setTurns(items=>[...items,{question:value,...data}]);setQuestion("");
    }catch(e){setError(e.message);}finally{setBusy(false);}
  }
  return <section className="workspace-card" id="gullu-rehearsal"><h3>Gullu rehearsal</h3>
    <p>Test Gullu against the current public website, including follow-up questions. These exchanges stay in this screen: they create no customer records, follow-ups or emails. Use fictional examples and public information.</p>
    <div className="gullu-rehearsal-examples">{examples.map(q=><button key={q} disabled={busy} onClick={()=>ask(q)}>{q}</button>)}</div>
    <div role="log" aria-live="polite">{turns.map((t,i)=><div className="intelligence-log" key={i}><p><strong>You</strong><br/>{t.question}</p><p style={{whiteSpace:"pre-wrap"}}><strong>Gullu</strong><br/>{t.reply.answer}</p>
      {t.reply.sources.map(s=><p key={s.href}><a href={s.href} target="_blank" rel="noreferrer">{s.title} ↗</a></p>)}
      <details><summary>{(t.diagnostics.total_ms/1000).toFixed(2)} seconds · {t.diagnostics.path.replaceAll("_"," ")}</summary><p>Retrieval: {t.diagnostics.retrieval_ms} ms · Configuration: {t.diagnostics.configuration_ms} ms · Answer: {t.diagnostics.generation_ms} ms · Verification: {t.diagnostics.verification_ms} ms. Independent reads overlap; the total measures the engine, excluding browser and sign-in checks.</p></details>
    </div>)}</div>
    <form onSubmit={e=>{e.preventDefault();ask(question);}}><label>Rehearsal question<textarea value={question} onChange={e=>setQuestion(e.target.value)} maxLength={700} required rows={2}/></label>
      <label>Reply language <select value={language} onChange={e=>setLanguage(e.target.value)}><option value="auto">Match the question</option><option>English</option><option>Hinglish</option><option>Hindi</option></select></label>
      <button disabled={busy||!question.trim()}>{busy?"Checking answer…":"Test Gullu"}</button> <button type="button" disabled={busy} onClick={()=>{setTurns([]);setError("");}}>New rehearsal</button>
    </form>{error&&<p role="alert">{error}</p>}
  </section>;
}
