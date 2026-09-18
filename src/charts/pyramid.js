// Population pyramid — FT Distribution. Two distributions back to back: one row per band (the table's
// order, top to bottom), A to the left in olive, B to the right in blue, the bars touching so each
// side reads as a shape, the band names down the middle, a scale under each side. `axes` names A
// and B. With eight rows or fewer each bar carries its value.
import * as core from "../core.js";
import { mix } from "../theme.js";

export default {
  id: "pyramid",
  name: "Population pyramid",
  needs: () => ["label", "value", "value2"],
  insight: "change",
  ringOnHue: true,
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th, paint: P } = ctx, R = th.roles, heads = (ctx.axes || ["A", "B"]).slice(0, 2);
    const n = rows.length, tp = S * 0.021, few = n <= 8, vp = S * 0.032;
    let lp = S * 0.024;
    const midW = Math.min(Math.max(...rows.map((r) => core.measure(r.label || "", "arvoBold", lp).w)) + S * 0.03, (x1 - x0) * 0.22);
    lp = Math.min(...rows.map((r) => core.shrinkTo(r.label || "", "arvoBold", lp, midW - S * 0.03, S * 0.015)));
    const mid = (x0 + x1) / 2, room = few ? core.measure("0000", "bebas", vp).w : 0;
    const la = mid - midW / 2, rb = mid + midW / 2, span = la - x0 - room;
    const vmax = Math.max(...rows.flatMap((r) => [r.value, r.value2])) || 1, [, top, ticks] = core.spanOf([0, vmax]);
    const L = (v) => span * v / top;
    const hp = S * 0.040, hd = g.append("g").attr("id", "heads");
    const ha = core.text(hd, heads[0].toUpperCase(), { x: la, y: y0, face: "bebas", px: hp, fill: mix(R.main, th.ink, 0.25), align: "r" });
    core.text(hd, heads[1].toUpperCase(), { x: rb, y: y0, face: "bebas", px: hp, fill: mix(R.versus, th.ink, 0.25) });
    const py0 = ha[3] + S * 0.03, py1 = y1 - S * 0.06, rowH = (py1 - py0) / n, gap = Math.max(1, Math.min(S * 0.004, rowH * 0.08));
    const axis = g.append("g").attr("id", "axis-x"), faint = mix(R.neutral, th.ground, 0.5);
    for (const t of ticks) for (const [x, al] of [[la - L(t), "c"], [rb + L(t), "c"]]) {
      core.dottedLine(axis, [x, py0], [x, py1], faint, S);
      core.text(axis, core.num(t, ctx, true), { x, y: py1 + S * 0.016, face: "arvo", px: tp, fill: th.body, align: al, valign: "asc" });
    }
    const marks = g.append("g").attr("id", "marks");
    let ib = null;
    rows.forEach((r, i) => {
      const row = core.rowGroup(marks, i, i, P), ya = py0 + rowH * i + gap / 2, yb = py0 + rowH * (i + 1) - gap / 2, yc = (ya + yb) / 2;
      if (r.value > 0) row.append("rect").attr("x", la - L(r.value)).attr("y", ya).attr("width", L(r.value)).attr("height", yb - ya).attr("fill", P.series(i, R.main));
      if (r.value2 > 0) row.append("rect").attr("x", rb).attr("y", ya).attr("width", L(r.value2)).attr("height", yb - ya).attr("fill", P.series(i, R.versus));
      const lb = core.text(row, r.label || "", { x: mid, y: yc, face: "arvoBold", px: Math.min(lp, rowH * 0.8), fill: P.on(i) ? th.ink : th.body, align: "c", valign: "fmid" });
      let box = [la - L(r.value), ya, rb + L(r.value2), yb];
      if (few) {
        const va = core.text(row, core.num(r.value, ctx), { x: la - L(r.value) - S * 0.012, y: yc, face: "bebas", px: vp, fill: th.ink, align: "r", valign: "mid" });
        const vb = core.text(row, core.num(r.value2, ctx), { x: rb + L(r.value2) + S * 0.012, y: yc, face: "bebas", px: vp, fill: th.ink, valign: "mid" });
        box = core.union(box, va, vb);
      }
      if (P.on(i)) ib = core.union(box, lb);
    });
    return ib;
  },
};
