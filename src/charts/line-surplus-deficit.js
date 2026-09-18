// Surplus and deficit line — FT Deviation. Two lines over time (value and value2, named by "axes")
// with the gap between them shaded: olive where the first is ahead, mauve where it falls behind.
// With one line, the gap is to a baseline (options.baseline, default 0). Each line named at its end.
import * as core from "../core.js";
import { mix, div } from "../theme.js";

const d3 = globalThis.d3;

export default {
  id: "line-surplus-deficit",
  name: "Surplus and deficit line",
  needs: () => ["value"],
  insight: "none",
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th } = ctx, n = rows.length, two = rows.some((r) => core.isNum(r.value2));
    const base = ctx.options.baseline ?? 0, other = (r) => (two ? r.value2 : base);
    const names = ctx.axes || (two ? ["A", "B"] : ["", ""]), lp = S * 0.026;
    const [lo, hi, ticks] = core.spanOf(rows.flatMap((r) => [r.value, other(r)]));
    const right = two ? Math.max(...names.map((nm) => core.measure(nm, "arvoBold", lp).w)) + S * 0.03 : S * 0.01;
    const px0 = x0 + core.tickWidth(ticks, ctx) + S * 0.03, px1 = x1 - right, py0 = y0 + S * 0.04, py1 = y1 - S * 0.07;
    const X = (i) => px0 + (px1 - px0) * i / Math.max(1, n - 1), Y = (v) => py1 - (py1 - py0) * (v - lo) / ((hi - lo) || 1);
    core.yGrid(g, ticks, Y, px0, px1, ctx);
    core.axisLabels(g.append("g").attr("id", "axis-x"), rows.map((r) => r.label), X, py1 + S * 0.03, ctx);
    // the gap, shaded by which side is ahead: clip the band to above or below the second line
    const marks = g.append("g").attr("id", "marks"), id = `vv-sd-${Math.round(px0)}-${Math.round(py0)}`;
    const aLine = rows.map((r, i) => [X(i), Y(r.value)]), bLine = rows.map((r, i) => [X(i), Y(other(r))]);
    const band = d3.area().x((p) => p[0]).y0((_, i) => bLine[i][1]).y1((p) => p[1])(aLine);
    const above = d3.area().x((p) => p[0]).y0(py0 - S).y1((p) => p[1])(bLine), below = d3.area().x((p) => p[0]).y0(py1 + S).y1((p) => p[1])(bLine);
    marks.append("clipPath").attr("id", `${id}-up`).append("path").attr("d", above);
    marks.append("clipPath").attr("id", `${id}-dn`).append("path").attr("d", below);
    marks.append("path").attr("d", band).attr("fill", mix(div(th, 0.85), th.ground, 0.25)).attr("clip-path", `url(#${id}-up)`).attr("class", "surplus");
    marks.append("path").attr("d", band).attr("fill", mix(div(th, -0.85), th.ground, 0.25)).attr("clip-path", `url(#${id}-dn)`).attr("class", "deficit");
    marks.append("path").attr("d", d3.line()(bLine)).attr("fill", "none").attr("stroke", two ? th.roles.neutral : th.strong).attr("stroke-width", S * (two ? 0.004 : 0.003)).attr("stroke-dasharray", two ? null : `${S * 0.01} ${S * 0.008}`);
    marks.append("path").attr("d", d3.line()(aLine)).attr("fill", "none").attr("stroke", th.strong).attr("stroke-width", S * 0.006).attr("stroke-linejoin", "round");
    if (two) {
      const ends = [[names[0], aLine[n - 1][1], th.ink], [names[1], bLine[n - 1][1], th.body]].sort((a, b) => a[1] - b[1]);
      if (ends[1][1] - ends[0][1] < lp * 1.3) ends[1][1] = ends[0][1] + lp * 1.3;
      for (const [nm, y, fill] of ends) core.text(g, nm, { x: px1 + S * 0.02, y, face: "arvoBold", px: lp, fill, valign: "fmid" });
    }
    return null;
  },
};
