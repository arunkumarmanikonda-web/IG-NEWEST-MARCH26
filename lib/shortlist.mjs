export const shortlistKey='ig-shortlist-v1';
export function normaliseShortlist(value){return Array.isArray(value)?[...new Set(value.filter(x=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x)))].slice(0,100):[];}
export function compareSelection(ids,id){return ids.includes(id)?ids.filter(x=>x!==id):ids.length<3?[...ids,id]:ids;}
