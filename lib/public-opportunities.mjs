// Explicit server-to-public projection. Private location/document/contact objects
// must stay in the database and must never be passed to a client component.
const clean=value=>typeof value==='string'?value.trim():'';
export function publicOpportunity(record){
  if(record?.publicationApproved!==true || !record.public) return null;
  const p=record.public;
  const slug=clean(p.slug), city=clean(p.city), region=clean(p.region);
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !city || /[0-9@/\\]/.test(city+region)) return null;
  const confidential=record.confidential===true;
  // Confidential teasers need a separately reviewed alias and non-identifying image.
  if(confidential && (!/^ig-opp-[a-z0-9-]+$/.test(slug) || record.identityReviewApproved!==true))return null;
  const title=clean(confidential?p.alias:p.title);
  if(!title || !clean(p.description))return null;
  const image=clean(p.image);
  if(image && (!image.startsWith('/images/') || image.includes('..') || /[?#]/.test(image)))return null;
  return {
    slug,title,city,region,location:[city,region].filter(Boolean).join(', '),
    sector:clean(p.sector),type:clean(p.type),description:clean(p.description),
    image:confidential && p.imageIdentityReviewed!==true?'':image,
    focus:Array.isArray(p.focus)?p.focus.filter(x=>typeof x==='string'):[],
    contexts:Array.isArray(p.contexts)?p.contexts.filter(x=>typeof x==='string'):[],
    locationPrecision:'city',confidential,
  };
}
