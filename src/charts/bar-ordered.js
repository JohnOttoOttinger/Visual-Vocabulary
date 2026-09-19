// Ordered bar — FT Ranking; the Storyteller's `ranking` mode. Biggest first, each bar under its
// name, the value at its end in Bebas, every rank in a circle-number in Depot: the insight's olive,
// the rest in their bar's colour (Otto, 19 Sep 2026). Seven bars at most (Otto, 18 Sep 2026:
// chunkier bars mean fewer of them).
import * as core from "../core.js";
import { onFill } from "../theme.js";

export const MAX_BARS = 7;

// sorted: biggest first, with the rank beside each bar; unsorted: the table's order, no ranks
export function bars(g, rows, [x0, y0, x1, y1], ctx, { sorted = true } = {}) {
    const { S, th, paint: P } = ctx;
    const order = rows.map((_, i) => i).sort((a, b) => (sorted ? rows[b].value - rows[a].value : a - b)).slice(0, MAX_BARS);
    if (rows.length > MAX_BARS) ctx.warn(`${rows.length} rows, drawing the ${sorted ? "top" : "first"} ${MAX_BARS}`);
    const vmax = Math.max(...rows.map((r) => r.value)) || 1;
    const vp = S * 0.044, numw = sorted ? S * 0.075 : 0, bx0 = x0 + numw;
    const valw = Math.max(...rows.map((r) => core.measure(core.num(r.value, ctx), "bebas", vp).w)) + S * 0.022;
    const barmax = x1 - bx0 - valw;
    const rowH = Math.min((y1 - y0) / order.length, S * 0.14);
    const lp = Math.min(S * 0.027, rowH * 0.28);      // seven rows in a square: the names give way
    const start = y0 + ((y1 - y0) - rowH * order.length) / 2;
    const marks = g.append("g").attr("id", "marks");
    let ib = null;
    order.forEach((i, k) => {
      const r = rows[i], top = start + k * rowH, row = core.rowGroup(marks, i, k, P);
      const lb = core.text(row, r.label, { x: bx0, y: top, face: "arvoBold", px: lp, fill: P.on(i) ? P.words(i) : th.body, valign: "asc" });
      const t = rowH * 0.46 * Math.min(P.grow(i), 1.2);
      const by = lb[3] + rowH * 0.08;
      const ln = Math.max(S * 0.012, barmax * r.value / vmax);
      core.bar(row, bx0, by, bx0 + ln, by + t, P.mark(i), "right");
      const cy = by + t / 2;
      const vb = core.text(row, core.num(r.value, ctx), { x: bx0 + ln + S * 0.016, y: cy, face: "bebas", px: vp, fill: P.words(i), valign: "mid" });
      const nx = x0 + numw / 2 - S * 0.012;
      if (!sorted) { if (P.on(i)) ib = core.union([bx0, top, bx0 + ln, by + t], vb); return; }
      const dia = Math.min(S * 0.058, rowH * 0.62);
      const bb = P.on(i) ? core.badge(row, nx, cy, dia, String(k + 1), th)
        : core.badge(row, nx, cy, dia, String(k + 1), th, "depot", { fill: P.mark(i), ink: onFill(P.mark(i)) });
      if (P.on(i)) ib = core.union([bx0, top, bx0 + ln, by + t], vb, bb);
    });
    return ib;
}

export default {
  id: "bar-ordered",
  name: "Ordered bar",
  needs: () => ["label", "value"],
  insight: "max",
  draw: (g, rows, box, ctx) => bars(g, rows, box, ctx),
};
