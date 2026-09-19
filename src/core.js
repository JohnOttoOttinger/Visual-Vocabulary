// Shared drawing: the table, the insight, type placed by its ink, bars, dots, rules, the circle
// number and the large stat. Every chart module is built from these, so a rule changed here (a bar
// end, a dotted rule, the stat face) changes every chart at once.
//
// Sizes are fractions of S, the short side of the frame the chart will sit in: 1080 for every
// Instagram format and for 1920x1080 video. Type keyed to S reads the same size on every shape.

import { FONTS, TRACK, mix } from "./theme.js";

const d3 = globalThis.d3;

// ---------------------------------------------------------------- the table

export const isNum = (v) => typeof v === "number" && Number.isFinite(v);

// A row is {label, value, value2, note, to, ...series}. [label, value, note] and [label, note]
// work as short forms, as in the Storyteller, so one table can be drawn several ways.
export function rowsOf(data) {
  return (data || []).map((r) => {
    if (!Array.isArray(r)) return { ...r };
    const d = { label: r.length ? String(r[0]) : "" };
    if (r.length > 1) {
      if (isNum(r[1]) || r[1] === null) {
        d.value = r[1];
        if (r.length > 2) d.note = r[2];
      } else d.note = r[1];
    }
    return d;
  }).filter((r) => Object.values(r).some((v) => v !== null && v !== "" && !(Array.isArray(v) && !v.length)));
}

// numbers must be numbers; anything else (a name, a date, a time, a list) must just be there
const NUMERIC = new Set(["value", "value2", "size", "target", "x", "y"]);
export function has(r, col) {
  const v = r[col];
  return NUMERIC.has(col) ? isNum(v) : Boolean(v !== undefined && v !== null && v !== "" && (v.length ?? true));
}

export const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b), n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
};

export function quartiles(xs) {
  const s = [...xs].sort((a, b) => a - b), n = s.length;
  const lo = s.slice(0, Math.floor(n / 2)), hi = s.slice(Math.ceil(n / 2));
  return [lo.length ? median(lo) : s[0], hi.length ? median(hi) : s[n - 1]];
}

export function fitLine(xs, ys) {
  const n = xs.length, mx = d3.mean(xs), my = d3.mean(ys);
  const sxx = d3.sum(xs, (x) => (x - mx) ** 2) || 1;
  const b = d3.sum(xs, (x, i) => (x - mx) * (ys[i] - my)) / sxx;
  return [my - b * mx, b, n];
}

// ---------------------------------------------------------------- the insight

// Which row carries the Aha: named by label, by a word, or left to the chart's own obvious choice.
// A chart names its default as one of: max, min, first, last, change, outlier, degree, residual.
export function pickInsight(rows, want, fallback) {
  if (want === "none" || !rows.length) return null;
  const labels = rows.map((r) => r.label ?? "");
  if (typeof want === "string" && labels.includes(want)) return labels.indexOf(want);
  const how = want || fallback;
  if (!how || how === "none") return null;
  const vals = rows.map((r, i) => [i, r.value]).filter(([, v]) => isNum(v));
  const both = rows.map((r, i) => [i, r.value, r.value2]).filter(([, a, b]) => isNum(a) && isNum(b));
  const best = (xs, f) => xs.reduce((m, x) => (f(x) > f(m) ? x : m), xs[0]);
  switch (how) {
    case "first": return 0;
    case "last": return rows.length - 1;
    case "max": return vals.length ? best(vals, (t) => t[1])[0] : null;
    case "min": return vals.length ? best(vals, (t) => -t[1])[0] : null;
    case "change": return both.length ? best(both, (t) => Math.abs(t[2] - t[1]))[0] : null;
    case "outlier": {
      if (!vals.length) return null;
      const v = vals.map((t) => t[1]), m = median(v), [q1, q3] = quartiles(v);
      const iqr = (q3 - q1) || 1;
      return best(vals, (t) => Math.abs(t[1] - m) / iqr)[0];
    }
    case "degree": {
      const deg = degrees(rows);
      return best(rows.map((_, i) => i), (i) => deg[labels[i]] || 0);
    }
    case "residual": {
      if (both.length < 3) return null;
      const [a, b] = fitLine(both.map((t) => t[1]), both.map((t) => t[2]));
      return best(both, (t) => Math.abs(t[2] - (a + b * t[1])))[0];
    }
  }
  throw new Error(`insight ${JSON.stringify(want)} is not a label in the table (or max, min, first, last, none)`);
}

