// Diverging stacked bar — FT Deviation. Answers on a scale (disagree to agree) stacked either side of
// the midpoint: the "series" run from the most negative to the most positive, coloured mauve through
// a warm grey to olive, a middle answer split across the line. Each row is shown as shares of its
// total, the share inside each part when it fits. The column version shares this drawing.
import * as core from "../core.js";
import { div, onFill } from "../theme.js";

export function diverging(g, rows, [x0, y0, x1, y1], ctx, { upright = false } = {}) {
  const { S, th, paint: P } = ctx, { names, cols } = core.seriesOf(rows, ctx), K = cols.length;
  const colours = cols.map((_, k) => div(th, K === 1 ? 0 : -1 + 2 * k / (K - 1)));
  const midK = K % 2 ? (K - 1) / 2 : -1;          // an odd scale has a middle answer
  const top0 = core.key(g, names, colours, x0, y0, x1, ctx) + S * 0.045;
  const n = rows.length, ip = S * 0.026, gap = Math.max(1.5, S * 0.003);
  const shares = rows.map((r) => { const t = cols.reduce((a, c) => a + Math.max(0, r[c] || 0), 0) || 1; return cols.map((c) => Math.max(0, r[c] || 0) / t); });
  const neg = shares.map((s) => s.reduce((a, v, k) => a + (k < (K - 1) / 2 ? v : k === midK ? v / 2 : 0), 0));
  const pos = shares.map((s, i) => 1 - neg[i]);
  const left = Math.max(...neg), right = Math.max(...pos);
  const marks = g.append("g").attr("id", "marks");
  let ib = null;
  if (!upright) {
    let lp = S * 0.025;
    const labW = Math.min(Math.max(...rows.map((r) => core.measure(r.label || "", "arvoBold", lp).w)), (x1 - x0) * 0.28);
    lp = Math.min(...rows.map((r) => core.shrinkTo(r.label || "", "arvoBold", lp, labW, S * 0.017)));
    const px0 = x0 + labW + S * 0.03, span = x1 - px0, zero = px0 + span * left / (left + right);
    const X = (u) => zero + span * u / (left + right);
    const rowH = Math.min((y1 - top0) / n, S * 0.11), start = top0 + ((y1 - top0) - rowH * n) / 2, t = rowH * 0.62;
    rows.forEach((r, i) => {
      const row = core.rowGroup(marks, i, i, P), yc = start + rowH * (i + 0.5);
      let u = -neg[i];
      shares[i].forEach((v, k) => {
        if (v <= 0) { return; }
        const a = X(u), b = X(u + v);
        row.append("rect").attr("x", a + gap / 2).attr("y", yc - t / 2).attr("width", Math.max(0, b - a - gap)).attr("height", t).attr("fill", colours[k]).attr("data-series", names[k]);
        const pct = `${Math.round(v * 100)}%`;
        if (b - a > core.measure(pct, "bebas", ip).w + S * 0.016) core.text(row, pct, { x: (a + b) / 2, y: yc, face: "bebas", px: ip, fill: onFill(colours[k]), align: "c", valign: "mid" });
        u += v;
      });
      const lb = core.text(row, r.label || "", { x: px0 - S * 0.03, y: yc, face: "arvoBold", px: lp, fill: P.on(i) ? th.ink : th.body, align: "r", valign: "fmid" });
      if (P.on(i)) ib = core.union(lb, [X(-neg[i]), yc - t / 2, X(pos[i]), yc + t / 2]);
    });
    g.append("line").attr("id", "midline").attr("x1", zero).attr("x2", zero).attr("y1", start - S * 0.012).attr("y2", start + rowH * n + S * 0.012).attr("stroke", th.strong).attr("stroke-width", S * 0.004);
  } else {
    const colW = (x1 - x0) / n, lp = core.fitWords(rows.map((r) => r.label), "arvoBold", Math.min(S * 0.024, colW * 0.18), colW * 0.92, S * 0.013);
    const labH = Math.max(...rows.map((r) => core.paraHeight(r.label || "", lp, colW * 0.92, 3)));
    const bottom = y1 - labH - S * 0.03, span = bottom - top0, zero = top0 + span * right / (left + right);
    const Y = (u) => zero - span * u / (left + right), w = Math.min(colW * 0.62, S * 0.12);
    rows.forEach((r, i) => {
      const row = core.rowGroup(marks, i, i, P), cx = x0 + colW * (i + 0.5);
      let u = -neg[i];
      shares[i].forEach((v, k) => {
        if (v <= 0) return;
        const a = Y(u + v), b = Y(u);
        row.append("rect").attr("x", cx - w / 2).attr("y", a + gap / 2).attr("width", w).attr("height", Math.max(0, b - a - gap)).attr("fill", colours[k]).attr("data-series", names[k]);
        const pct = `${Math.round(v * 100)}%`;
        if (b - a > ip * 1.3 && core.measure(pct, "bebas", ip).w < w - S * 0.01) core.text(row, pct, { x: cx, y: (a + b) / 2, face: "bebas", px: ip, fill: onFill(colours[k]), align: "c", valign: "mid" });
        u += v;
      });
      const [lb] = core.para(row, r.label || "", { x: cx, y: bottom + S * 0.03, px: lp, width: colW * 0.92, fill: P.on(i) ? th.ink : th.body, align: "c", bold: true, maxLines: 3 });
      if (P.on(i)) ib = [cx - colW * 0.46, Y(pos[i]), cx + colW * 0.46, lb];
    });
    g.append("line").attr("id", "midline").attr("x1", x0).attr("x2", x1).attr("y1", zero).attr("y2", zero).attr("stroke", th.strong).attr("stroke-width", S * 0.004);
  }
  return ib;
}

// the row leaning furthest to either side
export function leaning(rows, spec) {
  const { cols } = core.seriesOf(rows, spec), K = cols.length;
  const lean = rows.map((r) => {
    const t = cols.reduce((a, c) => a + Math.max(0, r[c] || 0), 0) || 1;
    return Math.abs(cols.reduce((a, c, k) => a + (Math.max(0, r[c] || 0) / t) * (K === 1 ? 0 : -1 + 2 * k / (K - 1)), 0));
  });
  return lean.indexOf(Math.max(...lean));
}

export default {
  id: "bar-diverging-stacked",
  name: "Diverging stacked bar",
  needs: (spec) => (spec && spec.series && spec.series.length
    ? ["label", ...spec.series] : ["label"]),
  // Two directions, each stacked: two or more measures.
  measures: 2,
  insight: leaning,
  ringOnHue: true,
  draw: (g, rows, box, ctx) => diverging(g, rows, box, ctx),
};
