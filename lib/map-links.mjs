import { coordinatesFromText } from "./coordinates.mjs";
const hosts = new Set([
  "maps.app.goo.gl",
  "goo.gl",
  "maps.google.com",
  "www.google.com",
  "google.com",
  "maps.google.co.in",
  "www.google.co.in",
  "google.co.in",
]);
function approvedMapUrl(input) {
  const u = new URL(input);
  if (
    u.protocol !== "https:" ||
    u.username ||
    u.password ||
    u.port ||
    !hosts.has(u.hostname)
  )
    throw new Error("Use an HTTPS Google Maps share link.");
  if (u.hostname === "goo.gl" && !u.pathname.startsWith("/maps/"))
    throw new Error("Use a Google Maps share link.");
  if (!u.hostname.startsWith("maps.") && !u.pathname.startsWith("/maps"))
    throw new Error("This address is not a map link.");
  return u;
}
export async function resolveMapLink(input, fetcher = fetch) {
  if (typeof input !== "string" || input.length > 2000)
    throw new Error("Paste a Google Maps link.");
  let url = approvedMapUrl(input.trim());
  const seen = new Set();
  for (let i = 0; i < 5; i++) {
    const point = coordinatesFromText(url.href);
    if (point) return { ...point, source: url.href };
    if (seen.has(url.href))
      throw new Error(
        "This map link redirects in a loop. Use the full Maps address.",
      );
    seen.add(url.href);
    const response = await fetcher(url.href, {
      method: "GET",
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(7000),
    });
    await response.body?.cancel();
    if (![301, 302, 303, 307, 308].includes(response.status))
      throw new Error(
        "This map link does not expose exact coordinates. Open it in Maps and copy the full pin address, or enter verified coordinates.",
      );
    const location = response.headers.get("location");
    if (!location) throw new Error("Map redirect unavailable.");
    url = approvedMapUrl(new URL(location, url).href);
  }
  throw new Error("Use the full Google Maps pin address.");
}
export async function expandIntakeMap(context, fetcher = fetch) {
  if (!["opportunity", "project"].includes(context.kind))
    return { context, notes: [] };
  const links = [
    ...new Set(
      context.text.match(
        /https:\/\/(?:maps\.app\.goo\.gl\/|goo\.gl\/maps\/)[^\s<>]+/g,
      ) || [],
    ),
  ];
  if (links.length !== 1)
    return {
      context,
      notes:
        links.length > 1
          ? [
              "Several map links were supplied. Confirm the property pin in the editor.",
            ]
          : [],
    };
  try {
    const map = await resolveMapLink(links[0], fetcher);
    return {
      context: {
        ...context,
        text: context.text + "\nResolved supplied map pin: " + map.source,
      },
      notes: [
        "Map share link expanded. Verify the pin before publishing its coordinates.",
      ],
    };
  } catch (e) {
    return { context, notes: [e.message] };
  }
}
