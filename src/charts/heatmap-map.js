// Grid heatmap map — FT Spatial. Where things gather, counted into equal squares: every row a place
// (with an optional "value" as its weight), the squares shaded by their total in one hue over the
// map, empty squares left out. Unlike a choropleth, the squares ignore borders.
import * as core from "../core.js";
import * as geo from "../geo.js";
import { seq } from "../theme.js";

const d3 = globalThis.d3;

export default {
  id: "heatmap-map",
  name: "Grid heatmap map",
  needs: () => ["label"],
  insight: "none",
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th } = ctx, focus = ctx.options.focus || "world";
    const room = geo.mapRoom(focus, [x0, y0, x1, y1], ctx, { bottom: [S * 0.46, S * 0.06] });
    const base = geo.basemap(g, focus, [x0, y0, x1, y1], ctx, { fit: room.fit }), cell = ctx.options.cell || S * 0.028;
    const bins = new Map();
    for (const r of rows) {
      let xy; try { xy = base.proj(geo.place(r)); } catch { continue; }
      if (!xy || xy[0] < x0 || xy[0] > x1 || xy[1] < y0 || xy[1] > y1) continue;
      const k = `${Math.floor((xy[0] - x0) / cell)},${Math.floor((xy[1] - y0) / cell)}`;
      bins.set(k, (bins.get(k) || 0) + (core.isNum(r.value) ? r.value : 1));
    }
    const vals = [...bins.values()], k = 5, scale = d3.scaleQuantile().domain(vals).range(d3.range(k));
    const colours = d3.range(k).map((j) => seq(th, 0.15 + 0.85 * j / (k - 1))), marks = g.append("g").attr("id", "marks"), gap = Math.max(0.8, cell * 0.1);
    let best = null;
    for (const [key, v] of bins) {
      const [a, b] = key.split(",").map(Number), x = x0 + a * cell, y = y0 + b * cell;
      marks.append("rect").attr("x", x + gap / 2).attr("y", y + gap / 2).attr("width", cell - gap).attr("height", cell - gap).attr("rx", cell * 0.12).attr("fill", colours[scale(v)]);
      if (!best || v > best.v) best = { v, box: [x, y, x + cell, y + cell] };
    }
    geo.shadeKey(g, colours, scale.quantiles().map((v) => core.num(Math.round(v), ctx, true)), room.bottom, ctx);
    if (best) {
      const ins = g.append("g").attr("id", "insight");
      ins.append("rect").attr("x", best.box[0]).attr("y", best.box[1]).attr("width", cell).attr("height", cell).attr("rx", cell * 0.12).attr("fill", "none").attr("stroke", th.ink).attr("stroke-width", S * 0.003);
    }
    return null;
  },
};
