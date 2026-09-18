// Parallel coordinates — FT Magnitude. Several measures side by side, each on its own upright scale
// ("series" names them, left to right), each row a line crossing them all; the insight row in olive
// and named at the right, the rest faint. Each scale is labelled with its low and high. The order
// of the measures matters: neighbours are the ones compared.
import * as core from "../core.js";
import { mix } from "../theme.js";

const d3 = globalThis.d3;

export default {
  id: "parallel-coordinates",
  name: "Parallel coordinates",
  needs: () => ["label"],
  insight: "first",
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th, paint: P } = ctx, { names, cols } = core.seriesOf(rows, ctx), K = cols.length;
    if (K < 2) throw new Error("parallel-coordinates: give two or more measures in \"series\"");
    if (rows.length > 12) ctx.warn(`${rows.length} rows; past about twelve the lines tangle`);
    const lp = S * 0.022, nameW = Math.min(Math.max(...rows.map((r) => core.measure(r.label || "", "arvoBold", lp).w)), (x1 - x0) * 0.24);
    const px0 = x0 + S * 0.03, px1 = x1 - nameW - S * 0.03, top = y0 + S * 0.07, bottom = y1 - S * 0.07;
    const X = (k) => px0 + (px1 - px0) * k / (K - 1);
    const scales = cols.map((c) => { const v = rows.map((r) => r[c]).filter(core.isNum); return d3.scaleLinear().domain([Math.min(...v), Math.max(...v)]).range([bottom, top]).nice(); });
    const axes = g.append("g").attr("id", "axes");
    names.forEach((nm, k) => {
      axes.append("line").attr("x1", X(k)).attr("x2", X(k)).attr("y1", top).attr("y2", bottom).attr("stroke", th.strong).attr("stroke-width", S * 0.003);
      core.text(axes, nm, { x: X(k), y: y0, face: "arvoBold", px: Math.min(S * 0.022, core.shrinkTo(nm, "arvoBold", S * 0.022, (px1 - px0) / (K - 1) * 0.95, S * 0.014)), fill: th.ink, align: k === 0 ? "l" : "c" });
      const [a, b] = scales[k].domain();
      core.text(axes, core.num(b, ctx, true), { x: X(k) + S * 0.008, y: top - S * 0.008, face: "arvo", px: S * 0.019, fill: th.body, valign: "fbottom" });
      core.text(axes, core.num(a, ctx, true), { x: X(k) + S * 0.008, y: bottom + S * 0.008, face: "arvo", px: S * 0.019, fill: th.body, valign: "asc" });
    });
    const marks = g.append("g").attr("id", "marks");
    const order = rows.map((_, i) => i).sort((a, b) => (P.on(a) ? 1 : 0) - (P.on(b) ? 1 : 0));
    const endY = core.spread(rows.map((r) => scales[K - 1](r[cols[K - 1]])), lp * 1.15, top, bottom);
    let ib = null;
    order.forEach((i, o) => {
      const row = core.rowGroup(marks, i, o, P), pts = cols.map((c, k) => [X(k), scales[k](rows[i][c])]);
      row.append("path").attr("d", d3.line()(pts)).attr("fill", "none").attr("stroke", P.on(i) ? th.roles.main : mix(th.roles.muted, th.roles.neutral, 0.25))
        .attr("stroke-width", S * (P.on(i) ? 0.008 : 0.004)).attr("stroke-linejoin", "round").attr("stroke-opacity", P.on(i) ? 1 : 0.85);
      if (P.on(i)) {
        pts.forEach(([x, y]) => core.dot(row, x, y, S * 0.010, th.roles.main, th.ground, S * 0.003));
        const lb = core.text(row, rows[i].label || "", { x: px1 + S * 0.02, y: endY[i], face: "arvoBold", px: lp, fill: P.words(i), valign: "fmid" });
        ib = core.union(lb, ...pts.map(([x, y]) => [x - S * 0.01, y - S * 0.01, x + S * 0.01, y + S * 0.01]));
      } else core.text(row, rows[i].label || "", { x: px1 + S * 0.02, y: endY[i], face: "arvo", px: lp * 0.85, fill: th.body, valign: "fmid" });
    });
    return ib;
  },
};
