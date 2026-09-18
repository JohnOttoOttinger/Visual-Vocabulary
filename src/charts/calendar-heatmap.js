// Calendar heatmap — FT Change over time. One square per day ("date": "2016-03-04"), weeks across
// and weekdays down, the shade the day's value in one hue (darker is more; lighter on dark paper),
// months named above, a year per block. The busiest day is ringed and its value given.
import * as core from "../core.js";
import { mix, seq } from "../theme.js";

const d3 = globalThis.d3;
const DAY = 864e5;

export default {
  id: "calendar-heatmap",
  name: "Calendar heatmap",
  needs: () => ["date", "value"],
  insight: "max",
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th, paint: P } = ctx;
    const byDay = new Map(rows.map((r, i) => [String(r.date).slice(0, 10), { v: r.value, i }]));
    const years = [...new Set(rows.map((r) => String(r.date).slice(0, 4)))].sort();
    const vmax = Math.max(...rows.map((r) => r.value)) || 1, lp = S * 0.020;
    const labW = core.measure("Mon", "arvo", lp).w + S * 0.02, legendH = S * 0.08;
    // A year folds into 1, 2, 3 or 4 blocks (12, 6, 4 or 3 months), whichever gives the biggest
    // squares in this frame: one long strip in a wide frame, two half-years in a tall one.
    const size = (k) => {
      const weeks = Math.ceil((366 / k + 6) / 7), blocks = years.length * k;
      return Math.min((x1 - x0 - labW) / weeks, (y1 - y0 - legendH) / (blocks * 9.4));
    };
    const k = [1, 2, 3, 4].reduce((a, b) => (size(b) > size(a) * 1.05 ? b : a), 1), cell = size(k);
    const gap = Math.max(1, cell * 0.12), blockH = cell * 9.4, blocks = years.length * k;
    const top = y0 + ((y1 - y0 - legendH) - (blocks * blockH - cell * 0.8)) / 2 + cell * 1.6;
    const marks = g.append("g").attr("id", "marks"), axis = g.append("g").attr("id", "axis");
    let hot = null;
    years.forEach((yr, yi) => {
      for (let c = 0; c < k; c++) {
        const b = yi * k + c, bTop = top + b * blockH, m0 = c * 12 / k, m1 = (c + 1) * 12 / k;
        const t0 = Date.UTC(+yr, m0, 1), t1 = Date.UTC(+yr, m1, 1), off = (new Date(t0).getUTCDay() + 6) % 7;   // Monday first
        if (years.length > 1 && c === 0) core.text(axis, yr, { x: x0, y: bTop - cell * 1.5, face: "bebas", px: S * 0.030, fill: th.roles.neutral, valign: "fbottom" });
        ["Mon", "", "Wed", "", "Fri", "", ""].forEach((d, w) => d && core.text(axis, d, { x: x0 + labW - S * 0.012, y: bTop + cell * (w + 0.5), face: "arvo", px: lp, fill: th.body, align: "r", valign: "fmid" }));
        for (let t = t0; t < t1; t += DAY) {
          const d = new Date(t), idx = Math.round((t - t0) / DAY) + off, wk = Math.floor(idx / 7), wd = idx % 7;
          const x = x0 + labW + wk * cell, y = bTop + wd * cell, key = d.toISOString().slice(0, 10), hit = byDay.get(key);
          if (d.getUTCDate() === 1) core.text(axis, d3.utcFormat("%b")(d), { x, y: bTop - cell * 0.35, face: "arvo", px: Math.min(lp, cell * 0.9), fill: th.body, valign: "fbottom" });
          const fill = hit && hit.v > 0 ? seq(th, 0.15 + 0.85 * hit.v / vmax) : mix(th.roles.muted, th.ground, th.dark ? 0.75 : 0.55);
          const sq = marks.append("rect").attr("x", x + gap / 2).attr("y", y + gap / 2).attr("width", cell - gap).attr("height", cell - gap).attr("rx", cell * 0.15).attr("fill", fill);
          if (hit) { sq.attr("data-row", hit.i); if (P.on(hit.i)) hot = { x, y, d, v: hit.v }; }
        }
      }
    });
    // the scale, less to more
    const ly = y1 - S * 0.04, lc = Math.min(cell, S * 0.03), lx = x1 - lc * 5 - core.measure("More", "arvo", lp).w - S * 0.01;
    core.text(axis, "Less", { x: lx - S * 0.012, y: ly + lc / 2, face: "arvo", px: lp, fill: th.body, align: "r", valign: "fmid" });
    for (let j = 0; j < 5; j++) axis.append("rect").attr("x", lx + j * lc).attr("y", ly).attr("width", lc - gap).attr("height", lc - gap).attr("rx", lc * 0.15).attr("fill", seq(th, 0.15 + 0.85 * j / 4));
    core.text(axis, "More", { x: lx + 5 * lc + S * 0.006, y: ly + lc / 2, face: "arvo", px: lp, fill: th.body, valign: "fmid" });
    if (!hot) return null;
    const ins = g.append("g").attr("id", "insight");
    ins.append("rect").attr("x", hot.x - gap).attr("y", hot.y - gap).attr("width", cell + 2 * gap).attr("height", cell + 2 * gap).attr("rx", cell * 0.25).attr("fill", "none").attr("stroke", th.ink).attr("stroke-width", S * 0.004);
    const vb = core.stat(ins, core.num(hot.v, ctx), { x: x0 + S * 0.05, y: ly + lc / 2, px: S * 0.050, fill: P.words(P.ins), valign: "mid" });
    const db = core.text(ins, `on ${d3.utcFormat("%-d %B %Y")(hot.d)}, the busiest day`, { x: vb[2] + S * 0.016, y: ly + lc / 2, face: "arvoBold", px: S * 0.022, fill: th.body, valign: "fmid" });
    return core.union(vb, db, [hot.x, hot.y, hot.x + cell, hot.y + cell]);
  },
};
