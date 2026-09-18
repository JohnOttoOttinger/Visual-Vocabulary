// Butterfly — the Storyteller's `comparison` mode (its default sub-mode). A against B: names down
// the middle, A's bars to the left in olive, B's to the right in blue, the values at the outer ends.
// Olive and blue are too close to sit side by side, which is fine here: the side tells them apart.
// `axes` names the two sides.
import * as core from "../core.js";
import { mix } from "../theme.js";
import { MAX_BARS } from "./bar-ordered.js";

export default {
  id: "butterfly",
  name: "Butterfly",
  needs: () => ["label", "value", "value2"],
  insight: "change",
  ringOnHue: true,
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th } = ctx, R = th.roles;
    let P = ctx.paint;
    const heads = (ctx.axes || ["A", "B"]).slice(0, 2);
    const A = R.main, B = R.versus, mid = (x0 + x1) / 2, lw = (x1 - x0) * 0.34;
    const gp = S * 0.014, hp = S * 0.044, vp = S * 0.036;
    if (rows.length > MAX_BARS) {
      const keep = rows.map((_, i) => i).sort((a, b) => (P.on(a) ? 0 : 1) - (P.on(b) ? 0 : 1) || a - b).slice(0, MAX_BARS).sort((a, b) => a - b);
      ctx.warn(`${rows.length} rows, drawing ${MAX_BARS}`);
      P = new core.Paint(P.how, keep.indexOf(P.ins) >= 0 ? keep.indexOf(P.ins) : null, th);
      rows = keep.map((i) => rows[i]);
    }
    const vmax = Math.max(...rows.map((r) => Math.max(r.value, r.value2))) || 1;
    const valw = Math.max(...rows.flatMap((r) => [r.value, r.value2].map((v) => core.measure(core.num(v, ctx), "bebas", vp).w))) + S * 0.018;
    const maxlen = (mid - lw / 2 - gp) - (x0 + valw);
    const hd = g.append("g").attr("id", "heads");
    const ha = core.text(hd, heads[0].toUpperCase(), { x: mid - lw / 2 - gp, y: y0, face: "bebas", px: hp, fill: mix(A, th.ink, 0.25), align: "r" });
    core.text(hd, heads[1].toUpperCase(), { x: mid + lw / 2 + gp, y: y0, face: "bebas", px: hp, fill: mix(B, th.ink, 0.25) });
    const top = ha[3] + S * 0.04, rowH = Math.min((y1 - top) / rows.length, S * 0.12);
    const start = top + ((y1 - top) - rowH * rows.length) / 2;
    const lpx = Math.min(...rows.map((r) => core.shrinkTo(r.label || "", "arvoBold", S * 0.025, lw - S * 0.01, S * 0.020)));
    const marks = g.append("g").attr("id", "marks");
    let ib = null;
    rows.forEach((r, i) => {
      const row = core.rowGroup(marks, i, i, P), yc = start + rowH * (i + 0.5);
      const t = rowH * 0.60 * Math.min(P.grow(i), 1.2);
      const lh = core.paraHeight(r.label || "", lpx, lw, 2);
      core.para(row, r.label || "", { x: mid, y: yc - lh / 2, px: lpx, width: lw, fill: P.on(i) ? P.words(i) : th.body, align: "c", bold: true, maxLines: 2 });
      const la = maxlen * r.value / vmax, lb = maxlen * r.value2 / vmax;
      const ra = mid - lw / 2 - gp, rb = mid + lw / 2 + gp;
      core.bar(row, ra - la, yc - t / 2, ra, yc + t / 2, P.series(i, A), "left");
      core.bar(row, rb, yc - t / 2, rb + lb, yc + t / 2, P.series(i, B), "right");
      const vc = P.on(i) || P.ins === null || P.ins === undefined ? th.ink : th.body;
      const va = core.text(row, core.num(r.value, ctx), { x: ra - la - S * 0.014, y: yc, face: "bebas", px: vp, fill: vc, align: "r", valign: "mid" });
      const vb = core.text(row, core.num(r.value2, ctx), { x: rb + lb + S * 0.014, y: yc, face: "bebas", px: vp, fill: vc, valign: "mid" });
      if (P.on(i)) ib = [va[0], yc - rowH / 2 + S * 0.004, vb[2], yc + rowH / 2 - S * 0.004];
    });
    return ib;
  },
};
