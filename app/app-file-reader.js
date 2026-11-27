'use client';

import {useEffect, useRef, useState} from 'react';
import {appFileLink} from '../lib/app-download.mjs';
import {hasInAppNavigation} from '../lib/mobile-workspace.mjs';

function Pdf({blob}) {
  const canvas = useRef(null);
  const [doc, setDoc] = useState(null), [page, setPage] = useState(1), [error, setError] = useState('');
  useEffect(() => {
    let task, closed = false;
    (async () => {
      const pdf = await import('pdfjs-dist/legacy/build/pdf.mjs');
      pdf.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url).toString();
      const data = await blob.arrayBuffer();
      if (closed) return;
      task = pdf.getDocument({data, isEvalSupported:false, useSystemFonts:true, maxImageSize:16000000});
      const document = await task.promise;
      if (!closed) setDoc(document);
    })().catch(() => { if (!closed) setError('This PDF could not be opened.'); });
    return () => { closed = true; void task?.destroy(); };
  }, [blob]);
  useEffect(() => {
    if (!doc) return;
    let closed = false, render;
    (async () => {
      const sheet = await doc.getPage(page);
      if (closed || !canvas.current) return;
      const normal = sheet.getViewport({scale:1});
      const viewport = sheet.getViewport({scale: Math.min(2, 1400 / normal.width, 1800 / normal.height)});
      canvas.current.width = Math.ceil(viewport.width);
      canvas.current.height = Math.ceil(viewport.height);
      render = sheet.render({canvas:canvas.current, viewport});
      await render.promise;
    })().catch(() => { if (!closed) setError('This page could not be displayed.'); });
    return () => {closed = true; render?.cancel();};
  }, [doc, page]);
  if (error) return <p role="alert">{error}</p>;
  return <>{doc ? <nav aria-label="Document pages"><button disabled={page<=1} onClick={()=>setPage(page-1)}>Previous</button> Page {page} of {doc.numPages} <button disabled={page>=doc.numPages} onClick={()=>setPage(page+1)}>Next</button></nav> : <p role="status">Opening PDF…</p>}<canvas ref={canvas} style={{maxWidth:'100%',height:'auto'}} aria-label={'Document page '+page}/></>;
}

async function officeText(blob, name) {
  const {unzipSync, strFromU8} = await import('fflate');
  const names = [];
  let expanded = 0;
  const entries = unzipSync(new Uint8Array(await blob.arrayBuffer()), {filter: item => {
    names.push(item.name);
    if (/\.zip$/i.test(name) || !/^(?:word\/document|ppt\/slides\/slide\d+|xl\/worksheets\/sheet\d+|xl\/sharedStrings)\.xml$/.test(item.name)) return false;
    expanded += item.originalSize;
    if (expanded > 16_000_000) throw Error('This document is too large to preview.');
    return true;
  }});
  if (/\.zip$/i.test(name)) return names.join('\n');
  const xml = bytes => new DOMParser().parseFromString(strFromU8(bytes), 'application/xml');
  const shared = entries['xl/sharedStrings.xml'];
  const strings = shared ? Array.from(xml(shared).getElementsByTagName('si'), e=>e.textContent) : [];
  return Object.keys(entries).filter(key=>key !== 'xl/sharedStrings.xml').sort((a,b)=>a.localeCompare(b,undefined,{numeric:true})).map(key=>{
    const root = xml(entries[key]);
    if (key.startsWith('xl/')) return Array.from(root.getElementsByTagName('row'),row=>
      Array.from(row.getElementsByTagName('c'),c=>c.getAttribute('t')==='s'?strings[Number(c.textContent)]||'':c.textContent).join('\t')).join('\n');
    return Array.from(root.getElementsByTagNameNS('*','p'),p=>p.textContent).join('\n');
  }).join('\n\n');
}

export default function AppFileReader() {
  const dialog = useRef(null), ticket = useRef(0), opener = useRef(null), abort = useRef(null);
  const [file,setFile] = useState(null);
  function close() { ticket.current++; abort.current?.abort(); setFile(null); opener.current?.focus(); }
  useEffect(()=>{
    if (!hasInAppNavigation(navigator.userAgent)) return;
    async function open({blob, name, href}) {
      const id = ++ticket.current;
      abort.current?.abort();
      abort.current = new AbortController();
      opener.current = document.activeElement;
      setFile({name: name || 'Document', loading:true});
      try {
        if (!blob) {
          const response = await fetch(href,{credentials:'same-origin',cache:'no-store',signal:abort.current.signal});
          if (!response.ok) throw Error('This file is unavailable or your access has changed.');
          if (!name) name = response.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/i)?.[1];
          blob = await response.blob();
        }
        if (id !== ticket.current) return;
        name ||= 'Document';
        const type = blob.type.toLowerCase();
        let next = {name,blob};
        if (type.includes('pdf') || /\.pdf$/i.test(name)) next.kind='pdf';
        else if (/^image\/(png|jpe?g|webp|gif)$/.test(type)) {next.kind='image'; next.src=URL.createObjectURL(blob);}
        else if (blob.size>32_000_000) throw Error('This file exceeds the in-app text preview limit.');
        else if (/\.((doc|ppt|xls)x|zip)$/i.test(name) || /officedocument|application\/zip/.test(type)) next.text = await officeText(blob,name);
        else if (/^text\/(plain|csv)|application\/json/.test(type) || /\.(csv|txt|json)$/i.test(name)) next.text = await blob.text();
        else throw Error('A preview is unavailable for this file type.');
        if (id === ticket.current) setFile(next);
        else if (next.src) URL.revokeObjectURL(next.src);
      } catch (e) { if (id === ticket.current) setFile({name:name||'Document',error:e.message}); }
    }
    function blobEvent(event) { event.preventDefault(); void open(event.detail); }
    function click(event) {
      const link=event.target.closest?.('a[href]');
      if (!link || !appFileLink(link.href,location.origin)) return;
      event.preventDefault(); event.stopPropagation();
      void open({href:link.href,name:link.download || link.dataset.filename});
    }
    function submit(event) {
      const form=event.target;
      if (form.method.toLowerCase()!=='get' || !appFileLink(form.action,location.origin)) return;
      event.preventDefault(); event.stopPropagation();
      const url=new URL(form.action); url.search=new URLSearchParams(new FormData(form)).toString();
      void open({href:url.href});
    }
    window.addEventListener('ig-open-file',blobEvent);
    document.addEventListener('click',click,true);
    document.addEventListener('submit',submit,true);
    return ()=>{ticket.current++;abort.current?.abort();window.removeEventListener('ig-open-file',blobEvent);document.removeEventListener('click',click,true);document.removeEventListener('submit',submit,true);};
  },[]);
  useEffect(()=>{ if (file && !dialog.current?.open) dialog.current?.showModal(); return ()=>{if(file?.src)URL.revokeObjectURL(file.src);}; },[file]);
  if (!file) return null;
  return <dialog ref={dialog} aria-label={file.name} onCancel={e=>{e.preventDefault();close();}} style={{width:'96vw',maxWidth:1000,maxHeight:'90dvh',overflow:'auto',padding:16}}>
    <header><button onClick={close}>Close document</button><h2>{file.name}</h2></header>
    {file.loading?<p role="status">Opening file…</p>:file.error?<p role="alert">{file.error}</p>:file.kind==='pdf'?<Pdf blob={file.blob}/>:file.kind==='image'?<img alt={file.name} src={file.src} style={{maxWidth:'100%'}}/>:<pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{file.text}</pre>}
  </dialog>;
}
