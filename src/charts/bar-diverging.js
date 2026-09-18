// Diverging bar — FT Deviation. Values either side of zero: gains grow right in olive, losses grow
// left in mauve (the diverging pair), the zero line solid, each value at its bar's end, names in a
// column on the left. The insight is ringed, since colour already says which side. Ten at most.
// Options: {"sort": true} puts the biggest gain first.
import * as core from "../core.js";
import { div } from "../theme.js";

export const MAX_DIVERGING = 10;

export default {
  id: "bar-diverging",
  name: "Diverging bar",
  needs: () => ["label", "value"],
  insight: (rows) => rows.reduce((m, r, i) => (Math.abs(r.value) > Math.abs(rows[m].value) ? i : m), 0),
  ringOnHue: true,
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th, paint: P } = ctx;
    let order = rows.map((_, i) => i);
    if (ctx.options.sort) order.sort((a, b) => rows[b].value - rows[a].value);
    if (order.length > MAX_DIVERGING) { ctx.warn(`${rows.length} rows, drawing ${MAX_DIVERGING}`); order = order.slice(0, MAX_DIVERGING); }
    const n = order.length, vp = S * 0.036;
    let lp = S * 0.025;
    const labW = Math.min(Math.max(...order.map((i) => core.measure(rows[i].label || "", "arvoBold", lp).w)), (x1 - x0) * 0.32);
    lp = Math.min(...order.map((i) => core.shrinkTo(rows[i].label || "", "arvoBold", lp, labW, S * 0.017)));
    const valW = Math.max(...order.map((i) => core.measure(core.num(rows[i].value, ctx), "bebas", vp).w)) + S * 0.02;
    const vals = order.map((i) => rows[i].value), lo = Math.min(0, ...vals), hi = Math.max(0, ...vals);
    const px0 = x0 + labW + S * 0.03 + (lo < 0 ? valW : 0), px1 = x1 - (hi > 0 ? valW : 0);
    const X = (v) => px0 + (px1 - px0) * (v - lo) / ((hi - lo) || 1), zero = X(0);
    const rowH = Math.min((y1 - y0) / n, S * 0.10), start = y0 + ((y1 - y0) - rowH * n) / 2, t = rowH * 0.56;
    const axis = g.append("g").attr("id", "axis");
    axis.append("line").attr("x1", zero).attr("x2", zero).attr("y1", start - S * 0.01).attr("y2", start + rowH * n + S * 0.01)
      .attr("stroke", th.strong).attr("stroke-width", S * 0.004);
    const marks = g.append("g").attr("id", "marks");
    let ib = null;
    order.forEach((i, k) => {
      const r = rows[i], row = core.rowGroup(marks, i, k, P), yc = start + rowH * (k + 0.5), up = r.value >= 0;
      const x = X(r.value), thick = t * Math.min(P.grow(i), 1.2);
      if (Math.abs(x - zero) > 0.5) core.bar(row, Math.min(x, zero), yc - thick / 2, Math.max(x, zero), yc + thick / 2, div(th, up ? 0.85 : -0.85), up ? "right" : "left", S * 0.012);
      const vb = core.text(row, core.num(r.value, ctx), { x: up ? x + S * 0.012 : x - S * 0.012, y: yc, face: "bebas", px: vp, fill: th.ink, align: up ? "l" : "r", valign: "mid" });
      const lb = core.text(row, r.label || "", { x: x0 + labW, y: yc, face: "arvoBold", px: lp, fill: P.on(i) ? th.ink : th.body, align: "r", valign: "fmid" });
      if (P.on(i)) ib = core.union(lb, vb, [Math.min(x, zero), yc - thick / 2, Math.max(x, zero), yc + thick / 2]);
    });
    return ib;
  },
};
