#!/usr/bin/env node
// A locator map, handed to After Effects: turns a locator-map spec (or a file of them) into a job
// for the GEOlayers points-of-interest template (Oddview-31) in Claude-After-Effects-Scenes, so the
// slide's map and the moving map show the same places. The camera starts wide over Australia (the
// template's default) and settles on the map's own view.
//
//   node tools/to-geolayers.mjs specs/examples/locator-map.json [--out out/geolayers/<name>.json]
//
// Then, with After Effects open and the GEOlayers panel showing:
//   ~/Claude-Projects-2026/Claude-After-Effects-Scenes/tools/map-job.sh <the job file>
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as d3 from "d3";
import * as topojson from "topojson-client";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (f) => JSON.parse(readFileSync(join(ROOT, "geo", f), "utf8"));
const cities = read("cities.json");
const topo = { states: read("australia-states.json"), capitals: read("australia-capitals.json"), world: read("world.json") };
const feats = {
  states: topojson.feature(topo.states, topo.states.objects.states).features,
  capitals: topojson.feature(topo.capitals, topo.capitals.objects.capitals).features,
  world: topojson.feature(topo.world, topo.world.objects.countries).features,
};
const norm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const SHORT = { melbourne: "Greater Melbourne", sydney: "Greater Sydney", brisbane: "Greater Brisbane", perth: "Greater Perth",
  adelaide: "Greater Adelaide", hobart: "Greater Hobart", darwin: "Greater Darwin", canberra: "Australian Capital Territory" };

function place(r) {
  if (typeof r.lat === "number" && typeof r.lon === "number") return [r.lon, r.lat];
  const hits = cities.filter((c) => norm(c.name) === norm(r.place ?? r.label) && (!r.country || norm(c.country) === norm(r.country)));
  if (!hits.length) throw new Error(`no place called ${r.label}; give lat and lon`);
  const c = hits.reduce((m, x) => (x.pop > m.pop ? x : m));
  return [c.lon, c.lat];
}

// the map's view as [west, south, east, north], rounded to what a camera needs
function viewBox(focus) {
  if (Array.isArray(focus)) return focus;
  const f = norm(focus || "australia");
  if (f === "world") return [-180, -60, 180, 75];
  if (f === "australia") return [112, -44, 154, -10];
  const byName = (list, name) => list.find((x) => [x.properties.name, x.properties.NAME].some((v) => norm(v) === norm(name)));
  const shape = byName(feats.states, focus) || byName(feats.capitals, SHORT[f] || focus) || byName(feats.world, focus);
  if (!shape) throw new Error(`unknown focus ${focus}`);
  const [[w, s], [e, n]] = d3.geoBounds(shape);
  return [w, s, e, n].map((v) => Math.round(v * 100) / 100);
}

const args = process.argv.slice(2), file = args.find((a) => !a.startsWith("--"));
const outAt = args.indexOf("--out") >= 0 ? args[args.indexOf("--out") + 1] : null;
if (!file) { console.log("usage: node tools/to-geolayers.mjs <locator-map spec.json> [--out job.json]"); process.exit(1); }
const j = JSON.parse(readFileSync(file, "utf8")), specs = (j.charts || [j]).filter((s) => s.chart === "locator-map");
if (!specs.length) { console.error("! no locator-map specs in", file); process.exit(1); }
const slug = (s) => String(s || "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");
const job = {
  template: "Oddview-31-AEP-Geolayers-POI",
  episode: slug(j.episode || "Visual-Vocabulary"),
  renders: specs.map((s) => ({
    subject: slug(s.title ? s.title.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : s.name),
    slots: {
      places: (s.data || []).map((r) => { const [lon, lat] = place(r); return { name: String(r.label), lat: +lat.toFixed(4), lon: +lon.toFixed(4) }; }),
      camera: { end_bbox: viewBox(s.options?.focus) },
    },
  })),
  output: { dir: "renders/maps" },
};
const out = outAt || join(ROOT, "out/geolayers", `${basename(file, ".json")}.json`);
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(job, null, 2) + "\n");
console.log(`${out}: ${job.renders.length} map(s) for Oddview-31`);
