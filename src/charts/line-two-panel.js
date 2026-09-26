// Two panels on one time axis — replaces FT's dual-axis line. Two measures with different scales
// each get their own panel, one above the other, sharing the periods along the bottom, so no false
// crossing is drawn. Reads "series": [a, b], or value and value2 named by "axes". The last point of
// each is marked with its value.
import * as core from "../core.js";
import { timePanel, xLabels, panelScale } from "./panel-line.js";

export default {
  id: "line-two-panel",
  name: "Two panels on one time axis",
  needs: (spec) => (spec && spec.series && spec.series.length
    ? ["label", ...spec.series] : ["label"]),
  // One panel per measure, so "series" must name two - or the rows carry value and value2.
  measures: 2,
  insight: "none",
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S } = ctx, { names, cols } = core.seriesOf(rows, ctx);
    if (cols.length < 2) throw new Error("line-two-panel: give two series, or value and value2");
    const gap = S * 0.05, h = (y1 - y0 - gap - S * 0.04) / 2;
    // the two panels share one run of periods, so their plots start at the same left edge
    const left = x0 + Math.max(...cols.slice(0, 2).map((c) => core.tickWidth(panelScale(rows, (r) => r[c]).ticks, ctx))) + S * 0.025;
    timePanel(g.append("g").attr("id", "panel-1"), rows, (r) => r[cols[0]], [x0, y0, x1, y0 + h], ctx, { title: names[0], hot: true, xLabels: false, left });
    const b = timePanel(g.append("g").attr("id", "panel-2"), rows, (r) => r[cols[1]], [x0, y0 + h + gap, x1, y1 - S * 0.04], ctx, { title: names[1], hot: true, colour: ctx.th.series[2], xLabels: false, left });
    xLabels(g, rows, b.X, b.py1 + S * 0.02, ctx);
    return null;
  },
};
