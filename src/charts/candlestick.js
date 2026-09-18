// Candlestick — FT Change over time (FT: stock price). Each period's open, high, low and close:
// a thin wick from low to high, a body from open to close, olive when it closed higher, mauve when
// lower. Rows carry "open", "high", "low", "close" and a "label" for the period.
import * as core from "../core.js";
import { div } from "../theme.js";

export default {
  id: "candlestick",
  name: "Candlestick",
  needs: () => ["label", "open", "high", "low", "close"],
  insight: (rows) => rows.reduce((m, r, i) => (r.high - r.low > rows[m].high - rows[m].low ? i : m), 0),
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th, paint: P } = ctx, n = rows.length;
    const [lo, hi, ticks] = core.spanOf(rows.flatMap((r) => [r.low, r.high]));
    const px0 = x0 + core.tickWidth(ticks, ctx) + S * 0.03, px1 = x1, py0 = y0 + S * 0.10, py1 = y1 - S * 0.07;
    const step = (px1 - px0) / n, X = (i) => px0 + step * (i + 0.5), Y = (v) => py1 - (py1 - py0) * (v - lo) / ((hi - lo) || 1);
    core.yGrid(g, ticks, Y, px0, px1, ctx);
    core.axisLabels(g.append("g").attr("id", "axis-x"), rows.map((r) => r.label), X, py1 + S * 0.03, ctx);
    const w = Math.max(S * 0.004, Math.min(step * 0.62, S * 0.05)), marks = g.append("g").attr("id", "marks");
    let ib = null;
    rows.forEach((r, i) => {
      const row = core.rowGroup(marks, i, i, P), x = X(i), up = r.close >= r.open;
      row.append("line").attr("x1", x).attr("x2", x).attr("y1", Y(r.high)).attr("y2", Y(r.low)).attr("stroke", th.strong).attr("stroke-width", Math.max(1, S * 0.0025));
      const a = Y(Math.max(r.open, r.close)), b = Y(Math.min(r.open, r.close));
      row.append("rect").attr("x", x - w / 2).attr("y", a).attr("width", w).attr("height", Math.max(1.5, b - a)).attr("rx", Math.min(S * 0.004, w / 4))
        .attr("fill", div(th, up ? 0.85 : -0.85)).attr("stroke", P.on(i) ? th.ink : "none").attr("stroke-width", P.on(i) ? S * 0.003 : 0);
      if (P.on(i)) {
        const vb = core.text(row, `${core.num(r.low, ctx)} to ${core.num(r.high, ctx)}`, { x: Math.min(Math.max(x, x0 + S * 0.1), x1 - S * 0.1), y: Y(r.high) - S * 0.016, face: "arvoBold", px: S * 0.024, fill: th.ink, align: "c", valign: "bottom", halo: [th.ground, S * 0.003] });
        ib = core.union(vb, [x - w / 2, Y(r.high), x + w / 2, Y(r.low)]);
      }
    });
    return ib;
  },
};