export function degrees(rows) {
  const deg = {};
  for (const r of rows) for (const t of r.to || []) {
    deg[r.label] = (deg[r.label] || 0) + 1;
    deg[t] = (deg[t] || 0) + 1;
  }
  return deg;
}

// How the insight is marked: four of the pack's Ten Ways to Highlight Insights. hue (olive against
// cream), intensity (ink against faded), enclosure (a dotted ring), size (drawn bigger).
export const HIGHLIGHTS = ["hue", "intensity", "enclosure", "size"];

export class Paint {
  constructor(how, insight, th) {
    if (!HIGHLIGHTS.includes(how)) throw new Error(`unknown highlight ${JSON.stringify(how)}. One of: ${HIGHLIGHTS.join(", ")}`);
    Object.assign(this, { how, ins: insight, th });
  }
  on(i) { return this.ins !== null && this.ins !== undefined && i === this.ins; }
  // a single-series mark: bar, dot, slice, node
  mark(i) {
    const R = this.th.roles;
    if (this.how === "hue") return this.on(i) ? R.main : R.muted;
    if (this.how === "intensity") return this.on(i) ? this.th.ink : mix(R.muted, this.th.ground, 0.35);
    return mix(R.muted, R.neutral, 0.30);
  }
  // a mark whose colour already means something (a series, A against B): the insight keeps it,
  // the rest fade toward the ground
  series(i, colour) {
    if (["hue", "intensity"].includes(this.how) && this.ins !== null && this.ins !== undefined && !this.on(i))
      return mix(colour, this.th.ground, 0.55);
    return colour;
  }
  words(i) { return this.on(i) && this.how === "hue" ? this.th.roles.mainText : this.th.ink; }
  grow(i) { return this.on(i) && this.how === "size" ? 1.45 : 1; }
}

// ---------------------------------------------------------------- numbers

export function num(v, ctx, short = false) {
  if (!isNum(v)) return "";
  const s = Number.isInteger(v) ? d3.format(",")(v) : d3.format(",.1f")(v);
  return `${ctx.prefix || ""}${s}${short ? "" : ctx.unit || ""}`;
}

export function niceTicks(lo, hi, want = 4) {
  const span = (hi - lo) || Math.abs(hi) || 1;
  const raw = span / want, mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw);
  const a = Math.floor(lo / step) * step, b = Math.ceil(hi / step) * step;
  const out = [];
  for (let t = a; t <= b + step * 0.01; t += step) out.push(+t.toFixed(10));
  return out;
}

// the axis span: from zero when the data sit well above it, else from the data
export function spanOf(values, zeroOk = true) {
  let lo = d3.min(values), hi = d3.max(values);
  if (zeroOk && lo >= 0 && lo <= hi * 0.5) lo = 0;
  const t = niceTicks(lo, hi);
  return [t[0], t[t.length - 1], t];
}

// ---------------------------------------------------------------- type

const cv = document.createElement("canvas").getContext("2d");

export const FACE = {
  bebas: { family: FONTS.bebas, weight: 400, track: TRACK },
  arvo: { family: FONTS.arvo, weight: 400, track: 0 },
  arvoBold: { family: FONTS.arvo, weight: 700, track: 0 },
  qwigley: { family: FONTS.qwigley, weight: 400, track: 0 },
  depot: { family: FONTS.depot, weight: 400, track: 0 },
};

