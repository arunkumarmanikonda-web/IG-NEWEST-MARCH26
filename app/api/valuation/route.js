import {calculate,InputError} from '../../../lib/valuation.mjs';
export const runtime='nodejs';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
export async function POST(request){
  if(!request.headers.get('content-type')?.startsWith('application/json'))return Response.json({error:'Use application/json.'},{status:415,headers});
  const reader=request.body?.getReader(); if(!reader)return Response.json({error:'Request body required.'},{status:400,headers});
  let length=0;const chunks=[];
  try{while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>8192){await reader.cancel();return Response.json({error:'Request is too large.'},{status:413,headers});}chunks.push(value);}
    const body=JSON.parse(Buffer.concat(chunks).toString('utf8'));
    return Response.json(calculate(body),{headers});
  }catch(error){if(error instanceof InputError)return Response.json({error:error.message,field:error.field},{status:422,headers});if(error instanceof SyntaxError)return Response.json({error:'Invalid JSON.'},{status:400,headers});return Response.json({error:'Calculation unavailable. Please try again.'},{status:500,headers});}
}
