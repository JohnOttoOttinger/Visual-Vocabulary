// Heatmap, categories — FT Correlation. A grid of two sets of categories: one row per table row,
// one column per "series" column, each cell shaded by its value in one hue (darker is more; lighter
// on dark paper), the value inside when it fits. The biggest cell is ringed.
import * as core from "../core.js";
import { seq, onFill } from "../theme.js";

export default {
  id: "heatmap-category",
  name: "Heatmap, categories",
  needs: (spec) => (spec && spec.series && spec.series.length
    ? ["label", ...spec.series] : ["label"]),
  // A grid needs columns to be a grid: two or more measures.
  measures: 2,
  insight: "none",
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th } = ctx, { names, cols } = core.seriesOf(rows, ctx);
    const all = rows.flatMap((r) => cols.map((c) => r[c])).filter(core.isNum), vmax = Math.max(...all) || 1, vmin = Math.min(0, ...all);
    let lp = S * 0.024;
    const labW = Math.min(Math.max(...rows.map((r) => core.measure(String(r.label ?? ""), "arvoBold", lp).w)), (x1 - x0) * 0.25) + S * 0.025;
    lp = Math.min(...rows.map((r) => core.shrinkTo(String(r.label ?? ""), "arvoBold", lp, labW - S * 0.025, S * 0.015)));
    const cw = (x1 - x0 - labW) / cols.length, hp = Math.min(S * 0.022, cw * 0.5);
    const headH = hp * 2.2, ch = Math.min((y1 - y0 - headH - S * 0.05) / rows.length, cw * 1.2, S * 0.10);
    const gx0 = x0 + labW, gy0 = y0 + headH, gap = Math.max(1.5, S * 0.003), vp = Math.min(S * 0.026, ch * 0.45, cw * 0.4);
    const axis = g.append("g").attr("id", "axis"), marks = g.append("g").attr("id", "marks");
    names.forEach((n, k) => core.text(axis, n, { x: gx0 + cw * (k + 0.5), y: gy0 - S * 0.012, face: "arvoBold", px: hp, fill: th.body, align: "c", valign: "fbottom" }));
    let best = null;
    rows.forEach((r, i) => {
      const row = marks.append("g").attr("class", "row").attr("data-row", i).attr("data-order", i), y = gy0 + ch * i;
      core.text(axis, String(r.label ?? ""), { x: gx0 - S * 0.02, y: y + ch / 2, face: "arvoBold", px: lp, fill: th.body, align: "r", valign: "fmid" });
      cols.forEach((c, k) => {
        const v = r[c], x = gx0 + cw * k;
        const fill = core.isNum(v) ? seq(th, 0.1 + 0.9 * (v - vmin) / ((vmax - vmin) || 1)) : th.ground;
        row.append("rect").attr("x", x + gap / 2).attr("y", y + gap / 2).attr("width", cw - gap).attr("height", ch - gap).attr("rx", S * 0.004).attr("fill", fill);
        if (core.isNum(v) && vp > S * 0.013 && core.measure(core.num(v, ctx), "bebas", vp).w < cw - S * 0.008)
          core.text(row, core.num(v, ctx), { x: x + cw / 2, y: y + ch / 2, face: "bebas", px: vp, fill: onFill(fill), align: "c", valign: "mid" });
        if (core.isNum(v) && (!best || v > best.v)) best = { v, box: [x, y, x + cw, y + ch] };
      });
    });
    return best ? best.box : null;
  },
  ringOnHue: true,
};
