// Scaled cartogram — FT Spatial. Regions resized by a number: each row's region a circle at its
// place, its area the "value", nudged apart so none overlap (a Dorling cartogram), over a faint map
// for bearings. The biggest are named inside their circles; the insight in olive.
import * as core from "../core.js";
import * as geo from "../geo.js";
import { mix, onFill } from "../theme.js";

const d3 = globalThis.d3;

export default {
  id: "cartogram-scaled",
  name: "Scaled cartogram",
  needs: () => ["label", "value"],
  insight: "max",
  draw(g, rows, box, ctx) {
    const { S, th, paint: P } = ctx, focus = ctx.options.focus || "world";
    const fs = geo.focusShape(focus), feats = geo.layer(ctx.options.layer || (fs.world || !fs.australian ? "world" : fs.state || fs.capital ? "councils" : "states"));
    const base = geo.basemap(g, focus, box, ctx);
    base.layer.attr("opacity", 0.45);
    const items = rows.map((r, i) => { const f = geo.region(feats, r.label); const c = f && base.proj(d3.geoCentroid(f)); return c && { r, i, f, x: c[0], y: c[1], tx: c[0], ty: c[1] }; }).filter(Boolean);
    const vmax = Math.max(...items.map((d) => d.r.value)) || 1, R = d3.scaleSqrt().domain([0, vmax]).range([0, ctx.options.maxRadius || S * 0.085]);
    items.forEach((d) => { d.rad = Math.max(S * 0.004, R(d.r.value)); });
    const sim = d3.forceSimulation(items).force("x", d3.forceX((d) => d.tx).strength(0.3)).force("y", d3.forceY((d) => d.ty).strength(0.3))
      .force("collide", d3.forceCollide((d) => d.rad + S * 0.002).iterations(3)).stop();
    for (let t = 0; t < 300; t++) sim.tick();
    for (const d of items) { d.x = Math.min(Math.max(d.x, box[0] + d.rad), box[2] - d.rad); d.y = Math.min(Math.max(d.y, box[1] + d.rad), box[3] - d.rad); }
    const marks = g.append("g").attr("id", "marks");
    let ib = null;
    [...items].sort((a, b) => b.rad - a.rad).forEach((d, o) => {
      const fill = P.on(d.i) ? th.roles.main : mix(th.roles.muted, th.roles.neutral, 0.25), row = core.rowGroup(marks, d.i, o, P);
      core.dot(row, d.x, d.y, d.rad, fill, th.ground, Math.max(1, S * 0.002));
      const code = d.f.properties.ADM0_A3 && d.rad < S * 0.05 ? d.f.properties.ADM0_A3 : (d.f.properties.NAME || d.f.properties.name);
      const px = Math.min(d.rad * 0.5, S * 0.026);
      if (px > S * 0.011 && core.measure(code, "arvoBold", px).w < d.rad * 1.9) core.text(row, code, { x: d.x, y: d.y, face: "arvoBold", px, fill: onFill(fill), align: "c", valign: "fmid" });
      if (P.on(d.i)) ib = [d.x - d.rad, d.y - d.rad, d.x + d.rad, d.y + d.rad];
    });
    return ib;
  },
};
