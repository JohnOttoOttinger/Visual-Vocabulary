// Equal-area cartogram — FT Spatial. Every region the same size: one square per row's region,
// placed near where it lies (its centre snapped to a grid, a neighbour nudged when two want the
// same square), shaded by its value in one hue, named by a short code. Small places count as much
// as big ones, which is the point (FT: voting regions with equal share).
import * as core from "../core.js";
import * as geo from "../geo.js";
import { seq, onFill } from "../theme.js";

const d3 = globalThis.d3;
const STATE_CODES = { "New South Wales": "NSW", Victoria: "VIC", Queensland: "QLD", "South Australia": "SA", "Western Australia": "WA", Tasmania: "TAS", "Northern Territory": "NT", "Australian Capital Territory": "ACT" };

export default {
  id: "cartogram-equal",
  name: "Equal-area cartogram",
  needs: () => ["label", "value"],
  insight: "max",
  ringOnHue: true,
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th, paint: P } = ctx, focus = ctx.options.focus || "world", keyH = S * 0.11;
    const fs = geo.focusShape(focus), feats = geo.layer(ctx.options.layer || (fs.world || !fs.australian ? "world" : fs.state || fs.capital ? "councils" : "states"));
    const { proj } = geo.projectionFor(focus, [x0, y0, x1, y1 - keyH]);
    const items = rows.map((r, i) => { const f = geo.region(feats, r.label); return f && { r, i, f, c: proj(d3.geoCentroid(f)) }; }).filter((d) => d && d.c);
    if (items.length < rows.length) ctx.warn(`${rows.length - items.length} rows name no region`);
    // grid size: the squares together cover about a third of the map's area
    const cell = Math.sqrt((x1 - x0) * (y1 - y0 - keyH) * 0.33 / Math.max(1, items.length)), taken = new Map();
    const key = (a, b) => `${a},${b}`;
    for (const d of [...items].sort((a, b) => b.r.value - a.r.value)) {
      const ga = Math.round((d.c[0] - x0) / cell), gb = Math.round((d.c[1] - y0) / cell);
      let best = null;
      for (let rad = 0; rad < 40 && !best; rad++)
        for (let da = -rad; da <= rad; da++) for (let db = -rad; db <= rad; db++) {
          if (Math.max(Math.abs(da), Math.abs(db)) !== rad || taken.has(key(ga + da, gb + db))) continue;
          const dist = Math.hypot(da, db);
          if (!best || dist < best[2]) best = [ga + da, gb + db, dist];
        }
      taken.set(key(best[0], best[1]), d); d.g = best;
    }
    // centre the whole grid in the box
    const gx = items.map((d) => d.g[0]), gy = items.map((d) => d.g[1]);
    const ox = x0 + ((x1 - x0) - (Math.max(...gx) - Math.min(...gx) + 1) * cell) / 2 - Math.min(...gx) * cell;
    const oy = y0 + ((y1 - y0 - keyH) - (Math.max(...gy) - Math.min(...gy) + 1) * cell) / 2 - Math.min(...gy) * cell;
    const k = 5, scale = d3.scaleQuantile().domain(items.map((d) => d.r.value)).range(d3.range(k)), colours = d3.range(k).map((j) => seq(th, 0.12 + 0.88 * j / (k - 1)));
    const marks = g.append("g").attr("id", "marks"), gap = Math.max(1, cell * 0.08);
    let ib = null;
    for (const d of items) {
      const x = ox + d.g[0] * cell, y = oy + d.g[1] * cell, row = core.rowGroup(marks, d.i, d.i, P), fill = colours[scale(d.r.value)];
      row.append("rect").attr("x", x + gap / 2).attr("y", y + gap / 2).attr("width", cell - gap).attr("height", cell - gap).attr("rx", cell * 0.1).attr("fill", fill);
      // a code where one exists; a council's name, cut to its first word, when it fits the square
      const code = STATE_CODES[d.f.properties.name] || d.f.properties.ADM0_A3 || String(d.f.properties.name ?? "").split(/[\s(]/)[0].toUpperCase();
      const px = Math.min(cell * 0.34, S * 0.03);
      if (px >= S * 0.013 && core.measure(code, "bebas", px).w < cell * 0.9) core.text(row, code, { x: x + cell / 2, y: y + cell / 2, face: "bebas", px, fill: onFill(fill), align: "c", valign: "mid" });
      if (P.on(d.i)) ib = [x, y, x + cell, y + cell];
    }
    geo.shadeKey(g, colours, scale.quantiles().map((v) => core.num(v >= 100 ? Math.round(v) : Math.round(v * 10) / 10, ctx, true)), [x0, y1 - keyH + S * 0.04], ctx);
    return ib;
  },
};
