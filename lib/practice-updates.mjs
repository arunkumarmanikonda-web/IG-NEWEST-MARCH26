import { contentPath } from "./content-routes.mjs";

const audiences = {opportunity: "real-estate", product: "horeca", project: "hospitality"};
const labels = {opportunity: "Discuss this property", product: "Request product specifications", project: "Explore the project"};
export function practiceUpdate(row) {
  const practice = audiences[row.kind];
  if (!practice || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.slug) || !row.title?.trim()) return null;
  const path = contentPath(row);
  const title = row.title.trim();
  return {id:row.id, title, summary:row.summary || "", path, practice,
    campaign: {title:("Practice update · "+title).slice(0,180), practice,
      subject:title.replace(/[\r\n]+/g," ").slice(0,180),
      body:[row.summary, labels[row.kind] + " at https://indiagully.com" + path,
        "If this is relevant to your plans, reply to this email. Our team would be glad to discuss the details with you."].filter(Boolean).join("\n\n")} };
}

export async function recentUpdates(client, practices) {
  const kinds = Object.keys(audiences).filter(kind=>practices.includes(audiences[kind]));
  if (!kinds.length) return [];
  const responses = await Promise.all(kinds.map(kind=>client.from("ig_public_content")
    .select("id,kind,title,summary,slug,published_at").eq("kind",kind)
    .order("published_at",{ascending:false}).limit(6)));
  return responses.flatMap(result=>result.data || []).sort((a,b)=>b.published_at.localeCompare(a.published_at))
    .map(practiceUpdate).filter(Boolean);
}
