export function briefContacts(item, business = {}) {
  if (item.kind === 'opportunity') return [
    { name: 'Arun Manikonda', role: 'Managing Director', email: 'akm@indiagully.com', phone: '+91 98108 89134' },
    { name: 'Amit Jhingan', role: 'President - Real Estate', email: 'amit.jhingan@indiagully.com', phone: '+91 98999 93543' },
  ];
  if (item.kind === 'product' || item.practice === 'horeca') return [
    { name: 'Pavan Manikonda', role: 'Executive Director', email: 'pavan@indiagully.com', phone: '+91 89889 88988' },
  ];
  return [{ name: 'India Gully', role: 'Your advisory team', email: business.email, phone: business.phone }];
}
