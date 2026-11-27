// Legacy hostnames merged into this workbench: permanent redirect to the matching tab.
const LEGACY = { "engineering.mohammed-km.in": "https://labs.mohammed-km.in/#engineering", "grid.mohammed-km.in": "https://labs.mohammed-km.in/#grid", "orbits.mohammed-km.in": "https://labs.mohammed-km.in/#orbits" };
export async function onRequest({ request, next }) {
  const target = LEGACY[new URL(request.url).hostname];
  return target ? Response.redirect(target, 308) : next();
}
