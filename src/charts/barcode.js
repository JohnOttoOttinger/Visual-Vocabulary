// Barcode — FT Distribution. Every row a thin tick on one scale, one strip per "group", so where
// the values crowd and where they thin out shows at a glance; the insight tick in olive and named.
import * as core from "../core.js";
import { mix } from "../theme.js";
import { lines } from "./distribution-rows.js";

export default {
  id: "barcode",
  name: "Barcode",
  needs: () => ["value"],
  insight: "none",
  draw(g, rows, box, ctx) {
    const { S, th, paint: P } = ctx;
    const w = Math.max(1, S * (rows.length > 400 ? 0.0015 : 0.003));
    return lines(g, rows, box, ctx, (gg, rs, X, yc, rowH) => {
      const h = Math.min(rowH * 0.62, S * 0.10);
      for (const r of rs)
        gg.append("line").attr("data-row", r._i).attr("x1", X(r.value)).attr("x2", X(r.value)).attr("y1", yc - h / 2).attr("y2", yc + h / 2)
          .attr("stroke", P.on(r._i) ? th.roles.main : th.strong).attr("stroke-width", P.on(r._i) ? w * 3 : w).attr("stroke-opacity", P.on(r._i) ? 1 : Math.max(0.18, Math.min(0.85, 30 / rs.length)));
      return h / 2;
    }, { insightTop: P.ins !== null && P.ins !== undefined });
  },
};
