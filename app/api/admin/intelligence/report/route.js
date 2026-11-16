import {accountContext} from "../../../../../lib/supabase/server";
import {readGulluDay,gulluWorkbook} from "../../../../../lib/gullu-workbook.mjs";
export async function GET(request){
 const {client,staffVerified,policiesAccepted}=await accountContext();
 if(!staffVerified||!policiesAccepted)return new Response("Staff sign-in required",{status:403});
 const day=new URL(request.url).searchParams.get("day");
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day||""))return new Response("Choose a report date",{status:400});
 try{
  const data=await readGulluDay(async after=>{
    const {data,error}=await client.rpc("ig_gullu_day",{p:{day,after}});if(error)throw error;return data;});
  return new Response(gulluWorkbook(data),{headers:{"Content-Type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","Content-Disposition":'attachment; filename="Gullu-'+day+'.xlsx"',"Cache-Control":"private, no-store"}});
 }catch(e){return new Response(e.code==="42501"?"Lead access required":"Report unavailable",{status:e.code==="42501"?403:503});}
}
