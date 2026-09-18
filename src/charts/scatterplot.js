// Scatterplot — FT Correlation; the Storyteller's `correlation` mode. Two numbers against each
// other: the pack's quadrant lines through the means, a dotted line of best fit, and the point
// furthest from it named with its note. `axes` names the two numbers: ["across", "up"].
import * as core from "../core.js";
import { mix } from "../theme.js";

const d3 = globalThis.d3;

export default {
  id: "scatterplot",
  name: "Scatterplot",
  needs: () => ["label", "value", "value2"],
  insight: "residual",
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th, paint: P } = ctx, R = th.roles;
    const xs = rows.map((r) => r.value), ys = rows.map((r) => r.value2);
    const names = ctx.axes || ["", ""], tp = S * 0.021;
    const [ylo, yhi, yt] = core.spanOf(ys), [xlo, xhi, xt] = core.spanOf(xs);
    const labW = Math.max(...yt.map((t) => core.measure(core.num(t, ctx, true), "arvo", tp).w));
    const px0 = x0 + labW + S * 0.03, px1 = x1 - S * 0.02, py0 = y0 + S * 0.075, py1 = y1 - S * 0.10;
    const X = (v) => px0 + (px1 - px0) * (v - xlo) / ((xhi - xlo) || 1);
    const Y = (v) => py1 - (py1 - py0) * (v - ylo) / ((yhi - ylo) || 1);
    const faint = mix(R.neutral, th.ground, 0.45);
    const ax = g.append("g").attr("id", "axes");
    for (const t of yt) core.text(ax, core.num(t, ctx, true), { x: px0 - S * 0.018, y: Y(t), face: "arvo", px: tp, fill: th.body, align: "r", valign: "mid" });
    for (const t of xt) core.text(ax, core.num(t, ctx, true), { x: X(t), y: py1 + S * 0.018, face: "arvo", px: tp, fill: th.body, align: "c", valign: "asc" });
    const mx = d3.mean(xs), my = d3.mean(ys);
    core.dottedLine(ax, [X(mx), py0], [X(mx), py1], faint, S);
    core.dottedLine(ax, [px0, Y(my)], [px1, Y(my)], faint, S);
    ax.append("path").attr("d", `M${px0},${py0 - S * 0.01}L${px0},${py1}L${px1 + S * 0.01},${py1}`)
      .attr("fill", "none").attr("stroke", th.ink).attr("stroke-width", S * 0.004).attr("stroke-linejoin", "round");
    if (names[0]) core.text(ax, names[0].toUpperCase(), { x: px1, y: py1 + S * 0.06, face: "bebas", px: S * 0.034, fill: R.neutral, align: "r" });
    if (names[1]) core.text(ax, names[1].toUpperCase(), { x: px0 - labW - S * 0.03, y: y0, face: "bebas", px: S * 0.034, fill: R.neutral });
    if (rows.length > 2) {
      const [a, b] = core.fitLine(xs, ys);
      const ends = [xlo, xhi].map((xv) => {
        const raw = a + b * xv, yv = Math.min(Math.max(raw, ylo), yhi);
        return [b && raw !== yv ? X((yv - a) / b) : X(xv), Y(yv)];
      });
      core.dottedLine(g.append("g").attr("id", "fit"), ends[0], ends[1], th.strong, S);
    }
    const marks = g.append("g").attr("id", "marks");
    const order = rows.map((_, i) => i).sort((a, b) => (P.on(a) ? 1 : 0) - (P.on(b) ? 1 : 0));
    order.forEach((i, k) => {
      const r = S * (P.on(i) ? 0.020 : 0.013) * P.grow(i);
      core.dot(core.rowGroup(marks, i, k, P), X(xs[i]), Y(ys[i]), r,
        P.on(i) || P.how !== "hue" ? P.mark(i) : R.muted, P.on(i) ? th.ground : R.neutral, Math.max(2, S * 0.003));
    });
    // labels: the insight first, then the rest while there is room, never over another label
    const taken = [], lp = S * 0.021, labels = g.append("g").attr("id", "labels");
    let ib = null;
    const queue = (P.ins !== null && P.ins !== undefined ? [P.ins] : []).concat(rows.map((_, i) => i).filter((i) => !P.on(i)));
    for (const i of queue) {
      if (rows.length > 9 && !P.on(i)) break;
      const x = X(xs[i]), y = Y(ys[i]), r = S * (P.on(i) ? 0.020 : 0.013);
      const face = P.on(i) ? "arvoBold" : "arvo", px = lp * (P.on(i) ? 1.15 : 1);
      const txt = rows[i].label || "", w = core.measure(txt, face, px).w;
      for (const [bx, right] of [[x + r + S * 0.012, true], [x - r - S * 0.012, false]]) {
        const bb = right ? [bx, y - lp * 0.7, bx + w, y + lp * 0.7] : [bx - w, y - lp * 0.7, bx, y + lp * 0.7];
        if (bb[0] < x0 || bb[2] > x1) continue;
        if (taken.some((t) => !(bb[2] < t[0] || bb[0] > t[2] || bb[3] < t[1] || bb[1] > t[3]))) continue;
        core.text(labels, txt, { x: bx, y, face, px, fill: P.on(i) ? P.words(i) : th.body, align: right ? "l" : "r", valign: "mid", halo: [th.ground, S * 0.003] });
        taken.push(bb);
        if (P.on(i)) {
          ib = core.union(bb, [x - r, y - r, x + r, y + r]);
          const note = rows[i].note || "";
          if (note) core.para(labels, note, { x: right ? bb[0] : bb[2], y: bb[3] + S * 0.012 + S * 0.021 * 0.4, px: S * 0.021, width: S * 0.34, fill: th.body, align: right ? "l" : "r", maxLines: 2 });
        }
        break;
      }
    }
    return ib;
  },
};
