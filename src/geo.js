// Maps: the data, the places, the projection for a view, and the base map every map chart draws on.
//
// The data is geo/*.json, built from Natural Earth (public domain) and the Australian Bureau of
// Statistics' ASGS boundaries (CC BY 4.0) by tools/build-geo.sh:
//   world     countries, with Natural Earth's population estimate and each country's area
//   states    Australia's states and territories
//   capitals  the greater capital city areas ("Greater Melbourne")
//   councils  local government areas (2025)
//   cities    capitals and places of 100,000 people or more; in Australia, 20,000 or more
//   terrain   the kind of ground, from RESOLVE Ecoregions 2017 (CC BY 4.0) and Natural Earth's ice:
//             a coarse file for the world and a finer one for Australia
//
// A map's "focus" is what it shows: "world", "australia", a state ("Victoria"), a capital area
// ("Greater Melbourne", or just "melbourne"), a country by name, or [west, south, east, north].
import * as core from "./core.js";
import { mix, landColours } from "./theme.js";

const d3 = globalThis.d3, topojson = globalThis.topojson;
export const GEO = {};

export async function loadGeo() {
  const get = async (f) => (await fetch(`/geo/${f}.json`)).json();
  const [world, states, capitals, councils, cities, tw, ta] = await Promise.all(["world", "australia-states", "australia-capitals", "australia-councils", "cities", "terrain-world", "terrain-australia"].map(get));
  GEO.world = topojson.feature(world, world.objects.countries).features;
  GEO.states = topojson.feature(states, states.objects.states).features;
  GEO.stateBorders = topojson.mesh(states, states.objects.states, (a, b) => a !== b);
  GEO.capitals = topojson.feature(capitals, capitals.objects.capitals).features;
  GEO.councils = topojson.feature(councils, councils.objects.councils).features;
  GEO.councilBorders = topojson.mesh(councils, councils.objects.councils, (a, b) => a !== b);
  // council lines within one state, for a close-up that should not draw its neighbours' councils
  GEO.councilBordersIn = (state) => topojson.mesh(councils, councils.objects.councils, (a, b) => a !== b && (a.properties.state === state || b.properties.state === state));
  GEO.countryBorders = topojson.mesh(world, world.objects.countries, (a, b) => a !== b);
  GEO.cities = cities;
  GEO.terrain = { world: topojson.feature(tw, tw.objects.terrain).features, australia: topojson.feature(ta, ta.objects.terrain).features };
  // ice last, over the ground it lies on
  GEO.terrain.world.sort((a, b) => (a.properties.terrain === "ice") - (b.properties.terrain === "ice"));
}

// The world view: a flat map, cropped to where people live (Antarctica and the far north's ice
// left off), cut through the Bering Strait so no country is split. Miller's cylinder, so the map
// fills its rectangle and the small countries of Europe and the Middle East draw larger than an
// equal-area map would draw them.
const WORLD = { cut: -169.5, s: -56, n: 84 };
const millerRaw = (l, p) => [l, 1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * p))];
millerRaw.invert = (x, y) => [x, 2.5 * Math.atan(Math.exp(0.8 * y)) - 0.625 * Math.PI];
const WORLD_VIEW = { type: "MultiPoint", coordinates: [WORLD.cut + 0.1, WORLD.cut - 0.1, WORLD.cut + 180].flatMap((x) => [[x, WORLD.s], [x, WORLD.n]]) };
export const inWorld = (f) => f.properties.ADM0_A3 !== "ATA";

// The parts of a region worth fitting a view to: its big pieces, not the specks far out to sea
// (New South Wales counts Lord Howe Island, 600 km east, and would pull a view of Australia off
// centre and shrink it).
function mainland(f) {
  const geom = f.geometry;
  if (!geom || geom.type !== "MultiPolygon") return f;
  const area = (c) => { const a = d3.geoArea({ type: "Polygon", coordinates: c }); return a > 2 * Math.PI ? 4 * Math.PI - a : a; };
  const parts = geom.coordinates.map((c) => ({ c, a: area(c) })), big = Math.max(...parts.map((q) => q.a));
  return { ...f, geometry: { type: "MultiPolygon", coordinates: parts.filter((q) => q.a >= big * 0.02).map((q) => q.c) } };
}

