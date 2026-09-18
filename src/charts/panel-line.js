// One small time panel, shared by the two-panel line, the column-and-line and the small multiples:
// a title, its own value axis, and a line (with its area), columns or bars. Not a chart of its own.
import * as core from "../core.js";
import { mix } from "../theme.js";

const d3 = globalThis.d3;

// Draws `get(row)` for every row into [x0, y0, x1, y1]. kind: line | area | column. Returns the
// x of each row and the panel's plot box, so the caller can label a shared axis once.
// The scale and ticks a panel will use, so panels that share a time axis can share a left edge.
export function panelScale(rows, get, scale, tickCount = 3) {
  const vals = rows.map(get).filter(core.isNum);
  const [lo, hi] = scale || core.spanOf(vals.length ? vals : [0], true);
  return { lo, hi, ticks: core.niceTicks(lo, hi, tickCount).filter((t) => t >= lo - 1e-9 && t <= hi + 1e-9) };
}

export function timePanel(g, rows, get, [x0, y0, x1, y1], ctx, { title, colour, kind = "line", hot = false, scale, ticks: tickCount = 3, mark = "last", xLabels = true, left, band } = {}) {
  const { S, th } = ctx, tp = S * 0.020;
  const { lo, hi, ticks } = panelScale(rows, get, scale, tickCount);
  band = band ?? kind === "column";
  let top = y0;
  if (title) {
    const tb = core.text(g, title, { x: x0, y: y0, face: "arvoBold", px: S * 0.026, fill: hot ? th.ink : th.body });
    top = tb[3] + S * 0.022;
  }
  const px0 = left ?? x0 + core.tickWidth(ticks, ctx) + S * 0.025, px1 = x1, py0 = top + S * 0.01, py1 = y1 - (xLabels ? tp * 2 : S * 0.005);
  const X = (i) => (band ? px0 + (px1 - px0) * (i + 0.5) / rows.length : px0 + (px1 - px0) * i / Math.max(1, rows.length - 1));
  const Y = (v) => py1 - (py1 - py0) * (v - lo) / ((hi - lo) || 1);
  const grid = g.append("g").attr("class", "grid");
  for (const t of ticks) {
    core.dottedLine(grid, [px0, Y(t)], [px1, Y(t)], mix(th.roles.neutral, th.ground, 0.5), S);
    core.text(grid, core.num(t, ctx, true), { x: px0 - S * 0.016, y: Y(t), face: "arvo", px: tp, fill: th.body, align: "r", valign: "mid" });
  }
  const marks = g.append("g").attr("class", "marks"), col = colour || (hot ? th.roles.main : th.roles.neutral);
  if (kind === "column") {
    const w = Math.min((px1 - px0) / rows.length * 0.7, S * 0.06);
    rows.forEach((r, i) => {
      const v = get(r); if (!core.isNum(v)) return;
      const up = v >= 0, a = Y(Math.max(0, v)), b = Y(Math.min(0, Math.max(lo, 0)));
      if (Math.abs(b - a) > 0.5) core.bar(marks, X(i) - w / 2, Math.min(a, b), X(i) + w / 2, Math.max(a, b), hot ? th.roles.main : th.roles.muted, up ? "top" : "bottom", S * 0.008);
    });
  } else {
    const pts = rows.map((r, i) => [X(i), core.isNum(get(r)) ? Y(get(r)) : NaN]);
    const line = d3.line().defined((p) => Number.isFinite(p[1]));
    if (kind === "area" || kind === "line")
      marks.append("path").attr("d", d3.area().defined((p) => Number.isFinite(p[1])).x((p) => p[0]).y0(Y(Math.max(lo, 0))).y1((p) => p[1])(pts))
        .attr("fill", kind === "area" ? mix(col, th.ground, 0.35) : mix(th.roles.muted, th.ground, 0.45));
    marks.append("path").attr("d", line(pts)).attr("fill", "none").attr("stroke", col).attr("stroke-width", S * (hot ? 0.006 : 0.004))
      .attr("stroke-linejoin", "round").attr("stroke-linecap", "round");
  }
  let ib = null;
  const k = mark === "max" ? rows.reduce((m, r, i) => ((get(r) ?? -Infinity) > (get(rows[m]) ?? -Infinity) ? i : m), 0) : mark === "last" ? rows.length - 1 : null;
  if (k !== null && core.isNum(get(rows[k]))) {
    const x = X(k), y = Y(get(rows[k])), ins = g.append("g").attr("class", "insight");
    if (kind !== "column") core.dot(ins, x, y, S * 0.012, hot ? th.roles.main : col, th.ground, S * 0.004);
    const vb = core.text(ins, core.num(get(rows[k]), ctx), { x: Math.min(x, px1 - S * 0.03), y: y - S * 0.02, face: "bebas", px: S * 0.036, fill: th.ink, align: x > px1 - S * 0.05 ? "r" : "c", valign: "bottom", halo: [th.ground, S * 0.003] });
    ib = core.union(vb, [x - S * 0.012, y - S * 0.012, x + S * 0.012, y + S * 0.012]);
  }
  return { X, Y, px0, px1, py0, py1, ib };
}

// Period names under a panel: every few, always the first and last.
export function xLabels(g, rows, X, y, ctx, { every } = {}) {
  const { S, th } = ctx, tp = S * 0.020;
  every = every || Math.max(1, Math.ceil(rows.length / 7));
  const xl = g.append("g").attr("class", "axis-x");
  rows.forEach((r, i) => {
    if (i % every === 0 || i === rows.length - 1)
      core.text(xl, r.label ?? "", { x: X(i), y, face: "arvo", px: tp, fill: th.body, align: "c", valign: "asc" });
  });
}
