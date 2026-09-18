// Violin — FT Distribution. The shape of each group's values: a mirrored density (a smoothed count)
// along one scale, the middle half as a bar inside it and the median as a dot, one violin per
// "group" (or one for the table). Where a box plot hides the shape, the violin shows it.
import * as core from "../core.js";
import { mix } from "../theme.js";
import { lines } from "./distribution-rows.js";

const d3 = globalThis.d3;

function density(values, lo, hi, steps = 60) {
  const n = values.length, sd = d3.deviation(values) || (hi - lo) / 10 || 1;
  const bw = 1.06 * sd * Math.pow(n, -0.2);                      // Silverman's rule of thumb
  const k = (u) => Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI);
  return d3.range(steps + 1).map((j) => { const x = lo + (hi - lo) * j / steps; return [x, d3.sum(values, (v) => k((x - v) / bw)) / (n * bw)]; });
}

export default {
  id: "violin",
  name: "Violin",
  needs: () => ["value"],
  insight: "outlier",
  draw(g, rows, box, ctx) {
    const { S, th, paint: P } = ctx;
    const all = rows.map((r) => r.value), span = (Math.max(...all) - Math.min(...all)) || 1;
    const groups = d3.groups(rows, (r) => r.group ?? "").map(([, rs]) => density(rs.map((r) => r.value), Math.min(...all) - span * 0.1, Math.max(...all) + span * 0.1));
    const peak = Math.max(...groups.flat().map((p) => p[1])) || 1;
    return lines(g, rows, box, ctx, (gg, rs, X, yc, rowH) => {
      const vals = rs.map((r) => r.value), lo = Math.min(...all) - span * 0.1, hi = Math.max(...all) + span * 0.1;
      const dens = density(vals, lo, hi), H = Math.min(rowH * 0.46, S * 0.08);
      const shape = d3.area().curve(d3.curveBasis).x((p) => X(p[0])).y0((p) => yc + H * p[1] / peak).y1((p) => yc - H * p[1] / peak)(dens);
      const hot = rs.some((r) => P.on(r._i));
      gg.append("path").attr("d", shape).attr("fill", hot && P.how === "hue" ? mix(th.roles.main, th.ground, 0.25) : mix(th.roles.muted, th.ground, 0.1)).attr("stroke", th.roles.neutral).attr("stroke-width", S * 0.002);
      const [q1, q3] = core.quartiles(vals), med = core.median(vals);
      gg.append("line").attr("x1", X(q1)).attr("x2", X(q3)).attr("y1", yc).attr("y2", yc).attr("stroke", th.strong).attr("stroke-width", S * 0.010).attr("stroke-linecap", "round");
      core.dot(gg, X(med), yc, S * 0.009, th.ground, th.strong, S * 0.003);
      const on = rs.find((r) => P.on(r._i));
      if (on) core.dot(core.rowGroup(gg, on._i, 0, P), X(on.value), yc, S * 0.012, th.roles.main, th.ground, S * 0.003);
      return S * 0.014;
    });
  },
};
