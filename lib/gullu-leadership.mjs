const normalize=s=>String(s||"").normalize("NFKC").toLowerCase().replace(/gully[’']s/gi,"gully").replace(/[’']/g,"").replace(/[^\p{L}\p{M}\p{N}\s]/gu," ").replace(/\s+/g," ").trim();

export function leadershipIntent(question){
  const q=normalize(question);
  return /\b(?:boss|top executive|founder|cofounder|leadership|managing director|md|ceo|chief executive|executive director|in charge|incharge|owner|owns|malik|maalik|sansthapak)\b|\bwho (?:runs|heads|leads|started|founded)\b|\bwho .*\bhead\b|मालिक|बॉस|संस्थापक|प्रबंध निदेशक|नेतृत्व/u.test(q);
}

export function leadershipAnswer(question,docs,language="English"){
  if(!leadershipIntent(question))return null;
  const q=normalize(question),people=docs.filter(d=>d.kind==="person");
  // Scope matters: "my boss needs finance" and "who runs CBRE" must not
  // turn into an answer about our MD. Unknown or compound questions use AI.
  const names=new Set(people.flatMap(p=>normalize(p.title).split(" ")));
  const allowed=new Set("hi hello hey namaste gullu india gully who whos is are the a an you your our and this company firm business team at of in for runs heads leads running heading leading founder founded started cofounder managing director md executive boss head main big top person charge incharge tell me about please kaun kon hai hain aapka aapki aapke hamare humare yahan ka ki ke ko aur chalata chalate chief leadership नाम कौन है हैं आपके आपका आपकी हमारे का के की में बॉस संस्थापक प्रबंध निदेशक नेतृत्व".split(" "));
  if(q.split(" ").some(word=>!allowed.has(word)&&!names.has(word)))return null;
  const role=d=>d.role||d.chunks.slice(0,2).filter(s=>!/\b(?:former|previous|retired|was|not|no longer)\b/i.test(s)).join(" ");
  if(/\bleadership\b/u.test(q)&&people.length){
    const list=people.filter(d=>d.role);
    if(!list.length)return null;
    return {answer:(language==="Hindi"?"हमारी नेतृत्व टीम:":language==="Hinglish"?"Yeh hai hamari leadership team:":"Meet our leadership team:")+"\n\n"+list.map(d=>"• "+d.title+", "+d.role).join("\n"),sources:list.map(d=>({title:d.title,href:d.href})),practice_interest:"Leadership"};
  }
  const wanted=/\bexecutive director\b/u.test(q)?/\bexecutive director\b/i:/\bfounder\b|संस्थापक/u.test(q)&&!(/\b(?:boss|md|managing director)\b|प्रबंध निदेशक/u.test(q))?/\bfounder\b/i:/\bmanaging director\b/i;
  const matches=people.filter(d=>wanted.test(role(d)));
  if(matches.length!==1)return null;
  const person=matches[0],actual=role(person);
  let title=/\bmanaging director\b/i.test(actual)?(/\bfounder\b/i.test(actual)?"Founder and Managing Director":"Managing Director"):/\bexecutive director\b/i.test(actual)?"Executive Director":"Founder";
  const hi={"Founder and Managing Director":"संस्थापक और प्रबंध निदेशक","Managing Director":"प्रबंध निदेशक","Executive Director":"कार्यकारी निदेशक","Founder":"संस्थापक"}[title];
  const answer=language==="Hindi"?`${person.title} हमारे ${hi} हैं।`:language==="Hinglish"?`${person.title} hamare ${title} hain.`:`${person.title} is our ${title}.`;
  return {answer,sources:[{title:person.title,href:person.href}],practice_interest:"Leadership"};
}

// Source checking is internal. A missing retrieved passage cannot establish
// that information does not exist on the website or in company records.
export function hasInternalEvidenceLanguage(text){
  return /\b(?:provided|supplied|retrieved) (?:evidence|passages|context)\b|\b(?:evidence|passages|context) (?:does not|do not|doesnt|dont|doesn't|don't) (?:specify|include|state|mention|contain|confirm)\b|\bnot (?:provided|included) in (?:the |this )?(?:evidence|context|passages)\b/iu.test(text);
}
