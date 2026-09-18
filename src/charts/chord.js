// Chord — FT Flow. What passes between the members of one group, both ways: rows are flows,
// "source" to "target" with a "value" (a row each way for two-way flows; one row for a shared
// amount). Members sit round a circle as arcs sized by all they send and receive; ribbons join them
// as wide as the flow. The biggest flow (unless named by source) in olive, the rest in cream.
import * as core from "../core.js";
import { mix } from "../theme.js";

const d3 = globalThis.d3;
const src = (r) => r.source ?? r.label, dst = (r) => r.target ?? (Array.isArray(r.to) ? r.to[0] : r.to);

export default {
  id: "chord",
  name: "Chord",
  needs: () => ["value"],
  insight: (rows, spec) => {
    if (spec.insight) { const k = rows.findIndex((r) => src(r) === spec.insight); if (k >= 0) return k; }
    return rows.reduce((m, r, i) => (r.value > rows[m].value ? i : m), 0);
  },
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th, paint: P } = ctx;
    const names = [...new Set(rows.flatMap((r) => [src(r), dst(r)]))], n = names.length, ix = new Map(names.map((nm, i) => [nm, i]));
    const M = names.map(() => names.map(() => 0)), rowAt = new Map();
    rows.forEach((r, i) => { M[ix.get(src(r))][ix.get(dst(r))] += r.value; rowAt.set(`${ix.get(src(r))},${ix.get(dst(r))}`, i); });
    const lp = S * 0.023, labW = Math.max(...names.map((nm) => core.measure(String(nm), "arvoBold", lp).w));
    const R = Math.min((x1 - x0) / 2, (y1 - y0) / 2) - labW - S * 0.03, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const layout = d3.chord().padAngle(0.04).sortSubgroups(d3.descending)(M), rIn = R * 0.92;
    const plot = g.append("g").attr("transform", `translate(${cx},${cy})`);
    const hot = (c) => P.on(rowAt.get(`${c.source.index},${c.target.index}`)) || P.on(rowAt.get(`${c.target.index},${c.source.index}`));
    const ribbons = plot.append("g").attr("id", "marks");
    [...layout].sort((a, b) => (hot(a) ? 1 : 0) - (hot(b) ? 1 : 0)).forEach((c, o) => {
      ribbons.append("path").attr("data-order", o).attr("d", d3.ribbon().radius(rIn - S * 0.004)(c))
        .attr("fill", hot(c) ? th.roles.main : mix(th.roles.muted, th.ground, 0.1)).attr("fill-opacity", hot(c) ? 0.95 : 0.8)
        .attr("stroke", th.ground).attr("stroke-width", Math.max(1, S * 0.002));
    });
    const arcs = plot.append("g").attr("id", "groups");
    // names keep a letter's height apart round the circle, so small neighbours do not overprint
    const minGap = lp * 1.25 / (R + S * 0.02), angles = layout.groups.map((grp) => (grp.startAngle + grp.endAngle) / 2);
    const byAngle = angles.map((_, k) => k).sort((a, b) => angles[a] - angles[b]);
    for (let j = 1; j < byAngle.length; j++) angles[byAngle[j]] = Math.max(angles[byAngle[j]], angles[byAngle[j - 1]] + minGap);
    for (const grp of layout.groups) {
      arcs.append("path").attr("d", d3.arc().innerRadius(rIn).outerRadius(R)(grp)).attr("fill", th.strong);
      const a = angles[grp.index] - Math.PI / 2, rr = R + S * 0.02, left = Math.cos(a) < 0;
      const deg = a * 180 / Math.PI + (left ? 180 : 0);
      const tg = arcs.append("g").attr("transform", `translate(${rr * Math.cos(a)},${rr * Math.sin(a)}) rotate(${deg})`);
      core.text(tg, String(names[grp.index]), { x: 0, y: 0, face: "arvoBold", px: lp, fill: th.ink, align: left ? "r" : "l", valign: "fmid" });
    }
    return null;
  },
};
