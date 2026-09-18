// Proportional symbols — FT Magnitude. Each row a circle whose area is its value, in the table's
// order, standing on one line; the value inside when it fits, the name under. The ordered version
// (biggest first) shares this drawing. For values too far apart for bars. Ten at most.
import * as core from "../core.js";
import { onFill } from "../theme.js";

const d3 = globalThis.d3;

export const MAX_SYMBOLS = 10;

export function symbols(g, rows, [x0, y0, x1, y1], ctx, { sorted = false } = {}) {
  const { S, th, paint: P } = ctx;
  const order = rows.map((_, i) => i).sort((a, b) => (sorted ? rows[b].value - rows[a].value : a - b)).slice(0, MAX_SYMBOLS);
  if (rows.length > MAX_SYMBOLS) ctx.warn(`${rows.length} rows, drawing ${MAX_SYMBOLS}`);
  const vmax = Math.max(...order.map((i) => rows[i].value)) || 1, gap = S * 0.03, labH = S * 0.11;
  const unit = order.map((i) => Math.sqrt(Math.max(0, rows[i].value) / vmax));
  // one row, or two when that lets the circles grow: the biggest diameter at which every slot (a
  // circle, or a readable name) fits across its row and the rows fit down the box
  const layout = (nRows) => {
    const per = Math.ceil(order.length / nRows), lines = d3.range(nRows).map((k) => d3.range(k * per, Math.min(order.length, (k + 1) * per)));
    const minSlot = Math.min(S * 0.13, ((x1 - x0) - gap * (per - 1)) / per * 0.98);
    const fits = (d) => lines.every((ks) => d3.sum(ks, (k) => Math.max(unit[k] * d, minSlot)) + gap * (ks.length - 1) <= x1 - x0);
    let d = Math.min(((y1 - y0) - nRows * labH - (nRows - 1) * gap) / d3.sum(lines, (ks) => unit[ks[0]]), x1 - x0);
    while (d > S * 0.05 && !fits(d)) d -= 2;
    return { d, lines, minSlot };
  };
  const one = layout(1), two = order.length > 3 ? layout(2) : { d: 0 };
  const { d: dmax, lines, minSlot } = two.d > one.d * 1.15 ? two : one;
  const marks = g.append("g").attr("id", "marks");
  const rowH = lines.map((ks) => unit[ks[0]] * dmax + labH), total = d3.sum(rowH) + gap * (lines.length - 1);
  let base0 = y0 + ((y1 - y0) - total) / 2, ib = null;
  lines.forEach((ks, L) => {
    const base = base0 + unit[ks[0]] * dmax;
    const slots = ks.map((k) => Math.max(unit[k] * dmax, minSlot)), used = d3.sum(slots) + gap * (ks.length - 1);
    let x = x0 + ((x1 - x0) - used) / 2;
    ks.forEach((k, j) => {
      const i = order[k], r = rows[i], d = unit[k] * dmax, slot = slots[j], cx = x + slot / 2, cy = base - d / 2, row = core.rowGroup(marks, i, k, P), fill = P.mark(i);
      core.dot(row, cx, cy, d / 2, fill);
      const v = core.num(r.value, ctx), vp = Math.min(S * 0.06, d * 0.36);
      const vb = core.measure(v, "bebas", vp).w < d * 0.8 && vp > S * 0.022
        ? core.text(row, v, { x: cx, y: cy, face: "bebas", px: vp, fill: onFill(fill), align: "c", valign: "mid" })
        : core.text(row, v, { x: cx, y: base - d - S * 0.01, face: "bebas", px: S * 0.03, fill: th.ink, align: "c", valign: "bottom" });
      const lw = slot + gap * 0.8;
      const [lb] = core.para(row, r.label || "", { x: cx, y: base + S * 0.02, px: core.fitWords([r.label], "arvoBold", S * 0.022, lw, S * 0.014), width: lw, fill: P.on(i) ? P.words(i) : th.body, align: "c", bold: true, maxLines: 3 });
      if (P.on(i)) ib = core.union([cx - d / 2, base - d, cx + d / 2, base], vb, [cx - lw / 2, base, cx + lw / 2, lb]);
      x += slot + gap;
    });
    base0 += rowH[L] + gap;
  });
  return ib;
}

export default {
  id: "proportional-symbol",
  name: "Proportional symbols",
  needs: () => ["label", "value"],
  insight: "max",
  draw: (g, rows, box, ctx) => symbols(g, rows, box, ctx),
};
