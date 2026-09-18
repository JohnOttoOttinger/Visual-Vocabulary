// Ordered column — FT Ranking. The ordered bar stood upright: biggest on the left, the value over
// each column in Bebas, the name under it in Arvo Bold, only the top end rounded. Seven at most,
// as with every bar chart in this system. Negative values hang below a dotted zero line.
import * as core from "../core.js";
import { mix } from "../theme.js";
import { MAX_BARS } from "./bar-ordered.js";

// sorted: biggest on the left; unsorted: the table's order
export function columns(g, rows, [x0, y0, x1, y1], ctx, { sorted = true } = {}) {
    const { S, th, paint: P } = ctx;
    const order = rows.map((_, i) => i).sort((a, b) => (sorted ? rows[b].value - rows[a].value : a - b)).slice(0, MAX_BARS);
    if (rows.length > MAX_BARS) ctx.warn(`${rows.length} rows, drawing the ${sorted ? "top" : "first"} ${MAX_BARS}`);
    const n = order.length, vp = S * 0.044, colW = (x1 - x0) / n;
    const lp = core.fitWords(order.map((i) => rows[i].label), "arvoBold", Math.min(S * 0.025, colW * 0.16), colW * 0.92, S * 0.013);
    const labH = Math.max(...order.map((i) => core.paraHeight(rows[i].label || "", lp, colW * 0.92, 3)));
    const vals = order.map((i) => rows[i].value);
    const lo = Math.min(0, ...vals), hi = Math.max(0, ...vals);
    const top = y0 + vp * 1.4, bottom = y1 - labH - S * 0.03 - (lo < 0 ? vp * 1.4 : 0);
    const Y = (v) => bottom - (bottom - top) * (v - lo) / ((hi - lo) || 1);
    const zero = Y(0), t = colW * 0.62;
    core.dottedLine(g.append("g").attr("id", "axis"), [x0, zero], [x1, zero], mix(th.roles.neutral, th.ground, 0.3), S);
    const marks = g.append("g").attr("id", "marks");
    let ib = null;
    order.forEach((i, k) => {
      const r = rows[i], row = core.rowGroup(marks, i, k, P), cx = x0 + colW * (k + 0.5);
      const w = t * Math.min(P.grow(i), 1.2), yv = Y(r.value), up = r.value >= 0;
      const [ya, yb] = up ? [Math.min(yv, zero - S * 0.012), zero] : [zero, Math.max(yv, zero + S * 0.012)];
      core.bar(row, cx - w / 2, ya, cx + w / 2, yb, P.mark(i), up ? "top" : "bottom", S * 0.015);
      const vb = core.text(row, core.num(r.value, ctx), { x: cx, y: up ? ya - S * 0.014 : yb + S * 0.014, face: "bebas", px: vp, fill: P.words(i), align: "c", valign: up ? "bottom" : "top" });
      const [lb] = core.para(row, r.label || "", { x: cx, y: bottom + S * 0.03 + (lo < 0 ? vp * 1.4 : 0), px: lp, width: colW * 0.92, fill: P.on(i) ? P.words(i) : th.body, align: "c", bold: true, maxLines: 3 });
      if (P.on(i)) ib = core.union([cx - w / 2, ya, cx + w / 2, yb], vb, [cx - colW * 0.46, bottom, cx + colW * 0.46, lb]);
    });
    return ib;
}

export default {
  id: "column-ordered",
  name: "Ordered column",
  needs: () => ["label", "value"],
  insight: "max",
  draw: (g, rows, box, ctx) => columns(g, rows, box, ctx),
};
