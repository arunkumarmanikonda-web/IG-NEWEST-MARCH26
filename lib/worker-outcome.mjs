export function workerNeedsAttention(result) {
  return ['held','failed','unknown'].includes(result?.status) ||
    Number(result?.failed||0)>0 || Number(result?.pending_review||0)>0;
}
export function workerIsIdle(result) {
  if(workerNeedsAttention(result))return false;
  if(!result || result.disabled || result.status==='idle')return true;
  if(result.status)return false;
  return ['sent','accepted','processed','checked'].some(k=>k in result) &&
    ['sent','accepted','processed','checked'].every(k=>!Number(result[k]||0));
}
