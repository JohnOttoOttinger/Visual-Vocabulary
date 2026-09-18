// Slope — FT Ranking and Change over time; the drawing the Storyteller parked as `cause-effect`
// (Otto, 18 Sep 2026: too small and technical as the Storyteller drew it). Drawn big here: seven
// lines at most, before on the left and after on the right, each end labelled, the change written
// in the positive or negative colour, the insight's line in olive. `axes` names the two columns
// (default BEFORE and AFTER); `options.cause` writes the action between them.
import * as core from "../core.js";
import { mix } from "../theme.js";
import { MAX_BARS } from "./bar-ordered.js";

export default {
  id: "slope",
  name: "Slope",
  needs: () => ["label", "value", "value2"],
  insight: "change",
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th } = ctx, R = th.roles;
    let P = ctx.paint;
    if (rows.length > MAX_BARS) {
      const keep = rows.map((_, i) => i).sort((a, b) => (P.on(a) ? 0 : 1) - (P.on(b) ? 0 : 1) || Math.abs(rows[b].value2 - rows[b].value) - Math.abs(rows[a].value2 - rows[a].value)).slice(0, MAX_BARS).sort((a, b) => a - b);
      ctx.warn(`${rows.length} rows, drawing the ${MAX_BARS} that change most`);
      P = new core.Paint(P.how, keep.indexOf(P.ins) >= 0 ? keep.indexOf(P.ins) : null, th);
      rows = keep.map((i) => rows[i]);
    }
    const heads = (ctx.axes || ["BEFORE", "AFTER"]).slice(0, 2), W = x1 - x0;
    const vp = S * 0.044, lp0 = S * 0.026, cp = S * 0.026;
    const ax = x0 + W * 0.40, bx = x1 - W * 0.30, hp = S * 0.044;
    const hd = g.append("g").attr("id", "heads");
    const ha = core.text(hd, heads[0].toUpperCase(), { x: ax, y: y0, face: "bebas", px: hp, fill: th.ink, align: "c" });
    const hb = core.text(hd, heads[1].toUpperCase(), { x: bx, y: y0, face: "bebas", px: hp, fill: th.ink, align: "c" });
    const my = (ha[1] + ha[3]) / 2;
    core.dottedLine(hd, [ha[2] + S * 0.03, my], [hb[0] - S * 0.05, my], th.strong, S);
    hd.append("path").attr("fill", th.strong).attr("d", `M${hb[0] - S * 0.05},${my - S * 0.013}L${hb[0] - S * 0.05},${my + S * 0.013}L${hb[0] - S * 0.026},${my}Z`);
    let top = ha[3] + S * 0.03;
    if (ctx.options.cause) {
      [top] = core.para(hd, ctx.options.cause, { x: (ax + bx) / 2, y: top + S * 0.022, px: S * 0.024, width: bx - ax, fill: th.body, align: "c", maxLines: 2 });
      top += S * 0.02;
    }
    const py0 = top + S * 0.05, py1 = y1 - S * 0.03;
    const all = rows.flatMap((r) => [r.value, r.value2]);
    let lo = Math.min(...all), hi = Math.max(...all);
    const padv = (hi - lo) * 0.06 || 1; lo -= padv; hi += padv;
    const Y = (v) => py1 - (py1 - py0) * (v - lo) / ((hi - lo) || 1);
    const rules = g.append("g").attr("id", "grid");
    for (const x of [ax, bx]) core.dottedLine(rules, [x, py0 - S * 0.02], [x, py1], mix(R.neutral, th.ground, 0.4), S);
    const marks = g.append("g").attr("id", "marks");
    const idx = rows.map((_, i) => i).sort((a, b) => (P.on(a) ? 1 : 0) - (P.on(b) ? 1 : 0));
    const groups = {};
    idx.forEach((i, k) => {
      const r = rows[i], row = core.rowGroup(marks, i, k, P); groups[i] = row;
      const col = P.on(i) || P.how !== "hue" ? P.mark(i) : mix(R.muted, R.neutral, 0.2);
      const w = S * (P.on(i) ? 0.012 : 0.006) * P.grow(i);
      row.append("line").attr("x1", ax).attr("y1", Y(r.value)).attr("x2", bx).attr("y2", Y(r.value2)).attr("stroke", col).attr("stroke-width", w).attr("stroke-linecap", "round");
      core.dot(row, ax, Y(r.value), w * 1.3, col);
      core.dot(row, bx, Y(r.value2), w * 1.3, col);
    });
    // labels pushed apart to stay legible, each keeping a thread back to its own dot
    const spread = (ys, gap) => {
      const order = ys.map((_, i) => i).sort((a, b) => ys[a] - ys[b]), out = [...ys];
      for (let k = 1; k < order.length; k++) if (out[order[k]] - out[order[k - 1]] < gap) out[order[k]] = out[order[k - 1]] + gap;
      const over = order.length ? Math.max(0, out[order[order.length - 1]] - py1 - S * 0.01) : 0;
      return out.map((y) => y - over);
    };
    const gap = S * 0.056, ly = spread(rows.map((r) => Y(r.value)), gap), ry = spread(rows.map((r) => Y(r.value2)), gap);
    const room = ax - S * 0.026 - core.measure("000", "bebas", vp).w - S * 0.018 - x0;
    const lp = Math.min(...rows.map((r) => core.shrinkTo(r.label || "", "arvoBold", lp0, room, S * 0.018)));
    let ib = null;
    rows.forEach((r, i) => {
      const row = groups[i], fill = P.on(i) ? P.words(i) : th.body;
      const vb = core.text(row, core.num(r.value, ctx), { x: ax - S * 0.026, y: ly[i], face: "bebas", px: vp, fill, align: "r", valign: "mid" });
      const lb = core.text(row, r.label || "", { x: vb[0] - S * 0.018, y: ly[i], face: "arvoBold", px: lp, fill, align: "r", valign: "fmid" });
      const rb = core.text(row, core.num(r.value2, ctx), { x: bx + S * 0.026, y: ry[i], face: "bebas", px: vp, fill, valign: "mid" });
      for (const [[px, py], [qx, qy]] of [[[ax - S * 0.012, Y(r.value)], [vb[2] + S * 0.006, ly[i]]], [[bx + S * 0.012, Y(r.value2)], [rb[0] - S * 0.006, ry[i]]]])
        if (Math.abs(py - qy) > S * 0.004) row.append("line").attr("x1", px).attr("y1", py).attr("x2", qx).attr("y2", qy).attr("stroke", mix(R.neutral, th.ground, 0.35)).attr("stroke-width", Math.max(1, S * 0.0015));
      const ch = r.value2 - r.value;
      const txt = r.value ? `${ch >= 0 ? "+" : "−"}${Math.round(Math.abs(ch) / Math.abs(r.value) * 100)}%` : `${ch >= 0 ? "+" : "−"}${core.num(Math.abs(ch), ctx)}`;
      const cb = core.text(row, txt, { x: rb[2] + S * 0.016, y: ry[i], face: "arvoBold", px: cp, fill: ch >= 0 ? R.positive : R.negative, valign: "fmid" });
      if (P.on(i)) ib = core.union(lb, vb, rb, cb);
    });
    return ib;
  },
};
