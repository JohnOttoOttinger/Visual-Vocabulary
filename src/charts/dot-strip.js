// Dot strip — FT Ranking and Distribution. Every row a dot on one scale, one strip per "group" (or
// one strip for the table), so ranks and spreads compare across groups; the odd one out named.
import * as core from "../core.js";
import { mix } from "../theme.js";
import { lines } from "./distribution-rows.js";

export default {
  id: "dot-strip",
  name: "Dot strip",
  needs: () => ["value"],
  insight: "outlier",
  draw(g, rows, box, ctx) {
    const { S, th, paint: P } = ctx;
    return lines(g, rows, box, ctx, (gg, rs, X, yc, rowH) => {
      gg.append("line").attr("x1", X(Math.min(...rs.map((r) => r.value)))).attr("x2", X(Math.max(...rs.map((r) => r.value)))).attr("y1", yc).attr("y2", yc)
        .attr("stroke", mix(th.roles.neutral, th.ground, 0.3)).attr("stroke-width", S * 0.004).attr("stroke-linecap", "round");
      const r0 = Math.min(S * 0.016, rowH * 0.2);
      for (const r of [...rs].sort((a, b) => (P.on(a._i) ? 1 : 0) - (P.on(b._i) ? 1 : 0)))
        core.dot(core.rowGroup(gg, r._i, r._i, P), X(r.value), yc, r0 * (P.on(r._i) ? 1.4 : 1), P.on(r._i) ? P.mark(r._i) : mix(th.roles.muted, th.ground, 0.05), P.on(r._i) ? th.ground : th.roles.neutral, Math.max(1.5, S * 0.002));
      return r0 * 1.4;
    });
  },
};
