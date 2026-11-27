// Resolve references from this conversation only. Never share answer/history
// caches across visitors, and never infer a preferred asset from an ambiguous list.
const tokens=s=>String(s||"").toLowerCase().replace(/जैसलकोट/gu,"jaisalkot").replace(/पार्क प्ला[ज़ज]ा/gu,"park plaza").match(/[\p{L}\p{M}\p{N}]+/gu)||[];
const generic=new Set("hotel hotels resort resorts heritage investment opportunity opportunities property properties development project commercial residential retail space office tower india gully limited private the and for with requirement requirements mandate leasing real estate".split(" "));
export function recentSources(history=[]) {
  for(const turn of history.slice().reverse()) {
    if(turn.sources?.length)return turn.sources.map(s=>typeof s==="string"?s:s.href);
    // Skip brief social acknowledgements, but stop at an unanswered new topic.
    if(tokens(turn.question).length>4)return [];
  }
  return [];
}
export function resolveSubjects(question,docs,history=[],page="/") {
  const q=String(question).toLowerCase(), words=new Set(tokens(q));
  const named=docs.filter(d=>["opportunity","retail_space","retail_requirement","product","person"].includes(d.kind)).map(d=>({d,score:tokens(d.title).filter(w=>w.length>3&&!generic.has(w)&&words.has(w)).length})).filter(x=>x.score>0);
  if(named.length){const best=Math.max(...named.map(x=>x.score));return named.filter(x=>x.score===best).map(x=>x.d);}
  const sources=recentSources(history), previous=sources.map(h=>docs.find(d=>d.href===h)).filter(Boolean);
  const ordinal=q.match(/\b(?:the |option |number |no )?(first|second|third|fourth|1st|2nd|3rd|4th|pehla|pehli|doosra|dusra|teesra)(?: one| option| property| wala)?\b/u);
  if(ordinal){const index={first:0,"1st":0,pehla:0,pehli:0,second:1,"2nd":1,doosra:1,dusra:1,third:2,"3rd":2,teesra:2,fourth:3,"4th":3}[ordinal[1]];return previous[index]?[previous[index]]:[];}
  if(/\b(?:it|its|that|this|there|same|iska|uska|isme|usme|iski|uski)\b|इसका|उसका|इसमें|उसमें/iu.test(q))return previous.length?previous:docs.filter(d=>d.href===page);
  // A short fact question immediately after an asset keeps that asset in focus.
  if(tokens(q).length<=9&&/\b(?:keys|rooms|area|size|price|moq|pack|sku|where|location|kamre|kahan|keemat)\b|कमरे|कहाँ|कीमत/u.test(q))return previous.length?previous:docs.filter(d=>d.href===page);
  return [];
}
export function factAnswer(question,docs,history=[],language="English",page="/") {
  if(/\b(?:compare|difference|why|should|recommend|best|guarantee|guaranteed|return|discount|not|isnt|isn't|was|used to|previous|earlier|changed|increased|decreased)\b/iu.test(question))return null;
  const wanted=[
    ["keys",/\b(?:keys|rooms|kamre|kamron)\b|कमरे|कमरों/iu],
    ["city",/\b(?:where|location|located|city|kahan|kidhar)\b|कहाँ|शहर/iu],
    ["area",/\b(?:area|size|sqft|square feet)\b|क्षेत्रफल/iu],
    ["price_label",/\b(?:price|cost|keemat|daam)\b|कीमत|दाम/iu],
    ["moq",/\b(?:moq|minimum order)\b/iu],
    ["pack_size",/\b(?:pack size|pieces per pack)\b/iu],
    ["sku",/\b(?:sku|product code)\b/iu],
  ].filter(([field,pattern])=>pattern.test(question)&&!(field==="area"&&/pack size/i.test(question)));
  if(!wanted.length)return null;
  // Complex requests need the reasoning route, not a partial field answer.
  if(/\b(?:also|but|with|including|availability|available|rent|lease|licen[cs]e|deadline|status|process|bank|fund|raise|operate|operating|buy|sell|lease|leasehold)\b/iu.test(question))return null;
  const targets=resolveSubjects(question,docs,history,page).filter(d=>["opportunity","product","retail_space","retail_requirement"].includes(d.kind));
  if(!targets.length)return null;
  const names=new Set(targets.flatMap(d=>tokens(d.title)));
  const allowed=new Set("how many much what whats is are the a an does do has have it its that this there located where location city area size sqft square feet keys rooms price cost current latest indicative moq minimum order pack pieces per sku product code of in for tell me please gullu hi hey second first third fourth one option number no 1st 2nd 3rd 4th pehla pehli doosra dusra teesra wala kitne kitna kamre kamron kahan kidhar hai hain iska uska iski uski isme usme keemat daam kya mujhe batao mein me total इसमें उसमें इसकी उसकी यह वह का के कितने कमरे कीमत क्या है कहाँ क्षेत्रफल".split(" "));
  if (wanted.length > 1) {
    for (const joiner of ["and", "aur", "और"]) allowed.add(joiner);
  }
  if(tokens(question).some(w=>!names.has(w)&&!allowed.has(w)))return null;
  const say=(en,mix,hi)=>language==="Hindi"?hi:language==="Hinglish"?mix:en;
  const sources=targets.slice(0,4).map(d=>({href:d.href,title:d.title}));
  if(targets.length>1)return {answer:say("Which one do you mean?", "Kis wale ki baat kar rahe hain?", "आप किसकी बात कर रहे हैं?")+"\n\n"+targets.slice(0,4).map((d,i)=>`${i+1}. ${d.title}`).join("\n"),sources,practice_interest:targets[0].interest||"General enquiry"};
  const d = targets[0];
  const labels = {
    keys: "", city: "", area: say("Area: ", "Area: ", "क्षेत्रफल: "),
    price_label: say("Indicative price: ", "Indicative price: ", "सांकेतिक कीमत: "),
    moq: say("Minimum order: ", "Minimum order: ", "न्यूनतम ऑर्डर: "),
    pack_size: say("Pack size: ", "Pack size: ", "पैक: "), sku: "SKU: ",
  };
  const details = [];
  for (const [field] of wanted) {
    const value = d.facts?.[field];
    // An incomplete set goes through retrieval and verification. Never silently
    // drop a requested field or borrow the missing value from another record.
    if (value == null || !String(value).trim()) return null;
    let detail = String(value).trim();
    if (field === "keys") detail += say(" keys", " keys", " कमरे");
    if (field === "city" && d.facts.region) detail += ", " + d.facts.region;
    if (field === "area") detail = [detail, d.facts.area_unit, d.facts.area_basis].filter(Boolean).join(" ");
    details.push(labels[field] + detail);
  }
  const pricing = wanted.some(([field]) => field === "price_label")
    ? say(" Current pricing and terms need confirmation.", " Current pricing aur terms confirm karne honge.", " वर्तमान कीमत और शर्तों की पुष्टि आवश्यक है।") : "";
  const status = d.availabilityNotice ? d.availabilityNotice + "\n\n" : "";
  return {answer: status + d.title + ": " + details.join(" · ") + "." + pricing, sources, practice_interest: d.interest || "General enquiry"};
}
