import {accountContext} from "../../../lib/supabase/server";
import {readSiteRecords} from "../../../lib/site-cms-records.mjs";
import ResidencesEditor from "./residences-editor";

export const metadata = {title:"India Gully Residences · Launch studio"};
export default async function ResidencesAdmin() {
  const {client} = await accountContext();
  const [drafts,live,media] = await Promise.all([
    readSiteRecords(client,"ig_content"),
    readSiteRecords(client,"ig_public_content"),
    client.from("ig_source_media").select("id,alt,source_name,preset,state,published,practice").order("created_at",{ascending:false}).limit(100),
  ]);
  return <ResidencesEditor record={drafts["residences-launch"] || null} live={live["residences-launch"] || null} media={media.data || []} mediaError={Boolean(media.error)} scheduling={Boolean(process.env.INTEGRATION_MASTER_KEY)} />;
}
