import {contentPath} from './content-routes.mjs';
import {readRegister} from './registers.mjs';

const normal=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[’']/g,'').replace(/[^\p{L}\p{M}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();
const aliases={gurgaon:'Gurugram',gurugram:'Gurugram',bangalore:'Bengaluru',bengaluru:'Bengaluru',noida:'Noida','greater noida':'Greater Noida',delhi:'Delhi','new delhi':'New Delhi',mumbai:'Mumbai',bombay:'Mumbai','नोएडा':'Noida','गुरुग्राम':'Gurugram','गुड़गांव':'Gurugram','दिल्ली':'Delhi','लुधियाना':'Ludhiana'};
const cityName=s=>aliases[normal(s)]||String(s||'').trim().replace(/\b\p{L}/gu,c=>c.toUpperCase());
const sameCity=(a,b)=>normal(cityName(a))===normal(cityName(b));
const assetPatterns=[['hotel',/\b(?:hotels?|resorts?|hospitality)\b|होटल|रिसॉर्ट/gu],['office',/\boffices?\b|ऑफिस|कार्यालय/gu],['retail',/\b(?:retail(?: spaces?)?|shops?)\b|दुकान/gu],['warehouse',/\bwarehouses?\b|गोदाम/gu],['land',/\b(?:land|plots?)\b|ज़मीन|जमीन/gu]];
const filler=new Set('hi hey hello gullu do does you we your our have has any a an the there is are i am im looking look search searching for find show me please want need got listed listing listings published public property properties opportunity opportunities available in at around near of to and or can could would about what whats buy purchase invest investment sale lease leasing rent rental book booking stay one some also else only mujhe aap aapke paas hai hain mein me chahiye dikhao kya koi ka ke ki kharidna khareedna kiraye par mujhe आपके पास में है हैं कोई क्या मुझे चाहिए दिखाओ खरीदना किराये पर'.split(' '));
const casual=/^(?:hi|hello|hey|thanks|thank you|love (?:u|you)|ok|okay|hmm|namaste|shukriya)[\s.!]*$/iu;

// This is a bounded search grammar, not a replacement for reasoning. Unknown
// criteria (budget, size, operating status, named assets, etc.) stay with the
// model and are never silently dropped to make a shortcut match.
function parseSearch(question,previous,knownCities=[]){
  const q=normal(question);let rest=q;
  const assets=assetPatterns.filter(([,p])=>new RegExp(p.source,p.flags).test(q)).map(([id])=>id);
  if(new Set(assets).size>1)return null;
  for(const [,p] of assetPatterns)rest=rest.replace(p,' ');
  const cities=[...new Set([...Object.keys(aliases),...knownCities.map(normal)])].sort((a,b)=>b.length-a.length);
  const cityHits=[];
  for(const city of cities){
    if((' '+rest+' ').includes(' '+city+' ')){cityHits.push(cityName(city));rest=(' '+rest+' ').replaceAll(' '+city+' ',' ').trim();}
  }
  if(cityHits.length>1)return null;
  let city=cityHits[0];
  // An unrecognised place can still be searched. Accept only a trailing place
  // phrase, never "near X", a second city, or an arbitrary extra requirement.
  if(!city){
    const location=rest.match(/\b(?:in|at) ([\p{L}\p{M} ]+?)(?=\s+for\s|$)/u);
    if(location){const words=location[1].trim().split(/\s+/);if(words.length<=4&&words.every(w=>!filler.has(w))){city=cityName(location[1]);rest=rest.replace(location[0],' ');}}
  }
  if(!city&&previous&&/^(?:what about|how about|and|aur) /u.test(q)){
    const value=q.replace(/^(?:what about|how about|and|aur) /u,'');
    if(value.split(' ').length<=3&&value.split(' ').every(w=>!filler.has(w))){city=cityName(value);rest='';}
  }
  if(/\b(?:near|nearby|around|except|not|without|rather than|outside|within|all|anywhere|elsewhere)\b/iu.test(q))return null;
  if(rest.split(/\s+/).filter(Boolean).some(w=>!filler.has(w)))return null;
  const asset=assets[0]||previous?.asset;
  if(!asset||(!assets.length&&!previous))return null;
  // "Can you design a hotel" must never be interpreted as inventory; the
  // strict remainder vocabulary above also rejects supplies and brand names.
  if(!city)city=previous?.city;
  const purposes=[[/\b(?:buy|purchase|invest|investment|sale|kharidna|khareedna)\b|खरीदना/u,'buy'],[/\b(?:lease|leasing|rent|rental|kiraye)\b|किराये/u,'lease'],[/\b(?:book|booking|stay)\b/u,'stay']].filter(([p])=>p.test(q)).map(([,v])=>v);
  if(purposes.length>1)return null;
  if(!city)return null;
  return {asset,city,purpose:purposes[0]||previous?.purpose||null};
}

export function inventoryRequest(question,history=[],knownCities=[]){
  let previous=null,complex=false;
  for(const turn of history.slice(-10)){
    const next=parseSearch(turn.question,previous,knownCities);
    if(next)previous=next;
    else if(!casual.test(String(turn.question||'').trim())){
      // A budget/operating-status/other compound brief must not disappear when
      // the next message only changes the city. Keep that search with AI.
      if(assetPatterns.some(([,p])=>new RegExp(p.source,p.flags).test(normal(turn.question)))||((previous||complex)&&/^(?:what about|how about|and |aur |under |below |budget|only |for |buy|lease|rent|book|stay|nearby|anywhere|elsewhere)/iu.test(turn.question)))complex=true;
      else {previous=null;complex=false;}
    }
  }
  if(complex)return null;
  return parseSearch(question,previous,knownCities);
}

export function needsInventory(question,history=[]){
  // Broad retrieval trigger. Only the stricter parser may issue an exact
  // search result. This also makes inventory available for complex questions.
  const mentions=s=>assetPatterns.some(([,p])=>new RegExp(p.source,p.flags).test(normal(s)))||/\b(?:properties|property|listings?|opportunities)\b/iu.test(s);
  return mentions(question)||Boolean(inventoryRequest(question,history))||(/^(?:what about|how about|and |aur |buy|lease|rent|book|stay|nearby|anywhere|elsewhere|only )/iu.test(question)&&history.slice(-5).some(t=>mentions(t.question)));
}

export async function readPublicInventory(client){
  const {data,error}=await readRegister(()=>client.from('ig_public_content')
    .select('id,kind,slug,title,public_data,published_at').in('kind',['opportunity','retail_space','retail_requirement']));
  if(error)throw new Error('Published inventory unavailable');
  return inventorySnapshot(data);
}

export function inventorySnapshot(records){
  const items=records.filter(r=>['opportunity','retail_space','retail_requirement'].includes(r.kind)&&(!r.status||r.status==='published')&&/^[a-z0-9][a-z0-9_-]*$/i.test(r.slug||'')).map(r=>{
    const p=r.public_data||{},value=k=>['string','number'].includes(typeof p[k])?String(p[k]).trim():'';
    return {kind:r.kind,href:contentPath(r),title:r.title,city:value('city'),region:value('region'),assetClass:value('asset_class'),sector:value('sector'),formats:value('formats'),transaction:value('transaction_type'),reference:value('reference'),availability:value('availability')};
  });
  return {complete:true,items};
}

function assetMatch(item,asset){
  const value=[item.assetClass,item.formats].filter(Boolean).join(' ')||[item.title,item.sector].join(' ');
  return new RegExp(assetPatterns.find(([id])=>id===asset)[1].source,'iu').test(value);
}
const portfolio=item=>/portfolio reference/i.test(item.reference);
function matchInventory(snapshot,request){
  return snapshot.items.filter(item=>item.kind!=='retail_requirement'&&sameCity(item.city,request.city)&&assetMatch(item,request.asset))
    .filter(item=>!request.purpose||request.purpose==='stay'||(request.purpose==='lease'?(item.kind==='retail_space'||/\blease\b/i.test(item.transaction)):item.kind==='opportunity'&&/sale|investment|resolution|insolvency/i.test(item.transaction)));
}
const labels={hotel:'hotel',office:'office',retail:'retail space',warehouse:'warehouse',land:'land'};

export function inventoryAnswer(question,snapshot,history=[],language='English'){
  if(!snapshot?.complete)return null;
  const request=inventoryRequest(question,history,snapshot.items.map(i=>i.city).filter(Boolean));
  if(!request)return null;
  const {asset,city,purpose}=request,say=(en,mix,hi)=>language==='Hindi'?hi:language==='Hinglish'?mix:en;
  if(purpose==='stay')return {answer:say('I can help you explore hotel properties for investment or leasing, but I can’t check room bookings or live room availability here. For a stay in '+city+', please check directly with a hotel or booking service.','Main hotel investment aur leasing options explore karne mein madad kar sakta hoon; room booking ya live room availability check nahi kar sakta. '+city+' mein stay ke liye hotel ya booking service se check karein.','मैं होटल निवेश और लीज़ के विकल्प खोजने में मदद कर सकता हूँ; यहाँ कमरे की बुकिंग या तत्काल उपलब्धता नहीं जाँच सकता। '+city+' में ठहरने के लिए होटल या बुकिंग सेवा से संपर्क करें।'),sources:[],practice_interest:'Hospitality'};
  const matches=matchInventory(snapshot,request),current=matches.filter(i=>!portfolio(i)),references=matches.filter(portfolio),label=labels[asset];
  let answer,sources=[];
  if(current.length){
    const list=current.slice(0,3);
    answer=say('I found '+(list.length===1?'this '+label+' listing':'these '+label+' listings')+' in '+city+':',city+' mein yeh '+label+' listings mili hain:',city+' में ये प्रकाशित '+label+' विकल्प मिले हैं:')+'\n\n'+list.map((i,n)=>(n+1)+'. '+i.title+'\n'+[i.city,i.assetClass||i.formats,i.transaction].filter(Boolean).join(' · ')).join('\n\n')+'\n\n'+say('Current availability and terms need confirmation.','Current availability aur terms confirm karne honge.','वर्तमान उपलब्धता और शर्तों की पुष्टि आवश्यक है।');
    sources=list.map(i=>({title:i.title,href:i.href}));
  }else{
    const route=purpose==='lease'?say(' for lease',' lease par',' लीज़ के लिए'):purpose==='buy'?say(' for purchase or investment',' purchase ya investment ke liye',' खरीद या निवेश के लिए'):'';
    answer=say('I don’t see a current '+label+' listing'+route+' in '+city+' on our public site.',city+' mein abhi hamari public listings mein '+label+route+' nahi dikh raha.','अभी हमारी सार्वजनिक लिस्टिंग में '+city+' का '+label+route+' नहीं दिख रहा।');
    if(references.length){answer+=' '+say('We do have a portfolio reference there, but it is not a current offer.','Wahan ek portfolio reference hai, lekin woh current offer nahi hai.','वहाँ एक पोर्टफोलियो संदर्भ है, लेकिन वह वर्तमान प्रस्ताव नहीं है।');sources=references.slice(0,1).map(i=>({title:i.title,href:i.href}));}
  }
  if(!purpose)answer+='\n\n'+(asset==='hotel'?say('Are you looking to buy/invest, lease a hotel, or book a stay?','Aap hotel kharidna/invest karna, lease par lena, ya stay book karna chahte hain?','आप होटल खरीदना/निवेश करना, लीज़ पर लेना या ठहरने की बुकिंग करना चाहते हैं?'):say('Are you looking to buy or lease?','Aap kharidna chahte hain ya lease par lena?','आप खरीदना चाहते हैं या लीज़ पर लेना?'));
  else if(!current.length)answer+='\n\n'+say('Would you consider another city, or shall we keep the search to '+city+'?','Kya doosra shehar bhi dekhein, ya search '+city+' tak rakhein?', 'क्या दूसरे शहर भी देखें या खोज '+city+' तक रखें?');
  return {answer,sources,practice_interest:purpose==='lease'?'Retail & Leasing':'Real estate'};
}

export function inventoryPassages(snapshot,question='',history=[]){
  if(!snapshot?.complete)return [];
  // Each source keeps its own identity and qualifications. Even a complete
  // public directory says nothing about private/off-market mandates.
  const query=normal(question+' '+(history.at(-1)?.question||''));
  const words=query.split(' ').filter(w=>w.length>2&&!filler.has(w)).map(w=>normal(cityName(w)).replace(/s$/u,''));
  const types=assetPatterns.filter(([,p])=>new RegExp(p.source,p.flags).test(query)).map(([id])=>id);
  return snapshot.items.map(i=>({item:i,score:words.reduce((n,w)=>n+Number(normal([i.title,cityName(i.city),i.assetClass,i.formats,i.transaction].join(' ')).includes(w)),0)+Number(types.some(type=>assetMatch(i,type)))})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,8).map(({item:i})=>({kind:'inventory',title:i.title,href:i.href,interest:'Real estate',text:[i.kind==='retail_requirement'?'Brand requirement, not space offered':portfolio(i)?'Portfolio reference, not a current offer':'Published property listing; current availability and terms require confirmation',i.city&&'City · '+i.city,i.assetClass&&'Asset class · '+i.assetClass,i.formats&&'Formats · '+i.formats,i.transaction&&'Transaction · '+i.transaction,i.availability&&'Availability · '+i.availability].filter(Boolean).join('. ')}));
}

// Only the complete structured search above may state an absence. A model
// cannot establish this from selected snippets, even with a plausible citation.
export function inventoryAbsenceClaim(text){
  return /\b(?:we|i|our (?:site|website|listings?|inventory)) (?:do not|dont|don't|does not|doesnt|doesn't|have no|has no|cannot|cant|can't|could not|couldnt|couldn't) (?:\w+\s+){0,6}(?:hotels?|resorts?|properties|offices?|listings?|warehouses?|spaces?|land)\b|\bno (?:\w+\s+){0,5}(?:hotels?|resorts?|properties|offices?|listings?|warehouses?|spaces?) (?:are |is )?(?:listed|available|published|in\b)|\b(?:hotels?|properties|offices?|listings?) (?:\w+\s+){0,5}(?:not listed|not available|not published)\b/iu.test(text);
}
