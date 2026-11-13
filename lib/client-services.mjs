export const engagementServices = Object.freeze([
 ['feasibility','Feasibility study'],['valuation','Valuation'],['forensic-audit','Forensic audit'],
 ['operational-audit','Operational / process audit'],['financial-review','Financial / commercial review'],
 ['due-diligence','Due diligence'],['other','Other advisory engagement'],
]);
export const clientStages = Object.freeze(['lead','prospect','engaged','completed','archived']);

export function prepareContactRows(rows) {
 if (!Array.isArray(rows) || rows.length>50) throw new Error('Add up to 50 contacts at a time.');
 const contacts=rows.map(row=>Object.fromEntries(['name','email','phone','designation'].map(key=>[key,String(row[key]||'').trim()]).concat([['portal_enabled',row.portal_enabled===true],['circulation',row.circulation===true]])))
  .filter(row=>row.name||row.email||row.phone||row.designation||row.portal_enabled||row.circulation);
 const emails=new Set();
 for(const [index,row] of contacts.entries()) {
  row.email=row.email.toLowerCase();
  if(!row.name||!row.email)throw new Error(`Contact ${index+1}: enter a name and email address. Phone is optional.`);
  if(!/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(row.email))throw new Error(`Contact ${index+1}: enter a valid email address.`);
  if(row.phone&&(!/^\+?[0-9 () .-]+$/.test(row.phone)||row.phone.replace(/\D/g,'').length<7||row.phone.replace(/\D/g,'').length>15))throw new Error(`Contact ${index+1}: enter a valid phone number with 7–15 digits, including the country code.`);
  if(emails.has(row.email))throw new Error(`The email ${row.email} appears more than once. Use one contact record per email for this client.`);
  emails.add(row.email);
 }
 return contacts;
}
