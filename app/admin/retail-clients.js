import {accountContext} from "../../lib/supabase/server";
import {readRegister} from "../../lib/registers.mjs";
import RetailAccess from "./retail-access";

export default async function RetailClients({record}){
  const {client}=await accountContext();
  const [directory,contacts,assignment,members]=await Promise.all([
    client.rpc("ig_client_directory"),
    readRegister(()=>client.from("ig_client_contacts").select("id,client_id,name,email,active,portal_enabled"),"id"),
    client.from("ig_retail_accounts").select("engagement_id,ig_engagements(id,client_id,title,ig_data_rooms(id))").eq("content_id",record.id).maybeSingle(),
    client.from("ig_retail_members").select("contact_id,side,dashboard,allow_upload,ig_room_grants(active,expires_at)").eq("content_id",record.id)
  ]);
  if([directory,contacts,assignment,members].some(r=>r.error))return <p id="mandate-clients" role="alert">The private client register could not be loaded. Check your practice permissions.</p>;
  return <RetailAccess record={{id:record.id,title:record.title,kind:record.kind}} clients={directory.data||[]} contacts={contacts.data}
    engagement={assignment.data?.ig_engagements} members={members.data||[]}/>;
}
