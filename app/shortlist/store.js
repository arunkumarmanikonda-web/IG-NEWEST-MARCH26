'use client';
import {useEffect,useState} from 'react';
import {normaliseShortlist,shortlistKey} from '../../lib/shortlist.mjs';
let state={ready:false,ids:[],local:[],account:false,error:''},pending=null;
const listeners=new Set();
function publish(next){state={...state,...next};for(const f of listeners)f(state);}
async function request(payload){const r=await fetch('/api/shortlist',payload?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}:{cache:'no-store'});const d=await r.json();if(r.status===401&&!payload)return null;if(!r.ok)throw Error(d.error||'Your shortlist could not be saved.');return d;}
async function load(){if(pending)return pending;pending=(async()=>{let local=[];try{local=normaliseShortlist(JSON.parse(localStorage.getItem(shortlistKey)||'[]'));}catch{}try{const d=await request();publish({ready:true,ids:d?.ids||local,local,account:!!d,error:''});}catch(e){publish({ready:true,ids:local,local,account:false,error:e.message});}})();try{return await pending;}finally{pending=null;}}
async function change(action,id){if(!state.ready)return;const before=state.ids;const next=action==='remove'?before.filter(x=>x!==id):normaliseShortlist([...before,id]);if(action==='add'&&before.length>=100)throw Error('Your shortlist can hold 100 listings. Remove one before adding another.');if(state.error)throw Error('Reconnect and reload before changing your shortlist.');if(state.account){const d=await request({action,id});publish({ids:d.ids});}else{localStorage.setItem(shortlistKey,JSON.stringify(next));publish({ids:next,local:next});}}
async function merge(){const d=await request({action:'merge',ids:state.local});localStorage.removeItem(shortlistKey);publish({ids:d.ids,local:[]});}
export function useShortlist(){const [value,setValue]=useState(state);useEffect(()=>{listeners.add(setValue);load();const focus=()=>{pending=null;load();};window.addEventListener('focus',focus);window.addEventListener('storage',focus);return()=>{listeners.delete(setValue);window.removeEventListener('focus',focus);window.removeEventListener('storage',focus);};},[]);return {...value,change,merge};}