const norm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const SHORT = { melbourne: "Greater Melbourne", sydney: "Greater Sydney", brisbane: "Greater Brisbane", perth: "Greater Perth",
  adelaide: "Greater Adelaide", hobart: "Greater Hobart", darwin: "Greater Darwin", canberra: "Australian Capital Territory" };

// The features a map colours or counts by: "world" (countries), "states" or "councils".
export function layer(name = "world") {
  if (name === "world" || name === "countries") return GEO.world;
  if (name === "states") return GEO.states;
  if (name === "councils") return GEO.councils;
  throw new Error(`unknown map layer ${JSON.stringify(name)}: world, states or councils`);
}

// A feature by name (or ISO code for a country), forgiving about case and punctuation.
export function region(features, name) {
  const n = norm(name);
  return features.find((f) => [f.properties.name, f.properties.NAME, f.properties.NAME_LONG, f.properties.ISO_A3, f.properties.ADM0_A3].some((v) => norm(v) === n));
}

// A place: [lon, lat] given, or a city looked up by name (and "country" when names repeat),
// the most populous match winning.
export function place(r) {
  if (core.isNum(r.lon) && core.isNum(r.lat)) return [r.lon, r.lat];
  const name = norm(r.place ?? r.label), country = r.country ? norm(r.country) : null;
  const hits = GEO.cities.filter((c) => norm(c.name) === name && (!country || norm(c.country) === country));
  if (!hits.length) throw new Error(`no place called ${JSON.stringify(r.place ?? r.label)}${r.country ? " in " + r.country : ""}; give "lat" and "lon"`);
  const c = hits.reduce((m, x) => (x.pop > m.pop ? x : m));
  return [c.lon, c.lat];
}

// What a focus shows, as a GeoJSON object to fit, and whether it is Australian.
export function focusShape(focus = "world") {
  if (Array.isArray(focus)) {
    const [w, s, e, n] = focus;
    // the box's corners, not a polygon: a polygon's winding decides which side is inside, and the
    // wrong way round it is the whole world less the box
    return { shape: { type: "MultiPoint", coordinates: [[w, s], [e, s], [e, n], [w, n], [(w + e) / 2, s], [(w + e) / 2, n]] }, australian: w > 100 && e < 160 && s < -8, box: true };
  }
  const f = norm(focus);
  if (f === "world") return { shape: WORLD_VIEW, world: true };
  if (f === "australia") return { shape: { type: "FeatureCollection", features: GEO.states.map(mainland) }, australian: true };
  const st = region(GEO.states, focus);
  if (st) return { shape: mainland(st), australian: true, state: st };
  const cap = region(GEO.capitals, SHORT[f] || focus);
  if (cap) return { shape: mainland(cap), australian: true, capital: cap };
  const country = region(GEO.world, focus);
  if (country) return { shape: mainland(country), australian: false };
  throw new Error(`unknown focus ${JSON.stringify(focus)}: world, australia, a state, a capital, a country, or [west, south, east, north]`);
}

// The projection for a focus: the flat world map above for the world, an equal-area conic for
// Australia, and Mercator for close-ups (shapes true at city and state scale).
export function projectionFor(focus, [x0, y0, x1, y1], pad = 0) {
  const fs = focusShape(focus);
  const [[w, s], [e, n]] = fs.world ? [[-180, WORLD.s], [180, WORLD.n]] : d3.geoBounds(fs.shape);
  const span = Math.max(e - w, n - s);
  // a conic cannot cross the equator, so a view that does is drawn in Mercator
  const proj = fs.world ? d3.geoProjection(millerRaw).rotate([-(WORLD.cut + 180), 0])
    : span > 20 && !(s < -5 && n > 5) ? d3.geoConicEqualArea().parallels([s + (n - s) / 6, n - (n - s) / 6]).rotate([-(w + e) / 2, 0]).center([0, (s + n) / 2])
    : d3.geoMercator();
  proj.fitExtent([[x0 + pad, y0 + pad], [x1 - pad, y1 - pad]], fs.shape);
  return { proj, path: d3.geoPath(proj), fs, span };
}

