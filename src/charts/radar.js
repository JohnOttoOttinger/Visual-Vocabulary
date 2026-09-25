// Radar — FT Magnitude. Several measures around a circle, one shape per row: "series" names the
// measures (the spokes, all on one scale from the centre), each row is a shape in the fixed series
// order. Every shape is filled see-through so the ones behind show where they overlap (Otto, 19 Sep
// 2026: solid, the insight hid the rest); the insight's fill is the strongest and it is drawn on
// top. The outlines go over all the fills, so no shape loses its edge. Three rows at most; the
// spokes' order matters, so put related measures side by side.
import * as core from "../core.js";
import { mix } from "../theme.js";

const d3 = globalThis.d3;

export default {
  id: "radar",
  name: "Radar",
  needs: (spec) => (spec && spec.series && spec.series.length
    ? ["label", ...spec.series] : ["label"]),
  // Three or more measures round a circle, so "series" must name at least three.
  measures: 3,
  insight: "first",
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th, paint: P } = ctx, { names, cols } = core.seriesOf(rows, ctx), K = cols.length;
    if (K < 3) throw new Error("radar: give three or more measures in \"series\"");
    if (rows.length > 3) { ctx.warn(`${rows.length} rows; a radar reads three at most`); rows = rows.slice(0, 3); }
    const colours = rows.map((_, k) => th.series[[0, 2, 1][k]]);
    const keyBottom = core.key(g, rows.map((r) => r.label), colours, x0, y0, x1, ctx, { dot: true });
    const lp = S * 0.023, labW = Math.max(...names.map((nm) => core.measure(nm, "arvoBold", lp).w));
    const top = keyBottom + S * 0.04, R = Math.min((x1 - x0) / 2 - labW - S * 0.03, (y1 - top) / 2 - lp * 2);
    const cx = (x0 + x1) / 2, cy = top + (y1 - top) / 2;
    const vmax = Math.max(...rows.flatMap((r) => cols.map((c) => r[c]))), ticks = core.niceTicks(0, vmax, 4), top_ = ticks[ticks.length - 1] || 1;
    const ang = (k) => -Math.PI / 2 + 2 * Math.PI * k / K, pt = (k, v) => [cx + R * v / top_ * Math.cos(ang(k)), cy + R * v / top_ * Math.sin(ang(k))];
    const grid = g.append("g").attr("id", "grid"), faint = mix(th.roles.neutral, th.ground, 0.45);
    for (const t of ticks.slice(1)) {
      grid.append("path").attr("d", d3.line()(d3.range(K).map((k) => pt(k, t))) + "Z").attr("fill", "none").attr("stroke", faint).attr("stroke-width", S * 0.002);
      core.text(grid, core.num(t, ctx, true), { x: cx + S * 0.008, y: pt(0, t)[1], face: "arvo", px: S * 0.018, fill: th.body, valign: "fbottom" });
    }
    names.forEach((nm, k) => {
      const [ex, ey] = pt(k, top_), c = Math.cos(ang(k));
      core.dottedLine(grid, [cx, cy], [ex, ey], faint, S);
      core.text(grid, nm, { x: ex + c * S * 0.02, y: ey + Math.sin(ang(k)) * S * 0.02, face: "arvoBold", px: lp, fill: th.body, align: Math.abs(c) < 0.2 ? "c" : c > 0 ? "l" : "r", valign: Math.sin(ang(k)) < -0.5 ? "fbottom" : Math.sin(ang(k)) > 0.5 ? "asc" : "fmid" });
    });
    const marks = g.append("g").attr("id", "marks");
    const order = rows.map((_, i) => i).sort((a, b) => (P.on(a) ? 1 : 0) - (P.on(b) ? 1 : 0));
    let ib = null;
    const polys = rows.map((r) => cols.map((c, k) => pt(k, Math.max(0, r[c] || 0))));
    // fills first, every one see-through; then each shape's edge and points over them all
    const fills = marks.append("g").attr("class", "fills"), edges = marks.append("g").attr("class", "edges");
    order.forEach((i, o) => {
      core.rowGroup(fills, i, o, P).append("path").attr("d", d3.line()(polys[i]) + "Z").attr("fill", colours[i]).attr("fill-opacity", P.on(i) ? 0.38 : 0.2);
      const row = core.rowGroup(edges, i, o, P);
      row.append("path").attr("d", d3.line()(polys[i]) + "Z").attr("fill", "none")
        .attr("stroke", colours[i]).attr("stroke-width", S * (P.on(i) ? 0.006 : 0.0045)).attr("stroke-linejoin", "round");
      polys[i].forEach(([x, y]) => core.dot(row, x, y, S * 0.008, colours[i], th.ground, S * 0.002));
    });
    return ib;
  },
};
