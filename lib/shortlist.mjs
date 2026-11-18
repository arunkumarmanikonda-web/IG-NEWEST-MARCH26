export const shortlistKey='ig-shortlist-v1';
export function normaliseShortlist(value){return Array.isArray(value)?[...new Set(value.filter(x=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x)))].slice(0,100):[];}
export function compareSelection(ids,id){return ids.includes(id)?ids.filter(x=>x!==id):ids.length<3?[...ids,id]:ids;}
export function comparisonArea(data={}){
 const area=String(data.area??'').trim();
 if(area)return /^[\d,.]+$/.test(area)?area+' '+(String(data.area_unit||'').trim()||'(unit to confirm)'):area;
 return data.area_range||data.units?.filter(u=>u.area).map(u=>u.area+(u.basis?' · '+u.basis:'')).join('; ')||'';
}