// The base map: the land in sand on the ground, borders as ground-coloured lines, and in Australia
// the states (and, close in, the councils) drawn within it. With "terrain", the land in view is
// shaded by the kind of ground it is: desert, dry grass, scrub, forest, jungle, taiga, tundra, ice.
// "fit" is the box the view is fitted to, when it is not the whole box (see mapRoom). Returns
// what it drew with.
export function basemap(g, focus, box, ctx, { pad = 0, councils, terrain = false, fit } = {}) {
  const { S, th } = ctx, P = projectionFor(focus, fit || box, pad), { path, fs } = P, C = landColours(th);
  const { land, far } = C;
  const base = g.append("g").attr("id", "basemap");
  const clipId = `vv-clip-${Math.round(box[0])}-${Math.round(box[1])}-${Math.round(box[2])}`;
  base.append("clipPath").attr("id", clipId).append("rect").attr("x", box[0]).attr("y", box[1]).attr("width", box[2] - box[0]).attr("height", box[3] - box[1]);
  const b = base.append("g").attr("clip-path", `url(#${clipId})`);
  const lineW = Math.max(0.6, S * (fs.world ? 0.0012 : 0.0018));
  const countries = GEO.world.filter((c) => !fs.world || inWorld(c));
  const home = fs.australian ? fs.state?.properties.name ?? fs.capital?.properties.state : null;
  // the terrain, clipped to the land it shades: the whole view, or in Australia its states (a close-
  // up, only its own state); each patch stroked in its own colour to close the gaps at the coast
  const shade = (lands, patches) => {
    const cid = `${clipId}-terrain`, cp = base.append("clipPath").attr("id", cid);
    for (const f of lands) cp.append("path").attr("d", path(f));
    const tg = b.append("g").attr("class", "terrain").attr("clip-path", `url(#${cid})`);
    for (const t of patches) {
      const c = C[t.properties.terrain];
      if (c) tg.append("path").attr("data-terrain", t.properties.terrain).attr("d", path(t)).attr("fill", c).attr("stroke", c).attr("stroke-width", S * 0.006).attr("stroke-linejoin", "round");
    }
  };
  // every country, Australia's neighbours included, then Australia's own states over the top
  for (const c of countries) {
    if (fs.australian && c.properties.ADM0_A3 === "AUS") continue;
    b.append("path").attr("class", "country").attr("d", path(c)).attr("fill", fs.australian ? far : land);
  }
  if (terrain && !fs.australian) shade(countries, GEO.terrain.world);
  b.append("path").attr("class", "borders").attr("d", path(GEO.countryBorders)).attr("fill", "none").attr("stroke", th.ground).attr("stroke-width", lineW);
  if (fs.australian) {
    // a state close-up shows its own state in the land colour and the neighbours paler
    for (const st of GEO.states) b.append("path").attr("class", "state").attr("data-name", st.properties.name).attr("d", path(st))
      .attr("fill", home && st.properties.name !== home ? far : land);
    if (terrain) shade(home ? GEO.states.filter((st) => st.properties.name === home) : GEO.states, GEO.terrain.australia);
    const close = councils ?? (fs.capital || fs.state || (fs.box && P.span < 12));
    if (close) b.append("path").attr("class", "council-borders").attr("d", path(home ? GEO.councilBordersIn(home) : GEO.councilBorders)).attr("fill", "none")
      .attr("stroke", th.dark ? mix(th.ground, land, 0.45) : mix(th.roles.neutral, land, 0.45)).attr("stroke-width", Math.max(0.5, S * 0.0012));
    b.append("path").attr("class", "state-borders").attr("d", path(GEO.stateBorders)).attr("fill", "none").attr("stroke", th.ground).attr("stroke-width", lineW * 1.8);
  }
  return { ...P, land, far, layer: b, clipId };
}

