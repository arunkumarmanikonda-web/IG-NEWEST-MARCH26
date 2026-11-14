import pages from "./site-defaults/pages.json" with { type: "json" };
import { milestones, principles } from "./company.mjs";
import { navigationDefaults } from "./site-defaults/navigation.mjs";
import { practiceDefaults } from "./site-defaults/practices.mjs";

export const siteDefaults = {
  ...pages, journey: milestones, principles, navigation: navigationDefaults,
  disciplines: practiceDefaults.map(({ number, ...p }) => ({
    ...p, audience: p.audience || p.intro, image: p.image || "/images/dining.jpg",
    href: p.href || "/practices/" + p.slug,
  })),
};
export const sectionLabel = key => ({
  "home-layout": "Homepage section order", disciplines: "Practice profiles",
  journey: "Company journey", principles: "Company principles", navigation: "Header menus",
  "practice-detail": "Practice detail page", "our-work": "Selected work", home: "Homepage",
}[key] || key.replaceAll("-", " ").replace(/^./, c => c.toUpperCase()));
const localPath = s => /^\/(?!\/)[^\\\s\u0000-\u001f]*$/u.test(s) && !s.includes("..");
const imagePath = s => localPath(s) && s.startsWith("/images/") && /\.(jpe?g|png|webp|avif)$/i.test(s);

function checkShape(value, sample, key) {
  if (typeof sample === "string") {
    if (typeof value !== "string" || !value.trim() || value.length > 8000) throw Error("Enter text for " + key);
    if ((key === "href" || key === "destination") && !localPath(value)) throw Error("Use a local website path for " + key);
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
  checkShape(value, siteDefaults[key], key);
  if (key === "home-layout" && (new Set(value).size !== value.length || value.some(id => !pages[key].includes(id)))) throw Error("Choose each homepage section only once.");
  if (key === "navigation" && value.length !== 3) throw Error("The header has three navigation groups.");
  if (key === "disciplines") {
    const identifiers = value.map(p => p.slug);
    if (new Set(identifiers).size !== identifiers.length || identifiers.some(s => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s))) throw Error("Use a unique URL slug for each practice.");
  }
  return value;
}
