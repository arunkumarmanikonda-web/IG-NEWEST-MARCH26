import advisory from "./site-defaults/brands/advisory.json" with {type:"json"};
import retail from "./site-defaults/brands/retail.json" with {type:"json"};
import hospitality from "./site-defaults/brands/hospitality.json" with {type:"json"};
export const practiceSections={"transaction-advisory":"transaction-showcase","retail-leasing":"retail-showcase",hospitality:"hospitality-showcase"};
export const showcaseDefaults={
 "retail-showcase":{
  title:"From catchment study to the first trading day",
  introduction:"We accept leasing mandates from owners and developers of malls, high streets and mixed-use destinations. We also help expanding brands assess and secure sites. The landlord and occupier briefs start with different questions, and each engagement sets out whom we represent, which spaces it covers and how commercial decisions will be approved.",
  stages:[
    ["Define the retail proposition","Study the catchment, competing destinations, access, spending occasions and dayparts. Translate those findings into a positioning brief and an area allocation for anchors, fashion, dining, entertainment and daily needs."],
    ["Turn the mix into a zoning plan","Map the customer journey floor by floor. Place anchors and cinemas where they draw footfall past smaller stores. Test dining zones against exhaust, servicing and evening access. Give luxury stores the frontage and adjacencies their format needs."],
    ["Take the signed mandate to market","Prepare the unit schedule, measured areas, floor plans, proposed commercials and handover conditions. Build a brand target list by format and size. Under an owner mandate we coordinate outreach, inspections, proposals and the leasing pipeline."],
    ["Agree a deal the property can deliver","Compare minimum guarantees, revenue share, common-area charges, escalation, deposit, fit-out period and opening commitments. Record agreed terms in the letter of intent and coordinate lease documentation with the parties and their counsel."],
    ["Onboard brands and open the doors","Bring the tenant, architect and property team together for design submissions, technical approvals and possession. Track fit-out, signage and opening dates against a single tenant-opening programme."]
  ],
  galleryTitle:"Retail brands by segment",galleryIntro:"Examples of formats used in retail mix and zoning discussions. The right shortlist depends on the catchment, floor plate, price point and the brand’s current expansion brief.",brands:retail,
  mandateTitle:"Retail leasing mandates",mandateIntro:"Owners can appoint India Gully to lease a property. Brands can share an expansion brief covering cities, preferred sites, area, frontage and occupancy budget.",
  ownerLabel:"Appoint us to lease a property",ownerPath:"/contact?interest=Retail%20leasing%20mandate",occupierLabel:"Share a brand expansion brief",occupierPath:"/contact?interest=Retail%20brand%20expansion",
  listingsTitle:"Published leasing opportunities",emptyText:"We currently have no public leasing listings. Share your requirement so the team can discuss a suitable mandate with you."
 },
 "transaction-showcase":{
  title:"The right people around a transaction",introduction:"The work changes as a transaction moves from feasibility to diligence, financing and execution. India Gully defines the brief with the client and coordinates the relevant transaction advisers, independent professionals and capital providers for the assignment.",
  stages:[["Define the assignment","Agree the objective, transaction structure, information requirements and responsibilities before opening discussions."],["Coordinate diligence and execution","Bring the relevant financial, commercial and technical workstreams together. Track open questions, decisions and conditions through to execution."]],
  galleryTitle:"Advisory and financing partners",galleryIntro:"India Gully’s transaction network includes the firms below. The services and participants for a particular assignment are set out in its mandate.",brands:advisory
 },
 "hospitality-showcase":{
  title:"From hotel concept to operator selection",introduction:"We help owners turn a site and an investment brief into a hotel proposition. The operator search begins with demand, achievable positioning, room mix and facilities, then moves to brand standards, project cost and the commercial terms the asset can support.",
  stages:[["Build the operator shortlist","Compare independent, domestic and international flags against the catchment, demand segments, key count and development timetable."],["Compare commercial proposals","Put management, franchise and lease proposals on a common basis. Examine fees, owner obligations, performance tests, technical services, pre-opening costs and capital requirements."],["Plan for opening","Translate the selected brand’s requirements into a coordinated design, procurement, operator-onboarding and mobilisation programme."]],
  galleryTitle:"Hotel brands and operator references",galleryIntro:"Indian and international hotel groups and brands considered in operator-selection research. Suitability, territory, brand availability and terms are assessed for each property.",brands:hospitality
 }};
export function leasingListings(rows=[]){
 return rows.filter(r=>{
  const data=r.public_data||{};
  const types=[data.transaction_type,...(r.tags||[]).filter(t=>t.dimension==="transaction-type").flatMap(t=>[t.slug,t.label])];
  return !/portfolio reference/i.test(data.reference||"")&&types.some(v=>/\b(?:lease|leasing|rental|to let|for rent)\b/i.test(String(v||"").replaceAll("-"," ")));
 });
}
export function showcasePassages(s){
 if(!s)return [];
 return [s.introduction,...s.stages.map(([title,copy])=>title+". "+copy),s.mandateIntro,
 ...[...new Set(s.brands.map(b=>b.category))].map(c=>s.galleryTitle+" · "+c+". "+s.brands.filter(b=>b.category===c).map(b=>b.name).join(", ")+". "+s.galleryIntro)].filter(Boolean);
}
