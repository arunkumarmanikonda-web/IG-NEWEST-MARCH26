// Owner-confirmed identity, registered address and grievance officer appointment.
export const businessDefaults = Object.freeze({
  brand: 'India Gully',
  legal_name: 'Vivacious Entertainment and Hospitality Private Limited',
  cin: 'U74999DL2017PTC323237',
  gstin: '07AAGCV0867P1ZN',
  email: 'hello@indiagully.com',
  phone: '+918988988988',
  registered_office: 'QTR NO. 229, Four Storey, Tagore Garden Extn., New Delhi, Delhi, 110027, India',
  grievance_name: 'Pavan Manikonda',
  grievance_designation: 'Grievance Officer',
  grievance_email: 'pavan@indiagully.com',
  grievance_phone: '+918988988988',
  statutory_details_confirmed: false,
});
export const practiceOptions = Object.freeze([
  ['real-estate', 'Real Estate Listings & Advisory'],
  ['transaction-advisory', 'Transaction Advisory'],
  ['debt-special-situations', 'Debt & Special Situations'],
  ['hospitality', 'Hospitality & Project Delivery'],
  ['retail-leasing', 'Retail & Leasing'],
  ['entertainment', 'Entertainment'],
  ['horeca', 'HORECA Procurement'],
  ['corporate', 'Company & general content'],
]);
export const scopeRights = Object.freeze([
  ['read', 'View assigned practice records'],
  ['write', 'Create and edit content'],
  ['publish', 'Publish and archive content'],
  ['enquiries', 'Handle enquiries'],
  ['data_rooms', 'Manage NDAs and data rooms'],
  ['commerce', 'Manage quotations and payments'],
]);
