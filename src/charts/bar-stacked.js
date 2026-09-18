// Stacked bar — FT Part-to-whole. One bar per row, its series stacked end to end in the fixed series
// order, the total at the end, each part's value inside when it fits, a key above. The insight (the
// biggest total unless named) is ringed. Ten rows at most; the column version shares this drawing.
import * as core from "../core.js";
import { onFill } from "../theme.js";

export const MAX_STACKED = 10;

export function stacked(g, rows, [x0, y0, x1, y1], ctx, { upright = false } = {}) {
  const { S, th, paint: P } = ctx, { names, cols } = core.seriesOf(rows, ctx);
  if (names.length > th.series.length) ctx.warn(`${names.length} series; the palette separates ${th.series.length}`);
  if (rows.length > MAX_STACKED) { ctx.warn(`${rows.length} rows, drawing ${MAX_STACKED}`); rows = rows.slice(0, MAX_STACKED); }
  const colours = names.map((_, k) => th.series[k % th.series.length]);
  const top0 = core.key(g, names, colours, x0, y0, x1, ctx) + S * 0.045;
  const tot = rows.map((r) => cols.reduce((a, c) => a + Math.max(0, r[c] || 0), 0)), vmax = Math.max(...tot) || 1;
  const n = rows.length, tp = S * 0.036, ip = S * 0.028, gap = Math.max(2, S * 0.004);
  const marks = g.append("g").attr("id", "marks");
  let ib = null;
  if (!upright) {
    let lp = S * 0.025;
    const labW = Math.min(Math.max(...rows.map((r) => core.measure(r.label || "", "arvoBold", lp).w)), (x1 - x0) * 0.28);
    lp = Math.min(...rows.map((r) => core.shrinkTo(r.label || "", "arvoBold", lp, labW, S * 0.017)));
    const totW = Math.max(...tot.map((t) => core.measure(core.num(t, ctx), "bebas", tp).w)) + S * 0.02;
    const px0 = x0 + labW + S * 0.03, span = x1 - totW - px0;
    const rowH = Math.min((y1 - top0) / n, S * 0.12), start = top0 + ((y1 - top0) - rowH * n) / 2, t = rowH * 0.6;
    rows.forEach((r, i) => {
      const row = core.rowGroup(marks, i, i, P), yc = start + rowH * (i + 0.5);
      let x = px0;
      cols.forEach((c, k) => {
        const w = span * Math.max(0, r[c] || 0) / vmax;
        if (w <= 0) return;
        const last = cols.slice(k + 1).every((cc) => !(r[cc] > 0));
        core.bar(row, x, yc - t / 2, x + w - (last ? 0 : gap), yc + t / 2, colours[k], last ? "right" : "none", S * 0.012).attr("data-series", names[k]);
        const v = core.num(r[c], ctx);
        if (w > core.measure(v, "bebas", ip).w + S * 0.024) core.text(row, v, { x: x + S * 0.012, y: yc, face: "bebas", px: ip, fill: onFill(colours[k]), valign: "mid" });
        x += w;
      });
      const vb = core.text(row, core.num(tot[i], ctx), { x: x + S * 0.012, y: yc, face: "bebas", px: tp, fill: th.ink, valign: "mid" });
      const lb = core.text(row, r.label || "", { x: px0 - S * 0.03, y: yc, face: "arvoBold", px: lp, fill: P.on(i) ? th.ink : th.body, align: "r", valign: "fmid" });
      if (P.on(i)) ib = core.union(lb, vb, [px0, yc - t / 2, x, yc + t / 2]);
    });
  } else {
    const colW = (x1 - x0) / n, lp = core.fitWords(rows.map((r) => r.label), "arvoBold", Math.min(S * 0.024, colW * 0.18), colW * 0.92, S * 0.013);
    const labH = Math.max(...rows.map((r) => core.paraHeight(r.label || "", lp, colW * 0.92, 3)));
    const bottom = y1 - labH - S * 0.03, top = top0 + tp * 1.3, H = bottom - top, w = Math.min(colW * 0.62, S * 0.12);
    g.append("line").attr("id", "axis").attr("x1", x0).attr("x2", x1).attr("y1", bottom).attr("y2", bottom).attr("stroke", th.strong).attr("stroke-width", S * 0.003);
    rows.forEach((r, i) => {
      const row = core.rowGroup(marks, i, i, P), cx = x0 + colW * (i + 0.5);
      let y = bottom;
      cols.forEach((c, k) => {
        const h = H * Math.max(0, r[c] || 0) / vmax;
        if (h <= 0) return;
        const last = cols.slice(k + 1).every((cc) => !(r[cc] > 0));
        core.bar(row, cx - w / 2, y - h + (last ? 0 : gap), cx + w / 2, y, colours[k], last ? "top" : "none", S * 0.012).attr("data-series", names[k]);
        const v = core.num(r[c], ctx);
        if (h > ip * 1.4 && core.measure(v, "bebas", ip).w < w - S * 0.01) core.text(row, v, { x: cx, y: y - h / 2, face: "bebas", px: ip, fill: onFill(colours[k]), align: "c", valign: "mid" });
        y -= h;
      });
      const vb = core.text(row, core.num(tot[i], ctx), { x: cx, y: y - S * 0.012, face: "bebas", px: tp, fill: th.ink, align: "c", valign: "bottom" });
      const [lb] = core.para(row, r.label || "", { x: cx, y: bottom + S * 0.03, px: lp, width: colW * 0.92, fill: P.on(i) ? th.ink : th.body, align: "c", bold: true, maxLines: 3 });
      if (P.on(i)) ib = core.union(vb, [cx - colW * 0.46, y, cx + colW * 0.46, lb]);
    });
  }
  return ib;
}

export function biggest(rows, spec) {
  const { cols } = core.seriesOf(rows, spec);
  const t = rows.map((r) => cols.reduce((a, c) => a + Math.max(0, r[c] || 0), 0));
  return t.indexOf(Math.max(...t));
}

export default {
  id: "bar-stacked",
  name: "Stacked bar",
  needs: () => ["label"],
  insight: biggest,
  ringOnHue: true,
  draw: (g, rows, box, ctx) => stacked(g, rows, box, ctx),
};