// Width by advance (tracking between letters, none after the last) and height by ink.
export function measure(text, face, px) {
  const f = FACE[face];
  cv.font = `${f.weight} ${px}px ${f.family}`;
  cv.letterSpacing = `${f.track * px}px`;
  const m = cv.measureText(text);
  cv.letterSpacing = "0px";
  return {
    w: m.width - (text.length ? f.track * px : 0),
    asc: m.actualBoundingBoxAscent, desc: m.actualBoundingBoxDescent,
    fAsc: m.fontBoundingBoxAscent, fDesc: m.fontBoundingBoxDescent,
  };
}

// Place text by its ink. align l / c / r on the advance box; valign top / mid / bottom on the ink,
// or "asc" to hang the line from the font's ascender (Pillow's "la" anchor). Returns the ink box.
export function text(g, str, { x, y, face = "arvo", px, fill, align = "l", valign = "top", cls, ref, halo } = {}) {
  str = String(str ?? "");
  const f = FACE[face], m = measure(str || "0", face, px), ink = ref ? measure(ref, face, px) : m;
  const w = str ? m.w : 0, h = ink.asc + ink.desc;
  const x0 = align === "c" ? x - w / 2 : align === "r" ? x - w : x;
  let base;
  if (valign === "asc") base = y + m.fAsc;                      // hang from the ascender
  else if (valign === "fmid") base = y + (m.fAsc - m.fDesc) / 2;  // centre the font's em box
  else if (valign === "fbottom") base = y - m.fDesc;              // stand on the descender
  else if (valign === "baseline") base = y;
  else {
    const top = valign === "mid" ? y - h / 2 : valign === "bottom" ? y - h : y;
    base = top + ink.asc;
  }
  if (str) {
    const t = g.append("text").attr("x", x0).attr("y", base).text(str)
      .attr("font-family", f.family.replaceAll('"', "")).attr("font-size", px)
      .attr("fill", fill);
    if (f.weight !== 400) t.attr("font-weight", f.weight);
    if (f.track) t.attr("letter-spacing", f.track * px);
    if (cls) t.attr("class", cls);
    // a ring of the ground round the letters, so a label stays readable over a line or a dot
    if (halo) t.attr("stroke", halo[0]).attr("stroke-width", halo[1] * 2).attr("paint-order", "stroke").attr("stroke-linejoin", "round");
  }
  return [x0, base - m.asc, x0 + w, base + m.desc];
}

// Shrink a line until it fits a width, never below a floor.
export function shrinkTo(str, face, px, width, floor) {
  while (px > floor && measure(str, face, px).w > width) px -= 1;
  return px;
}

// One size for a set of labels that wrap into a narrow width: small enough that the longest single
// word fits, since a word like "experience-gardens" cannot break.
export function fitWords(labels, face, px, width, floor) {
  const words = labels.flatMap((l) => pieces(String(l || "")));
  while (px > floor && words.some((w) => measure(w, face, px).w > width)) px -= 0.5;
  return px;
}

// The unbreakable pieces of a label: words, and the parts of a hyphenated word, each keeping its
// hyphen ("experience-", "gardens"), since a line may break after a hyphen.
export function pieces(s) {
  return s.split(" ").filter(Boolean).flatMap((w) => w.split(/(?<=-)(?=.)/));
}

// Arvo with *asterisks* for bold, wrapped to a width.
export function splitBold(s) {
  const out = []; let b = false;
  for (const chunk of String(s).split("*")) { if (chunk) out.push([chunk, b]); b = !b; }
  return out;
}

