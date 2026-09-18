// Line — FT Change over time; the Storyteller's `trend` mode.
//
// One series (`value`): the Storyteller's trend. The line through the points on dotted gridlines,
// the area under it in cream, the insight's point in olive with its value in Depot and its note
// above it. Options: {"area": false} leaves the area out.
//
// Several series (spec "series": ["A", "B"], one column each per row): a line per series in the
// fixed series order, each named at its right-hand end rather than in a legend box, the insight
// series drawn in its colour and the rest faded.
import * as core from "../core.js";
import { mix } from "../theme.js";

const d3 = globalThis.d3;

function axes(g, rows, lo, hi, ticks, [x0, y0, x1, y1], ctx, { top, right }) {
  const { S, th, paint: P } = ctx, tp = S * 0.022;
  const labW = Math.max(...ticks.map((t) => core.measure(core.num(t, ctx, true), "arvo", tp).w));
  const px0 = x0 + labW + S * 0.03, px1 = x1 - right, py0 = y0 + top, py1 = y1 - S * 0.07;
  const X = (i) => px0 + (px1 - px0) * (i / Math.max(1, rows.length - 1));
  const Y = (v) => py1 - (py1 - py0) * ((v - lo) / ((hi - lo) || 1));
  const grid = g.append("g").attr("id", "grid");
  for (const t of ticks) {
    core.dottedLine(grid, [px0, Y(t)], [px1, Y(t)], mix(th.roles.neutral, th.ground, 0.45), S);
    core.text(grid, core.num(t, ctx, true), { x: px0 - S * 0.02, y: Y(t), face: "arvo", px: tp, fill: th.body, align: "r", valign: "mid" });
  }
  const every = Math.max(1, Math.ceil(rows.length / 7));
  const xl = g.append("g").attr("id", "axis-x");
  rows.forEach((r, i) => {
    if (i % every === 0 || i === rows.length - 1 || P.on(i))
      core.text(xl, r.label ?? "", { x: X(i), y: py1 + S * 0.030, face: "arvo", px: tp, fill: P.on(i) ? th.ink : th.body, align: "c", valign: "asc" });
  });
  return { X, Y, px0, px1, py0, py1 };
}

function single(g, rows, box, ctx) {
  const { S, th, paint: P } = ctx;
  const vals = rows.map((r) => r.value);
  const [lo, hi, ticks] = core.spanOf(vals);
  const { X, Y, px0, px1 } = axes(g, rows, lo, hi, ticks, box, ctx, { top: S * 0.16, right: S * 0.02 });
  const pts = vals.map((v, i) => [X(i), Y(v)]);
  const marks = g.append("g").attr("id", "marks");
  if (ctx.options.area !== false)
    marks.append("path").attr("id", "area").attr("fill", mix(th.roles.muted, th.ground, 0.35))
      .attr("d", d3.line()([...pts, [px1, Y(lo)], [px0, Y(lo)]]) + "Z");
  marks.append("path").attr("id", "line").attr("d", d3.line().curve(d3.curveLinear)(pts))
    .attr("fill", "none").attr("stroke", th.roles.neutral).attr("stroke-width", S * 0.006)
    .attr("stroke-linejoin", "round").attr("stroke-linecap", "round");
  pts.forEach(([x, y], i) => {
    if (P.on(i)) return;
    core.dot(core.rowGroup(marks, i, i, P), x, y, S * 0.010 * P.grow(i), th.ground, th.roles.neutral, S * 0.004);
  });
  if (P.ins === null || P.ins === undefined) return null;
  const i = P.ins, [x, y] = pts[i], r = S * 0.020 * P.grow(i);
  const ins = core.rowGroup(g.append("g").attr("id", "insight"), i, i, P);
  core.dot(ins, x, y, r, P.mark(i), th.ground, S * 0.005);
  const note = rows[i].note || "", nw = S * 0.40, spx = S * 0.064, npx = S * 0.024;
  const vw = core.measure(core.num(vals[i], ctx), core.statFace(core.num(vals[i], ctx)), spx).w;
  const bw = Math.max(vw, note ? Math.min(nw, core.measure(note, "arvo", npx).w) : 0);
  const lx = Math.min(Math.max(x - bw / 2, box[0]), box[2] - bw);
  const top = y - r - S * 0.03 - spx * 0.72 - (note ? core.paraHeight(note, npx, nw, 2) + S * 0.012 : 0);
  const vb = core.stat(ins, core.num(vals[i], ctx), { x: lx + bw / 2, y: top, px: spx, fill: P.words(i) });
  const [bottom] = core.para(ins, note, { x: lx + bw / 2, y: vb[3] + S * 0.012 + npx * 0.4, px: npx, width: nw, fill: th.body, align: "c", maxLines: 2 });
  return core.union(vb, [lx, vb[3], lx + bw, bottom], [x - r, y - r, x + r, y + r]);
}

function several(g, rows, box, ctx) {
  const { S, th } = ctx, names = ctx.series;
  const cols = names.map((_, k) => th.series[k % th.series.length]);
  if (names.length > th.series.length) ctx.warn(`${names.length} series; past ${th.series.length} fold the rest into "Other" or use small multiples`);
  const all = rows.flatMap((r) => names.map((n) => r[n])).filter(core.isNum);
  const [lo, hi, ticks] = core.spanOf(all);
  const lpx = S * 0.026;
  const right = Math.max(...names.map((n) => core.measure(n, "arvoBold", lpx).w)) + S * 0.03;
  const { X, Y } = axes(g, rows, lo, hi, ticks, box, ctx, { top: S * 0.04, right });
  // the insight is a series here: named by "insight": "<series name>", else the first
  const hot = names.indexOf(ctx.options.insightSeries ?? names[0]);
  const marks = g.append("g").attr("id", "marks"), ends = [];
  names.forEach((n, k) => {
    const sg = marks.append("g").attr("class", "series").attr("data-series", n).attr("data-order", k);
    const pts = rows.map((r, i) => [X(i), Y(r[n])]).filter(([, y]) => Number.isFinite(y));
    const c = cols[k];   // validated as a set; fading one would undo the check
    sg.append("path").attr("d", d3.line()(pts)).attr("fill", "none").attr("stroke", c)
      .attr("stroke-width", S * (k === hot ? 0.008 : 0.005)).attr("stroke-linejoin", "round").attr("stroke-linecap", "round");
    const [ex, ey] = pts[pts.length - 1];
    core.dot(sg, ex, ey, S * 0.009, c, th.ground, S * 0.003);
    ends.push({ n, k, x: ex, y: ey, c, sg });
  });
  // direct labels at the line ends, nudged apart so they never overlap
  ends.sort((a, b) => a.y - b.y);
  const gap = lpx * 1.25;
  for (let j = 1; j < ends.length; j++) ends[j].y = Math.max(ends[j].y, ends[j - 1].y + gap);
  for (const e of ends)
    core.text(e.sg, e.n, { x: e.x + S * 0.02, y: e.y, face: "arvoBold", px: lpx, fill: e.k === hot ? th.ink : th.body, valign: "mid" });
  return null;
}

export default {
  id: "line",
  name: "Line",
  needs: (spec) => (spec.series ? ["label"] : ["value"]),
  insight: "last",
  draw(g, rows, box, ctx) {
    return ctx.series ? several(g, rows, box, ctx) : single(g, rows, box, ctx);
  },
};
