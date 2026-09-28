// Event timeline — the Storyteller's `timeline` mode (not in the FT set). The linear timeline stood
// upright for a tall frame: a dotted spine down the middle, the entries alternating either side,
// time running down to an arrowhead, the insight's dot in olive.
import * as core from "../core.js";

export default {
  id: "event-timeline",
  name: "Event timeline",
  needs: () => ["label"],
  insight: "last",
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    // A wide box gets the timeline lying down: the spine runs left to right, entries alternate
    // above and below it, and time ends in an arrowhead on the right (Otto, 28 Sep 2026 — upright
    // in a 16:9 frame left two thirds of the width empty).
    if (x1 - x0 > (y1 - y0) * 1.25) return this.lying(g, rows, [x0, y0, x1, y1], ctx);
    const { S, th, paint: P } = ctx, R = th.roles;
    const n = rows.length, cx = (x0 + x1) / 2;
    const lp = S * 0.048, npx = S * 0.026, gap = S * 0.050, colw = (x1 - x0) / 2 - gap;
    const cap = core.measure("H", "bebas", lp).asc;
    const heights = rows.map((r) => cap + (r.note ? S * 0.014 + core.paraHeight(r.note, npx, colw, 3) : 0));
    const avail = (y1 - y0) - (heights[n - 1] - cap / 2) - cap / 2;
    const step = Math.min(S * 0.24, avail / Math.max(1, n - 1));
    const start = y0 + cap / 2 + (avail - step * (n - 1)) / 2;
    const ys = rows.map((_, i) => start + step * i);
    const spine = g.append("g").attr("id", "spine");
    core.dottedLine(spine, [cx, ys[0] - S * 0.04], [cx, ys[n - 1] + S * 0.06], th.strong, S);
    const tip = ys[n - 1] + S * 0.075;
    spine.append("path").attr("d", `M${cx - S * 0.016},${tip - S * 0.02}L${cx + S * 0.016},${tip - S * 0.02}L${cx},${tip + S * 0.006}Z`).attr("fill", th.strong);
    const marks = g.append("g").attr("id", "marks");
    let ib = null;
    rows.forEach((r, i) => {
      const row = core.rowGroup(marks, i, i, P), y = ys[i], right = i % 2 === 0;
      const rad = S * (P.on(i) ? 0.024 : 0.014) * P.grow(i);
      core.dot(row, cx, y, rad, P.on(i) || P.how !== "hue" ? P.mark(i) : th.strong, th.ground, S * 0.005);
      const tx = right ? cx + gap : cx - gap, sgn = right ? 1 : -1;
      core.dottedLine(row, [cx + (rad + S * 0.012) * sgn, y], [tx - S * 0.012 * sgn, y], R.neutral, S);
      const lb = core.text(row, r.label || "", { x: tx, y, face: "bebas", px: lp, fill: P.words(i), align: right ? "l" : "r", valign: "mid" });
      const [bottom, w] = core.para(row, r.note || "", { x: tx, y: lb[3] + S * 0.014 + npx * 0.4, px: npx, width: colw, fill: th.body, align: right ? "l" : "r", maxLines: 3 });
      if (P.on(i)) ib = core.union(lb, [right ? tx : tx - w, lb[3], right ? tx + w : tx, bottom], [cx - rad, y - rad, cx + rad, y + rad]);
    });
    return ib;
  },

  // The same timeline on its side, for a landscape frame.
  lying(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th, paint: P } = ctx, R = th.roles;
    const n = rows.length, cy = (y0 + y1) / 2;
    const lp = S * 0.044, npx = S * 0.024, gap = S * 0.034;
    const colw = Math.min(S * 0.30, (x1 - x0) / Math.max(1, n) - S * 0.02);
    const cap = core.measure("H", "bebas", lp).asc;
    // time runs to an arrowhead, so the last entry stops short of the right edge
    const head = S * 0.075;
    const px0 = x0 + colw / 2, px1 = x1 - head - colw / 2;
    const xs = rows.map((_, i) => (n === 1 ? (px0 + px1) / 2 : px0 + (px1 - px0) * (i / (n - 1))));
    const spine = g.append("g").attr("id", "spine");
    core.dottedLine(spine, [xs[0] - S * 0.04, cy], [xs[n - 1] + S * 0.06, cy], th.strong, S);
    const tip = xs[n - 1] + head;
    spine.append("path")
      .attr("d", `M${tip - S * 0.02},${cy - S * 0.016}L${tip - S * 0.02},${cy + S * 0.016}L${tip + S * 0.006},${cy}Z`)
      .attr("fill", th.strong);
    const marks = g.append("g").attr("id", "marks");
    let ib = null;
    rows.forEach((r, i) => {
      const row = core.rowGroup(marks, i, i, P), x = xs[i], above = i % 2 === 0;
      const rad = S * (P.on(i) ? 0.024 : 0.014) * P.grow(i);
      core.dot(row, x, cy, rad, P.on(i) || P.how !== "hue" ? P.mark(i) : th.strong, th.ground, S * 0.005);
      const sgn = above ? -1 : 1, ty = cy + (gap + rad) * sgn;
      core.dottedLine(row, [x, cy + (rad + S * 0.010) * sgn], [x, ty - S * 0.010 * sgn], R.neutral, S);
      // above the spine the block is built upwards, so the note sits under its own label either way
      const noteH = r.note ? S * 0.012 + core.paraHeight(r.note, npx, colw, 3) : 0;
      const labY = above ? ty - noteH - cap * 0.5 : ty + cap * 0.5;
      const lb = core.text(row, r.label || "", { x, y: labY, face: "bebas", px: lp, fill: P.words(i), align: "m", valign: "mid" });
      const [bottom] = core.para(row, r.note || "", { x, y: lb[3] + S * 0.012 + npx * 0.4, px: npx, width: colw, fill: th.body, align: "m", maxLines: 3 });
      if (P.on(i)) ib = core.union(lb, [x - colw / 2, lb[3], x + colw / 2, bottom], [x - rad, cy - rad, x + rad, cy + rad]);
    });
    return ib;
  },
};
