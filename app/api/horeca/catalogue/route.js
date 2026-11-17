import {horecaCatalogue} from '../../../../lib/horeca-catalogue';
export async function GET(request){
 const p=new URL(request.url).searchParams;
 const headers={'Cache-Control':'no-store'};
 try{
  const filters=Object.fromEntries(['category','query','brand','type','sort'].map(k=>[k,(p.get(k)||'').slice(0,120)]));
  const offset=Number(p.get('offset')||0);
  if(!Number.isInteger(offset)||offset<0||offset>100000)return Response.json({error:'Invalid page'},{status:400,headers});
  return Response.json(await horecaCatalogue({...filters,offset}),{headers});
 }catch{return Response.json({error:'Catalogue is temporarily unavailable. Please retry.'},{status:503,headers});}
}
