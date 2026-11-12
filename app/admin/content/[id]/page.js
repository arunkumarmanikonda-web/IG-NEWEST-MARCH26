import {prepareIntakeDraft} from "../../../../lib/intake.mjs";
import { notFound } from "next/navigation";
import { accountContext } from "../../../../lib/supabase/server";
import Editor from "./editor";
export default async function EditPage({ params, searchParams }) {
  const { id } = await params,
    { client } = await accountContext();
  if (id !== "new" && !/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [{ data: terms }, { data: item }, { data: tags }, { data: revisions }] =
    await Promise.all([
      client.from("ig_taxonomy").select("*").order("label"),
      id === "new"
        ? Promise.resolve({ data: null })
        : client.from("ig_content").select("*").eq("id", id).maybeSingle(),
      id === "new"
        ? Promise.resolve({ data: [] })
        : client.from("ig_content_tags").select("term_id").eq("content_id", id),
      id === "new"
        ? Promise.resolve({ data: [] })
        : client
            .from("ig_content_revisions")
            .select("version,created_at")
            .eq("content_id", id)
            .order("version", { ascending: false })
            .limit(30),
    ]);
  if (id !== "new" && !item) notFound();
  const {data:mediaAssets}=await client.from("ig_source_media").select("id,alt,source_name,path,preset,state,published,practice").order("created_at",{ascending:false}).limit(100);
  const q=await searchParams;
  let seed=null;
  if(id==="new" && q?.ai){const {data:job}=await client.from("ig_ai_jobs").select("context,draft,practice").eq("id",q.ai).eq("status","ready").maybeSingle();if(job?.context?.kind==="intake" && job.context.record_kind!=="operation"){const draft=prepareIntakeDraft(job.draft);seed={...draft,kind:job.context.record_kind,practice:job.practice,public_data:draft.fields};}}
  if(id==="new" && q?.media){const {data:media}=await client.from("ig_source_media").select("id,alt,published").eq("id",q.media).maybeSingle();if(media?.published)seed={...seed,public_data:{...seed?.public_data,image:"/images/library/"+media.id+".jpg",image_alt:media.alt,image_identity_reviewed:true}};}
  return (
    <Editor
      key={item?.id + "-" + item?.version + "-" + item?.status}
      item={item}
      initialKind={q?.kind}
      seed={seed}
      mediaAssets={mediaAssets||[]}
      terms={terms || []}
      selectedTerms={(tags || []).map((x) => x.term_id)}
      revisions={revisions || []}
    />
  );
}
