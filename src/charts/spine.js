// Spine — FT Deviation. Each row split into two contrasting parts that meet at a spine: A's share
// to the left in olive, B's to the right in blue, each share written at its end. Olive and blue sit
// apart here, so position tells them apart. `axes` names the two parts.
import * as core from "../core.js";
import { mix } from "../theme.js";

export default {
  id: "spine",
  name: "Spine",
  needs: () => ["label", "value", "value2"],
  // the row most out of balance
  insight: (rows) => rows.reduce((m, r, i) => {
    const d = (x) => Math.abs(x.value / ((x.value + x.value2) || 1) - 0.5);
    return d(r) > d(rows[m]) ? i : m;
  }, 0),
  ringOnHue: true,
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th, paint: P } = ctx, R = th.roles, heads = (ctx.axes || ["A", "B"]).slice(0, 2);
    const n = rows.length, vp = S * 0.034;
    let lp = S * 0.025;
    const labW = Math.min(Math.max(...rows.map((r) => core.measure(r.label || "", "arvoBold", lp).w)), (x1 - x0) * 0.28);
    lp = Math.min(...rows.map((r) => core.shrinkTo(r.label || "", "arvoBold", lp, labW, S * 0.017)));
    const pw = core.measure("100%", "bebas", vp).w + S * 0.016;
    const px0 = x0 + labW + S * 0.03 + pw, px1 = x1 - pw, spine = (px0 + px1) / 2, half = (px1 - px0) / 2;
    const hp = S * 0.040, hd = g.append("g").attr("id", "heads");
    const ha = core.text(hd, heads[0].toUpperCase(), { x: spine - S * 0.02, y: y0, face: "bebas", px: hp, fill: mix(R.main, th.ink, 0.25), align: "r" });
    core.text(hd, heads[1].toUpperCase(), { x: spine + S * 0.02, y: y0, face: "bebas", px: hp, fill: mix(R.versus, th.ink, 0.25) });
    const top = ha[3] + S * 0.035, rowH = Math.min((y1 - top) / n, S * 0.10), start = top + ((y1 - top) - rowH * n) / 2, t = rowH * 0.58;
    g.append("line").attr("id", "spine").attr("x1", spine).attr("x2", spine).attr("y1", top - S * 0.01).attr("y2", start + rowH * n)
      .attr("stroke", th.strong).attr("stroke-width", S * 0.004);
    const marks = g.append("g").attr("id", "marks");
    let ib = null;
    rows.forEach((r, i) => {
      const row = core.rowGroup(marks, i, i, P), yc = start + rowH * (i + 0.5), tot = (r.value + r.value2) || 1;
      const a = r.value / tot, b = r.value2 / tot, gap = Math.max(1, S * 0.002);
      core.bar(row, spine - half * a, yc - t / 2, spine - gap, yc + t / 2, P.series(i, R.main), "left", S * 0.012);
      core.bar(row, spine + gap, yc - t / 2, spine + half * b, yc + t / 2, P.series(i, R.versus), "right", S * 0.012);
      const fill = P.on(i) || P.ins === null || P.ins === undefined ? th.ink : th.body;
      const va = core.text(row, `${Math.round(a * 100)}%`, { x: spine - half * a - S * 0.012, y: yc, face: "bebas", px: vp, fill, align: "r", valign: "mid" });
      const vb = core.text(row, `${Math.round(b * 100)}%`, { x: spine + half * b + S * 0.012, y: yc, face: "bebas", px: vp, fill, valign: "mid" });
      const lb = core.text(row, r.label || "", { x: x0, y: yc, face: "arvoBold", px: lp, fill: P.on(i) ? th.ink : th.body, valign: "fmid" });
      if (P.on(i)) ib = core.union(lb, va, vb);
    });
    return ib;
  },
};