export function wrap(s, px, width) {
  // words carry whether a space came before them, so "*first*." stays "first." and never "first .";
  // a hyphenated word may break after its hyphen, its parts joining with no space when they share
  // a line
  const words = [];
  let spaced = true;                      // did the text so far end on a space?
  for (const [t, b] of splitBold(s)) {
    t.split(" ").forEach((w, k) => {
      if (!w) return;
      w.split(/(?<=-)(?=.)/).forEach((part, j) => {
        const glued = j > 0 || (k === 0 && !spaced && words.length);
        if (k === 0 && j === 0 && !spaced && words.length) words[words.length - 1].parts.push([part, b]);
        else words.push({ parts: [[part, b]], glued: Boolean(glued) });
      });
    });
    spaced = t.endsWith(" ");
  }
  const sp = measure(" ", "arvo", px).w;
  const wOf = (wd) => d3.sum(wd.parts, ([w, b]) => measure(w, b ? "arvoBold" : "arvo", px).w);
  const lines = []; let cur = [], cw = 0;
  for (const wd of words) {
    const ww = wOf(wd), gap = cur.length && !wd.glued ? sp : 0;
    if (cur.length && cw + gap + ww > width) { lines.push(cur); cur = []; cw = 0; }
    cw += (cur.length && !wd.glued ? sp : 0) + ww; cur.push({ ...wd, w: ww, first: !cur.length });
  }
  if (cur.length) lines.push(cur);
  return lines.map((ln) => ({ words: ln, w: d3.sum(ln, (x) => x.w) + sp * ln.filter((x, k) => k && !x.glued).length }));
}

// A paragraph; y is the top of the first line's ink. Returns [bottom, widest], the bottom measured
// the Storyteller's way (the last line's top plus one size), so spacing below it matches.
export function para(g, s, { x, y, px, width, fill, align = "l", maxLines, lead = 1.36, bold = false } = {}) {
  if (!s) return [y, 0];
  let lines = wrap(bold ? `*${String(s).replaceAll("*", "")}*` : s, px, width);
  if (maxLines) lines = lines.slice(0, maxLines);
  const asc = measure("H", "arvo", px).asc;
  let widest = 0, top = y;
  for (const ln of lines) {
    widest = Math.max(widest, ln.w);
    const lx = align === "c" ? x - ln.w / 2 : align === "r" ? x - ln.w : x;
    const t = g.append("text").attr("x", lx).attr("y", top + asc)
      .attr("font-family", "Arvo").attr("font-size", px).attr("fill", fill);
    ln.words.forEach((wd, k) => wd.parts.forEach(([w, b], j) => {
      const sp = t.append("tspan").text((k && !j && !wd.glued ? " " : "") + w);
      if (b) sp.attr("font-weight", 700);
    }));
    top += px * lead;
  }
  return [top - px * lead + px, widest];
}

export function paraHeight(s, px, width, maxLines, lead = 1.36) {
  if (!s) return 0;
  let n = wrap(s, px, width).length;
  if (maxLines) n = Math.min(n, maxLines);
  return px * (n * lead - (lead - 1));
}

// ---------------------------------------------------------------- series

// The series a chart draws. Named columns ("series": ["2019", "2020"]) when the spec gives them;
// otherwise value and value2, named by "axes", so an A-against-B table can be drawn as grouped bars.
export function seriesOf(rows, ctx) {
  if (ctx.series && ctx.series.length) return { names: ctx.series, cols: ctx.series };
  const two = rows.some((r) => isNum(r.value2));
  const names = (ctx.axes || (two ? ["A", "B"] : [""])).slice(0, two ? 2 : 1);
  return { names, cols: two ? ["value", "value2"] : ["value"] };
}

// ---------------------------------------------------------------- marks

// A bar with only its far end slightly rounded (Otto, 18 Sep 2026): right on a bar growing right,
// left on one growing left, top on a column, bottom on a column hanging below zero.
// A wide column keeps the same small corner as a bar (rmax), so it never turns into a pill.
export function barPath(x0, y0, x1, y1, end = "right", rmax = Infinity) {
  const across = end === "right" || end === "left";
  const thick = across ? y1 - y0 : x1 - x0, long = across ? x1 - x0 : y1 - y0;
  const r = end === "none" ? 0 : Math.max(0, Math.min(thick * 0.26, long / 2, rmax));
  const p = d3.path();
  if (end === "none") { p.rect(x0, y0, x1 - x0, y1 - y0); return p.toString(); }
  if (end === "right") {
    p.moveTo(x0, y0); p.lineTo(x1 - r, y0); p.arcTo(x1, y0, x1, y0 + r, r);
    p.lineTo(x1, y1 - r); p.arcTo(x1, y1, x1 - r, y1, r); p.lineTo(x0, y1);
  } else if (end === "left") {
    p.moveTo(x1, y0); p.lineTo(x1, y1); p.lineTo(x0 + r, y1); p.arcTo(x0, y1, x0, y1 - r, r);
    p.lineTo(x0, y0 + r); p.arcTo(x0, y0, x0 + r, y0, r);
  } else if (end === "top") {
    p.moveTo(x0, y1); p.lineTo(x0, y0 + r); p.arcTo(x0, y0, x0 + r, y0, r);
    p.lineTo(x1 - r, y0); p.arcTo(x1, y0, x1, y0 + r, r); p.lineTo(x1, y1);
  } else {
    p.moveTo(x0, y0); p.lineTo(x1, y0); p.lineTo(x1, y1 - r); p.arcTo(x1, y1, x1 - r, y1, r);
    p.lineTo(x0 + r, y1); p.arcTo(x0, y1, x0, y1 - r, r);
  }
  p.closePath();
  return p.toString();
}

