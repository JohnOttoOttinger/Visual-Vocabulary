// Voronoi — FT Part-to-whole. Points turned into areas: each row a point (value across, value2 up,
// named by "axes"), and the ground nearest to it drawn as its cell. Big cells are the lonely points,
// small ones the crowded. The insight's cell in olive, its name given; a few others named.
import * as core from "../core.js";
import { mix } from "../theme.js";

const d3 = globalThis.d3;

export default {
  id: "voronoi",
  name: "Voronoi",
  needs: () => ["label", "value", "value2"],
  insight: "residual",
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th, paint: P } = ctx, names = ctx.axes || ["", ""], tp = S * 0.021;
    const [xlo, xhi, xt] = core.spanOf(rows.map((r) => r.value)), [ylo, yhi, yt] = core.spanOf(rows.map((r) => r.value2));
    const px0 = x0 + core.tickWidth(yt, ctx) + S * 0.03, px1 = x1, py0 = y0 + S * 0.06, py1 = y1 - S * 0.10;
    const X = (v) => px0 + (px1 - px0) * (v - xlo) / ((xhi - xlo) || 1), Y = (v) => py1 - (py1 - py0) * (v - ylo) / ((yhi - ylo) || 1);
    const ax = g.append("g").attr("id", "axes");
    for (const t of yt) core.text(ax, core.num(t, ctx, true), { x: px0 - S * 0.018, y: Y(t), face: "arvo", px: tp, fill: th.body, align: "r", valign: "mid" });
    for (const t of xt) core.text(ax, core.num(t, ctx, true), { x: X(t), y: py1 + S * 0.018, face: "arvo", px: tp, fill: th.body, align: "c", valign: "asc" });
    if (names[0]) core.text(ax, names[0].toUpperCase(), { x: px1, y: py1 + S * 0.06, face: "bebas", px: S * 0.032, fill: th.roles.neutral, align: "r" });
    if (names[1]) core.text(ax, names[1].toUpperCase(), { x: x0, y: y0, face: "bebas", px: S * 0.032, fill: th.roles.neutral });
    const pts = rows.map((r) => [X(r.value), Y(r.value2)]);
    const vor = d3.Delaunay.from(pts).voronoi([px0, py0, px1, py1]);
    const marks = g.append("g").attr("id", "marks");
    rows.forEach((r, i) => {
      const cell = vor.renderCell(i);
      if (!cell) return;
      core.rowGroup(marks, i, i, P).append("path").attr("d", cell).attr("fill", P.on(i) ? mix(th.roles.main, th.ground, 0.2) : mix(th.roles.muted, th.ground, 0.35 + 0.3 * (i % 3) / 2))
        .attr("stroke", th.ground).attr("stroke-width", Math.max(1.5, S * 0.004));
    });
    pts.forEach(([x, y], i) => core.dot(marks, x, y, S * (P.on(i) ? 0.012 : 0.007), P.on(i) ? th.ink : th.strong));
    // name the insight and the points with the biggest cells, never over each other
    const area = rows.map((_, i) => { const poly = vor.cellPolygon(i); return poly ? Math.abs(d3.polygonArea(poly)) : 0; });
    const named = [...(P.ins !== null && P.ins !== undefined ? [P.ins] : []), ...rows.map((_, i) => i).filter((i) => !P.on(i)).sort((a, b) => area[b] - area[a]).slice(0, 7)];
    const taken = [], labels = g.append("g").attr("id", "labels");
    let ib = null;
    for (const i of named) {
      const [x, y] = pts[i], face = P.on(i) ? "arvoBold" : "arvo", px = S * (P.on(i) ? 0.024 : 0.019), txt = String(rows[i].label ?? ""), w = core.measure(txt, face, px).w;
      const bx = Math.min(Math.max(x - w / 2, px0), px1 - w), by = y + S * 0.014, bb = [bx, by, bx + w, by + px * 1.1];
      if (taken.some((t) => !(bb[2] < t[0] || bb[0] > t[2] || bb[3] < t[1] || bb[1] > t[3]))) continue;
      core.text(labels, txt, { x: bx, y: by, face, px, fill: P.on(i) ? th.ink : th.body, valign: "asc", halo: [mix(th.roles.muted, th.ground, 0.4), S * 0.002] });
      taken.push(bb);
      if (P.on(i)) ib = core.union(bb, [x - S * 0.012, y - S * 0.012, x + S * 0.012, y + S * 0.012]);
    }
    return ib;
  },
};
