// Connected scatterplot — FT Correlation. Two numbers moving together over time: each row a point
// (value across, value2 up), joined in the table's order so the path is the story, the first and
// last points named with their label (a period) and a few in between. `axes` names the numbers.
import * as core from "../core.js";
import { mix } from "../theme.js";

const d3 = globalThis.d3;

export default {
  id: "scatterplot-connected",
  name: "Connected scatterplot",
  needs: () => ["label", "value", "value2"],
  insight: "last",
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th, paint: P } = ctx, R = th.roles, n = rows.length, names = ctx.axes || ["", ""], tp = S * 0.021;
    const [xlo, xhi, xt] = core.spanOf(rows.map((r) => r.value)), [ylo, yhi, yt] = core.spanOf(rows.map((r) => r.value2));
    const px0 = x0 + core.tickWidth(yt, ctx) + S * 0.03, px1 = x1 - S * 0.03, py0 = y0 + S * 0.07, py1 = y1 - S * 0.10;
    const X = (v) => px0 + (px1 - px0) * (v - xlo) / ((xhi - xlo) || 1), Y = (v) => py1 - (py1 - py0) * (v - ylo) / ((yhi - ylo) || 1);
    const ax = g.append("g").attr("id", "axes"), faint = mix(R.neutral, th.ground, 0.5);
    for (const t of yt) { core.dottedLine(ax, [px0, Y(t)], [px1, Y(t)], faint, S); core.text(ax, core.num(t, ctx, true), { x: px0 - S * 0.018, y: Y(t), face: "arvo", px: tp, fill: th.body, align: "r", valign: "mid" }); }
    for (const t of xt) { core.dottedLine(ax, [X(t), py0], [X(t), py1], faint, S); core.text(ax, core.num(t, ctx, true), { x: X(t), y: py1 + S * 0.018, face: "arvo", px: tp, fill: th.body, align: "c", valign: "asc" }); }
    if (names[0]) core.text(ax, names[0].toUpperCase(), { x: px1, y: py1 + S * 0.06, face: "bebas", px: S * 0.034, fill: R.neutral, align: "r" });
    if (names[1]) core.text(ax, names[1].toUpperCase(), { x: x0, y: y0, face: "bebas", px: S * 0.034, fill: R.neutral });
    const pts = rows.map((r) => [X(r.value), Y(r.value2)]), marks = g.append("g").attr("id", "marks");
    marks.append("path").attr("d", d3.line().curve(d3.curveCatmullRom.alpha(0.5))(pts)).attr("fill", "none")
      .attr("stroke", R.neutral).attr("stroke-width", S * 0.005).attr("stroke-linecap", "round");
    // the dots darken along the path, so the direction reads without arrows
    pts.forEach(([x, y], i) => core.dot(core.rowGroup(marks, i, i, P), x, y, S * (P.on(i) ? 0.017 : 0.010),
      P.on(i) ? R.main : mix(R.muted, R.neutral, 0.15 + 0.6 * i / Math.max(1, n - 1)), th.ground, S * 0.003));
    const every = Math.max(1, Math.ceil(n / 6)), taken = [], labels = g.append("g").attr("id", "labels");
    let ib = null;
    rows.forEach((r, i) => {
      if (!(i === 0 || i === n - 1 || P.on(i) || i % every === 0)) return;
      const [x, y] = pts[i], face = P.on(i) || i === 0 ? "arvoBold" : "arvo", px = S * (P.on(i) ? 0.024 : 0.020);
      const w = core.measure(String(r.label ?? ""), face, px).w;
      for (const [sx, al] of [[x + S * 0.02, "l"], [x - S * 0.02, "r"]]) {
        const bb = al === "l" ? [sx, y - px * 0.6, sx + w, y + px * 0.6] : [sx - w, y - px * 0.6, sx, y + px * 0.6];
        if (bb[0] < x0 || bb[2] > x1 || taken.some((t) => !(bb[2] < t[0] || bb[0] > t[2] || bb[3] < t[1] || bb[1] > t[3]))) continue;
        core.text(labels, String(r.label ?? ""), { x: sx, y, face, px, fill: P.on(i) ? P.words(i) : th.body, align: al, valign: "fmid", halo: [th.ground, S * 0.003] });
        taken.push(bb);
        if (P.on(i)) ib = core.union(bb, [x - S * 0.017, y - S * 0.017, x + S * 0.017, y + S * 0.017]);
        break;
      }
    });
    return ib;
  },
};
