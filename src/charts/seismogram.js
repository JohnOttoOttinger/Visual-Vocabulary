// Seismogram — FT Change over time. Every period as a spike either side of one line, its height the
// value: for long series with big swings, where a line would be a scribble. Rows in time order with
// "label" (dates or periods) and "value"; the biggest spike is named.
import * as core from "../core.js";
import { mix } from "../theme.js";

export default {
  id: "seismogram",
  name: "Seismogram",
  needs: () => ["value"],
  insight: "max",
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th, paint: P } = ctx, n = rows.length;
    const vmax = Math.max(...rows.map((r) => Math.abs(r.value))) || 1;
    const top = y0 + S * 0.16, bottom = y1 - S * 0.07, mid = (top + bottom) / 2, half = (bottom - top) / 2;
    const step = (x1 - x0) / n, X = (i) => x0 + step * (i + 0.5), w = Math.max(1, Math.min(step * 0.7, S * 0.006));
    g.append("line").attr("id", "axis").attr("x1", x0).attr("x2", x1).attr("y1", mid).attr("y2", mid).attr("stroke", mix(th.roles.neutral, th.ground, 0.3)).attr("stroke-width", S * 0.002);
    const marks = g.append("g").attr("id", "marks");
    rows.forEach((r, i) => {
      const h = half * Math.abs(r.value) / vmax;
      if (h < 0.5) return;
      marks.append("rect").attr("data-row", i).attr("x", X(i) - w / 2).attr("y", mid - h).attr("width", w).attr("height", 2 * h).attr("rx", w / 2)
        .attr("fill", P.on(i) ? th.roles.main : mix(th.strong, th.ground, 0.15));
    });
    // a few period names along the bottom
    const every = Math.max(1, Math.ceil(n / 6)), xl = g.append("g").attr("id", "axis-x");
    rows.forEach((r, i) => { if ((i % every === 0 || i === n - 1) && r.label) core.text(xl, r.label, { x: X(i), y: bottom + S * 0.02, face: "arvo", px: S * 0.021, fill: th.body, align: i === 0 ? "l" : i === n - 1 ? "r" : "c", valign: "asc" }); });
    if (P.ins === null || P.ins === undefined) return null;
    const r = rows[P.ins], x = X(P.ins), h = half * Math.abs(r.value) / vmax, ins = g.append("g").attr("id", "insight");
    const cx = Math.min(Math.max(x, x0 + S * 0.12), x1 - S * 0.12);
    const vb = core.stat(ins, core.num(r.value, ctx), { x: cx, y: y0, px: S * 0.058, fill: P.words(P.ins) });
    const lb = core.text(ins, String(r.label ?? ""), { x: cx, y: vb[3] + S * 0.012, face: "arvoBold", px: S * 0.024, fill: th.body, align: "c", valign: "asc" });
    core.dottedLine(ins, [x, lb[3] + S * 0.012], [x, mid - h - S * 0.01], th.roles.neutral, S);
    return core.union(vb, lb, [x - w, mid - h, x + w, mid + h]);
  },
};
