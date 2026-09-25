// Sankey — FT Flow. Amounts moving from one set of things to the next: each row one flow, "source"
// to "target" with its "value" (or "label" to "to"). Nodes are dark bars named with their total,
// flows are bands as wide as their amount; the insight's flow in olive, the rest in cream.
// The insight is the biggest flow unless named by its source label.
import * as core from "../core.js";
import { mix } from "../theme.js";

const d3 = globalThis.d3;
const src = (r) => r.source ?? r.label, dst = (r) => r.target ?? (Array.isArray(r.to) ? r.to[0] : r.to);

export default {
  id: "sankey",
  name: "Sankey",
  needs: () => ["value"],
  insight: (rows, spec) => {
    if (spec.insight) { const k = rows.findIndex((r) => src(r) === spec.insight || dst(r) === spec.insight); if (k >= 0) return k; }
    return rows.reduce((m, r, i) => (r.value > rows[m].value ? i : m), 0);
  },
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th, paint: P } = ctx, R = th.roles, lp = S * 0.022;
    // Every row is a flow FROM somewhere TO somewhere. A table of bare values has neither, so
    // both ends resolved to undefined, every flow ran from one nameless node back to itself, and
    // d3-sankey said "circular link" - true, and no help at all (25 Sep 2026).
    const noEnds = rows.map((r, k) => (src(r) === undefined || dst(r) === undefined ? k + 1 : 0)).filter(Boolean);
    if (noEnds.length) {
      throw new Error(`sankey: row(s) ${noEnds.join(", ")} do not say where the flow goes`
        + ' — give each row "label" and "to", or "source" and "target"');
    }
    const loops = rows.map((r, k) => (src(r) === dst(r) ? k + 1 : 0)).filter(Boolean);
    if (loops.length) throw new Error(`sankey: row(s) ${loops.join(", ")} flow from a thing to itself`);
    const names = [...new Set(rows.flatMap((r) => [src(r), dst(r)]))];
    const graph = d3.sankey().nodeId((d) => d.name).nodeWidth(S * 0.022).nodePadding(S * 0.03)
      .nodeSort(null).extent([[x0, y0 + S * 0.01], [x1, y1 - S * 0.01]])({
        nodes: names.map((name) => ({ name })),
        links: rows.map((r, i) => ({ source: src(r), target: dst(r), value: r.value, i })),
      });
    // names to the right of each node, the last column's to the left, so nothing runs off the box
    const last = Math.max(...graph.nodes.map((nd) => nd.depth));
    const flows = g.append("g").attr("id", "marks"), link = d3.sankeyLinkHorizontal();
    const order = graph.links.map((l, k) => k).sort((a, b) => (P.on(graph.links[a].i) ? 1 : 0) - (P.on(graph.links[b].i) ? 1 : 0));
    order.forEach((k, o) => {
      const l = graph.links[k], row = core.rowGroup(flows, l.i, o, P);
      row.append("path").attr("d", link(l)).attr("fill", "none")
        .attr("stroke", P.on(l.i) ? (P.how === "intensity" ? th.ink : R.main) : mix(R.muted, th.ground, P.ins !== null && P.ins !== undefined ? 0.25 : 0))
        .attr("stroke-opacity", P.on(l.i) ? 0.95 : 0.85).attr("stroke-width", Math.max(1, l.width));
    });
    const nodes = g.append("g").attr("id", "nodes");
    let ib = null;
    for (const nd of graph.nodes) {
      nodes.append("rect").attr("x", nd.x0).attr("y", nd.y0).attr("width", nd.x1 - nd.x0).attr("height", Math.max(1, nd.y1 - nd.y0)).attr("fill", th.strong).attr("rx", S * 0.003);
      const right = nd.depth !== last, x = right ? nd.x1 + S * 0.012 : nd.x0 - S * 0.012, y = (nd.y0 + nd.y1) / 2;
      const hot = nd.sourceLinks.concat(nd.targetLinks).some((l) => P.on(l.i));
      const lb = core.text(nodes, String(nd.name), { x, y: y - lp * 0.1, face: "arvoBold", px: lp, fill: hot ? th.ink : th.body, align: right ? "l" : "r", valign: "fbottom", halo: [th.ground, S * 0.003] });
      core.text(nodes, core.num(nd.value, ctx), { x, y: y + lp * 0.05, face: "bebas", px: lp * 1.25, fill: th.ink, align: right ? "l" : "r", valign: "top", halo: [th.ground, S * 0.003] });
      void lb;
    }
    const hotLink = graph.links.find((l) => P.on(l.i));
    if (hotLink) ib = [hotLink.source.x1, Math.min(hotLink.y0, hotLink.y1) - hotLink.width / 2, hotLink.target.x0, Math.max(hotLink.y0, hotLink.y1) + hotLink.width / 2];
    return ib;
  },
};
