// Dumbbell — FT's dot plot (Distribution); the Storyteller's `comparison / dumbbell`. Two dots on
// one line per row, A in olive and B in blue: the gap between them is the comparison. Both numbers
// in a column on the right. `axes` names A and B.
import * as core from "../core.js";
import { mix } from "../theme.js";

export default {
  id: "dumbbell",
  name: "Dumbbell",
  needs: () => ["label", "value", "value2"],
  insight: "change",
  ringOnHue: true,
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th, paint: P } = ctx, R = th.roles;
    const heads = (ctx.axes || ["A", "B"]).slice(0, 2), A = R.main, B = R.versus, n = rows.length;
    let lp = S * 0.025;
    const labw = Math.min(Math.max(...rows.map((r) => core.measure(r.label || "", "arvoBold", lp).w)), (x1 - x0) * 0.34);
    lp = Math.min(...rows.map((r) => core.shrinkTo(r.label || "", "arvoBold", lp, labw, S * 0.018)));
    const valw = S * 0.13, px0 = x0 + labw + S * 0.035, px1 = x1 - valw;
    const [lo, hi, ticks] = core.spanOf(rows.flatMap((r) => [r.value, r.value2]));
    const X = (v) => px0 + (px1 - px0) * (v - lo) / ((hi - lo) || 1);
    const key = g.append("g").attr("id", "key");
    let kx = px0;
    heads.forEach((name, k) => {
      core.dot(key, kx + S * 0.012, y0 + S * 0.018, S * 0.012, [A, B][k]);
      core.text(key, name, { x: kx + S * 0.034, y: y0 + S * 0.018, face: "arvoBold", px: S * 0.024, fill: th.ink, valign: "mid" });
      kx += S * 0.034 + core.measure(name, "arvoBold", S * 0.024).w + S * 0.05;
    });
    let top = y0 + S * 0.075;
    const bottom = y1 - S * 0.06, rowH = Math.min((bottom - top) / n, S * 0.10);
    top += ((bottom - top) - rowH * n) / 2;
    const faint = mix(R.neutral, th.ground, 0.5), grid = g.append("g").attr("id", "grid");
    for (const t of ticks) {
      core.dottedLine(grid, [X(t), top], [X(t), top + rowH * n], faint, S);
      core.text(grid, core.num(t, ctx, true), { x: X(t), y: top + rowH * n + S * 0.016, face: "arvo", px: S * 0.020, fill: th.body, align: "c", valign: "asc" });
    }
    const marks = g.append("g").attr("id", "marks");
    let ib = null;
    rows.forEach((r, i) => {
      const row = core.rowGroup(marks, i, i, P), yc = top + rowH * (i + 0.5), a = X(r.value), b = X(r.value2), gr = P.grow(i);
      row.append("line").attr("x1", a).attr("x2", b).attr("y1", yc).attr("y2", yc)
        .attr("stroke", P.series(i, mix(R.muted, R.neutral, 0.25))).attr("stroke-width", S * 0.010 * gr);
      core.dot(row, a, yc, S * 0.016 * gr, P.series(i, A), th.ground, S * 0.003);
      core.dot(row, b, yc, S * 0.016 * gr, P.series(i, B), th.ground, S * 0.003);
      core.text(row, r.label || "", { x: px0 - S * 0.035, y: yc, face: "arvoBold", px: lp, fill: P.on(i) || P.ins === null || P.ins === undefined ? th.ink : th.body, align: "r", valign: "mid" });
      const fv = S * 0.024, sa = core.num(r.value, ctx), sb = core.num(r.value2, ctx);
      const wb = core.measure(sb, "arvoBold", fv).w, dx = x1 - wb - S * 0.020;   // the dot's centre
      core.text(row, sb, { x: x1, y: yc, face: "arvoBold", px: fv, fill: P.series(i, mix(B, th.ink, 0.35)), align: "r", valign: "mid" });
      core.dot(row, dx, yc, S * 0.003, th.body);
      core.text(row, sa, { x: dx - S * 0.020, y: yc, face: "arvoBold", px: fv, fill: P.series(i, mix(A, th.ink, 0.35)), align: "r", valign: "mid" });
      if (P.on(i)) ib = [x0 + S * 0.005, yc - rowH / 2 + S * 0.006, x1 + S * 0.01, yc + rowH / 2 - S * 0.006];
    });
    return ib;
  },
};
