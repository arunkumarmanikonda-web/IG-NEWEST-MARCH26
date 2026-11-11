import { notFound } from "next/navigation";
import { accountContext } from "../../../../lib/supabase/server";
import Editor from "./editor";
export default async function EditPage({ params }) {
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
  return (
    <Editor
      key={item?.id + "-" + item?.version + "-" + item?.status}
      item={item}
      terms={terms || []}
      selectedTerms={(tags || []).map((x) => x.term_id)}
      revisions={revisions || []}
    />
  );
}
