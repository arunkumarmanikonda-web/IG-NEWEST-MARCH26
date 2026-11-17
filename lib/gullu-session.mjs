import {createHmac,timingSafeEqual} from 'node:crypto';
export const gulluCookie='ig_gullu_session';
const uuid=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
export function sessionCookie(id,secret,now=Date.now()){
  const payload=id+'.'+(now+86400000);
  return payload+'.'+createHmac('sha256',secret).update('gullu-cookie-v1|'+payload).digest('hex');
}
export function readSession(value,secret,now=Date.now()){
  const [id,expiry,mac,...rest]=String(value||'').split('.');
  if(rest.length||!uuid.test(id)||!/^\d{13}$/.test(expiry||'')||+expiry<=now||+expiry>now+86400000||!/^[a-f0-9]{64}$/.test(mac||'')||!secret)return null;
  const expected=createHmac('sha256',secret).update('gullu-cookie-v1|'+id+'.'+expiry).digest('hex');
  return timingSafeEqual(Buffer.from(mac,'hex'),Buffer.from(expected,'hex'))?id:null;
}
