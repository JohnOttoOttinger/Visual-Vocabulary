// Lollipop, vertical — FT Ranking. The ordered column made light: a stick up from the baseline to a
// dot, the value over the dot, the name under the stick. Ten at most.
import * as core from "../core.js";
import { mix } from "../theme.js";
import { MAX_LOLLIPOPS } from "./lollipop-h.js";

export default {
  id: "lollipop-v",
  name: "Lollipop, vertical",
  needs: () => ["label", "value"],
  insight: "max",
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th, paint: P } = ctx;
    const order = rows.map((_, i) => i).sort((a, b) => rows[b].value - rows[a].value).slice(0, MAX_LOLLIPOPS);
    if (rows.length > MAX_LOLLIPOPS) ctx.warn(`${rows.length} rows, drawing the top ${MAX_LOLLIPOPS}`);
    const n = order.length, colW = (x1 - x0) / n, vp = S * 0.036;
    const lp = core.fitWords(order.map((i) => rows[i].label), "arvoBold", Math.min(S * 0.024, colW * 0.2), colW * 0.94, S * 0.013);
    const labH = Math.max(...order.map((i) => core.paraHeight(rows[i].label || "", lp, colW * 0.94, 3)));
    const bottom = y1 - labH - S * 0.035, top = y0 + vp * 1.6 + S * 0.03;
    const vmax = Math.max(...order.map((i) => rows[i].value)) || 1;
    const Y = (v) => bottom - (bottom - top) * Math.max(0, v) / vmax;
    core.dottedLine(g.append("g").attr("id", "axis"), [x0, bottom], [x1, bottom], mix(th.roles.neutral, th.ground, 0.3), S);
    const stick = mix(th.roles.neutral, th.ground, 0.35), marks = g.append("g").attr("id", "marks");
    let ib = null;
    order.forEach((i, k) => {
      const r = rows[i], row = core.rowGroup(marks, i, k, P), cx = x0 + colW * (k + 0.5), y = Y(r.value), rad = S * 0.022 * P.grow(i);
      row.append("line").attr("x1", cx).attr("x2", cx).attr("y1", bottom).attr("y2", y)
        .attr("stroke", P.on(i) ? P.mark(i) : stick).attr("stroke-width", S * 0.007).attr("stroke-linecap", "round");
      core.dot(row, cx, y, rad, P.mark(i), th.ground, S * 0.004);
      const vb = core.text(row, core.num(r.value, ctx), { x: cx, y: y - rad - S * 0.014, face: "bebas", px: vp, fill: P.words(i), align: "c", valign: "bottom" });
      const [lb] = core.para(row, r.label || "", { x: cx, y: bottom + S * 0.035, px: lp, width: colW * 0.94, fill: P.on(i) ? P.words(i) : th.body, align: "c", bold: true, maxLines: 3 });
      if (P.on(i)) ib = core.union(vb, [cx - rad, y - rad, cx + rad, bottom], [cx - colW * 0.47, bottom, cx + colW * 0.47, lb]);
    });
    return ib;
  },
};
