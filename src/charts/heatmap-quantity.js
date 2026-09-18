// Heatmap, quantities — FT Correlation. A grid on two number scales: each row one cell at "x" and
// "y" (a regular grid of both) with its "value", shaded in one hue (darker is more; lighter on dark
// paper). `axes` names x and y. The biggest cell is ringed and its value given.
import * as core from "../core.js";
import { seq, mix } from "../theme.js";

export default {
  id: "heatmap-quantity",
  name: "Heatmap, quantities",
  needs: () => ["x", "y", "value"],
  insight: "max",
  ringOnHue: true,
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th, paint: P } = ctx, names = ctx.axes || ["", ""], tp = S * 0.021;
    const xs = [...new Set(rows.map((r) => r.x))].sort((a, b) => a - b), ys = [...new Set(rows.map((r) => r.y))].sort((a, b) => a - b);
    const vmax = Math.max(...rows.map((r) => r.value)) || 1;
    const labW = Math.max(...ys.map((v) => core.measure(core.num(v, ctx, true), "arvo", tp).w)) + S * 0.03;
    const gx0 = x0 + labW, gy0 = y0 + S * 0.06, gy1 = y1 - S * 0.12;
    const cw = (x1 - gx0) / xs.length, ch = (gy1 - gy0) / ys.length, gap = Math.max(1, S * 0.0025);
    const axis = g.append("g").attr("id", "axis"), marks = g.append("g").attr("id", "marks");
    const ex = Math.max(1, Math.ceil(xs.length / 8)), ey = Math.max(1, Math.ceil(ys.length / 8));
    xs.forEach((v, k) => { if (k % ex === 0) core.text(axis, core.num(v, ctx, true), { x: gx0 + cw * (k + 0.5), y: gy1 + S * 0.014, face: "arvo", px: tp, fill: th.body, align: "c", valign: "asc" }); });
    ys.forEach((v, k) => { if (k % ey === 0) core.text(axis, core.num(v, ctx, true), { x: gx0 - S * 0.016, y: gy1 - ch * (k + 0.5), face: "arvo", px: tp, fill: th.body, align: "r", valign: "mid" }); });
    if (names[0]) core.text(axis, names[0].toUpperCase(), { x: x1, y: gy1 + S * 0.055, face: "bebas", px: S * 0.032, fill: th.roles.neutral, align: "r" });
    if (names[1]) core.text(axis, names[1].toUpperCase(), { x: x0, y: y0, face: "bebas", px: S * 0.032, fill: th.roles.neutral });
    // empty cells show the grid faintly, so gaps read as nothing rather than as missing
    xs.forEach((_, a) => ys.forEach((_, b) => marks.append("rect").attr("x", gx0 + cw * a + gap / 2).attr("y", gy1 - ch * (b + 1) + gap / 2)
      .attr("width", cw - gap).attr("height", ch - gap).attr("fill", mix(th.roles.muted, th.ground, th.dark ? 0.8 : 0.6))));
    let ib = null;
    rows.forEach((r, i) => {
      const a = xs.indexOf(r.x), b = ys.indexOf(r.y), x = gx0 + cw * a, y = gy1 - ch * (b + 1);
      if (r.value > 0) marks.append("rect").attr("data-row", i).attr("x", x + gap / 2).attr("y", y + gap / 2).attr("width", cw - gap).attr("height", ch - gap).attr("fill", seq(th, 0.12 + 0.88 * r.value / vmax));
      if (P.on(i)) {
        const vb = core.text(g, `${core.num(r.value, ctx)}`, { x: Math.min(x + cw / 2, x1 - S * 0.03), y: y - S * 0.012, face: "bebas", px: S * 0.036, fill: th.ink, align: "c", valign: "bottom", halo: [th.ground, S * 0.004] });
        ib = core.union([x, y, x + cw, y + ch], vb);
      }
    });
    return ib;
  },
};
