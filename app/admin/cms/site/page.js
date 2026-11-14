import { accountContext } from "../../../../lib/supabase/server";
import { readSiteRecords } from "../../../../lib/site-cms-records.mjs";
import WebsiteEditor from "./website-editor";
export default async function Page() {
  const { client } = await accountContext();
  const [records,live]=await Promise.all([readSiteRecords(client,"ig_content"),readSiteRecords(client,"ig_public_content")]);
  for (const [key,draft] of Object.entries(records)) {
    draft.live_version=live[key]?.version;
    draft.scheduled_at=live[key]?.scheduled_at || null;
  }
  return <WebsiteEditor records={records} />;
}
