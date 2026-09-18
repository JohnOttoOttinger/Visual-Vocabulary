// Treemap — FT Part-to-whole; a `proportions` sub-mode. One whole as rectangles sized by share,
// biggest top-left, the insight in olive, the rest stepping through the ground's ramp by size.
// Each tile carries its name and share when they fit. Rows may name a "parent" to nest them.
import * as core from "../core.js";
import { mix, onFill } from "../theme.js";

const d3 = globalThis.d3;

export default {
  id: "treemap",
  name: "Treemap",
  needs: () => ["label", "value"],
  insight: "max",
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th, paint: P } = ctx;
    const total = d3.sum(rows, (r) => r.value) || 1;
    const nested = rows.some((r) => r.parent);
    const tree = { name: "", children: [] };
    if (nested) {
      const groups = d3.group(rows.map((r, i) => ({ ...r, _i: i })), (r) => r.parent || "");
      for (const [p, kids] of groups) tree.children.push({ name: p, children: kids });
    } else tree.children = rows.map((r, i) => ({ ...r, _i: i }));
    const root = d3.hierarchy(tree).sum((d) => (d.children ? 0 : Math.max(0, d.value || 0))).sort((a, b) => b.value - a.value);
    const gap = Math.max(2, S * 0.006);
    d3.treemap().tile(d3.treemapSquarify.ratio(1.2)).size([x1 - x0, y1 - y0]).paddingInner(gap).paddingOuter(0)
      .paddingTop(nested ? S * 0.04 : 0).round(false)(root);
    const leaves = root.leaves(), rank = [...leaves].sort((a, b) => b.value - a.value).filter((l) => !P.on(l.data._i));
    const fill = (l) => (P.on(l.data._i) ? (P.how !== "enclosure" ? P.mark(l.data._i) : th.roles.main)
      : mix(th.ramp[0], th.ramp[1], rank.indexOf(l) / Math.max(1, rank.length - 1)));
    const marks = g.append("g").attr("id", "marks").attr("transform", `translate(${x0},${y0})`);
    if (nested) for (const p of root.children || [])
      core.text(marks, (p.data.name || "").toUpperCase(), { x: p.x0, y: p.y0 + S * 0.004, face: "bebas", px: S * 0.030, fill: th.roles.neutral });
    let ib = null;
    leaves.forEach((l, k) => {
      const i = l.data._i, row = core.rowGroup(marks, i, k, P), w = l.x1 - l.x0, h = l.y1 - l.y0;
      row.append("rect").attr("x", l.x0).attr("y", l.y0).attr("width", w).attr("height", h).attr("rx", S * 0.004).attr("fill", fill(l));
      const ink = onFill(fill(l)), pad = S * 0.016;
      const pct = `${Math.round(l.value / total * 100)}%`, big = Math.min(S * 0.07, h * 0.42, w * 0.5);
      if (w > S * 0.09 && h > S * 0.075) {
        const sb = core.text(row, pct, { x: l.x0 + pad, y: l.y0 + pad, face: "bebas", px: Math.max(S * 0.03, big), fill: ink });
        const lp = core.shrinkTo(l.data.label || "", "arvoBold", S * 0.022, w - 2 * pad, S * 0.016);
        if (sb[3] + lp * 1.6 < l.y1) core.text(row, l.data.label || "", { x: l.x0 + pad, y: sb[3] + S * 0.012, face: "arvoBold", px: lp, fill: ink, valign: "asc" });
      }
      if (P.on(i)) ib = [x0 + l.x0, y0 + l.y0, x0 + l.x1, y0 + l.y1];
    });
    return ib;
  },
};
