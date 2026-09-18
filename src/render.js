// One spec in, one chart out. Runs in the render page (render/page.html) inside headless Chrome.
//
// drawChart(spec)  the chart alone, on a transparent ground: what the Storyteller composites into
//                  its own slide, and what a motion pass takes apart row by row.
// drawFrame(spec)  the chart on a specimen slide (lead-in, headline, line, source), for the
//                  library's own gallery and for any use that has no slide of its own.

import * as core from "./core.js";
import { theme } from "./theme.js";
import { CHARTS } from "./charts/index.js";

const d3 = globalThis.d3;
const SVGNS = "http://www.w3.org/2000/svg";

export function drawChart(spec) {
  const chart = CHARTS[spec.chart];
  if (!chart) throw new Error(`unknown chart ${JSON.stringify(spec.chart)}. Built: ${Object.keys(CHARTS).join(", ")}`);
  const th = theme(spec.mode || "plaster");
  const W = spec.width, H = spec.height;
  // S is the frame's short side. A Storyteller chart box is 0.85 of a 1080 frame wide, so that is
  // the guess when nobody says.
  const S = spec.scale || Math.round(W / 0.85);
  const b = Math.round(spec.bleed ?? S * 0.03);   // room for a ring or a label past the box edge
  const warnings = [];

  const svg = d3.create("svg").attr("xmlns", SVGNS)
    .attr("width", W + 2 * b).attr("height", H + 2 * b)
    .attr("viewBox", `0 0 ${W + 2 * b} ${H + 2 * b}`)
    .attr("data-chart", spec.chart).attr("data-mode", th.mode).attr("data-bleed", b);
  if (spec.ground) svg.append("rect").attr("id", "ground").attr("width", W + 2 * b).attr("height", H + 2 * b).attr("fill", th.ground);
  const g = svg.append("g").attr("id", "chart").attr("transform", `translate(${b},${b})`);
  const box = [0, 0, W, H];

  const rows = core.rowsOf(spec.data);
  const needs = chart.needs(spec);
  const ready = rows.length > 0 && needs.every((col) => rows.some((r) => core.has(r, col)));
  let insight = null;
  if (ready) {
    for (const col of needs) {
      if (col === "to" || col === "note" || col === "label") continue;   // a blank label is allowed
      const gaps = rows.map((r, k) => (core.has(r, col) ? null : k + 1)).filter(Boolean);
      if (gaps.length) throw new Error(`${spec.chart}: row(s) ${gaps.join(", ")} have no ${col}`);
    }
    // a chart may work out its own default insight (a group, a bin) when the spec names none
    const ins = typeof chart.insight === "function" && !spec.insight
      ? chart.insight(rows, spec) : core.pickInsight(rows, spec.insight, typeof chart.insight === "string" ? chart.insight : null);
    const P = new core.Paint(spec.highlight || "hue", ins, th);
    const ctx = {
      S, th, paint: P, unit: spec.unit || "", prefix: spec.prefix || "", axes: spec.axes,
      series: spec.series, options: spec.options || {}, images: spec.images, warn: (m) => warnings.push(m),
    };
    insight = chart.draw(g, rows, box, ctx);
    const ring = (spec.highlight === "enclosure") || (chart.ringOnHue && (spec.highlight || "hue") === "hue");
    if (insight && ring) {
      const m = S * 0.010;
      core.dottedBox(g.append("g").attr("id", "enclosure"),
        [insight[0] - m, insight[1] - m, insight[2] + m, insight[3] + m], th.ink, S);
    }
  } else placeholder(g, box, spec.chart, needs, S, th);

  return { node: svg.node(), bleed: b, insight, warnings };
}

// A drafted slide with no numbers yet still renders, so a shape can be looked at before the table
// is written: a dotted box naming the columns the chart reads.
function placeholder(g, box, id, needs, S, th) {
  core.dottedBox(g, box, th.roles.neutral, S, S * 0.03);
  const cx = (box[0] + box[2]) / 2, cy = (box[1] + box[3]) / 2;
  core.text(g, "DATA TO COME", { x: cx, y: cy - S * 0.01, face: "bebas", px: S * 0.07, fill: th.roles.neutral, align: "c", valign: "bottom" });
  core.text(g, `${id} reads: ${needs.join(", ")}`, { x: cx, y: cy + S * 0.03, face: "arvo", px: S * 0.026, fill: th.body, align: "c" });
}

// ---------------------------------------------------------------- the specimen slide

