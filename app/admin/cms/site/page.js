import { accountContext } from "../../../../lib/supabase/server";
import { readSiteRecords, schemaUnavailable } from "../../../../lib/site-cms-records.mjs";
import WebsiteEditor from "./website-editor";
export default async function Page() {
  const { client } = await accountContext();
  const { data, error } = await client.rpc("ig_website_edit", { p: { action: "list" } });
  if (schemaUnavailable(error)) {
    const records = await readSiteRecords(client, "ig_content");
    return <WebsiteEditor records={records} scheduling={false} />;
  }
  if (error) return <section className="workspace-card"><h2>Website editor unavailable</h2><p>Website editing requires corporate publishing workspace access.</p></section>;
  return <WebsiteEditor records={data || {}} />;
}