export function bar(g, x0, y0, x1, y1, fill, end = "right", rmax = Infinity) {
  return g.append("path").attr("d", barPath(x0, y0, x1, y1, end, rmax)).attr("fill", fill);
}

export function dot(g, x, y, r, fill, stroke, width = 0) {
  const c = g.append("circle").attr("cx", x).attr("cy", y).attr("r", r).attr("fill", fill);
  if (stroke && width) c.attr("stroke", stroke).attr("stroke-width", width);
  return c;
}

// The system's dotted rule, at any angle: round dots, three dots' pitch.
export function dottedLine(g, [x0, y0], [x1, y1], colour, S, size) {
  const d = size || Math.max(2, S * 0.004);
  const L = Math.hypot(x1 - x0, y1 - y0);
  return g.append("line").attr("x1", x0).attr("y1", y0).attr("x2", x1).attr("y2", y1)
    .attr("stroke", colour).attr("stroke-width", d).attr("stroke-linecap", "round")
    .attr("stroke-dasharray", `0 ${d * 3}`).attr("data-length", L.toFixed(1));
}

export function dottedBox(g, [x0, y0, x1, y1], colour, S, radius) {
  const r = radius ?? S * 0.02, d = Math.max(2, S * 0.004);
  return g.append("rect").attr("x", x0).attr("y", y0).attr("width", x1 - x0).attr("height", y1 - y0)
    .attr("rx", r).attr("fill", "none").attr("stroke", colour).attr("stroke-width", d)
    .attr("stroke-linecap", "round").attr("stroke-dasharray", `0 ${d * 3}`);
}

// The oddtoe.com circle-number: an olive disc, the numeral in Depot, centred on the face's own
// "0" so a 1 and an 8 sit at the same height. "fill" and "ink" for a disc that is not the insight.
export function badge(g, cx, cy, dia, str, th, face = "depot", { fill, ink } = {}) {
  const b = g.append("g").attr("class", "badge");
  dot(b, cx, cy, dia / 2, fill ?? th.roles.main);
  text(b, str, { x: cx, y: cy, face, px: dia * 0.58, fill: ink ?? th.roles.onMain, align: "c", valign: "mid", ref: "0" });
  return [cx - dia / 2, cy - dia / 2, cx + dia / 2, cy + dia / 2];
}

// A large stat, centred on its own ink: a call-out value in Bebas. Depot is for numbering (the
// circle-number, a process's steps), so a count of things reads apart from a value; pass
// face: "depot" for those.
export const STAT_FACE = "bebas";
export function stat(g, s, { x, y, px, fill, valign = "top", face = STAT_FACE }) {
  return text(g, s, { x, y, face, px, fill, align: "c", valign });
}

export function union(...boxes) {
  const bs = boxes.filter(Boolean);
  if (!bs.length) return null;
  return [d3.min(bs, (b) => b[0]), d3.min(bs, (b) => b[1]), d3.max(bs, (b) => b[2]), d3.max(bs, (b) => b[3])];
}

