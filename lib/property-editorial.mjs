// Editorial refinements use the existing published asset descriptions and focus.
// No price, room count, area, yield or mandate exclusivity is inferred.
export const propertyEditorial = {
 'prism-tower-gurgaon': {
  summary: 'A commercial and hospitality asset in Gurugram, bringing two complementary real estate uses into one investment conversation.',
  body: 'Prism Tower brings a mixed-use commercial and hospitality proposition to Gurugram. The asset can be explored through the requirements of investors, owners and operating partners.\n\n## The commercial conversation\n\nThe initial review centres on acquisition strategy, the proposed commercial structure and the information required for diligence. India Gully can coordinate the property discussion around your investment brief.\n\n## Take the next step\n\nSpeak with our real estate team to request the property schedule and current transaction terms, and to discuss the next stage of review.',
 },
 'hotel-rajshree-chandigarh': {
  summary: 'City hospitality with a wellness dimension. Hotel Rajshree & Spa brings a hotel and spa proposition to Chandigarh for investors and hospitality operators to explore.',
  body: 'Hotel Rajshree & Spa combines a hotel and wellness proposition in Chandigarh. It offers a starting point for a focused discussion about hospitality acquisition, operations and positioning.\n\n## The hospitality conversation\n\nA property review can consider the accommodation and wellness offering, the operating model and the scope for brand alignment. The property schedule, operating information and commercial terms form the basis of the next stage of assessment.\n\n## Begin a private discussion\n\nContact India Gully’s real estate team to request the detailed property information, discuss your investment parameters and arrange the next steps.',
 },
 'heritage-hotel-jaipur': {
  summary: 'A hospitality development proposition in Jaipur, with the opportunity to shape the property’s fit-out, operating concept and route to market.',
  body: 'This hotel structure in Jaipur invites a development-led assessment of the property and the work required to bring a hospitality concept into operation.\n\n## Shape the development brief\n\nThe discussion begins with the existing structure, development requirements and fit-out scope. Operator strategy and project planning can then be considered against the proposed positioning and investment brief.\n\n## Explore the property\n\nRequest the property information from India Gully to discuss the development scope, review the available documentation and establish the next steps.',
 },
 'welcomheritage-santa-roza-kasauli': {
  summary: 'A hill-resort proposition in Kasauli, bringing destination hospitality, an operating concept and long-term asset planning into focus.',
  body: 'Santa Roza presents a resort proposition in Kasauli’s hill-hospitality landscape. The property can be considered through the objectives of hospitality investors and operating partners.\n\n## Consider the resort proposition\n\nThe initial conversation covers acquisition objectives, the operating model and capital planning. A detailed review should connect the property information with the intended positioning and investment approach.\n\n## Plan the next conversation\n\nSpeak with India Gully’s real estate team to request the property schedule and commercial information, and to discuss the next stage of review.',
 },
};
export function refineLegacyProperty(item) {
 const replacement = propertyEditorial[item?.slug];
 return replacement && /featured in India Gully|carried forward from the existing India Gully/.test((item.summary || '') + (item.body || '')) ? { ...item, ...replacement } : item;
}
