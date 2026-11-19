/** One approved launch configuration drives the website, discovery and mobile app. */
export const residencesDefaults = {
  enabled: false,
  homepage: true,
  placement: "after-hero",
  name: "India Gully Residences",
  kicker: "Our first residential project",
  headline: "India Gully Residences",
  description: "Signature residential floors in Sector 35, Sohna.",
  location: "Sector 35, Sohna",
  image: "",
  imageAlt: "",
  logo: "",
  video: "",
  ctaLabel: "Enquire about Residences",
  ctaHref: "/contact?interest=India%20Gully%20Residences",
  highlights: [],
  startsAt: "",
  endsAt: "",
};

export const residencePlacements = {
  "after-hero": "After the homepage hero",
  "before-listings": "Before property and leasing listings",
  "before-contact": "Before the contact section",
};

function publicPath(value) {
  if (!/^\/(?!\/)[^\\\s\u0000-\u001f]*$/u.test(value)) return false;
  try {
    const decoded = decodeURIComponent(value.split(/[?#]/)[0]);
    return !decoded.includes("..") && !/[\\\s\u0000-\u001f]/u.test(decoded) && !decoded.startsWith("//") &&
      !/^\/(?:api|admin|account|auth|login|logout)(?:\/|$)/i.test(decoded);
  } catch { return false; }
}

function normaliseMedia(value) {
  if (!value.startsWith("https://")) return value;
  try {
    const url = new URL(value);
    if (["indiagully.com","www.indiagully.com"].includes(url.hostname) && !url.username && !url.password && !url.port) return url.pathname + url.search + url.hash;
  } catch { /* Validation below reports malformed paths. */ }
  return value;
}

function publicMedia(value, type) {
  if (!value) return true;
  if (type === "logo" && value.length <= 28000 && /^data:image\/webp;base64,UklGR[A-Za-z0-9+/]+=*$/.test(value)) return true;
  if (value.length > 2000) return false;
  const extension = type === "video" ? /\.(mp4|webm)$/i : type === "logo" ? /\.(jpe?g|png|webp|avif|svg)$/i : /\.(jpe?g|png|webp|avif)$/i;
  if (value.startsWith("/")) return publicPath(value) && /^\/(images|brand|partners|videos)\//.test(value) && extension.test(value.split(/[?#]/)[0]);
  return false;
}

function validInstant(value) {
  const parts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!parts || !Number.isFinite(Date.parse(value))) return false;
  const [,year,month,day,hour,minute,second=0] = parts.map((part,index) => index && part !== undefined ? Number(part) : part);
  const last = new Date(0); last.setUTCFullYear(year,month,0);
  return month>=1 && month<=12 && day>=1 && day<=last.getUTCDate() && hour<24 && minute<60 && second<60;
}

export function validateResidences(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).sort().join(",") !== Object.keys(residencesDefaults).sort().join(","))
    throw Error("Check the fields in the Residences launch configuration.");
  const result = { ...value };
  for (const key of ["enabled", "homepage"]) if (typeof value[key] !== "boolean") throw Error("Choose the launch visibility options.");
  if (!Object.hasOwn(residencePlacements, value.placement)) throw Error("Choose a homepage position.");
  for (const [key, limit] of Object.entries({name:100,kicker:100,headline:180,description:6000,location:180,image:2000,imageAlt:250,logo:28000,video:2000,ctaLabel:80,ctaHref:2000,startsAt:40,endsAt:40})) {
    if (typeof value[key] !== "string" || value[key].length > limit || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(value[key])) throw Error("Check the " + key + " field.");
    result[key] = value[key].trim();
  }
  for (const key of ["name", "headline", "description", "location", "ctaLabel", "ctaHref"]) if (!result[key]) throw Error("Enter " + key + " for the launch.");
  if (!publicPath(result.ctaHref)) throw Error("Use a public India Gully page path for the enquiry button.");
  for (const type of ["image", "logo", "video"]) {
    result[type] = normaliseMedia(result[type]);
    if (!publicMedia(result[type], type)) throw Error("Choose an approved " + type + " hosted on India Gully. Use the media library or a public website file path.");
  }
  if (result.image && !result.imageAlt) throw Error("Describe the launch image for visitors using screen readers.");
  if (!Array.isArray(value.highlights) || value.highlights.length > 8 || value.highlights.some(item => typeof item !== "string" || !item.trim() || item.length > 180 || /[\u0000-\u001f]/u.test(item))) throw Error("Add up to eight short, approved highlights.");
  result.highlights = value.highlights.map(item => item.trim());
  for (const key of ["startsAt", "endsAt"]) if (result[key] && !validInstant(result[key])) throw Error("Choose a valid launch start and end time.");
  if (result.startsAt && result.endsAt && Date.parse(result.endsAt) <= Date.parse(result.startsAt)) throw Error("The launch end must be after its start.");
  return result;
}

/** Fail closed on invalid, unpublished/default, not-yet-started or expired launches. */
export function publicResidences(config, now = Date.now()) {
  let value;
  try { value = validateResidences(config); } catch { return null; }
  const time = typeof now === "number" ? now : new Date(now).getTime();
  if (!Number.isFinite(time) || !value.enabled || (value.startsAt && time < Date.parse(value.startsAt)) || (value.endsAt && time >= Date.parse(value.endsAt))) return null;
  const { enabled, startsAt, endsAt, ...approved } = value;
  return { ...approved, href: "/residences" };
}

/** Respect existing homepage order without requiring staff to edit it twice. */
export function residencesHomeLayout(layout, launch) {
  const order = layout.filter(key => key !== "residences");
  if (!launch?.homepage) return order;
  let index = launch.placement === "before-listings" ? order.indexOf("listings") : launch.placement === "before-contact" ? order.indexOf("contact") : -1;
  if (index < 0) index = Math.max(0, order.indexOf("hero") + 1);
  return [...order.slice(0,index), "residences", ...order.slice(index)];
}
