import "server-only";
import { anonymousServerClient } from "./runtime-config";
import { currentPolicies } from "./policies";
import { siteRecordSlugs } from "./site-cms-records.mjs";
import { livePractices } from "./website";
import { isPublicPath, publicDocuments, terms } from "./gullu.mjs";

// Query the same public publication snapshot as the website. Limit by content
// type so a large supplier catalogue cannot displace the property or article results.
async function candidateRows(question,history,page) {
  const client=anonymousServerClient();
  const words=[...new Set([...terms(question),...terms(history.at(-1)?.question)])].slice(0,7);
  const paths=[page,...(history.at(-1)?.sources || [])].filter(isPublicPath);
  const slugs=paths.map(p=>p.split("/").at(-1)).filter(s=>/^[a-z0-9_-]{2,125}$/i.test(s));
  const filters=[...new Set(slugs)].map(s=>"slug.eq."+s);
  const recent=/\b(latest|archive|recent|newest|perspectives?|insights?|articles?)\b/i.test(question);
  const groups=[["opportunity"],["product"],["article"],["person","project","faq","page"]];
  const lists=await Promise.all(groups.map(async kinds=>{
    const product=kinds.includes("product");
    const fields=["title","summary","body",...(product?["public_data->>sku","public_data->>brand","public_data->>category"]:["public_data->>city"])];
    const queryFilters=[...filters,...words.flatMap(w=>fields.map(k=>k+".ilike.*"+w+"*"))];
    let query=client.from("ig_public_content").select("kind,slug,title,summary,body,public_data,published_at").in("kind",kinds);
    if (kinds.includes("page")) query=query.not("slug","like","website-editor-*");
    if (!(recent && kinds.includes("article"))) {
      if (!queryFilters.length) return [];
      query=query.or(queryFilters.join(","));
    }
    const {data,error}=await query.order("published_at",{ascending:false}).limit(22);
    if (error) throw new Error("Public site content unavailable");
    return data.filter(x=>!siteRecordSlugs.includes(x.slug));
  }));
  return lists.flat();
}

export async function liveGulluDocuments(question,history,page) {
  const [records,practices,policies]=await Promise.all([candidateRows(question,history,page),livePractices(),currentPolicies()]);
  return publicDocuments({records,practices,policies});
}
