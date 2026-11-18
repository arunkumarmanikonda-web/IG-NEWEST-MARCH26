export const assetSectors = ['Commercial','Hospitality','Residential','Land','Industrial','Mixed use'];
export const assetTypes = ['Office','Retail space','City hotel','Heritage resort','Hotel development and residential land','Hospitality development','Mixed-use commercial & hospitality','Residential','Land','Warehouse'];
export const transactionRoutes = ['Sale','Lease','Investment','Corporate insolvency resolution','Joint venture / JDA'];
export const reviewFields = {data_as_of:'Information period / as at',last_verified_at:'Facts reviewed on',availability_verified_at:'Availability confirmed on',process_stage:'Transaction / process stage',management_agreement:'Operator / management agreement'};
export const productDetailFields={material:'Material / grade',dimensions:'Dimensions',finish:'Finish',capacity:'Capacity / rating',sample_policy:'Samples',specification_status:'Specification status'};
const clean=x=>String(x||'').trim();
export function canonicalLocation(value){const city=clean(value).split(',')[0];return ({gurgaon:'Gurugram',gurugram:'Gurugram',noida:'Noida',bangalore:'Bengaluru',bengaluru:'Bengaluru'})[city.toLowerCase()]||city;}
export function canonicalSector(d={}){
 if(assetSectors.includes(d.sector))return d.sector;
 const s=[d.asset_class,d.sector].join(' ').toLowerCase();
 if(/hotel.*land|mixed|hospitality and real estate/.test(s))return 'Mixed use';
 if(/hotel|resort|hospitality/.test(s))return 'Hospitality';
 if(/office|retail|commercial/.test(s))return 'Commercial';
 if(/warehouse|industrial/.test(s))return 'Industrial';
 if(/residen/.test(s))return 'Residential';
 if(/land|plot/.test(s))return 'Land';return 'Real estate';
}
export function canonicalTransaction(value){return /insolvency|resolution plan|cirp/i.test(value||'')?'Corporate insolvency resolution':clean(value);}
export function descriptiveAlt(value,title){const v=clean(value);return !v||/^(do nothing|image|photo|test|placeholder|n\/a)$/i.test(v)?title:v;}
export function dateLabel(value){if(!/^\d{4}-\d{2}-\d{2}/.test(value||''))return '';const d=new Date(value);return Number.isFinite(+d)?d.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Kolkata'}):'';}
export function reviewStatus(data,now=Date.now()){
 const verified=Date.parse(data.availability_verified_at||'');
 return Number.isFinite(verified)&&verified<=now&&now-verified<=30*864e5?'Availability confirmed '+dateLabel(data.availability_verified_at):'Current availability: confirmation required';
}
export function readableParagraphs(text){
 return String(text||'').replace(/\\n/g,'\n').split(/\n\s*\n/).flatMap(p=>{
  if(p.startsWith('## ')||p.length<700)return [p];
  const sentences=p.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g)||[p];const blocks=[];let current='';
  for(const s of sentences){if(current.length+s.length>520&&current){blocks.push(current.trim());current='';}current+=s;}
  if(current.trim())blocks.push(current.trim());return blocks;
 }).filter(Boolean);
}
const practices={
 'transaction-advisory':['Transaction Advisory','Discuss valuation and transaction preparation'],
 hospitality:['Hospitality & Project Delivery','Plan a hospitality project'],
 horeca:['HORECA Procurement','Build your procurement brief'],
 'retail-leasing':['Retail & Leasing','Discuss a leasing requirement'],
 'real-estate':['Real Estate Listings & Advisory','Explore a property requirement'],
 'debt-special-situations':['Debt & Special Situations','Discuss funding or refinancing'],
 entertainment:['Entertainment & Destinations','Plan an entertainment destination'],
};
export function articlePractice(item){
 const raw=clean(item.practice||item.public_data?.sector||item.category).toLowerCase();
 const id=Object.keys(practices).find(k=>k===raw)||(/procurement|horeca/.test(raw)?'horeca':/hospitality|project/.test(raw)?'hospitality':/transaction/.test(raw)?'transaction-advisory':/retail|leasing/.test(raw)?'retail-leasing':/debt|special/.test(raw)?'debt-special-situations':/real estate/.test(raw)?'real-estate':/entertainment/.test(raw)?'entertainment':'');
 return {id,label:practices[id]?.[0]||'India Gully Perspectives',cta:practices[id]?.[1]||'Discuss this Perspective',href:id==='horeca'?'/horeca':id?'/practices/'+id:'/practices'};
}
export function readingMinutes(item){return Math.max(1,Math.ceil(String(item.body||item.public_data?.sections?.map(s=>s.text).join(' ')||'').split(/\s+/).length/200));}
export function contextualQuestions(path=''){
 if(path.startsWith('/horeca'))return ['Help me prepare a hotel supplies quotation','How do samples and delivery work?','Hotel supplies chahiye'];
 if(path.startsWith('/retail-leasing'))return ['I need office or retail space','We want India Gully to lease our property','My brand wants to expand'];
 if(path.startsWith('/opportunities'))return ['Help me explore this property','Show me distressed hotel opportunities','How do I request the data room?'];
 if(path.startsWith('/insights'))return ['Explain this Perspective simply','How can this help my project?','Connect me with the relevant team'];
 return ['I want to raise debt or equity','What does India Gully do?','Find a property or hotel supplies'];
}
export function publicationIssues(record){
 const d=record.public_data||{},issues=[];
 if(record.title?.length>100)issues.push('Use a concise customer title of up to 100 characters. Keep the full legal description in the body.');
 if(record.image||d.image){if(descriptiveAlt(d.image_alt,'')==='')issues.push('Add a meaningful description of the approved image.');}
 if(record.kind==='opportunity'){
  if(!assetSectors.includes(d.sector))issues.push('Choose a recognised asset sector; locations belong in City / State.');
  if(!d.asset_class)issues.push('Choose a property type.');
  if(!d.transaction_type)issues.push('Choose a transaction route.');
  if(!d.last_verified_at)issues.push('Record when the published facts were checked against sources.');
  if(/hotel|sarovar|management|operator/i.test(d.tenure||''))issues.push('Move the operator agreement out of property tenure into Management agreement.');
 }
 if(record.kind==='retail_space'&&d.price_label&&(!d.rent_period||!d.area_basis))issues.push('State the rent period and area basis, or explicitly mark each as To confirm.');
 if(record.kind==='product')for(const k of ['material','dimensions','finish'])if(!d[k])issues.push('Confirm '+productDetailFields[k].toLowerCase()+' from the manufacturer or mark To confirm.');
 return issues;
}

export function productSpecificationFields(category=''){const base={material:'Material / grade',dimensions:'Dimensions',finish:'Finish'};if(/lighting|kitchen|equipment|housekeeping/i.test(category))base.capacity=/lighting/i.test(category)?'Power / electrical rating':'Capacity / electrical rating';if(/glassware|crockery|hollow/i.test(category))base.capacity='Capacity / size';return {...base,sample_policy:'Samples',specification_status:'Specification status'};}
