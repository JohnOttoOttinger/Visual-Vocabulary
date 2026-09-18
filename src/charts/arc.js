// Parliament arc — FT Part-to-whole. Seats in a half circle: one dot per unit of each row's value,
// laid in rows from the inside out and coloured by part in the fixed series order (a fifth part and
// beyond share the neutral), the biggest part first from the left. The total sits in the middle in
// Depot, a dotted line marks half, and a key names each part with its count.
import * as core from "../core.js";
import { mix } from "../theme.js";

const d3 = globalThis.d3;

export default {
  id: "arc",
  name: "Parliament arc",
  needs: () => ["label", "value"],
  insight: "max",
  ringOnHue: true,
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th, paint: P } = ctx;
    const order = rows.map((_, i) => i).sort((a, b) => rows[b].value - rows[a].value);
    const colour = (k) => (k < th.series.length ? th.series[k] : mix(th.roles.neutral, th.ground, 0.3));
    const seats = Math.round(d3.sum(rows, (r) => Math.max(0, r.value)));
    if (seats > 800) ctx.warn(`${seats} seats; past about 800 the dots are too small to count`);
    const lrow = S * 0.058, keyH = Math.ceil(order.length / 2) * lrow + S * 0.04;
    const R = Math.min((x1 - x0) / 2, (y1 - y0) - keyH - S * 0.02), cx = (x0 + x1) / 2, cy = y0 + R;
    const r0 = R * 0.38;
    // rows of seats from the inside out: pick the count that fills the band with round dots
    let nRows = 1;
    for (; nRows < 40; nRows++) {
      const dr = (R - r0) / nRows, cap = d3.sum(d3.range(nRows), (k) => Math.floor(Math.PI * (r0 + dr * (k + 0.5)) / dr));
      if (cap >= seats) break;
    }
    const dr = (R - r0) / nRows, spots = [];
    const caps = d3.range(nRows).map((k) => Math.floor(Math.PI * (r0 + dr * (k + 0.5)) / dr)), cap = d3.sum(caps);
    const share = caps.map((c) => Math.floor(seats * c / cap));
    caps.map((c, k) => [seats * c / cap - share[k], k]).sort((a, b) => b[0] - a[0]).slice(0, seats - d3.sum(share)).forEach(([, k]) => { share[k] += 1; });
    for (let k = 0; k < nRows; k++) {
      const rr = r0 + dr * (k + 0.5), n = share[k];
      for (let j = 0; j < n; j++) { const a = Math.PI * (1 - (n === 1 ? 0.5 : j / (n - 1))); spots.push({ a, x: cx + rr * Math.cos(a), y: cy - rr * Math.sin(a) }); }
    }
    spots.sort((p, q) => q.a - p.a);                       // left to right across every row, so each part is a wedge
    const used = spots.slice(0, seats), marks = g.append("g").attr("id", "marks");
    let s = 0, ib = null;
    order.forEach((i, k) => {
      const row = core.rowGroup(marks, i, k, P), n = Math.round(Math.max(0, rows[i].value)), pts = used.slice(s, s + n);
      // every part keeps its own colour (the series order was validated as a set); the insight is
      // named in bold in the key and ringed
      for (const p of pts) core.dot(row, p.x, p.y, dr * 0.40, colour(k));
      s += n;
      if (P.on(i) && pts.length) ib = [Math.min(...pts.map((p) => p.x)) - dr / 2, Math.min(...pts.map((p) => p.y)) - dr / 2, Math.max(...pts.map((p) => p.x)) + dr / 2, Math.max(...pts.map((p) => p.y)) + dr / 2];
    });
    core.dottedLine(g.append("g").attr("id", "half"), [cx, cy - R - S * 0.01], [cx, cy - r0 + S * 0.01], th.strong, S);
    core.stat(g, core.num(seats, ctx), { x: cx, y: cy - S * 0.004, px: Math.min(S * 0.08, r0 * 0.6), fill: th.ink, valign: "bottom" });
    const key = g.append("g").attr("id", "key"), colw = (x1 - x0) / 2, ky = cy + S * 0.05;
    order.forEach((i, k) => {
      const lx = x0 + (k % 2) * colw, ly = ky + Math.floor(k / 2) * lrow, sw = S * 0.026;
      core.dot(key, lx + sw / 2, ly + sw / 2, sw / 2, colour(k));
      const v = core.num(rows[i].value, ctx), vw = core.measure(v, "bebas", S * 0.036).w;
      const px = core.shrinkTo(rows[i].label || "", "arvoBold", S * 0.025, colw - sw - S * 0.06 - vw, S * 0.017);
      core.text(key, rows[i].label || "", { x: lx + sw + S * 0.018, y: ly + sw / 2, face: "arvoBold", px, fill: P.on(i) ? th.ink : th.body, valign: "fmid" });
      core.text(key, v, { x: lx + colw - S * 0.03, y: ly + sw / 2, face: "bebas", px: S * 0.036, fill: th.ink, align: "r", valign: "mid" });
    });
    return ib;
  },
};