// Room for what goes with a map: "top" (a stat) and "bottom" (a key), each [width, height]. The
// map is drawn as large as the box allows, and each piece goes beside it when the map leaves the
// room, else on open sea in a corner of the view; only when neither works does the map shrink to
// make room. Returns the box to fit the map to ("fit", for basemap) and each piece's top-left.
export function mapRoom(focus, box, ctx, need = {}) {
  const { S } = ctx, [x0, y0, x1, y1] = box, gap = S * 0.025, fs = focusShape(focus);
  const band = (k) => (need[k] ? need[k][1] + gap : 0);
  let P = projectionFor(focus, box);
  const [[a, b], [c, d]] = P.path.bounds(fs.shape), free = y1 - y0 - (d - b);
  // beside: the stat, the map and the key stacked and centred
  if (free >= band("top") + band("bottom")) {
    const gy = y0 + (free - band("top") - band("bottom")) / 2, top = gy + band("top"), fit = [x0, top, x1, top + (d - b)];
    return { fit, top: need.top && [Math.max(x0, a), gy], bottom: need.bottom && [Math.max(x0, a), fit[3] + gap] };
  }
  // on the sea: the land that matters in view, sampled across the piece's corner
  const lands = { type: "FeatureCollection", features: fs.australian
    ? GEO.states.filter((st) => !(fs.state || fs.capital) || st.properties.name === (fs.state?.properties.name ?? fs.capital?.properties.state))
    : GEO.world.filter(inWorld) };
  const clear = (proj, [p, q, r, t]) => {
    const step = S * 0.012;
    for (let x = p; x <= r + 0.1; x += Math.max(step, (r - p) / 40)) for (let y = q; y <= t + 0.1; y += Math.max(step, (t - q) / 10)) {
      const ll = proj.invert([x, y]);
      if (ll && d3.geoContains(lands, ll)) return false;
    }
    return true;
  };
  const corner = (Q, bx, k) => {
    const [w, h] = need[k], [[l], [r]] = Q.path.bounds(fs.shape), y = k === "top" ? bx[1] : bx[3] - h;
    return [[Math.max(bx[0], l), y], [Math.min(bx[2], r) - w, y]].find(([x]) => clear(Q.proj, [x, y, x + w, y + h])) || null;
  };
  const top = need.top && corner(P, box, "top"), bottom = need.bottom && corner(P, box, "bottom");
  if ((!need.top || top) && (!need.bottom || bottom)) return { fit: box, top, bottom };
  // shrink: a band for each piece that found no sea, and the others tried again on the smaller map
  const fit = [x0, y0 + (need.top && !top ? band("top") : 0), x1, y1 - (need.bottom && !bottom ? band("bottom") : 0)];
  P = projectionFor(focus, fit);
  const [[a2]] = P.path.bounds(fs.shape);
  const at = (k, found) => found ? corner(P, fit, k) || null : [Math.max(x0, a2), k === "top" ? y0 : fit[3] + gap];
  let t2 = need.top && at("top", top), b2 = need.bottom && at("bottom", bottom);
  if (need.top && !t2 || need.bottom && !b2) {
    const f3 = [x0, y0 + band("top"), x1, y1 - band("bottom")];
    const [[a3]] = projectionFor(focus, f3).path.bounds(fs.shape);
    return { fit: f3, top: need.top && [Math.max(x0, a3), y0], bottom: need.bottom && [Math.max(x0, a3), f3[3] + gap] };
  }
  return { fit, top: t2, bottom: b2 };
}

// A small overview map in a corner, the close-up's area outlined on it.
export function inset(g, focus, overview, [x0, y0, x1, y1], ctx) {
  const { S, th } = ctx, ig = g.append("g").attr("id", "inset");
  ig.append("rect").attr("x", x0).attr("y", y0).attr("width", x1 - x0).attr("height", y1 - y0).attr("rx", S * 0.01).attr("fill", th.ground).attr("stroke", mix(th.roles.neutral, th.ground, 0.4)).attr("stroke-width", S * 0.002);
  const P = basemap(ig, overview, [x0, y0, x1, y1], ctx, { pad: S * 0.012, councils: false });
  const fs = focusShape(focus);
  const [[a, b], [c, d]] = P.path.bounds(fs.shape);
  ig.append("rect").attr("x", a).attr("y", b).attr("width", Math.max(3, c - a)).attr("height", Math.max(3, d - b)).attr("fill", "none").attr("stroke", th.roles.main).attr("stroke-width", S * 0.004);
  return ig;
}

