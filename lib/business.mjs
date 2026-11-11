// Owner-confirmed identifiers. Statutory address/officer must be confirmed separately.
export const businessDefaults = Object.freeze({
  brand: 'India Gully',
  legal_name: 'Vivacious Entertainment and Hospitality Private Limited',
  cin: 'U74999DL2017PTC323237',
  gstin: '07AAGCV0867P1ZN',
  email: 'hello@indiagully.com',
  phone: '+918988988988',
  registered_office: '',
  grievance_name: '',
  grievance_designation: '',
  grievance_email: 'hello@indiagully.com',
  statutory_details_confirmed: false,
});
export const practiceOptions = Object.freeze([
  ['real-estate', 'Real Estate Advisory'],
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