// A group per row, so a motion pass (After Effects) can reveal the chart row by row: data-row is
// the row's place in the table, data-order the order it is drawn, data-insight marks the Aha.
export function rowGroup(parent, i, order, P) {
  const g = parent.append("g").attr("class", "row").attr("data-row", i).attr("data-order", order);
  if (P && P.on(i)) g.attr("data-insight", "true");
  return g;
}

// ---------------------------------------------------------------- shared furniture

// Dotted gridlines at each tick with the tick's number to the left: the value axis of every chart
// that reads up the page.
export function yGrid(g, ticks, Y, px0, px1, ctx, { labels = true } = {}) {
  const { S, th } = ctx, grid = g.append("g").attr("id", "grid"), tp = S * 0.022;
  for (const t of ticks) {
    dottedLine(grid, [px0, Y(t)], [px1, Y(t)], mix(th.roles.neutral, th.ground, 0.45), S);
    if (labels) text(grid, num(t, ctx, true), { x: px0 - S * 0.02, y: Y(t), face: "arvo", px: tp, fill: th.body, align: "r", valign: "mid" });
  }
  return grid;
}

// the width the tick labels need, so the plot starts after them
export function tickWidth(ticks, ctx) {
  return Math.max(...ticks.map((t) => measure(num(t, ctx, true), "arvo", ctx.S * 0.022).w));
}

// A key: swatch and name for each series, in a row that wraps. Returns the y under it.
export function key(g, names, colours, x0, y0, x1, ctx, { dot: round = false } = {}) {
  const { S, th } = ctx, k = g.append("g").attr("id", "key"), kp = S * 0.024;
  let x = x0, y = y0;
  names.forEach((n, i) => {
    const w = kp + S * 0.014 + measure(n, "arvoBold", kp).w;
    if (x > x0 && x + w > x1) { x = x0; y += kp * 1.8; }
    if (round) dot(k, x + kp / 2, y + kp / 2, kp / 2, colours[i]);
    else k.append("rect").attr("x", x).attr("y", y).attr("width", kp).attr("height", kp).attr("rx", kp * 0.2).attr("fill", colours[i]);
    text(k, n, { x: x + kp + S * 0.014, y: y + kp / 2, face: "arvoBold", px: kp, fill: th.ink, valign: "mid" });
    x += w + S * 0.045;
  });
  return y + kp;
}

// Cells for small multiples: n panels in the fewest rows of up to `cols` columns.
export function panels(n, [x0, y0, x1, y1], S, cols) {
  cols = cols || (n <= 2 ? 1 : n <= 4 ? 2 : 3);
  const rows = Math.ceil(n / cols), gx = S * 0.05, gy = S * 0.05;
  const w = (x1 - x0 - gx * (cols - 1)) / cols, h = (y1 - y0 - gy * (rows - 1)) / rows;
  return Array.from({ length: n }, (_, i) => {
    const c = i % cols, r = Math.floor(i / cols);
    return [x0 + c * (w + gx), y0 + r * (h + gy), x0 + c * (w + gx) + w, y0 + r * (h + gy) + h];
  });
}

// Times: a year (2016), a date ("2016-03-04"), a month ("2016-03") or a time of day ("14:30"), as a
// number that orders them: milliseconds for dates, minutes for times, the year itself for years.
export function when(v) {
  if (isNum(v)) return v;
  const s = String(v ?? "");
  if (/^\d{1,2}:\d{2}$/.test(s)) { const [h, m] = s.split(":").map(Number); return h * 60 + m; }
  if (/^\d{4}-\d{2}(-\d{2})?/.test(s)) return Date.parse(s.length === 7 ? `${s}-01` : s.slice(0, 10));
  if (/^\d{4}$/.test(s)) return Number(s);
  return NaN;
}

// Labels for a date axis: "2016" on a year's first tick, "Apr" between, so a year never repeats.
export function dateTicks(scale, count = 6) {
  const ticks = scale.ticks(count), fmtY = d3.utcFormat("%Y"), fmtM = d3.utcFormat("%b");
  const yearly = ticks.every((t) => t.getUTCMonth() === 0 && t.getUTCDate() === 1);
  return ticks.map((t) => ({ t, label: yearly || (t.getUTCMonth() === 0 && t.getUTCDate() === 1) ? fmtY(t) : fmtM(t) }));
}

