// One public category directory for manual products and imported catalogue SKUs.
// Existing supplier category names remain intact in the content register.
export const horecaCategories = [
  {id:'lighting',label:'Lighting',description:'Architectural, decorative and outdoor lighting.'},
  {id:'in-room',label:'In-room',description:'Guest amenities, appliances and room essentials.'},
  {id:'cutlery',label:'Cutlery',description:'Table knives, forks, spoons and serving cutlery.'},
  {id:'crockery',label:'Crockery',description:'Plates, bowls, cups and porcelain collections.'},
  {id:'glassware',label:'Glassware',description:'Stemware, tumblers and beverage service.'},
  {id:'hollowware',label:'Hollowware',description:'Metal serviceware, pots, jugs and presentation pieces.'},
  {id:'kitchen-equipment',label:'Kitchen Equipment',description:'Cooking, refrigeration and food preparation.'},
  {id:'linen',label:'Linen',description:'Bed, bath, table and banquet linen.'},
  {id:'housekeeping',label:'Housekeeping',description:'Cleaning equipment, trolleys and operating supplies.'},
  {id:'banquet-buffet',label:'Banquet & Buffet',description:'Buffet displays, chafing dishes and service stations.'},
  {id:'furniture',label:'Furniture',description:'Guestroom, restaurant and outdoor furniture.'},
  {id:'bathroom',label:'Bathroom',description:'Bath fittings, accessories and dispensers.'},
  {id:'other',label:'Other Supplies',description:'Specialist products for your operating brief.'},
];
const normalise = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const aliases = [
  ['lighting',/\b(light(?:ing|s|er)?|downlights?|downlighter|chandeliers?|lamps?|luminaire|track spots?|pendants?|pendents|led|sconce)\b/],
  ['cutlery',/\b(cutlery|cuttlery|flatware|forks?|spoons?|knives|table knife|steak knife|butter knife)\b/],
  ['crockery',/\b(crockery|porcelain|ceramic|bone china|stoneware|plates?|bowls?|saucers?|cups?|ramekins?|mugs?)\b/],
  ['glassware',/\b(glass ?ware|stemware|tumblers?|goblets?|wine glasses|beer glasses|glass decanters?)\b/],
  ['hollowware',/\b(hollow ?ware|metal serviceware|stainless steel (?:jug|pot|tray)|silverware)\b/],
  ['in-room',/\b(in ?room|guest ?room|room amenities|guest amenities|minibars?|safes?|kettles?|hair ?dryers?|ironing|hangers?|luggage racks?)\b/],
  ['linen',/\b(linen|bedding|towels?|duvets?|pillows?|bed ?sheets?|napkins?|tablecloths?|bathrobes?)\b/],
  ['housekeeping',/\b(housekeeping|cleaning|janitorial|vacuum|scrubber|waste bins?|mops?|laundry equipment)\b/],
  ['banquet-buffet',/\b(banquet|buffet|chafing|food warmer|service station)\b/],
  ['furniture',/\b(furniture|chairs?|tables?|sofas?|beds?|wardrobes?|desks?|stools?|loungers?)\b/],
  ['bathroom',/\b(bathroom|bath fittings|sanitary|faucets?|showers?|soap dispensers?|towel rails?)\b/],
  ['kitchen-equipment',/\b(kitchen|cookware|cooking|ovens?|fryers?|refrigerat\w*|freezers?|dishwashers?|ice makers?|food preparation|baking|bakery|coffee machines?|blenders?)\b/],
];
export function horecaCategory(product) {
  const data=product?.public_data || {};
  // An explicitly chosen category always wins over incidental product wording.
  const category=normalise(data.category);
  const exact=horecaCategories.find(c=>[normalise(c.id),normalise(c.label)].includes(category));
  if (exact) return exact;
  for (const value of [category,...(product?.tags||[]).filter(t=>!t.dimension||t.dimension==='product-category').map(t=>normalise(t.label)),normalise(product?.title)]) {
    const match=aliases.find(([,pattern])=>pattern.test(value));
    if (match) return horecaCategories.find(c=>c.id===match[0]);
  }
  return horecaCategories.at(-1);
}
export function categoryDirectory(products) {
  const counts=new Map();
  for(const p of products){const id=horecaCategory(p).id;counts.set(id,(counts.get(id)||0)+1);}
  return horecaCategories.filter(c=>c.id!=='other'||counts.has(c.id)).map(c=>({...c,count:counts.get(c.id)||0}));
}
export function productType(product) {
  const category=horecaCategory(product),text=normalise([product.public_data?.category,product.title].join(' '));
  if(category.id==='lighting') {
    if(/\b(track|spots)\b/.test(text))return 'Track lights';
    if(/\b(pendant|pendents)\b/.test(text))return 'Pendant lights';
    if(/\b(globe)\b/.test(text))return 'Globe lights';
    if(/\b(chandelier)\b/.test(text))return 'Chandeliers';
    if(/\b(downlight|downlights|downlighter|recess|recessed|popout)\b/.test(text))return 'Downlights';
    if(/\b(lamp)\b/.test(text))return 'Lamps';
  }
  if(category.id==='crockery') {
    if(/\b(plate|plates|platter)\b/.test(text))return 'Plates & platters';
    if(/\b(bowl|bowls|ramekin)\b/.test(text))return 'Bowls & ramekins';
    if(/\b(cup|mug|saucer)\b/.test(text))return 'Cups & saucers';
    return 'Table accessories';
  }
  if(category.id==='cutlery') {
    if(/\b(knife|knives)\b/.test(text))return 'Knives';
    if(/\b(fork|forks)\b/.test(text))return 'Forks';
    if(/\b(spoon|spoons|teaspoon)\b/.test(text))return 'Spoons';
  }
  return category.label;
}
export function categoryHref(id) {return '/horeca'+(id?'?category='+encodeURIComponent(id):'')+'#catalogue';}
