// Sunburst — FT Part-to-whole. A whole split twice: the inner ring by each row's "parent", the
// outer ring by the rows themselves, each arc's angle its share. The insight's parent and its rows
// in olive, the rest in the ground's ramp; the total in the middle in Depot. FT's note stands: use
// sparingly; a treemap or stacked bar usually reads better.
import * as core from "../core.js";
import { mix, onFill } from "../theme.js";

const d3 = globalThis.d3;

export default {
  id: "sunburst",
  name: "Sunburst",
  needs: () => ["label", "parent", "value"],
  insight: (rows) => {
    const tot = d3.rollup(rows, (v) => d3.sum(v, (r) => r.value), (r) => r.parent);
    const top = [...tot].sort((a, b) => b[1] - a[1])[0]?.[0];
    return rows.findIndex((r) => r.parent === top);
  },
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th, paint: P } = ctx;
    const hotParent = P.ins !== null && P.ins !== undefined ? rows[P.ins].parent : null;
    const tree = { name: "", children: d3.groups(rows.map((r, i) => ({ ...r, _i: i })), (r) => r.parent).map(([p, kids]) => ({ name: p, children: kids })) };
    const root = d3.hierarchy(tree).sum((d) => (d.children ? 0 : Math.max(0, d.value || 0))).sort((a, b) => b.value - a.value);
    const R = Math.min(x1 - x0, y1 - y0) / 2 - S * 0.01, cx = (x0 + x1) / 2, cy = y0 + (y1 - y0) / 2;
    d3.partition().size([2 * Math.PI, 3])(root);
    const ring = [[R * 0.30, R * 0.62], [R * 0.64, R]];
    const parents = root.children || [], rank = [...parents].sort((a, b) => b.value - a.value).filter((p) => p.data.name !== hotParent);
    const tone = (p, depth) => {
      if (p.data.name === hotParent) return depth === 1 ? th.roles.main : mix(th.roles.main, th.ground, 0.35);
      const t = rank.indexOf(p) / Math.max(1, rank.length - 1), base = mix(th.ramp[0], th.ramp[1], t);
      return depth === 1 ? base : mix(base, th.ground, 0.3);
    };
    const marks = g.append("g").attr("id", "marks").attr("transform", `translate(${cx},${cy})`), gap = Math.max(1, S * 0.003);
    const label = (node, [ri, ro], fill) => {
      const a = (node.x0 + node.x1) / 2 - Math.PI / 2, rr = (ri + ro) / 2, arcLen = (node.x1 - node.x0) * rr;
      const txt = String(node.data.name ?? node.data.label ?? ""), px = S * 0.020;
      if (arcLen < core.measure(txt, "arvoBold", px).w * 0.6 && (node.x1 - node.x0) < 0.25) return;
      if (core.measure(txt, "arvoBold", px).w > ro - ri - S * 0.01 && arcLen < S * 0.12) return;
      core.text(marks, txt, { x: rr * Math.cos(a), y: rr * Math.sin(a), face: "arvoBold", px, fill: onFill(fill), align: "c", valign: "fmid" });
    };
    for (const p of parents) {
      const f = tone(p, 1);
      marks.append("path").attr("class", "parent").attr("d", d3.arc().innerRadius(ring[0][0]).outerRadius(ring[0][1]).startAngle(p.x0).endAngle(p.x1).padAngle(gap / R)()).attr("fill", f);
      label(p, ring[0], f);
      for (const c of p.children || []) {
        const fc = tone(p, 2);
        marks.append("path").attr("data-row", c.data._i).attr("d", d3.arc().innerRadius(ring[1][0]).outerRadius(ring[1][1]).startAngle(c.x0).endAngle(c.x1).padAngle(gap / R)()).attr("fill", fc);
        label({ ...c, data: { name: c.data.label } }, ring[1], fc);
      }
    }
    core.stat(g, core.num(root.value, ctx), { x: cx, y: cy, px: Math.min(S * 0.07, R * 0.2), fill: th.ink, valign: "mid" });
    return null;
  },
};
