// Area — FT Change over time. Several series ("series": [...], a column each per row) stacked
// over time in the fixed series order, each band named where it ends, so the top edge is the
// total. FT's warning holds: the total reads well, the parts less so. One series is the line
// chart with its area filled, and is drawn by it.
import * as core from "../core.js";
import { mix, onFill } from "../theme.js";
import line from "./line.js";

const d3 = globalThis.d3;

export default {
  id: "area",
  name: "Area",
  needs: (spec) => (spec.series ? ["label"] : ["value"]),
  insight: "last",
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    if (!ctx.series) return line.draw(g, rows, [x0, y0, x1, y1], ctx);
    const { S, th, paint: P } = ctx, names = ctx.series;
    if (names.length > th.series.length) ctx.warn(`${names.length} series; the palette separates ${th.series.length}`);
    const cols = names.map((_, k) => th.series[k % th.series.length]);
    const stack = d3.stack().keys(names).value((r, k) => Math.max(0, r[k] || 0))(rows);
    const tot = rows.map((r) => d3.sum(names, (n) => Math.max(0, r[n] || 0)));
    const [lo, hi, ticks] = core.spanOf([0, ...tot]);
    const tp = S * 0.022, lpx = S * 0.026;
    const labW = Math.max(...ticks.map((t) => core.measure(core.num(t, ctx, true), "arvo", tp).w));
    const px0 = x0 + labW + S * 0.03, px1 = x1, py0 = y0 + S * 0.04, py1 = y1 - S * 0.07;
    const X = (i) => px0 + (px1 - px0) * (i / Math.max(1, rows.length - 1));
    const Y = (v) => py1 - (py1 - py0) * (v - lo) / ((hi - lo) || 1);
    const grid = g.append("g").attr("id", "grid");
    for (const t of ticks) {
      core.dottedLine(grid, [px0, Y(t)], [px1, Y(t)], mix(th.roles.neutral, th.ground, 0.45), S);
      core.text(grid, core.num(t, ctx, true), { x: px0 - S * 0.02, y: Y(t), face: "arvo", px: tp, fill: th.body, align: "r", valign: "mid" });
    }
    const every = Math.max(1, Math.ceil(rows.length / 7)), xl = g.append("g").attr("id", "axis-x");
    rows.forEach((r, i) => {
      if (i % every === 0 || i === rows.length - 1)
        core.text(xl, r.label ?? "", { x: X(i), y: py1 + S * 0.030, face: "arvo", px: tp, fill: th.body, align: "c", valign: "asc" });
    });
    const unnamed = [];
    const marks = g.append("g").attr("id", "marks"), area = d3.area().x((_, i) => X(i)).y0((d) => Y(d[0])).y1((d) => Y(d[1]));
    stack.forEach((layer, k) => {
      const sg = marks.append("g").attr("class", "series").attr("data-series", names[k]).attr("data-order", k);
      sg.append("path").attr("d", area(layer)).attr("fill", cols[k]).attr("stroke", th.ground).attr("stroke-width", Math.max(1.5, S * 0.003));
      // the band's name where the band is thickest (its end, when that is thick enough), else in a key
      const thick = layer.map((d) => Y(d[0]) - Y(d[1])), end = thick.length - 1;
      const at = thick[end] > lpx * 1.5 ? end : thick.indexOf(Math.max(...thick));
      const w = core.measure(names[k], "arvoBold", lpx).w, mid = (Y(layer[at][0]) + Y(layer[at][1])) / 2;
      if (thick[at] > lpx * 1.5) {
        const lx = at === end ? px1 - S * 0.014 - w : Math.min(Math.max(X(at) - w / 2, px0 + S * 0.01), px1 - w - S * 0.01);
        core.text(sg, names[k], { x: lx, y: mid, face: "arvoBold", px: lpx, fill: onFill(cols[k]), valign: "mid" });
      } else unnamed.push(k);
    });
    if (unnamed.length) {
      // bands too thin to carry their own names get a key in the top left
      const key = g.append("g").attr("id", "key"), kp = S * 0.022;
      let ky = py0;
      for (const k of unnamed) {
        key.append("rect").attr("x", px0 + S * 0.02).attr("y", ky).attr("width", kp).attr("height", kp).attr("fill", cols[k]);
        core.text(key, names[k], { x: px0 + S * 0.02 + kp + S * 0.012, y: ky + kp / 2, face: "arvoBold", px: kp, fill: th.ink, valign: "mid" });
        ky += kp * 1.6;
      }
    }
    return null;
  },
};
