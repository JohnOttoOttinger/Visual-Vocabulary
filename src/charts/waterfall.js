// Waterfall — FT Part-to-whole and Flow. How a total is built step by step: each row adds or takes
// away (olive up, mauve down), dotted runs carry the running total from one step to the next, and a
// row marked "total": true stands on the baseline as the sum so far (a start or an end). Each step
// carries its change. The insight is the biggest single step.
import * as core from "../core.js";
import { mix, div } from "../theme.js";

export default {
  id: "waterfall",
  name: "Waterfall",
  needs: () => ["label", "value"],
  insight: (rows) => rows.reduce((m, r, i) => (!r.total && Math.abs(r.value) > (rows[m].total ? -1 : Math.abs(rows[m].value)) ? i : m), 0),
  ringOnHue: true,
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th, paint: P } = ctx, n = rows.length;
    if (n > 12) ctx.warn(`${n} steps; a waterfall reads best with twelve or fewer`);
    // the running total before and after each row
    let run = 0;
    const span = rows.map((r) => {
      const a = r.total ? 0 : run, b = r.total ? r.value : run + r.value;
      run = b;
      return [a, b];
    });
    const all = span.flat(), [lo, hi, ticks] = core.spanOf([0, ...all], true);
    const colW = (x1 - x0) / n, vp = S * 0.034;
    const lp = core.fitWords(rows.map((r) => r.label), "arvoBold", Math.min(S * 0.023, colW * 0.2), colW * 0.94, S * 0.013);
    const labH = Math.max(...rows.map((r) => core.paraHeight(r.label || "", lp, colW * 0.94, 3)));
    const top = y0 + vp * 1.5, bottom = y1 - labH - S * 0.03;
    const Y = (v) => bottom - (bottom - top) * (v - lo) / ((hi - lo) || 1), w = Math.min(colW * 0.66, S * 0.12);
    const faint = mix(th.roles.neutral, th.ground, 0.4), marks = g.append("g").attr("id", "marks");
    g.append("line").attr("id", "axis").attr("x1", x0).attr("x2", x1).attr("y1", Y(0)).attr("y2", Y(0)).attr("stroke", th.strong).attr("stroke-width", S * 0.003);
    let ib = null;
    rows.forEach((r, i) => {
      const row = core.rowGroup(marks, i, i, P), cx = x0 + colW * (i + 0.5), [a, b] = span[i];
      const ya = Y(Math.max(a, b)), yb = Y(Math.min(a, b)), up = b >= a;
      const fill = r.total ? (P.on(i) ? th.roles.main : th.strong) : div(th, up ? 0.85 : -0.85);
      if (yb - ya > 0.5) core.bar(row, cx - w / 2, ya, cx + w / 2, yb, fill, r.total || up ? "top" : "bottom", S * 0.010);
      if (i < n - 1) core.dottedLine(row, [cx + w / 2, Y(b)], [cx + colW - w / 2, Y(b)], faint, S);
      const txt = r.total ? core.num(r.value, ctx) : `${r.value >= 0 ? "+" : "−"}${core.num(Math.abs(r.value), ctx)}`;
      const vb = core.text(row, txt, { x: cx, y: ya - S * 0.012, face: "bebas", px: vp, fill: r.total ? th.ink : th.body, align: "c", valign: "bottom" });
      const [lb] = core.para(row, r.label || "", { x: cx, y: bottom + S * 0.03, px: lp, width: colW * 0.94, fill: P.on(i) ? th.ink : th.body, align: "c", bold: true, maxLines: 3 });
      if (P.on(i)) ib = core.union(vb, [cx - colW * 0.47, ya, cx + colW * 0.47, lb]);
    });
    return ib;
  },
};
