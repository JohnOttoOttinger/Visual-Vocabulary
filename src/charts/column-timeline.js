// Column over time — FT Change over time; a `trend` sub-mode. One number per period as a column,
// in the table's order, on dotted gridlines; the insight's column in olive with its value in Depot
// above it. Best with one series and up to about two dozen periods.
import * as core from "../core.js";
import { mix } from "../theme.js";

export default {
  id: "column-timeline",
  name: "Column over time",
  needs: () => ["value"],
  insight: "last",
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th, paint: P } = ctx;
    const vals = rows.map((r) => r.value), n = rows.length;
    const [lo, hi, ticks] = core.spanOf([0, ...vals]);
    const tp = S * 0.022;
    const labW = Math.max(...ticks.map((t) => core.measure(core.num(t, ctx, true), "arvo", tp).w));
    const px0 = x0 + labW + S * 0.03, px1 = x1, py0 = y0 + S * 0.13;
    const step0 = (px1 - px0) / n, wide = rows.some((r) => core.measure(String(r.label ?? ""), "arvo", tp).w > step0 * Math.max(1, Math.ceil(n / 7)) * 0.95);
    const py1 = y1 - (wide ? S * 0.11 : S * 0.07);
    const Y = (v) => py1 - (py1 - py0) * (v - lo) / ((hi - lo) || 1);
    const step = (px1 - px0) / n, w = Math.min(step * 0.72, S * 0.09);
    const grid = g.append("g").attr("id", "grid");
    for (const t of ticks) {
      core.dottedLine(grid, [px0, Y(t)], [px1, Y(t)], mix(th.roles.neutral, th.ground, 0.45), S);
      core.text(grid, core.num(t, ctx, true), { x: px0 - S * 0.02, y: Y(t), face: "arvo", px: tp, fill: th.body, align: "r", valign: "mid" });
    }
    // period names under their columns: short ones every few columns, long ones (names, not dates)
    // under every column, wrapped and sized so the longest word fits
    const every = Math.max(1, Math.ceil(n / 7)), xl = g.append("g").attr("id", "axis-x");
    const long = rows.some((r) => core.measure(String(r.label ?? ""), "arvo", tp).w > step * every * 0.95);
    const lp = long ? core.fitWords(rows.map((r) => r.label), "arvo", tp, step * 0.94, S * 0.013) : tp;
    const marks = g.append("g").attr("id", "marks");
    let ib = null;
    rows.forEach((r, i) => {
      const cx = px0 + step * (i + 0.5), row = core.rowGroup(marks, i, i, P), up = r.value >= 0;
      const [ya, yb] = up ? [Y(r.value), Y(0)] : [Y(0), Y(r.value)];
      if (yb - ya > 0.5) core.bar(row, cx - w / 2, ya, cx + w / 2, yb, P.mark(i), up ? "top" : "bottom", S * 0.012);
      if (long) core.para(xl, String(r.label ?? ""), { x: cx, y: py1 + S * 0.030, px: lp, width: step * 0.94, fill: P.on(i) ? th.ink : th.body, align: "c", maxLines: 3 });
      else if (i % every === 0 || i === n - 1 || P.on(i))
        core.text(xl, r.label ?? "", { x: cx, y: py1 + S * 0.030, face: "arvo", px: tp, fill: P.on(i) ? th.ink : th.body, align: "c", valign: "asc" });
      if (P.on(i)) {
        const vb = core.stat(row, core.num(r.value, ctx), { x: cx, y: (up ? ya : yb) + (up ? -S * 0.016 : S * 0.016), px: S * 0.058, fill: P.words(i), valign: up ? "bottom" : "top" });
        ib = core.union([cx - w / 2, ya, cx + w / 2, yb], vb);
      }
    });
    return ib;
  },
};
