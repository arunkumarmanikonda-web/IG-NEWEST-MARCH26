import {recentSources} from "./gullu-context.mjs";
import {siteRecordSlugs} from "./site-cms-records.mjs";
import {distressIntent,isPublicPath,terms} from "./gullu.mjs";

// Public-only retrieval, injected clients make the real query policy testable.
export async function retrieveGulluRows(client,publishedOpportunities,question,history,page){
  const words=[...new Set([...terms(question),...terms(history.at(-1)?.question)])].slice(0,7);
  const paths=[page,...recentSources(history)].filter(isPublicPath);
  const slugs=paths.map(p=>p.split("/").at(-1)).filter(s=>/^[a-z0-9_-]{2,125}$/i.test(s));
  const filters=[...new Set(slugs)].map(s=>"slug.eq."+s);
  const recent=/\b(latest|archive|recent|newest|perspectives?|insights?|articles?)\b/i.test(question);
  // Keep the small published leadership directory available for every factual
  // question. A role synonym or a large batch of CMS pages must not hide it.
  const groups=[["person"],["opportunity"],["retail_space","retail_requirement"],["product"],["article"],["project","faq","page"]];
  const lists=await Promise.all(groups.map(async kinds=>{
    const product=kinds.includes("product"),leadership=kinds[0]==="person";
    const fields=["title","summary","body",...(product?["public_data->>sku","public_data->>brand","public_data->>category"]:["public_data->>city"])];
    const queryFilters=[...filters,...words.flatMap(w=>fields.map(k=>k+".ilike.*"+w+"*"))];
    const columns="kind,slug,title,summary,body,public_data,published_at";
    const shortlist=kinds[0]==="opportunity"&&distressIntent(question,history);
    let query=kinds[0]==="opportunity"?publishedOpportunities(client,columns):client.from("ig_public_content").select(columns).in("kind",kinds);
    if(kinds.includes("page"))query=query.not("slug","like","website-editor-*");
    if(!leadership&&!shortlist&&!(recent&&kinds.includes("article"))){
      if(!queryFilters.length)return [];
      query=query.or(queryFilters.join(","));
    }
    const {data,error}=await query.order("published_at",{ascending:false}).limit(leadership?50:shortlist?150:22);
    if(error)throw new Error("Public site content unavailable");
    return data.filter(x=>!siteRecordSlugs.includes(x.slug));
  }));
  return lists.flat();
}
