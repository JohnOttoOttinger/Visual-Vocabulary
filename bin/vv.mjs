#!/usr/bin/env node
// vv — the chart library's command line.
//
//   vv render <spec.json ...> [--out DIR] [--frame] [--mode plaster|longform|marquee]
//       One PNG per spec: the chart alone on a transparent ground (<name>.png) plus its layered
//       SVG (<name>.svg). --frame also draws it on a specimen slide (<name>-frame.png).
//       A spec file may hold one spec or {"charts": [...]}, so a caller renders a whole deck in
//       one launch. Prints a JSON list of what it wrote.
//   vv gallery [--out DIR] [--only chart,chart] [--scale 2]
//       Every example in specs/examples, framed, in plaster and in marquee. --scale 2 renders at
//       twice the pixels (for a zoomable review page).
//
// Fonts come from ~/Library/Fonts; the plaster and grunge textures from the Visual Storyteller
// (VV_TEXTURES to point elsewhere). Neither is copied into this repo.

import http from "node:http";
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, basename, extname, resolve } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FONTS = join(homedir(), "Library/Fonts");
const TEXTURES = process.env.VV_TEXTURES ||
  join(homedir(), "Claude-Projects-2026/Oddtoe-Instagram-Boost-Ads/creative/textures");
const CHROME = process.env.VV_CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json",
  ".ttf": "font/ttf", ".otf": "font/otf", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml" };

function serve() {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split("?")[0]);
    let file;
    if (url.startsWith("/fonts/")) file = join(FONTS, basename(url));
    else if (url.startsWith("/texture/")) file = join(TEXTURES, basename(url));
    else file = join(ROOT, url);
    if (!file.startsWith(ROOT) && !file.startsWith(FONTS) && !file.startsWith(TEXTURES)) { res.writeHead(403).end(); return; }
    if (!existsSync(file) || statSync(file).isDirectory()) { res.writeHead(404).end(); return; }
    res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
    res.end(readFileSync(file));
  });
  return new Promise((ok) => server.listen(0, "127.0.0.1", () => ok(server)));
}

function args(argv) {
  const out = { files: [], flags: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const k = a.slice(2), v = argv[i + 1];
      if (v === undefined || v.startsWith("--")) out.flags[k] = true; else { out.flags[k] = v; i++; }
    } else out.files.push(a);
  }
  return out;
}

// Pictures named by path (relative to the spec file, or from home with ~/) are read in as data URIs, so the chart and its
// SVG carry them and the render page needs no access to the disk.
const IMAGE_TYPES = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };
function inline(images, base) {
  return images.map((f) => {
    if (!f) return null;
    const file = f.startsWith("~/") ? join(homedir(), f.slice(2)) : resolve(base, f), type = IMAGE_TYPES[extname(file).toLowerCase()];
    if (!type) throw new Error(`picture ${f}: use jpg, png or webp`);
    return `data:${type};base64,${readFileSync(file).toString("base64")}`;
  });
}

function specsFrom(file) {
  const j = JSON.parse(readFileSync(file, "utf8"));
  const list = Array.isArray(j.charts) ? j.charts : [j];
  const stem = basename(file, ".json");
  return list.map((s, k) => ({
    name: s.name || (list.length > 1 ? `${stem}-${k + 1}` : stem), ...s,
    ...(s.images ? { images: inline(s.images, dirname(resolve(file))) } : {}),
  }));
}

async function session(fn) {
  const server = await serve();
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--font-render-hinting=none"] });
  try {
    const page = await browser.newPage();
    page.on("pageerror", (e) => console.error("! page:", e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/render/page.html`);
    await page.waitForFunction("window.vvReady === true", { timeout: 20000 });
    return await fn(page);
  } finally {
    await browser.close();
    server.close();
  }
}

let SCALE = 1;   // --scale 2 renders at twice the pixels, for zooming in

async function shoot(page, file, w, h) {
  await page.setViewport({ width: Math.ceil(w), height: Math.ceil(h), deviceScaleFactor: SCALE });
  const el = await page.$("#stage > *");
  await el.screenshot({ path: file, omitBackground: true });
}

async function renderOne(page, spec, outDir, { frame, chartOnly = true }) {
  const wrote = { name: spec.name };
  if (chartOnly) {
    const w = spec.width || 918, h = spec.height || 820;
    const r = await page.evaluate((s) => window.vv.chart(s), { ...spec, width: w, height: h });
    const png = join(outDir, `${spec.name}.png`), svg = join(outDir, `${spec.name}.svg`);
    await shoot(page, png, r.width, r.height);
    writeFileSync(svg, r.svg);
    Object.assign(wrote, { png, svg, bleed: r.bleed, insight: r.insight, warnings: r.warnings });
  }
  if (frame) {
    const r = await page.evaluate((s) => window.vv.frame(s), spec);
    const file = join(outDir, `${spec.name}-frame.png`);
    await shoot(page, file, r.width, r.height);
    Object.assign(wrote, { frame: file, box: r.box });
    if (!chartOnly) wrote.warnings = r.warnings;
  }
  return wrote;
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const { files, flags } = args(rest);
  SCALE = Number(flags.scale) || 1;
  if (cmd === "render") {
    const outDir = resolve(flags.out || join(ROOT, "out"));
    mkdirSync(outDir, { recursive: true });
    const specs = files.flatMap(specsFrom).map((s) => (flags.mode ? { ...s, mode: flags.mode } : s));
    const done = await session(async (page) => {
      const out = [];
      for (const s of specs) out.push(await renderOne(page, s, outDir, { frame: Boolean(flags.frame) }));
      return out;
    });
    console.log(JSON.stringify(done, null, 2));
  } else if (cmd === "gallery") {
    const outDir = resolve(flags.out || join(ROOT, "out/gallery"));
    mkdirSync(outDir, { recursive: true });
    const dir = join(ROOT, "specs/examples");
    // --only a,b: just the examples whose chart id is listed
    const only = flags.only ? new Set(String(flags.only).split(",")) : null;
    const specs = readdirSync(dir).filter((f) => f.endsWith(".json")).sort().flatMap((f) => specsFrom(join(dir, f)))
      .filter((s) => !only || only.has(s.chart));
    const modes = flags.mode ? [flags.mode] : ["plaster", "marquee"];
    const done = await session(async (page) => {
      const out = [];
      for (const s of specs) for (const mode of modes) {
        const w = await renderOne(page, { ...s, mode, name: `${s.name}-${mode}` }, outDir, { frame: true, chartOnly: false });
        for (const m of w.warnings || []) console.error(`! ${w.name}: ${m}`);
        out.push(w);
      }
      return out;
    });
    console.log(`${done.length} framed charts in ${outDir}`);
  } else {
    console.log(readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").filter((l) => l.startsWith("//")).map((l) => l.slice(3)).join("\n"));
  }
}

main().catch((e) => { console.error("!", e.message); process.exit(1); });
