// Bullet — FT Magnitude. One row per measure against its target: bands for the ranges behind it
// (poor to good, darkening), the value as a thick bar, the target as a solid tick, the value and the
// target written on the right. Rows give "target" and "ranges" ([up to, up to, ...]); options.ranges
// sets them for every row. The insight is the row furthest short of its target.
import * as core from "../core.js";
import { mix } from "../theme.js";

export default {
  id: "bullet",
  name: "Bullet",
  needs: () => ["label", "value", "target"],
  insight: (rows) => rows.reduce((m, r, i) => ((r.target - r.value) / (r.target || 1) > (rows[m].target - rows[m].value) / (rows[m].target || 1) ? i : m), 0),
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th, paint: P } = ctx, R = th.roles, n = rows.length;
    let lp = S * 0.026;
    const labW = Math.min(Math.max(...rows.map((r) => core.measure(r.label || "", "arvoBold", lp).w)), (x1 - x0) * 0.30);
    lp = Math.min(...rows.map((r) => core.shrinkTo(r.label || "", "arvoBold", lp, labW, S * 0.017)));
    const vp = S * 0.040, sp = S * 0.024;
    const valW = Math.max(...rows.map((r) => core.measure(core.num(r.value, ctx), "bebas", vp).w + core.measure(`of ${core.num(r.target, ctx)}`, "arvo", sp).w + S * 0.012)) + S * 0.03;
    const px0 = x0 + labW + S * 0.03, px1 = x1 - valW;
    const ranges = (r) => r.ranges || ctx.options.ranges || [];
    const vmax = Math.max(...rows.flatMap((r) => [r.value, r.target, ...ranges(r)])) || 1;
    const X = (v) => px0 + (px1 - px0) * Math.max(0, v) / vmax;
    const rowH = Math.min((y1 - y0) / n, S * 0.13), start = y0 + ((y1 - y0) - rowH * n) / 2, bh = rowH * 0.56;
    const marks = g.append("g").attr("id", "marks");
    let ib = null;
    rows.forEach((r, i) => {
      const row = core.rowGroup(marks, i, i, P), yc = start + rowH * (i + 0.5), rg = [...ranges(r)].sort((a, b) => a - b);
      const bands = rg.length ? rg : [vmax];
      // the ranges behind, lightest last: the furthest band is the palest
      [...bands].reverse().forEach((up, k) => {
        const tone = mix(R.muted, th.ground, 0.15 + 0.25 * (bands.length - 1 - k) / Math.max(1, bands.length - 1));
        row.append("rect").attr("x", px0).attr("y", yc - bh / 2).attr("width", X(up) - px0).attr("height", bh).attr("fill", k === bands.length - 1 ? mix(R.muted, R.neutral, 0.25) : tone);
      });
      const vh = bh * 0.40 * Math.min(P.grow(i), 1.2);
      core.bar(row, px0, yc - vh / 2, X(r.value), yc + vh / 2, P.on(i) ? P.mark(i) : th.strong, "right", S * 0.008);
      row.append("line").attr("x1", X(r.target)).attr("x2", X(r.target)).attr("y1", yc - bh * 0.42).attr("y2", yc + bh * 0.42)
        .attr("stroke", th.ink).attr("stroke-width", S * 0.006).attr("stroke-linecap", "round");
      const lb = core.text(row, r.label || "", { x: px0 - S * 0.03, y: yc, face: "arvoBold", px: lp, fill: P.on(i) ? th.ink : th.body, align: "r", valign: "fmid" });
      const vb = core.text(row, core.num(r.value, ctx), { x: px1 + S * 0.03, y: yc, face: "bebas", px: vp, fill: P.words(i), valign: "mid" });
      const ob = core.text(row, `of ${core.num(r.target, ctx)}`, { x: vb[2] + S * 0.012, y: yc, face: "arvo", px: sp, fill: th.body, valign: "fmid" });
      if (P.on(i)) ib = core.union(lb, ob, [px0, yc - bh / 2, px1, yc + bh / 2]);
    });
    return ib;
  },
};
