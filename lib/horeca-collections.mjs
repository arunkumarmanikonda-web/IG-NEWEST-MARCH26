import {horecaCategories,categoryDirectory} from './horeca-categories.mjs';

const art={
  lighting:['Light & atmosphere','Warm architectural and decorative lighting in a hotel lounge'],
  'in-room':['The guest experience','A guestroom amenity tray, kettle, porcelain cups and folded robe'],
  cutlery:['Details at the table','Polished stainless steel cutlery on textured linen'],
  crockery:['A considered table','Ivory porcelain plates, bowls and cups on stone plinths'],
  glassware:['The art of serving','Crystal wine glasses, tumblers and a coupe on a hotel bar'],
  hollowware:['Service with distinction','Polished metal coffee pots, jugs and serving trays'],
  'kitchen-equipment':['Behind every great kitchen','Professional stainless steel cooking equipment in a hotel kitchen'],
  linen:['A softer welcome','Folded hotel towels, bed linen and a waffle robe'],
  housekeeping:['Care in every corner','A hotel housekeeping trolley with linen and cleaning equipment'],
  'banquet-buffet':['Made for occasions','Chafing dishes and tiered serving stands on a banquet buffet'],
  furniture:['Spaces with character','Walnut hospitality chairs and a table in a warm lounge'],
  bathroom:['Everyday rituals, elevated','A stone hotel vanity with brass fittings and bath accessories'],
  other:['A complete operating brief','A carefully appointed hospitality interior'],
};
export const horecaCollectionDefaults={
  title:'Considered essentials.\nExceptional spaces.',
  description:'Explore our HORECA collections, from the first impression to the smallest finishing detail.',
  collections:horecaCategories.map(c=>({id:c.id,title:c.label,kicker:art[c.id][0],description:c.description,
    image:'/images/horeca-collections/'+(c.id==='other'?'in-room':c.id)+'.webp',alt:art[c.id][1]})),
};
export function collectionDirectory(products,config=horecaCollectionDefaults){
  const counts=new Map(categoryDirectory(products).map(c=>[c.id,c]));
  return config.collections.filter(c=>counts.has(c.id)).map(c=>({...counts.get(c.id),...c}));
}
