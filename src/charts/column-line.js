// Column and line — FT's column-line timeline, drawn as two panels: an amount as columns above, a
// rate as a line below, on the same periods. Two scales on one chart would invite a false reading,
// so each has its own. Reads value (the amount) and value2 (the rate), named by "axes".
import * as core from "../core.js";
import { timePanel, xLabels, panelScale } from "./panel-line.js";

export default {
  id: "column-line",
  name: "Column and line",
  needs: () => ["label", "value", "value2"],
  insight: "none",
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S } = ctx, names = ctx.axes || ["Amount", "Rate"];
    const gap = S * 0.05, h = (y1 - y0 - gap - S * 0.04) * 0.55;
    // one left edge and one spacing for both, so each period's column sits over its point
    const left = x0 + Math.max(...["value", "value2"].map((c) => core.tickWidth(panelScale(rows, (r) => r[c]).ticks, ctx))) + S * 0.025;
    const a = timePanel(g.append("g").attr("id", "panel-1"), rows, (r) => r.value, [x0, y0, x1, y0 + h], ctx, { title: names[0], kind: "column", hot: false, mark: "max", xLabels: false, left });
    const b = timePanel(g.append("g").attr("id", "panel-2"), rows, (r) => r.value2, [x0, y0 + h + gap, x1, y1 - S * 0.04], ctx, { title: names[1], hot: true, xLabels: false, left, band: true });
    xLabels(g, rows, b.X, b.py1 + S * 0.02, ctx);
    return a.ib;
  },
};
