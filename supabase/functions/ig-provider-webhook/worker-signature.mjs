import {createHmac,timingSafeEqual} from 'node:crypto';

export function validWorkerSignature({stamp,signature,body,secret,now=Date.now()}) {
 if(typeof stamp!=='string'||!/^\d+$/.test(stamp)||!Number.isFinite(Number(stamp))||Math.abs(now/1000-Number(stamp))>300)return false;
 if(typeof signature!=='string'||!/^[a-f0-9]{64}$/.test(signature)||typeof secret!=='string'||!secret||new TextDecoder().decode(body)!=='{}')return false;
 const expected=createHmac('sha256',secret).update('ig-email-worker-v1.'+stamp+'.{}').digest('hex');
 const encode=new TextEncoder();
 return timingSafeEqual(encode.encode(signature),encode.encode(expected));
}
