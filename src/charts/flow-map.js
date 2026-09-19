// Flow map — FT Spatial. Movement between places: each row "from" and "to" (cities, or give
// "from_lat" / "from_lon" / "to_lat" / "to_lon") and a "value", drawn as a curved band as thick as
// the value with an arrowhead at the destination. The Storyteller's table works too: "label" is
// where it starts and "to" (a name, or a list whose first name is used) where it ends. The biggest flow (unless one is named by its
// "to") in olive with its value; every end named once.
import * as core from "../core.js";
import * as geo from "../geo.js";
import { mix } from "../theme.js";

const d3 = globalThis.d3;

export default {
  id: "flow-map",
  name: "Flow map",
  needs: () => ["to", "value"],
  insight: (rows, spec) => {
    if (spec.insight) { const k = rows.findIndex((r) => r.to === spec.insight); if (k >= 0) return k; }
    return rows.reduce((m, r, i) => (r.value > rows[m].value ? i : m), 0);
  },
  draw(g, rows, box, ctx) {
    const { S, th, paint: P } = ctx, focus = ctx.options.focus || "world";
    const base = geo.basemap(g, focus, box, ctx, { terrain: ctx.options.terrain ?? true });
    const vmax = Math.max(...rows.map((r) => r.value)) || 1, W = (v) => S * (0.003 + 0.016 * v / vmax);
    // the Storyteller's table: "label" to "to"
    rows = rows.map((r) => ({ ...r, from: r.from ?? r.label, to: Array.isArray(r.to) ? r.to[0] : r.to }));
    const end = (r, k) => base.proj(core.isNum(r[`${k}_lon`]) ? [r[`${k}_lon`], r[`${k}_lat`]] : geo.place({ label: r[k], country: r[`${k}_country`] ?? r.country }));
    const marks = g.append("g").attr("id", "marks"), ends = new Map();
    let ib = null;
    rows.map((r, i) => ({ r, i })).sort((a, b) => (P.on(a.i) ? 1 : 0) - (P.on(b.i) ? 1 : 0)).forEach(({ r, i }, o) => {
      const a = end(r, "from"), b = end(r, "to"), row = core.rowGroup(marks, i, o, P);
      const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, bend = 0.22;
      const c = [(a[0] + b[0]) / 2 - dy * bend, (a[1] + b[1]) / 2 + dx * bend];
      // stop short of the destination by the arrowhead's length, and point the head along the curve
      const w = W(r.value), head = Math.max(S * 0.018, w * 2.4), t = 1 - head / (L * 1.05);
      const q = (tt) => [(1 - tt) ** 2 * a[0] + 2 * (1 - tt) * tt * c[0] + tt * tt * b[0], (1 - tt) ** 2 * a[1] + 2 * (1 - tt) * tt * c[1] + tt * tt * b[1]];
      const stop = q(t), ang = Math.atan2(b[1] - stop[1], b[0] - stop[0]), col = P.on(i) ? th.roles.main : mix(th.strong, th.ground, 0.25);
      const p = d3.path(); p.moveTo(...a); p.quadraticCurveTo(c[0] * t + a[0] * (1 - t), c[1] * t + a[1] * (1 - t), ...stop);
      row.append("path").attr("d", p.toString()).attr("fill", "none").attr("stroke", col).attr("stroke-width", w).attr("stroke-linecap", "round");
      const hw = Math.max(w * 1.3, S * 0.01);
      row.append("path").attr("fill", col).attr("d", `M${b[0]},${b[1]}L${stop[0] - Math.sin(ang) * hw},${stop[1] + Math.cos(ang) * hw}L${stop[0] + Math.sin(ang) * hw},${stop[1] - Math.cos(ang) * hw}Z`);
      ends.set(r.from, a); ends.set(r.to, b);
      if (P.on(i)) {
        const m = q(0.5), vb = core.text(row, core.num(r.value, ctx), { x: m[0], y: m[1] - w - S * 0.01, face: "bebas", px: S * 0.040, fill: th.ink, align: "c", valign: "bottom", halo: [th.ground, S * 0.004] });
        ib = core.union(vb, [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])]);
      }
    });
    for (const xy of ends.values()) geo.marker(marks, xy, ctx);
    geo.labelPoints(g.append("g").attr("id", "labels"), [...ends].map(([name, xy]) => ({ xy, text: name, face: "arvoBold", px: S * 0.021 })), box, ctx);
    return ib;
  },
};
