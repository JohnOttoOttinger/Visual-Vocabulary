// Grouped bar — FT Magnitude. One group of bars per row, one bar per series in the fixed series
// order, the value at each bar's end, a key above naming the series (a key is always shown for two
// or more series). The insight is a row, ringed; every bar keeps its series colour, because the
// colours were validated as a set and fading some rows would undo that.
// Keep to two or three series; four is the most the series palette separates.
import * as core from "../core.js";

export default {
  id: "bar-grouped",
  name: "Grouped bar",
  needs: () => ["label"],
  // the row whose series sit furthest apart
  insight(rows, spec) {
    const { cols: s } = core.seriesOf(rows, spec);
    if (s.length < 2) return null;
    let best = null, gap = -1;
    rows.forEach((r, i) => {
      const v = s.map((n) => r[n]).filter(core.isNum);
      const d = v.length ? Math.max(...v) - Math.min(...v) : -1;
      if (d > gap) { gap = d; best = i; }
    });
    return best;
  },
  ringOnHue: true,
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th, paint: P } = ctx, { names, cols: keys } = core.seriesOf(rows, ctx);
    if (names.length > th.series.length) ctx.warn(`${names.length} series; the palette separates ${th.series.length}`);
    const cols = names.map((_, k) => th.series[k % th.series.length]);
    // the key
    const key = g.append("g").attr("id", "key"), kp = S * 0.024;
    let kx = x0;
    names.forEach((n, k) => {
      key.append("rect").attr("x", kx).attr("y", y0).attr("width", kp).attr("height", kp).attr("rx", kp * 0.2).attr("fill", cols[k]);
      core.text(key, n, { x: kx + kp + S * 0.014, y: y0 + kp / 2, face: "arvoBold", px: kp, fill: th.ink, valign: "mid" });
      kx += kp + S * 0.014 + core.measure(n, "arvoBold", kp).w + S * 0.045;
    });
    // names in a column on the left, so the bars can take the whole row's height
    const top = y0 + kp + S * 0.05, n = rows.length;
    const groupH = Math.min((y1 - top) / n, S * 0.05 + names.length * S * 0.05);
    const start = top + ((y1 - top) - groupH * n) / 2;
    let lp = S * 0.025;
    const labW = Math.min(Math.max(...rows.map((r) => core.measure(r.label || "", "arvoBold", lp).w)), (x1 - x0) * 0.32);
    lp = Math.min(...rows.map((r) => core.shrinkTo(r.label || "", "arvoBold", lp, labW, S * 0.018)));
    const vp = S * 0.032;
    const vals = rows.flatMap((r) => keys.map((c) => r[c])).filter(core.isNum);
    const vmax = Math.max(...vals) || 1;
    const valW = Math.max(...vals.map((v) => core.measure(core.num(v, ctx), "bebas", vp).w)) + S * 0.02;
    const bx0 = x0 + labW + S * 0.03, barmax = x1 - bx0 - valW;
    const marks = g.append("g").attr("id", "marks");
    let ib = null;
    rows.forEach((r, i) => {
      const row = core.rowGroup(marks, i, i, P), gt = start + groupH * i;
      const bandH = groupH * 0.78, bandTop = gt + (groupH - bandH) / 2;
      const t = bandH / names.length, gap = Math.max(2, S * 0.003);
      const lb = core.text(row, r.label || "", { x: bx0 - S * 0.02, y: gt + groupH / 2, face: "arvoBold", px: lp, fill: P.on(i) ? th.ink : th.body, align: "r", valign: "mid" });
      let right = bx0;
      names.forEach((nm, k) => {
        const v = r[keys[k]];
        if (!core.isNum(v)) return;
        const by = bandTop + t * k, ln = barmax * Math.max(0, v) / vmax;
        if (ln > 0) core.bar(row, bx0, by + gap / 2, bx0 + ln, by + t - gap / 2, P.how === "intensity" ? P.series(i, cols[k]) : cols[k], "right", S * 0.015).attr("data-series", nm);
        const vb = core.text(row, core.num(v, ctx), { x: bx0 + ln + S * 0.012, y: by + t / 2, face: "bebas", px: vp, fill: P.on(i) || P.ins === null ? th.ink : th.body, valign: "mid" });
        right = Math.max(right, vb[2]);
      });
      if (P.on(i)) ib = [lb[0] - S * 0.006, bandTop - S * 0.004, right + S * 0.006, bandTop + bandH + S * 0.004];
    });
    return ib;
  },
};
