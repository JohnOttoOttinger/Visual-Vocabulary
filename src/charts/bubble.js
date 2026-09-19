// Bubble — FT Correlation; a `correlation` sub-mode. The scatterplot with a third number as each
// dot's area: `value` across, `value2` up, `size` as the bubble. The biggest bubbles are named;
// the insight in olive with its note. `axes` names across and up; `options.sizeName` names the size.
import * as core from "../core.js";
import { mix } from "../theme.js";

const d3 = globalThis.d3;

export default {
  id: "bubble",
  name: "Bubble",
  needs: () => ["label", "value", "value2", "size"],
  // the biggest bubble, unless the spec names one
  insight: (rows) => rows.reduce((m, r, i) => ((r.size ?? -Infinity) > (rows[m].size ?? -Infinity) ? i : m), 0),
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th, paint: P } = ctx, R = th.roles;
    const xs = rows.map((r) => r.value), ys = rows.map((r) => r.value2), zs = rows.map((r) => Math.max(0, r.size));
    const names = ctx.axes || ["", ""], tp = S * 0.021, rmax = S * 0.065;
    const [ylo, yhi, yt] = core.spanOf(ys), [xlo, xhi, xt] = core.spanOf(xs);
    const labW = Math.max(...yt.map((t) => core.measure(core.num(t, ctx, true), "arvo", tp).w));
    const px0 = x0 + core.axisRoom(names[1], ctx) + labW + S * 0.03 + rmax * 0.4, px1 = x1 - rmax * 0.6, py0 = y0 + S * 0.035 + rmax * 0.4, py1 = y1 - S * 0.10;
    const X = (v) => px0 + (px1 - px0) * (v - xlo) / ((xhi - xlo) || 1);
    const Y = (v) => py1 - (py1 - py0) * (v - ylo) / ((yhi - ylo) || 1);
    const Rz = d3.scaleSqrt().domain([0, Math.max(...zs) || 1]).range([0, rmax]);
    const ax = g.append("g").attr("id", "axes"), faint = mix(R.neutral, th.ground, 0.45);
    for (const t of yt) {
      core.dottedLine(ax, [px0, Y(t)], [px1, Y(t)], faint, S);
      core.text(ax, core.num(t, ctx, true), { x: px0 - rmax * 0.4 - S * 0.018, y: Y(t), face: "arvo", px: tp, fill: th.body, align: "r", valign: "mid" });
    }
    for (const t of xt) core.text(ax, core.num(t, ctx, true), { x: X(t), y: py1 + S * 0.024, face: "arvo", px: tp, fill: th.body, align: "c", valign: "asc" });
    core.axisNames(ax, names, ctx, { x0, px0, px1, py0, py1, below: py1 + S * 0.065 });
    const marks = g.append("g").attr("id", "marks");
    const order = rows.map((_, i) => i).sort((a, b) => zs[b] - zs[a]);   // big first, so small ones sit on top
    order.forEach((i, k) => {
      core.dot(core.rowGroup(marks, i, k, P), X(xs[i]), Y(ys[i]), Math.max(S * 0.006, Rz(zs[i]) * P.grow(i)),
        P.on(i) || P.how !== "hue" ? P.mark(i) : mix(R.muted, th.ground, 0.15), th.ground, Math.max(2, S * 0.003));
    });
    const labels = g.append("g").attr("id", "labels"), taken = [];
    let ib = null;
    const named = [...(P.ins !== null && P.ins !== undefined ? [P.ins] : []), ...order.filter((i) => !P.on(i)).slice(0, 6)];
    for (const i of named) {
      const x = X(xs[i]), y = Y(ys[i]), r = Rz(zs[i]), on = P.on(i), face = on ? "arvoBold" : "arvo", px = S * (on ? 0.024 : 0.020);
      const txt = rows[i].label || "", w = core.measure(txt, face, px).w;
      const spots = [[x, y + r + S * 0.008, "c", "asc"], [x, y - r - S * 0.008, "c", "fbottom"], [x + r + S * 0.01, y, "l", "fmid"], [x - r - S * 0.01, y, "r", "fmid"]];
      for (const [sx, sy, al, va] of spots) {
        const bx = al === "c" ? sx - w / 2 : al === "r" ? sx - w : sx;
        const byy = va === "asc" ? sy : va === "fbottom" ? sy - px * 1.1 : sy - px * 0.55;
        const bb = [bx, byy, bx + w, byy + px * 1.1];
        if (bb[0] < x0 || bb[2] > x1 || taken.some((t) => !(bb[2] < t[0] || bb[0] > t[2] || bb[3] < t[1] || bb[1] > t[3]))) continue;
        core.text(labels, txt, { x: sx, y: sy, face, px, fill: on ? P.words(i) : th.body, align: al, valign: va, halo: [th.ground, S * 0.003] });
        taken.push(bb);
        if (on) ib = core.union(bb, [x - r, y - r, x + r, y + r]);
        break;
      }
    }
    return ib;
  },
};
