// Beeswarm — FT's stacked dot plot (Distribution); the Storyteller's `outlier` mode. Every row a
// dot on one scale, packed into a swarm, the middle half shaded, the median dotted, and the odd one
// out named with its value in Depot, its name and its note.
import * as core from "../core.js";
import { mix } from "../theme.js";

export default {
  id: "beeswarm",
  name: "Beeswarm",
  needs: () => ["label", "value"],
  insight: "outlier",
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th, paint: P } = ctx, R = th.roles;
    const vals = rows.map((r) => r.value), m = core.median(vals), [q1, q3] = core.quartiles(vals);
    let lo = Math.min(...vals), hi = Math.max(...vals);
    const padv = (hi - lo) * 0.06 || 1;
    lo -= padv; hi += padv;
    const ix0 = x0 + S * 0.02, ix1 = x1 - S * 0.02;
    const X = (v) => ix0 + (ix1 - ix0) * (v - lo) / ((hi - lo) || 1);
    const n = rows.length, r0 = Math.max(S * 0.010, Math.min(S * 0.024, S * 0.024 * Math.sqrt(10 / n)));
    const cy = y0 + (y1 - y0) * 0.60, placed = [], pos = {};
    for (const i of rows.map((_, i) => i).sort((a, b) => vals[a] - vals[b])) {
      const rr = r0 * (P.on(i) ? 1.5 : 1) * P.grow(i), x = X(vals[i]);
      let y = cy;
      for (let k = 0; k < 60; k++) {
        y = cy + Math.floor((k + 1) / 2) * (2 * r0 + 3) * (k % 2 ? 1 : -1);
        if (placed.every(([px, py, pr]) => Math.hypot(x - px, y - py) >= rr + pr + 3)) break;
      }
      placed.push([x, y, rr]); pos[i] = [x, y, rr];
    }
    const ys = placed.map((p) => p[1]), top = Math.min(...ys) - r0 * 2.2, bot = Math.max(...ys) + r0 * 2.2;
    const band = g.append("g").attr("id", "band");
    band.append("rect").attr("x", X(q1)).attr("y", top).attr("width", X(q3) - X(q1)).attr("height", bot - top)
      .attr("rx", S * 0.02).attr("fill", mix(R.muted, th.ground, 0.45));
    core.dottedLine(band, [X(m), top - S * 0.02], [X(m), bot + S * 0.02], R.neutral, S);
    core.text(band, "middle half", { x: X(q1) + S * 0.012, y: top + S * 0.012, face: "arvo", px: S * 0.019, fill: R.neutral, valign: "asc" });
    const ay = bot + S * 0.05, axis = g.append("g").attr("id", "axis-x"), tp = S * 0.022;
    core.dottedLine(axis, [x0, ay], [x1, ay], th.strong, S);
    core.text(axis, core.num(Math.min(...vals), ctx), { x: x0, y: ay + S * 0.018, face: "arvo", px: tp, fill: th.body, valign: "asc" });
    core.text(axis, `median ${core.num(m, ctx)}`, { x: X(m), y: ay + S * 0.018, face: "arvo", px: tp, fill: th.body, align: "c", valign: "asc" });
    core.text(axis, core.num(Math.max(...vals), ctx), { x: x1, y: ay + S * 0.018, face: "arvo", px: tp, fill: th.body, align: "r", valign: "asc" });
    const marks = g.append("g").attr("id", "marks");
    Object.entries(pos).forEach(([i, [x, y, rr]]) => {
      i = +i;
      if (P.on(i)) return;
      core.dot(core.rowGroup(marks, i, vals[i], P), x, y, rr, P.mark(i), R.neutral, Math.max(2, S * 0.002));
    });
    if (P.ins === null || P.ins === undefined) return null;
    const [x, y, rr] = pos[P.ins], r = rows[P.ins], ins = core.rowGroup(g.append("g").attr("id", "insight"), P.ins, n, P);
    core.dot(ins, x, y, rr, P.how !== "enclosure" ? P.mark(P.ins) : R.main, th.ground, S * 0.004);
    const bw = S * 0.42, lx = Math.min(Math.max(x - bw / 2, x0), x1 - bw);
    const vb = core.stat(ins, core.num(r.value, ctx), { x: lx + bw / 2, y: y0 + S * 0.01, px: S * 0.064, fill: P.words(P.ins) });
    const [b1] = core.para(ins, r.label || "", { x: lx + bw / 2, y: vb[3] + S * 0.014 + S * 0.026 * 0.4, px: S * 0.026, width: bw, fill: th.ink, align: "c", bold: true, maxLines: 2 });
    const [b2] = core.para(ins, r.note || "", { x: lx + bw / 2, y: b1 + S * 0.010 + S * 0.023 * 0.4, px: S * 0.023, width: bw, fill: th.body, align: "c", maxLines: 2 });
    core.dottedLine(ins, [x, b2 + S * 0.02], [x, y - rr - S * 0.012], R.neutral, S);
    return core.union([lx, vb[1], lx + bw, b2], [x - rr, y - rr, x + rr, y + rr]);
  },
};
