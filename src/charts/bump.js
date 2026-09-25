// Bump — FT Ranking. How ranks change: one column per period ("series": the period columns, in
// order), each row's rank in every period (1 is the highest value), a line joining its ranks. The
// insight is the row that moves furthest; names at both ends. Ten rows at most.
import * as core from "../core.js";
import { mix } from "../theme.js";

const d3 = globalThis.d3;

function ranks(rows, periods) {
  // per period, rows ordered by value, highest first; ties keep the table's order
  return periods.map((p) => {
    const order = rows.map((_, i) => i).sort((a, b) => (rows[b][p] ?? -Infinity) - (rows[a][p] ?? -Infinity) || a - b);
    const rk = []; order.forEach((i, k) => { rk[i] = k + 1; });
    return rk;
  });
}

export default {
  id: "bump",
  name: "Bump",
  needs: (spec) => (spec && spec.series && spec.series.length
    ? ["label", ...spec.series] : ["label"]),
  // A rank needs two periods to move between, so "series" must name at least two.
  measures: 2,
  insight(rows, spec) {
    const periods = spec.series || [];
    if (periods.length < 2) return null;
    const rk = ranks(rows, periods);
    let best = 0, move = -1;
    rows.forEach((_, i) => { const m = Math.abs(rk[0][i] - rk[rk.length - 1][i]); if (m > move) { move = m; best = i; } });
    return best;
  },
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th, paint: P } = ctx, periods = ctx.series || [];
    if (periods.length < 2) throw new Error('bump: name at least two period columns with "series": [...]');
    if (rows.length > 10) ctx.warn(`${rows.length} rows; a bump chart reads best with ten or fewer`);
    const rk = ranks(rows, periods), n = rows.length, lp = S * 0.024;
    const nameW = Math.min(Math.max(...rows.map((r) => core.measure(r.label || "", "arvoBold", lp).w)), (x1 - x0) * 0.26);
    const lpx = Math.min(...rows.map((r) => core.shrinkTo(r.label || "", "arvoBold", lp, nameW, S * 0.017)));
    const px0 = x0 + nameW + S * 0.06, px1 = x1 - nameW - S * 0.06, hp = S * 0.034;
    const py0 = y0 + hp * 1.8, py1 = y1 - S * 0.02;
    const X = (k) => px0 + (px1 - px0) * k / (periods.length - 1);
    const Y = (r) => py0 + (py1 - py0) * (r - 1) / Math.max(1, n - 1);
    const heads = g.append("g").attr("id", "heads");
    periods.forEach((p, k) => core.text(heads, String(p).toUpperCase(), { x: X(k), y: y0, face: "bebas", px: hp, fill: th.roles.neutral, align: "c" }));
    const marks = g.append("g").attr("id", "marks"), path = d3.line().curve(d3.curveBumpX);
    const order = rows.map((_, i) => i).sort((a, b) => (P.on(a) ? 1 : 0) - (P.on(b) ? 1 : 0));   // the insight on top
    let ib = null;
    order.forEach((i, k) => {
      const on = P.on(i), row = core.rowGroup(marks, i, k, P);
      const col = on || P.how !== "hue" ? P.mark(i) : mix(th.roles.muted, th.roles.neutral, 0.15);
      const pts = periods.map((_, j) => [X(j), Y(rk[j][i])]);
      row.append("path").attr("d", path(pts)).attr("fill", "none").attr("stroke", col).attr("stroke-width", S * (on ? 0.012 : 0.006) * P.grow(i)).attr("stroke-linecap", "round");
      pts.forEach(([x, y], j) => {
        core.dot(row, x, y, S * (on ? 0.018 : 0.013), col, th.ground, S * 0.003);
        if (on || j === 0 || j === pts.length - 1)
          core.text(row, String(rk[j][i]), { x, y, face: "bebas", px: S * (on ? 0.022 : 0.018), fill: on ? th.roles.onMain : th.ink, align: "c", valign: "mid" });
      });
      const fill = on ? P.words(i) : th.body, face = on ? "arvoBold" : "arvo";
      const a = core.text(row, rows[i].label || "", { x: px0 - S * 0.03, y: pts[0][1], face, px: lpx, fill, align: "r", valign: "fmid" });
      const b = core.text(row, rows[i].label || "", { x: px1 + S * 0.03, y: pts[pts.length - 1][1], face, px: lpx, fill, valign: "fmid" });
      if (on) ib = core.union(a, b, ...pts.map(([x, y]) => [x - S * 0.02, y - S * 0.02, x + S * 0.02, y + S * 0.02]));
    });
    return ib;
  },
};
