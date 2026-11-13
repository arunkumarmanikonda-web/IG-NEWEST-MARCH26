// Draft strategy, not keyword-volume research or an activated advertising account.
// No guaranteed outcomes, funding promises or unverified opportunity claims.
const group=(id,path,keywords,headlines,descriptions)=>({id,path,status:'paused',keywords:keywords.flatMap(text=>[{text,matchType:'EXACT'},{text,matchType:'PHRASE'}]),negativeKeywords:['jobs','salary','internship','course','training','free download'],headlines,descriptions,conversion:'qualified_enquiry',dailyBudgetInr:null,totalBudgetInr:null,reviewRequired:true});
export const campaignDrafts=[
  group('real-estate','/practices/real-estate',['commercial real estate advisory','real estate transaction advisor','land development advisory'],['India Gully Advisory','Real Estate Advisory','Discuss Your Asset Strategy','Land & Development Advisory'],['Commercial advice for owners, developers and investors. Discuss your requirements.','Assess acquisition, divestment, leasing and development partnership options.']),
  group('transactions','/practices/transaction-advisory',['transaction advisory india','business divestment advisory','investment memorandum advisor'],['Transaction Advisory','Prepare For Your Transaction','India Gully Advisory','Acquisition & Divestment'],['Prepare a clear commercial case for acquisitions, divestments and partnerships.','Connect transaction preparation, investor materials and diligence coordination.']),
  group('debt','/practices/debt-special-situations',['debt advisory india','special situations advisory','stressed asset advisory'],['Debt & Special Situations','Assess Your Funding Options','India Gully Advisory','Commercial Scenario Planning'],['Assess funding requirements, repayment assumptions and documentation readiness.','Advisory for complex capital situations. Funding is subject to lender approval.']),
  group('hospitality','/practices/hospitality',['hotel feasibility consultant','hospitality project management','hotel operator selection advisor'],['Hospitality Advisory','Hotel Feasibility & PMC','From Concept To Opening','India Gully Hospitality'],['Connect feasibility, operator strategy, design coordination and project delivery.','Discuss your hotel or resort brief with India Gully’s hospitality team.']),
  group('retail','/practices/retail-leasing',['retail leasing consultant','mall leasing advisory','retail brand expansion consultant'],['Retail & Leasing Advisory','Build The Right Brand Mix','India Gully Advisory','Retail Expansion Support'],['Connect catchment, brand mix and commercial terms for your retail destination.','Discuss tenant strategy, retail expansion and site comparisons with India Gully.']),
  group('entertainment','/practices/entertainment',['entertainment destination consultant','leisure project feasibility','entertainment project advisory'],['Entertainment Advisory','Destination Feasibility','Concept To Operating Plan','India Gully Advisory'],['Shape an entertainment destination around audience, economics and delivery.','Explore concept, commercial feasibility, partners and operating readiness.']),
  group('horeca','/horeca',['horeca procurement india','hotel operating supplies','hotel project procurement'],['HORECA Procurement','Hotel & Restaurant Supplies','Compare Your Procurement BOQ','India Gully Procurement'],['Source equipment, tableware, linen and operating supplies against your brief.','Share your BOQ, specifications, quantities and delivery needs with India Gully.']),
];
export function validateCampaignDraft(draft){
  const errors=[];
  if(!draft.path?.startsWith('/')||draft.path.startsWith('//'))errors.push('A local landing-page path is required');
  if(!Array.isArray(draft.headlines)||draft.headlines.length<3||draft.headlines.length>15)errors.push('Use 3–15 headlines');
  if(draft.headlines?.some(x=>typeof x!=='string'||!x.length||[...x].length>30))errors.push('Headlines must contain 1–30 characters');
  if(!Array.isArray(draft.descriptions)||draft.descriptions.length<2||draft.descriptions.length>4)errors.push('Use 2–4 descriptions');
  if(draft.descriptions?.some(x=>typeof x!=='string'||!x.length||[...x].length>90))errors.push('Descriptions must contain 1–90 characters');
  if(new Set(draft.headlines).size!==draft.headlines?.length||new Set(draft.descriptions).size!==draft.descriptions?.length)errors.push('Ad text must be unique');
  if(!draft.keywords?.length||draft.keywords.some(k=>!['EXACT','PHRASE'].includes(k.matchType)||!k.text?.trim()))errors.push('Reviewed exact or phrase keywords are required');
  return {valid:errors.length===0,errors};
}
