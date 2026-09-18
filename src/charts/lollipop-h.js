// Lollipop, horizontal — FT Ranking. The ordered bar made light: a thin stick from the name to a
// dot, the value beside the dot. Lighter marks carry more rows than chunky bars, so ten at most.
import * as core from "../core.js";
import { mix } from "../theme.js";

export const MAX_LOLLIPOPS = 10;

export default {
  id: "lollipop-h",
  name: "Lollipop, horizontal",
  needs: () => ["label", "value"],
  insight: "max",
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th, paint: P } = ctx;
    const order = rows.map((_, i) => i).sort((a, b) => rows[b].value - rows[a].value).slice(0, MAX_LOLLIPOPS);
    if (rows.length > MAX_LOLLIPOPS) ctx.warn(`${rows.length} rows, drawing the top ${MAX_LOLLIPOPS}`);
    const n = order.length, rowH = Math.min((y1 - y0) / n, S * 0.10);
    const start = y0 + ((y1 - y0) - rowH * n) / 2;
    let lp = Math.min(S * 0.025, rowH * 0.34);
    const labW = Math.min(Math.max(...order.map((i) => core.measure(rows[i].label || "", "arvoBold", lp).w)), (x1 - x0) * 0.36);
    lp = Math.min(...order.map((i) => core.shrinkTo(rows[i].label || "", "arvoBold", lp, labW, S * 0.018)));
    const vp = S * 0.036;
    const valW = Math.max(...order.map((i) => core.measure(core.num(rows[i].value, ctx), "bebas", vp).w)) + S * 0.05;
    const sx = x0 + labW + S * 0.03, ex = x1 - valW;
    const vmax = Math.max(...order.map((i) => rows[i].value)) || 1;
    const stick = mix(th.roles.neutral, th.ground, 0.35), marks = g.append("g").attr("id", "marks");
    let ib = null;
    order.forEach((i, k) => {
      const r = rows[i], row = core.rowGroup(marks, i, k, P), yc = start + rowH * (k + 0.5);
      const x = sx + (ex - sx) * Math.max(0, r.value) / vmax, rad = S * 0.020 * P.grow(i);
      row.append("line").attr("x1", sx).attr("x2", x).attr("y1", yc).attr("y2", yc)
        .attr("stroke", P.on(i) ? P.mark(i) : stick).attr("stroke-width", S * 0.007).attr("stroke-linecap", "round");
      core.dot(row, x, yc, rad, P.mark(i), th.ground, S * 0.004);
      const lb = core.text(row, r.label || "", { x: sx - S * 0.03, y: yc, face: "arvoBold", px: lp, fill: P.on(i) ? P.words(i) : th.body, align: "r", valign: "mid" });
      const vb = core.text(row, core.num(r.value, ctx), { x: x + rad + S * 0.016, y: yc, face: "bebas", px: vp, fill: P.words(i), valign: "mid" });
      if (P.on(i)) ib = core.union(lb, vb, [x - rad, yc - rad, x + rad, yc + rad]);
    });
    return ib;
  },
};
