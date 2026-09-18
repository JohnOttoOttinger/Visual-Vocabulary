// Proportional stacked bar — FT Part-to-whole; a `proportions` sub-mode. With label and value: one
// thick bar split by share, biggest first, each part named under its own stretch with its share.
// With "series": one bar per row, each split by the series in the fixed order, a key above.
import * as core from "../core.js";
import { mix, onFill } from "../theme.js";

const d3 = globalThis.d3;

function one(g, rows, [x0, y0, x1, y1], ctx) {
  const { S, th, paint: P } = ctx;
  const total = d3.sum(rows, (r) => r.value) || 1;
  const order = rows.map((_, i) => i).sort((a, b) => rows[b].value - rows[a].value);
  const others = order.filter((i) => !P.on(i));
  const fill = (i) => (P.on(i) ? (P.how !== "enclosure" ? P.mark(i) : th.roles.main) : mix(th.ramp[0], th.ramp[1], others.indexOf(i) / Math.max(1, others.length - 1)));
  // the bar, then a key beneath it: swatch, name, value, share, one part a line
  const lrow = S * 0.075, keyH = order.length * lrow;
  const bh = Math.min(S * 0.20, (y1 - y0) - keyH - S * 0.10), gap = Math.max(2, S * 0.005);
  const by = y0 + ((y1 - y0) - (bh + S * 0.08 + keyH)) / 2;
  const marks = g.append("g").attr("id", "marks");
  let x = x0, ib = null;
  order.forEach((i, k) => {
    const w = (x1 - x0) * rows[i].value / total, row = core.rowGroup(marks, i, k, P);
    const first = k === 0, last = k === order.length - 1, rx = Math.min(S * 0.012, w / 2);
    // only the two outer ends of the whole bar are rounded
    const p = d3.path(), a = x + (first ? 0 : gap / 2), b = x + w - (last ? 0 : gap / 2);
    p.moveTo(a + (first ? rx : 0), by); p.lineTo(b - (last ? rx : 0), by);
    if (last) p.arcTo(b, by, b, by + rx, rx); p.lineTo(b, by + bh - (last ? rx : 0));
    if (last) p.arcTo(b, by + bh, b - rx, by + bh, rx); p.lineTo(a + (first ? rx : 0), by + bh);
    if (first) p.arcTo(a, by + bh, a, by + bh - rx, rx); p.lineTo(a, by + (first ? rx : 0));
    if (first) p.arcTo(a, by, a + rx, by, rx); p.closePath();
    row.append("path").attr("d", p.toString()).attr("fill", fill(i));
    const pct = `${Math.round(rows[i].value / total * 100)}%`, sp = Math.min(S * 0.07, bh * 0.45);
    if (b - a > core.measure(pct, "bebas", sp).w + S * 0.03)
      core.text(row, pct, { x: a + S * 0.018, y: by + bh / 2, face: "bebas", px: sp, fill: onFill(fill(i)), valign: "mid" });
    if (P.on(i)) ib = [a, by, b, by + bh];
    x += w;
  });
  const key = g.append("g").attr("id", "key"), ky = by + bh + S * 0.08, sw = S * 0.030;
  order.forEach((i, k) => {
    const y = ky + k * lrow, kg = key.append("g").attr("class", "key-row").attr("data-row", i);
    kg.append("rect").attr("x", x0).attr("y", y).attr("width", sw).attr("height", sw).attr("rx", sw * 0.15).attr("fill", fill(i));
    const pct = `${Math.round(rows[i].value / total * 100)}%`, on = P.on(i);
    core.text(kg, pct, { x: x1, y: y + sw / 2, face: "bebas", px: S * 0.044, fill: on ? P.words(i) : th.ink, align: "r", valign: "mid" });
    const vw = core.measure(core.num(rows[i].value, ctx), "bebas", S * 0.044).w;
    core.text(kg, core.num(rows[i].value, ctx), { x: x1 - S * 0.14, y: y + sw / 2, face: "bebas", px: S * 0.044, fill: th.body, align: "r", valign: "mid" });
    const room = x1 - S * 0.14 - vw - S * 0.04 - (x0 + sw + S * 0.02);
    const px = core.shrinkTo(rows[i].label || "", "arvoBold", S * 0.028, room, S * 0.018);
    const lb = core.text(kg, rows[i].label || "", { x: x0 + sw + S * 0.02, y: y + sw / 2, face: "arvoBold", px, fill: on ? P.words(i) : th.body, valign: "mid" });
    if (on) ib = core.union(ib, [x0, y - S * 0.008, x1, y + sw + S * 0.008]);
    if (k) core.dottedLine(kg, [x0, y - lrow * 0.30], [x1, y - lrow * 0.30], mix(th.roles.neutral, th.ground, 0.5), S);
    void lb;
  });
  return ib;
}

function several(g, rows, [x0, y0, x1, y1], ctx) {
  const { S, th, paint: P } = ctx, { names, cols } = core.seriesOf(rows, ctx);
  const colours = names.map((_, k) => th.series[k % th.series.length]);
  const key = g.append("g").attr("id", "key"), kp = S * 0.024;
  let kx = x0;
  names.forEach((n, k) => {
    key.append("rect").attr("x", kx).attr("y", y0).attr("width", kp).attr("height", kp).attr("rx", kp * 0.2).attr("fill", colours[k]);
    core.text(key, n, { x: kx + kp + S * 0.014, y: y0 + kp / 2, face: "arvoBold", px: kp, fill: th.ink, valign: "mid" });
    kx += kp + S * 0.014 + core.measure(n, "arvoBold", kp).w + S * 0.045;
  });
  const top = y0 + kp + S * 0.05, n = rows.length, rowH = Math.min((y1 - top) / n, S * 0.13);
  const lp = Math.min(S * 0.025, rowH * 0.3), gap = Math.max(2, S * 0.005), marks = g.append("g").attr("id", "marks");
  let ib = null;
  rows.forEach((r, i) => {
    const row = core.rowGroup(marks, i, i, P), ty = top + rowH * i;
    const lb = core.text(row, r.label || "", { x: x0, y: ty, face: "arvoBold", px: lp, fill: P.on(i) ? th.ink : th.body, valign: "asc" });
    const by = lb[3] + rowH * 0.08, bh = rowH * 0.5, tot = d3.sum(cols, (c) => Math.max(0, r[c] || 0)) || 1;
    let x = x0;
    cols.forEach((c, k) => {
      const w = (x1 - x0) * Math.max(0, r[c] || 0) / tot;
      if (w <= 0) return;
      row.append("rect").attr("x", x + (k ? gap / 2 : 0)).attr("y", by).attr("width", Math.max(0, w - gap)).attr("height", bh).attr("fill", colours[k]).attr("data-series", names[k]);
      const pct = `${Math.round(r[c] / tot * 100)}%`;
      if (w > core.measure(pct, "bebas", S * 0.032).w + S * 0.024)
        core.text(row, pct, { x: x + S * 0.012, y: by + bh / 2, face: "bebas", px: S * 0.032, fill: onFill(colours[k]), valign: "mid" });
      x += w;
    });
    if (P.on(i)) ib = [x0, ty, x1, by + bh];
  });
  return ib;
}

export default {
  id: "bar-stacked-proportional",
  name: "Proportional stacked bar",
  needs: (spec) => (spec.series ? ["label"] : ["label", "value"]),
  insight: "max",
  ringOnHue: false,
  draw: (g, rows, box, ctx) => (ctx.series ? several(g, rows, box, ctx) : one(g, rows, box, ctx)),
};
