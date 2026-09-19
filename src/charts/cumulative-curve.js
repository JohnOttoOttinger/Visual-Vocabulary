// Cumulative curve — FT Distribution. How unequal a set of numbers is: every row's value sorted
// along the bottom, the share of rows at or below it rising up the side as a step line, with the
// halfway mark dotted in and named ("half are at or under ..."). The insight row, when named, is
// marked on the curve.
import * as core from "../core.js";
import { mix } from "../theme.js";

const d3 = globalThis.d3;

export default {
  id: "cumulative-curve",
  name: "Cumulative curve",
  needs: () => ["value"],
  insight: "none",
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th, paint: P } = ctx, n = rows.length;
    const sorted = rows.map((r, i) => ({ v: r.value, i })).sort((a, b) => a.v - b.v);
    const [lo, hi, xt] = core.spanOf(sorted.map((d) => d.v)), yt = [0, 25, 50, 75, 100];
    const px0 = x0 + core.measure("100%", "arvo", S * 0.022).w + S * 0.03, px1 = x1 - S * 0.02, py0 = y0 + S * 0.05, py1 = y1 - S * 0.09;
    const X = (v) => px0 + (px1 - px0) * (v - lo) / ((hi - lo) || 1), Y = (p) => py1 - (py1 - py0) * p / 100;
    const grid = g.append("g").attr("id", "grid"), faint = mix(th.roles.neutral, th.ground, 0.45);
    for (const t of yt) { core.dottedLine(grid, [px0, Y(t)], [px1, Y(t)], faint, S); core.text(grid, `${t}%`, { x: px0 - S * 0.02, y: Y(t), face: "arvo", px: S * 0.022, fill: th.body, align: "r", valign: "mid" }); }
    for (const t of xt) core.text(grid, core.num(t, ctx, true), { x: X(t), y: py1 + S * 0.02, face: "arvo", px: S * 0.022, fill: th.body, align: "c", valign: "asc" });
    core.axisNames(grid, [ctx.axes?.[0]], ctx, { x0, px0, px1, py0, py1, below: py1 + S * 0.065 });
    const pts = [[X(lo), Y(0)]];
    sorted.forEach((d, k) => { pts.push([X(d.v), Y(k / n * 100)]); pts.push([X(d.v), Y((k + 1) / n * 100)]); });
    pts.push([px1, Y(100)]);
    const marks = g.append("g").attr("id", "marks");
    marks.append("path").attr("d", d3.area().x((p) => p[0]).y0(py1).y1((p) => p[1])(pts)).attr("fill", mix(th.roles.muted, th.ground, 0.35));
    marks.append("path").attr("d", d3.line()(pts)).attr("fill", "none").attr("stroke", th.strong).attr("stroke-width", S * 0.005).attr("stroke-linejoin", "round");
    // the halfway mark
    const med = core.median(sorted.map((d) => d.v)), ins = g.append("g").attr("id", "insight");
    core.dottedLine(ins, [px0, Y(50)], [X(med), Y(50)], th.roles.main, S, S * 0.006);
    core.dottedLine(ins, [X(med), Y(50)], [X(med), py1], th.roles.main, S, S * 0.006);
    core.dot(ins, X(med), Y(50), S * 0.014, th.roles.main, th.ground, S * 0.004);
    const tb = core.text(ins, `Half are at or under ${core.num(med, ctx)}`, { x: X(med) + S * 0.022, y: Y(50) + S * 0.01, face: "arvoBold", px: S * 0.026, fill: th.ink, valign: "top", halo: [th.ground, S * 0.004] });
    if (P.ins !== null && P.ins !== undefined) {
      const k = sorted.findIndex((d) => d.i === P.ins), x = X(sorted[k].v), y = Y((k + 1) / n * 100);
      core.dot(ins, x, y, S * 0.012, th.ink, th.ground, S * 0.003);
      core.text(ins, String(rows[P.ins].label ?? ""), { x: x - S * 0.016, y, face: "arvoBold", px: S * 0.022, fill: th.ink, align: "r", valign: "fmid", halo: [th.ground, S * 0.004] });
    }
    return tb;
  },
};
