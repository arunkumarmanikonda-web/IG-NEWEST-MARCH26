import pages from "./site-defaults/pages.json" with { type: "json" };
import { milestones, principles } from "./company.mjs";
import { navigationDefaults } from "./site-defaults/navigation.mjs";
import { practiceDefaults } from "./site-defaults/practices.mjs";

import {showcaseDefaults} from "./practice-showcases.mjs";
import {horecaCollectionDefaults} from './horeca-collections.mjs';
import {residencesDefaults,validateResidences} from './residences.mjs';
export const siteDefaults = {
  'residences-launch':residencesDefaults,
  'horeca-collections':horecaCollectionDefaults,
  ...pages, ...showcaseDefaults, journey: milestones, principles, navigation: navigationDefaults,
  disciplines: practiceDefaults.map(({ number, ...p }) => ({
    ...p, audience: p.audience || p.intro, image: p.image || "/images/dining.jpg",
    href: p.href || "/practices/" + p.slug,
  })),
};
export const sectionLabel = key => ({
  'residences-launch':'India Gully Residences launch',
  'horeca-collections':'HORECA category imagery & titles',
  "retail-showcase":"Retail leasing story, mandates & brands","transaction-showcase":"Transaction advisory partners","hospitality-showcase":"Hospitality operators & brands",
  "home-layout": "Homepage section order", disciplines: "Practice profiles",
  journey: "Company journey", principles: "Company principles", navigation: "Header menus",
  "practice-detail": "Practice detail page", "our-work": "Selected work", home: "Homepage",
}[key] || key.replaceAll("-", " ").replace(/^./, c => c.toUpperCase()));
const localPath = s => /^\/(?!\/)[^\\\s\u0000-\u001f]*$/u.test(s) && !s.includes("..");
const imagePath = s => localPath(s) && s.startsWith("/images/") && /\.(jpe?g|png|webp|avif)$/i.test(s);

function checkShape(value, sample, key) {
  if(key==="brands"){
    if(!Array.isArray(value)||value.length>160)throw Error("Use up to 160 brand entries.");
    const seen=new Set();
    for(const b of value){
      if(!b||Object.keys(b).sort().join(",")!=="category,logo,name,site"||typeof b.name!=="string"||!b.name.trim()||b.name.length>150||typeof b.category!=="string"||!b.category.trim()||b.category.length>90||typeof b.logo!=="string")
        throw Error("Give every brand a name, group, website and logo field.");
      if(seen.has(b.category+"|"+b.name))throw Error("Each brand must have one entry in its group.");seen.add(b.category+"|"+b.name);
      const secure=s=>{try{const u=new URL(s);return u.protocol==="https:"&&!u.username&&!u.password&&u.hostname.includes(".")&&s.length<2000;}catch{return false;}};
      const uploaded=b.logo.length<=28000 && /^data:image\/webp;base64,UklGR[A-Za-z0-9+/]+=*$/.test(b.logo);
      if(!secure(b.site)||b.logo && !uploaded && !secure(b.logo)&&!(/^\/(?:partners|images|brand)\/[a-zA-Z0-9_./-]+$/.test(b.logo)&&localPath(b.logo)))throw Error("Use an HTTPS website and an approved local or HTTPS logo URL.");
    }
    return;
  }
  if (typeof sample === "string") {
    if (typeof value !== "string" || !value.trim() || value.length > 8000) throw Error("Enter text for " + key);
    if ((key === "href" || key === "destination" || key === "ownerPath" || key === "occupierPath") && !localPath(value)) throw Error("Use a local website path for " + key);
    if ((key === "image" || /^(image|src)-/.test(key)) && !imagePath(value)) throw Error("Choose a website image path under /images/.");
    return;
  }
  if (Array.isArray(sample)) {
    if (!Array.isArray(value) || !value.length || value.length > 100) throw Error("Check the entries in " + key);
    for (const row of value) {
      if (Array.isArray(sample[0])) {
        if (!Array.isArray(row) || row.length !== sample[0].length) throw Error("Check the fields in " + key);
        row.forEach((cell, index) => checkShape(cell, sample[0][index], key === "links" && index === 0 ? "destination" : key));
      } else checkShape(row, sample[0], key);
    }
    return;
  }
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).length !== Object.keys(sample).length)
    throw Error("Check the fields in " + key);
  for (const [name, field] of Object.entries(sample)) checkShape(value[name], field, name);
}
export function validateSection(key, value) {
  if (!Object.hasOwn(siteDefaults, key)) throw Error("Unknown website section");
  if (key === "residences-launch") return validateResidences(value);
  checkShape(value, siteDefaults[key], key);
  if (key === "home-layout" && (new Set(value).size !== value.length || value.some(id => !pages[key].includes(id)))) throw Error("Choose each homepage section only once.");
  if (key === "navigation" && value.length !== 3) throw Error("The header has three navigation groups.");
  if(key==='horeca-collections'){
    const ids=value.collections.map(c=>c.id).sort();
    if(ids.join(',')!==horecaCollectionDefaults.collections.map(c=>c.id).sort().join(','))
      throw Error('Keep each standard HORECA category once. Category identifiers cannot be changed.');
  }
  if (key === "disciplines") {
    const identifiers = value.map(p => p.slug);
    if (new Set(identifiers).size !== identifiers.length || identifiers.some(s => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s))) throw Error("Use a unique URL slug for each practice.");
  }
  return value;
}