// A place marker: a dot with a ground ring, or for the one that matters, an olive pin.
export function marker(g, [x, y], ctx, { main = false, r } = {}) {
  const { S, th } = ctx;
  if (!main) return core.dot(g, x, y, r ?? S * 0.009, th.strong, th.ground, S * 0.003);
  const h = S * 0.05, w = S * 0.034, p = d3.path();
  p.moveTo(x, y);
  p.bezierCurveTo(x - w * 0.15, y - h * 0.35, x - w / 2, y - h * 0.55, x - w / 2, y - h * 0.75);
  p.arc(x, y - h * 0.75, w / 2, Math.PI, 0);
  p.bezierCurveTo(x + w / 2, y - h * 0.55, x + w * 0.15, y - h * 0.35, x, y);
  // a ground halo, then the pin edged in the strong ink, so it holds on sand and on green alike
  g.append("path").attr("d", p.toString()).attr("fill", th.ground).attr("stroke", th.ground).attr("stroke-width", S * 0.009).attr("stroke-linejoin", "round");
  g.append("path").attr("d", p.toString()).attr("fill", th.roles.main).attr("stroke", th.strong).attr("stroke-width", S * 0.0022).attr("stroke-linejoin", "round");
  core.dot(g, x, y - h * 0.75, w * 0.18, th.ground);
  return [x - w / 2, y - h * 1.0, x + w / 2, y];
}

// Names beside points, each in the first of four spots clear of the others and inside the box;
// items earlier in the list choose first. Returns the boxes it used.
export function labelPoints(g, items, box, ctx) {
  const { S, th } = ctx, taken = [...(items.blocks || [])], used = [];
  for (const it of items) {
    const [x, y] = it.xy, r = it.r ?? S * 0.01, px = it.px ?? S * 0.021, face = it.face ?? "arvo";
    const w = core.measure(it.text, face, px).w, h = px * 1.15, gp = S * 0.008;
    const spots = [[x + r + gp, y, "l", [x + r + gp, y - h / 2, x + r + gp + w, y + h / 2]],
      [x - r - gp, y, "r", [x - r - gp - w, y - h / 2, x - r - gp, y + h / 2]],
      [x, y - r - gp - h / 2, "c", [x - w / 2, y - r - gp - h, x + w / 2, y - r - gp]],
      [x, y + r + gp + h / 2, "c", [x - w / 2, y + r + gp, x + w / 2, y + r + gp + h]],
      [x + r + gp, y - r - h / 2, "l", [x + r + gp, y - r - h, x + r + gp + w, y - r]],
      [x - r - gp, y - r - h / 2, "r", [x - r - gp - w, y - r - h, x - r - gp, y - r]],
      [x + r + gp, y + r + h / 2, "l", [x + r + gp, y + r, x + r + gp + w, y + r + h]],
      [x - r - gp, y + r + h / 2, "r", [x - r - gp - w, y + r, x - r - gp, y + r + h]]];
    const ok = spots.find((s) => s[3][0] >= box[0] && s[3][2] <= box[2] && s[3][1] >= box[1] && s[3][3] <= box[3]
      && !taken.some((t) => !(s[3][2] < t[0] || s[3][0] > t[2] || s[3][3] < t[1] || s[3][1] > t[3])));
    if (!ok) { if (it.must) used.push(null); continue; }
    core.text(g, it.text, { x: ok[0], y: ok[1], face, px, fill: it.fill ?? th.ink, align: ok[2], valign: "fmid", halo: [th.ground, S * 0.004] });
    taken.push(ok[3]); used.push(ok[3]);
  }
  return used;
}

// A key of shades, least to most, with the breaks written under the joins.
export function shadeKey(g, colours, breaks, [x0, y], ctx, { width } = {}) {
  const { S, th } = ctx, k = g.append("g").attr("id", "key"), n = colours.length, sw = (width ?? S * 0.42) / n, sh = S * 0.022;
  colours.forEach((c, i) => k.append("rect").attr("x", x0 + i * sw).attr("y", y).attr("width", sw - 1).attr("height", sh).attr("fill", c));
  breaks.forEach((b, i) => core.text(k, b, { x: x0 + (i + 1) * sw, y: y + sh + S * 0.008, face: "arvo", px: S * 0.018, fill: th.body, align: "c", valign: "asc" }));
  return y + sh + S * 0.035;
}
