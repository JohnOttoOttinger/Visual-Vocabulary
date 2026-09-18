// Venn — FT Part-to-whole (FT: generally schematic). Two or three sets and what they share: rows
// name the sets in "sets" (["A"], ["A", "B"], ...) with each region's count as "value" — a region
// counts only what is in exactly those sets. The circles are sized by each set's total; every
// region carries its count, the sets their names. The insight is the region shared by all.
import * as core from "../core.js";
import { mix } from "../theme.js";

const d3 = globalThis.d3;
const keyOf = (sets) => [...sets].sort().join(" & ");

export default {
  id: "venn",
  name: "Venn",
  needs: () => ["sets", "value"],
  insight: (rows) => rows.reduce((m, r, i) => ((r.sets || []).length > (rows[m].sets || []).length ? i : m), 0),
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th, paint: P } = ctx;
    const names = [...new Set(rows.flatMap((r) => r.sets || []))].slice(0, 3), n = names.length;
    if (n < 2) throw new Error("venn: name at least two sets");
    const region = new Map(rows.map((r, i) => [keyOf(r.sets), { v: r.value, i }]));
    const total = (s) => d3.sum(rows.filter((r) => (r.sets || []).includes(s)), (r) => r.value);
    const cx = (x0 + x1) / 2, cy = y0 + (y1 - y0) * (n === 3 ? 0.52 : 0.5), span = Math.min(x1 - x0, (y1 - y0) * (n === 3 ? 1 : 1.3));
    const tmax = Math.max(...names.map(total)) || 1;
    const rBase = span * (n === 3 ? 0.27 : 0.30), rad = names.map((s) => rBase * (0.75 + 0.25 * Math.sqrt(total(s) / tmax)));
    // fixed, symmetric places: two side by side, three in a triangle
    const d = rBase * (n === 3 ? 0.95 : 1.05);
    const at = n === 2 ? [[cx - d / 2, cy], [cx + d / 2, cy]]
      : [[cx - d / 2, cy - d * 0.29], [cx + d / 2, cy - d * 0.29], [cx, cy + d * 0.58]];
    const colours = names.map((_, k) => th.series[[0, 2, 1][k]]);
    const marks = g.append("g").attr("id", "marks");
    names.forEach((s, k) => marks.append("circle").attr("class", "set").attr("data-set", s).attr("cx", at[k][0]).attr("cy", at[k][1]).attr("r", rad[k])
      .attr("fill", colours[k]).attr("fill-opacity", th.dark ? 0.32 : 0.30).attr("stroke", colours[k]).attr("stroke-width", S * 0.004));
    // where each region's count goes: away from the others for one set, between them for shared ones
    const centre = [d3.mean(at, (p) => p[0]), d3.mean(at, (p) => p[1])];
    const spot = (ks) => {
      if (ks.length === 1) { const k = ks[0], dx = at[k][0] - centre[0], dy = at[k][1] - centre[1], L = Math.hypot(dx, dy) || 1; return [at[k][0] + dx / L * rad[k] * 0.45, at[k][1] + dy / L * rad[k] * 0.45]; }
      if (ks.length === n) return centre;
      const m = [d3.mean(ks, (k) => at[k][0]), d3.mean(ks, (k) => at[k][1])];
      if (n === 3) { const dx = m[0] - centre[0], dy = m[1] - centre[1], L = Math.hypot(dx, dy) || 1; return [m[0] + dx / L * rBase * 0.28, m[1] + dy / L * rBase * 0.28]; }
      return m;
    };
    let ib = null;
    const subsets = n === 2 ? [[0], [1], [0, 1]] : [[0], [1], [2], [0, 1], [0, 2], [1, 2], [0, 1, 2]];
    for (const ks of subsets) {
      const hit = region.get(keyOf(ks.map((k) => names[k])));
      if (!hit) continue;
      const [x, y] = spot(ks), on = P.on(hit.i);
      const vb = core.stat(marks, core.num(hit.v, ctx), { x, y, px: S * (on ? 0.060 : 0.044), fill: on ? P.words(hit.i) : th.ink, valign: "mid" });
      if (on) ib = [vb[0] - S * 0.02, vb[1] - S * 0.02, vb[2] + S * 0.02, vb[3] + S * 0.02];
    }
    // set names outside their circles
    names.forEach((s, k) => {
      const dx = at[k][0] - centre[0], dy = at[k][1] - centre[1], L = Math.hypot(dx, dy) || 1;
      const x = at[k][0] + dx / L * (rad[k] + S * 0.03), y = at[k][1] + dy / L * (rad[k] + S * 0.03);
      core.text(g, `${s} · ${core.num(total(s), ctx)}`, { x: Math.min(Math.max(x, x0 + S * 0.15), x1 - S * 0.15), y, face: "arvoBold", px: S * 0.026, fill: th.ink, align: "c", valign: dy > 0 ? "asc" : "fbottom" });
    });
    return ib;
  },
  ringOnHue: false,
};
