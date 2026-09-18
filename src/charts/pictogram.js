// Pictogram — FT Magnitude (FT: isotype). Counts as rows of whole symbols: one per unit of each
// row's value (options.per makes each stand for more), wrapped into lines, the name on the left and
// the count on the right; the insight's symbols in olive. Whole numbers only: never half a symbol.
// options.symbol: "square" (default), "dot" or "person".
import * as core from "../core.js";
import { mix } from "../theme.js";

function symbol(g, kind, x, y, s, fill) {
  if (kind === "dot") return core.dot(g, x + s / 2, y + s / 2, s * 0.42, fill);
  if (kind === "person") {
    core.dot(g, x + s / 2, y + s * 0.22, s * 0.18, fill);
    return g.append("path").attr("fill", fill).attr("d", `M${x + s * 0.2},${y + s}L${x + s * 0.2},${y + s * 0.62}Q${x + s * 0.2},${y + s * 0.44} ${x + s * 0.38},${y + s * 0.44}L${x + s * 0.62},${y + s * 0.44}Q${x + s * 0.8},${y + s * 0.44} ${x + s * 0.8},${y + s * 0.62}L${x + s * 0.8},${y + s}Z`);
  }
  return g.append("rect").attr("x", x + s * 0.08).attr("y", y + s * 0.08).attr("width", s * 0.84).attr("height", s * 0.84).attr("rx", s * 0.12).attr("fill", fill);
}

export default {
  id: "pictogram",
  name: "Pictogram",
  needs: () => ["label", "value"],
  insight: "max",
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th, paint: P } = ctx, per = ctx.options.per || 1, kind = ctx.options.symbol || "square";
    const counts = rows.map((r) => Math.round(Math.max(0, r.value) / per));
    if (rows.some((r) => r.value % per)) ctx.warn(`values are not whole multiples of ${per}; rounded to whole symbols`);
    let lp = S * 0.025;
    const labW = Math.min(Math.max(...rows.map((r) => core.measure(r.label || "", "arvoBold", lp).w)), (x1 - x0) * 0.3);
    lp = Math.min(...rows.map((r) => core.shrinkTo(r.label || "", "arvoBold", lp, labW, S * 0.017)));
    const vp = S * 0.036, valW = Math.max(...rows.map((r) => core.measure(core.num(r.value, ctx), "bebas", vp).w)) + S * 0.03;
    const gx0 = x0 + labW + S * 0.03, gx1 = x1 - valW, cmax = Math.max(...counts) || 1;
    // symbol size: as big as lets every row fit its symbols in the lines it gets
    let s = S * 0.06;
    const linesOf = (c, sz) => Math.max(1, Math.ceil(c / Math.max(1, Math.floor((gx1 - gx0) / sz))));
    while (s > S * 0.012 && rows.reduce((a, _, i) => a + linesOf(counts[i], s) * s + S * 0.028, 0) > y1 - y0) s -= 1;
    void cmax;
    const heights = counts.map((c) => linesOf(c, s) * s), totalH = heights.reduce((a, b) => a + b + S * 0.028, 0);
    let y = y0 + ((y1 - y0) - totalH) / 2;
    const marks = g.append("g").attr("id", "marks");
    let ib = null;
    rows.forEach((r, i) => {
      const row = core.rowGroup(marks, i, i, P), per_line = Math.max(1, Math.floor((gx1 - gx0) / s));
      for (let j = 0; j < counts[i]; j++) symbol(row, kind, gx0 + (j % per_line) * s, y + Math.floor(j / per_line) * s, s, P.on(i) ? P.mark(i) : mix(th.roles.muted, th.roles.neutral, 0.2));
      const lb = core.text(row, r.label || "", { x: gx0 - S * 0.03, y: y + s / 2, face: "arvoBold", px: lp, fill: P.on(i) ? th.ink : th.body, align: "r", valign: "fmid" });
      const lastX = gx0 + Math.min(counts[i], per_line) * s;
      const vb = core.text(row, core.num(r.value, ctx), { x: lastX + S * 0.016, y: y + s / 2, face: "bebas", px: vp, fill: P.words(i), valign: "mid" });
      if (P.on(i)) ib = core.union(lb, vb, [gx0, y, lastX, y + heights[i]]);
      y += heights[i] + S * 0.028;
    });
    return ib;
  },
};
