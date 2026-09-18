// Histogram — FT Distribution. The rows' values sorted into bands of equal width, a column per band
// with small gaps so the shape of the whole reads first, the count over each column, the band edges
// under the gaps. The insight is a band: the busiest by default, or the band holding a named row.
// Options: {"bins": 8} asks for about that many bands (the edges are kept round).
import * as core from "../core.js";
import { mix } from "../theme.js";

const d3 = globalThis.d3;

function binsOf(rows, spec) {
  const vals = rows.map((r) => r.value);
  const want = (spec.options || {}).bins || Math.min(10, Math.max(5, Math.ceil(Math.log2(vals.length) + 1)));
  const x = d3.scaleLinear().domain(d3.extent(vals)).nice(want);
  const bin = d3.bin().value((r) => r.value).domain(x.domain()).thresholds(x.ticks(want));
  // a threshold on the domain's top edge leaves an empty band of no width: drop it
  return bin(rows.map((r, i) => ({ ...r, _i: i }))).filter((b) => b.x1 > b.x0);
}

export default {
  id: "histogram",
  name: "Histogram",
  needs: () => ["value"],
  insight(rows, spec) {
    const bins = binsOf(rows, spec);
    const top = bins.reduce((m, b) => (b.length > m.length ? b : m), bins[0]);
    return top.length ? top[0]._i : null;
  },
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th, paint: P } = ctx;
    const bins = binsOf(rows, { options: ctx.options });
    const hot = bins.findIndex((b) => b.some((r) => P.on(r._i)));
    const tp = S * 0.022, vp = S * 0.040;
    const bottom = y1 - tp * 2.2, top = y0 + vp * 1.5;
    const cmax = Math.max(...bins.map((b) => b.length)) || 1;
    const X = d3.scaleLinear().domain([bins[0].x0, bins[bins.length - 1].x1]).range([x0 + S * 0.01, x1 - S * 0.01]);
    const Y = (c) => bottom - (bottom - top) * c / cmax;
    const gap = Math.max(2, S * 0.006), marks = g.append("g").attr("id", "marks");
    const on = (k) => k === hot;
    const fill = (k) => (P.how === "hue" ? (on(k) ? th.roles.main : th.roles.muted)
      : P.how === "intensity" ? (on(k) ? th.ink : mix(th.roles.muted, th.ground, 0.35)) : mix(th.roles.muted, th.roles.neutral, 0.3));
    let ib = null;
    bins.forEach((b, k) => {
      const col = marks.append("g").attr("class", "row").attr("data-bin", k).attr("data-order", k);
      if (on(k)) col.attr("data-insight", "true");
      const bx0 = X(b.x0) + gap / 2, bx1 = X(b.x1) - gap / 2;
      if (b.length) core.bar(col, bx0, Y(b.length), bx1, bottom, fill(k), "top", S * 0.015);
      const vb = core.text(col, String(b.length), { x: (bx0 + bx1) / 2, y: Y(b.length) - S * 0.012, face: "bebas", px: vp, fill: on(k) && P.how === "hue" ? th.roles.mainText : th.ink, align: "c", valign: "bottom" });
      if (on(k)) ib = core.union([bx0, Y(b.length), bx1, bottom], vb);
    });
    const axis = g.append("g").attr("id", "axis-x");
    axis.append("line").attr("x1", x0).attr("x2", x1).attr("y1", bottom + S * 0.004).attr("y2", bottom + S * 0.004)
      .attr("stroke", th.strong).attr("stroke-width", S * 0.003);
    const edges = [bins[0].x0, ...bins.map((b) => b.x1)];
    const every = Math.max(1, Math.ceil(edges.length / 8));
    edges.forEach((e, k) => {
      if (k % every && k !== edges.length - 1) return;
      core.text(axis, core.num(e, ctx, true), { x: X(e), y: bottom + S * 0.022, face: "arvo", px: tp, fill: th.body, align: "c", valign: "asc" });
    });
    return ib;
  },
};
