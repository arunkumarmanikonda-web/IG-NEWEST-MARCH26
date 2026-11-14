import { prepareIntakeDraft } from "../../../../lib/intake.mjs";
import { notFound } from "next/navigation";
import { accountContext } from "../../../../lib/supabase/server";
import Editor from "./editor";
import IntakeStudio from "../../intake-studio";
export default async function EditPage({ params, searchParams }) {
  const { id } = await params,
    { client, user } = await accountContext();
  const q = await searchParams;
  if (id !== "new" && !/^[0-9a-f-]{36}$/.test(id)) notFound();
  if (id === "new" && !q?.ai && q?.manual !== "1")
    return <IntakeStudio initialKind={q?.kind} />;
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
  const { data: mediaAssets } = await client
    .from("ig_source_media")
    .select("id,alt,source_name,path,preset,state,published,practice")
    .order("created_at", { ascending: false })
    .limit(100);
  const { data: creativeJobs } = await client
    .from("ig_provider_jobs")
    .select("id,practice,kind,input,status,asset_key,published,note,created_at")
    .eq("provider", "runway")
    .eq("kind", "image")
    .order("created_at", { ascending: false })
    .limit(100);
  const { data: intake } = item
    ? await client
        .from("ig_content_intakes")
        .select("*")
        .eq("content_id", item.id)
        .maybeSingle()
    : { data: null };
  const { data: sourceFiles, error: roomFileError } = intake?.room_id
    ? await client.from("ig_room_files").select("id,name,folder,bytes,status")
        .eq("room_id",intake.room_id).is("preview_for",null).order("created_at")
    : { data: [], error: null };
  if (q?.generate === "1" && intake?.actor_id === user.id) {
    const { data: sourceJob } = intake.job_id
      ? await client
          .from("ig_ai_jobs")
          .select("context")
          .eq("id", intake.job_id)
          .eq("actor_id", user.id)
          .maybeSingle()
      : { data: null };
    const { data: sources } = await client
      .from("ig_intake_sources")
      .select("id,name,sha256")
      .like("path", intake.room_id + "/%");
    const pdf = item.kind === "product" && sources?.find(s => /\.pdf$/i.test(s.name));
    const {data: catalogue} = pdf ? await client.from("ig_brand_catalogues").select("id")
      .eq("actor_id",user.id).eq("sha256",pdf.sha256).order("created_at",{ascending:false}).limit(1).maybeSingle() : {data:null};
    return (
      <IntakeStudio
        initialKind={item.kind}
        initialPractice={item.practice}
        initialWorkspace={{ ...intake, version: item.version }}
        existingSources={sources || []}
        savedCatalogueId={catalogue?.id || ""}
        initialSourceText={sourceJob?.context?.text || ""}
        initialBrief={sourceJob?.context?.brief || ""}
      />
    );
  }
  let catalogueSource = null;
  if (item?.kind === "product") {
    const { data: links } = await client
      .from("ig_catalogue_items")
      .select("page_id,item_no,media_id")
      .eq("content_id", item.id)
      .limit(1);
    if (links?.[0]) {
      const link = links[0],
        { data: page } = await client
          .from("ig_catalogue_pages")
          .select("catalogue_id,page_number,result")
          .eq("id", link.page_id)
          .maybeSingle();
      if (page) {
        const { data: catalogue } = await client
          .from("ig_brand_catalogues")
          .select("brand")
          .eq("id", page.catalogue_id)
          .maybeSingle();
        const product = page.result?.products?.[link.item_no];
        catalogueSource = {
          brand: catalogue?.brand,
          page: page.page_number,
          media_id: link.media_id,
          search_phrases: product?.search_phrases,
          evidence: product?.evidence,
          review_notes: product?.review_notes,
        };
      }
    }
  }
  if (
    catalogueSource?.media_id &&
    !mediaAssets?.some((m) => m.id === catalogueSource.media_id)
  ) {
    const { data: source } = await client
      .from("ig_source_media")
      .select("id,alt,source_name,path,preset,state,published,practice")
      .eq("id", catalogueSource.media_id)
      .maybeSingle();
    if (source) mediaAssets?.unshift(source);
  }
  if (item?.kind === "product" && !catalogueSource?.media_id) {
    const {data:matched} = await client.from("ig_source_media").select("id,alt,source_name,path,preset,state,published,practice")
      .eq("practice","horeca").eq("state","ready").like("source_name","catalogue-photo-"+item.id+"-%")
      .order("created_at",{ascending:false}).limit(1).maybeSingle();
    if (matched) {
      catalogueSource = {...catalogueSource, brand:item.public_data?.brand,media_id:matched.id,
        evidence:catalogueSource?.evidence || "Photograph matched by manufacturer code "+item.public_data?.reference};
      if (mediaAssets && !mediaAssets.some(m=>m.id===matched.id)) mediaAssets.unshift(matched);
    }
  }
  let seed = null;
  if (id === "new" && q?.ai) {
    const { data: job } = await client
      .from("ig_ai_jobs")
      .select("context,draft,practice")
      .eq("id", q.ai)
      .eq("status", "ready")
      .maybeSingle();
    if (
      job?.context?.kind === "intake" &&
      job.context.record_kind !== "operation"
    ) {
      const draft = prepareIntakeDraft(job.draft);
      seed = {
        ...draft,
        kind: job.context.record_kind,
        practice: job.practice,
        public_data: {
          ...draft.fields,
          seo_keywords: (draft.keywords || []).join(", ").slice(0, 500),
        },
      };
    }
  }
  if (id === "new" && q?.media) {
    const { data: media } = await client
      .from("ig_source_media")
      .select("id,alt,published")
      .eq("id", q.media)
      .maybeSingle();
    if (media?.published)
      seed = {
        ...seed,
        public_data: {
          ...seed?.public_data,
          image: "/images/library/" + media.id + ".jpg",
          image_alt: media.alt,
          image_identity_reviewed: true,
        },
      };
  }
  return (
    <Editor
      key={item?.id + "-" + item?.version + "-" + item?.status}
      item={item}
      imageState={q?.image}
      initialKind={q?.kind}
      seed={seed}
      catalogueSource={catalogueSource}
      intake={intake}
      roomFiles={roomFileError ? null : sourceFiles}
      canResumeIntake={intake?.actor_id === user.id}
      mediaAssets={mediaAssets || []}
      creativeJobs={creativeJobs || []}
      terms={terms || []}
      selectedTerms={(tags || []).map((x) => x.term_id)}
      revisions={revisions || []}
    />
  );
}