// Period names along a bottom axis that never collide: the first, the last and the insight always,
// the rest in order wherever there is room.
export function axisLabels(g, labels, X, y, ctx, { must = [] } = {}) {
  const { S, th } = ctx, tp = S * 0.021, n = labels.length, placed = [];
  const box = (i) => { const w = measure(String(labels[i] ?? ""), "arvo", tp).w; const x = Math.min(Math.max(X(i) - w / 2, X(0) - w / 2), X(n - 1) + w / 2); return [x, x + w]; };
  const order = [0, n - 1, ...must, ...Array.from({ length: n }, (_, i) => i)];
  for (const i of order) {
    if (i < 0 || i >= n || !labels[i] || placed.some((p) => p.i === i)) continue;
    const [a, b] = box(i);
    if (placed.some((p) => !(b + S * 0.012 < p.a || a - S * 0.012 > p.b))) continue;
    placed.push({ i, a, b });
    text(g, String(labels[i]), { x: (a + b) / 2, y, face: "arvo", px: tp, fill: th.body, align: "c", valign: "asc" });
  }
}

// An axis's name, written at the axis's far end: small Arvo Bold in the body colour (Otto, 19 Sep
// 2026: Bebas in the neutral was hard to read at this size). options.axisName picks another look,
// for comparing: "bebas" (the old caps), "bebas-ink" (the caps in ink), "arvo-caps".
const AXIS_NAME = {
  arvo: { face: "arvoBold", px: 0.024, caps: false, fill: "body" },
  "arvo-caps": { face: "arvoBold", px: 0.02, caps: true, fill: "body" },
  bebas: { face: "bebas", px: 0.034, caps: true, fill: "neutral" },
  "bebas-ink": { face: "bebas", px: 0.036, caps: true, fill: "ink" },
};
const axisStyle = (ctx) => AXIS_NAME[ctx.options?.axisName] || AXIS_NAME.arvo;
export function axisName(g, name, ctx, { x, y, align = "l", valign }) {
  const { S, th } = ctx, st = axisStyle(ctx);
  const fill = st.fill === "neutral" ? th.roles.neutral : st.fill === "ink" ? th.ink : th.body;
  return text(g, st.caps ? String(name).toUpperCase() : String(name), { x, y, face: st.face, px: S * st.px, fill, align, ...(valign ? { valign } : {}) });
}

// The room the up axis's name takes at the chart's left edge (none without a name).
export function axisRoom(name, ctx) {
  return name ? ctx.S * axisStyle(ctx).px * 1.2 + ctx.S * 0.022 : 0;
}

// Both axes' names, each centred on its own axis (Otto, 19 Sep 2026): the across name under the
// tick numbers at "below", the up name turned to read upward at the chart's left edge "x0", in
// the room axisRoom keeps for it.
export function axisNames(g, [across, up], ctx, { x0, px0, px1, py0, py1, below }) {
  if (across) axisName(g, across, ctx, { x: (px0 + px1) / 2, y: below, align: "c" });
  if (up) {
    const cx = x0 + ctx.S * axisStyle(ctx).px * 0.6, cy = (py0 + py1) / 2;
    axisName(g.append("g").attr("class", "axis-name-up").attr("transform", `rotate(-90 ${cx} ${cy})`), up, ctx, { x: cx, y: cy, align: "c", valign: "fmid" });
  }
}

// Push a column of labels apart so none sits closer than `gap` to the next, keeping their order.
export function spread(ys, gap, lo = -Infinity, hi = Infinity) {
  const order = ys.map((_, i) => i).sort((a, b) => ys[a] - ys[b]), out = [...ys];
  for (let k = 1; k < order.length; k++) out[order[k]] = Math.max(out[order[k]], out[order[k - 1]] + gap);
  const over = order.length ? Math.max(0, out[order[order.length - 1]] - hi) : 0;
  return out.map((y) => Math.max(lo, y - over));
}
