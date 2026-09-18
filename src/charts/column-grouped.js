// Grouped column — FT Magnitude; a `comparison` sub-mode. The grouped bar stood upright: one group
// of columns per row, one column per series in the fixed order, the value over each, the row's name
// under its group, a key above. Reads named "series", or value and value2 named by "axes".
import * as core from "../core.js";
import barGrouped from "./bar-grouped.js";

export default {
  id: "column-grouped",
  name: "Grouped column",
  needs: () => ["label"],
  insight: barGrouped.insight,
  ringOnHue: true,
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th, paint: P } = ctx, { names, cols: keys } = core.seriesOf(rows, ctx);
    if (names.length > th.series.length) ctx.warn(`${names.length} series; the palette separates ${th.series.length}`);
    if (rows.length * names.length > 16) ctx.warn(`${rows.length * names.length} columns; a grouped bar reads more easily past about sixteen`);
    const cols = names.map((_, k) => th.series[k % th.series.length]);
    const key = g.append("g").attr("id", "key"), kp = S * 0.024;
    let kx = x0;
    names.forEach((n, k) => {
      key.append("rect").attr("x", kx).attr("y", y0).attr("width", kp).attr("height", kp).attr("rx", kp * 0.2).attr("fill", cols[k]);
      core.text(key, n, { x: kx + kp + S * 0.014, y: y0 + kp / 2, face: "arvoBold", px: kp, fill: th.ink, valign: "mid" });
      kx += kp + S * 0.014 + core.measure(n, "arvoBold", kp).w + S * 0.045;
    });
    const n = rows.length, gw = (x1 - x0) / n, vp = S * 0.032;
    const lp = core.fitWords(rows.map((r) => r.label), "arvoBold", Math.min(S * 0.024, gw * 0.16), gw * 0.92, S * 0.013);
    const labH = Math.max(...rows.map((r) => core.paraHeight(r.label || "", lp, gw * 0.92, 3)));
    const top = y0 + kp + S * 0.05 + vp * 1.3, bottom = y1 - labH - S * 0.03;
    const vals = rows.flatMap((r) => keys.map((c) => r[c])).filter(core.isNum), vmax = Math.max(...vals, 0) || 1;
    const Y = (v) => bottom - (bottom - top) * Math.max(0, v) / vmax;
    const bandW = gw * 0.78, t = bandW / names.length, gap = Math.max(2, S * 0.004);
    const axis = g.append("g").attr("id", "axis");
    axis.append("line").attr("x1", x0).attr("x2", x1).attr("y1", bottom).attr("y2", bottom).attr("stroke", th.strong).attr("stroke-width", S * 0.003);
    const marks = g.append("g").attr("id", "marks");
    let ib = null;
    rows.forEach((r, i) => {
      const row = core.rowGroup(marks, i, i, P), gx = x0 + gw * i + (gw - bandW) / 2;
      let topmost = bottom;
      keys.forEach((c, k) => {
        const v = r[c];
        if (!core.isNum(v)) return;
        const bx = gx + t * k, y = Y(v);
        if (bottom - y > 0.5) core.bar(row, bx + gap / 2, y, bx + t - gap / 2, bottom, cols[k], "top", S * 0.012).attr("data-series", names[k]);
        const vb = core.text(row, core.num(v, ctx), { x: bx + t / 2, y: y - S * 0.010, face: "bebas", px: vp, fill: P.on(i) || P.ins === null || P.ins === undefined ? th.ink : th.body, align: "c", valign: "bottom" });
        topmost = Math.min(topmost, vb[1]);
      });
      const [lb] = core.para(row, r.label || "", { x: x0 + gw * (i + 0.5), y: bottom + S * 0.03, px: lp, width: gw * 0.92, fill: P.on(i) ? th.ink : th.body, align: "c", bold: true, maxLines: 3 });
      if (P.on(i)) ib = [gx - S * 0.008, topmost - S * 0.006, gx + bandW + S * 0.008, lb + S * 0.004];
    });
    return ib;
  },
};
