// Proportional squares — FT Magnitude. Each row a square whose area is its value, biggest first,
// standing on one line; the value inside when it fits, the name under. For values too far apart
// for bars. Seven at most.
import * as core from "../core.js";
import { onFill } from "../theme.js";
import { MAX_BARS } from "./bar-ordered.js";

export default {
  id: "proportional-squares",
  name: "Proportional squares",
  needs: () => ["label", "value"],
  insight: "max",
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th, paint: P } = ctx;
    const order = rows.map((_, i) => i).sort((a, b) => rows[b].value - rows[a].value).slice(0, MAX_BARS);
    if (rows.length > MAX_BARS) ctx.warn(`${rows.length} rows, drawing the top ${MAX_BARS}`);
    const vmax = rows[order[0]].value || 1, gap = S * 0.03;
    const unit = order.map((i) => Math.sqrt(Math.max(0, rows[i].value) / vmax));
    const labH = S * 0.11, minSlot = Math.min(S * 0.13, ((x1 - x0) - gap * (order.length - 1)) / order.length * 0.98);
    // a square's slot is its own width or a readable name's, whichever is wider
    const fits = (smax) => unit.reduce((a, u) => a + Math.max(u * smax, minSlot), 0) + gap * (order.length - 1) <= x1 - x0;
    let smax = (y1 - y0) - labH - S * 0.02;
    while (smax > S * 0.05 && !fits(smax)) smax -= 2;
    const slots = unit.map((u) => Math.max(u * smax, minSlot)), used = slots.reduce((a, b) => a + b, 0) + gap * (order.length - 1);
    const base = y0 + ((y1 - y0) - labH + smax) / 2;
    const marks = g.append("g").attr("id", "marks");
    let x = x0 + ((x1 - x0) - used) / 2, ib = null;
    order.forEach((i, k) => {
      const r = rows[i], s = unit[k] * smax, row = core.rowGroup(marks, i, k, P), fill = P.mark(i), slot = slots[k];
      x += (slot - s) / 2;
      row.append("rect").attr("x", x).attr("y", base - s).attr("width", s).attr("height", s).attr("rx", Math.min(S * 0.008, s * 0.1)).attr("fill", fill);
      const v = core.num(r.value, ctx), vp = Math.min(S * 0.06, s * 0.42);
      let vb = null;
      if (core.measure(v, "bebas", vp).w < s * 0.85 && vp > S * 0.022) vb = core.text(row, v, { x: x + s / 2, y: base - s / 2, face: "bebas", px: vp, fill: onFill(fill), align: "c", valign: "mid" });
      else vb = core.text(row, v, { x: x + s / 2, y: base - s - S * 0.01, face: "bebas", px: S * 0.03, fill: th.ink, align: "c", valign: "bottom" });
      const lw = slot + gap * 0.8;
      const [lb] = core.para(row, r.label || "", { x: x + s / 2, y: base + S * 0.02, px: core.fitWords([r.label], "arvoBold", S * 0.022, lw, S * 0.014), width: lw, fill: P.on(i) ? P.words(i) : th.body, align: "c", bold: true, maxLines: 3 });
      if (P.on(i)) ib = core.union([x, base - s, x + s, base], vb, [x + s / 2 - lw / 2, base, x + s / 2 + lw / 2, lb]);
      x += s + (slot - s) / 2 + gap;
    });
    return ib;
  },
};