// Laid out on the Storyteller's measures (infographic_lab.header, chart_lab.one_line and build), so
// a specimen and a Storyteller chart slide put the chart in the same box.
export async function drawFrame(spec) {
  const th = theme(spec.mode || "plaster");
  const [FW, FH] = spec.frame || [1080, 1350];
  const S = Math.min(FW, FH);
  const pad = S * 0.075;

  const host = document.createElement("div");
  host.className = "frame";
  Object.assign(host.style, { position: "relative", width: `${FW}px`, height: `${FH}px`, overflow: "hidden", background: th.ground });

  const textured = spec.texture ?? th.mode === "plaster";
  if (textured) {
    const ground = await textureLayer("plaster", FW, FH, (t, mean) => 1 + (t - mean) * 0.55, th.ground);
    if (ground) host.append(ground);
  }

  const svg = d3.create("svg").attr("xmlns", SVGNS).attr("width", FW).attr("height", FH);
  Object.assign(svg.node().style, { position: "absolute", left: 0, top: 0 });
  const hd = svg.append("g").attr("id", "header");

  let y = S * 0.085;
  if (spec.kicker) {
    const kpx = Math.max(S * 0.030, core.shrinkTo(spec.kicker, "qwigley", S * 0.052, FW - 2 * pad, S * 0.030));
    core.text(hd, spec.kicker, { x: pad, y, face: "qwigley", px: kpx, fill: th.kicker });
    y += kpx * 1.0;   // the headline rises into the lead-in's descenders
  }
  const hpx = core.shrinkTo(spec.title || "", "bebas", S * 0.088, FW - 2 * pad, S * 0.05);
  const hb = core.text(hd, spec.title || "", { x: pad, y, face: "bebas", px: hpx, fill: th.ink, ref: "H" });
  let top = hb[3] + S * 0.050;

  const line = spec.line || "";
  if (line) {
    let px = S * 0.030;
    const width = (p) => d3.sum(core.splitBold(line), ([t, b]) => core.measure(t, b ? "arvoBold" : "arvo", p).w);
    while (px > S * 0.021 && width(px) > FW - 2 * pad) px -= 1;
    core.para(hd, line, { x: pad, y: top - S * 0.020, px, width: FW, fill: th.body });
    top = top - S * 0.020 + px + S * 0.040;
  }
  const box = [pad, top + S * 0.015, FW - pad, FH - S * 0.165];

  const res = drawChart({ ...spec, width: box[2] - box[0], height: box[3] - box[1], scale: S, ground: false });
  const cg = svg.append("g").attr("transform", `translate(${box[0] - res.bleed},${box[1] - res.bleed})`);
  cg.node().append(...res.node.childNodes);

  if (spec.source) {
    const dia = S * 0.082, m = S * 0.045;
    core.text(hd, `Source: ${spec.source}`, { x: pad, y: FH - m - dia / 2, face: "arvo", px: S * 0.020, fill: th.body, valign: "mid" });
  }
  host.append(svg.node());

  if (textured) {
    const grunge = await textureLayer("grunge", FW, FH, (t) => 1 - (1 - t) * 0.20, null);
    if (grunge) { grunge.style.mixBlendMode = "multiply"; host.append(grunge); }
  }
  return { node: host, box, bleed: res.bleed, warnings: res.warnings };
}

// The Storyteller's two texture passes, computed the same way (build_creative.texture_ground and
// overlay_texture). The textures live in the Storyteller and are not copied here; without them
// the ground is flat.
async function textureLayer(name, W, H, f, colour) {
  const img = new Image();
  img.src = `/texture/${name}.jpg`;
  try { await img.decode(); } catch { return null; }
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  Object.assign(c.style, { position: "absolute", left: 0, top: 0 });
  const x = c.getContext("2d");
  const s = Math.max(W / img.width, H / img.height);
  const tw = img.width * s, th = img.height * s;
  x.drawImage(img, colour ? (W - tw) / 2 : 0, colour ? (H - th) / 2 : 0, tw, th);
  const px = x.getImageData(0, 0, W, H), d = px.data;
  let mean = 0;
  for (let i = 0; i < d.length; i += 4) mean += d[i];
  mean /= (d.length / 4) * 255;
  const base = colour ? [1, 3, 5].map((k) => parseInt(colour.slice(k, k + 2), 16)) : [255, 255, 255];
  for (let i = 0; i < d.length; i += 4) {
    const g = f(d[i] / 255, mean);
    d[i] = Math.min(255, base[0] * g); d[i + 1] = Math.min(255, base[1] * g); d[i + 2] = Math.min(255, base[2] * g);
    d[i + 3] = 255;
  }
  x.putImageData(px, 0, 0);
  return c;
}
