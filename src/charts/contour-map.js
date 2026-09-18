// Contour map — FT Spatial. Areas of equal value: every row a place with a weight ("value"), the
// weights smoothed into bands of equal density and shaded in one hue, clipped to the land, the
// biggest places named. For where things gather, not for exact counts.
import * as core from "../core.js";
import * as geo from "../geo.js";
import { seq } from "../theme.js";

const d3 = globalThis.d3;

export default {
  id: "contour-map",
  name: "Contour map",
  needs: () => ["label", "value"],
  insight: "max",
  draw(g, rows, box, ctx) {
    const { S, th, paint: P } = ctx, focus = ctx.options.focus || "world", [x0, y0, x1, y1] = box;
    const base = geo.basemap(g, focus, box, ctx);
    const pts = rows.map((r, i) => ({ r, i, xy: base.proj(geo.place(r)) })).filter((p) => p.xy);
    const bands = ctx.options.bands || 7;
    const dens = d3.contourDensity().x((p) => p.xy[0] - x0).y((p) => p.xy[1] - y0).weight((p) => Math.max(0, p.r.value))
      .size([x1 - x0, y1 - y0]).bandwidth(ctx.options.bandwidth || S * 0.05).thresholds(bands + 1)(pts);
    // clip the bands to the land in view
    const clip = `vv-land-${Math.round(x0)}-${Math.round(y0)}`, cp = g.append("clipPath").attr("id", clip);
    const lands = base.fs.australian ? geo.GEO.states : geo.GEO.world;
    for (const f of lands) cp.append("path").attr("d", base.path(f));
    const marks = g.append("g").attr("id", "marks").attr("clip-path", `url(#${clip})`).attr("transform", `translate(${x0},${y0})`);
    dens.slice(1).forEach((c, k) => marks.append("path").attr("d", d3.geoPath()(c)).attr("fill", seq(th, 0.15 + 0.85 * k / Math.max(1, dens.length - 2)))
      .attr("fill-opacity", 0.9).attr("stroke", th.ground).attr("stroke-width", Math.max(0.5, S * 0.001)));
    const top = [...pts].sort((a, b) => (P.on(b.i) ? 1 : 0) - (P.on(a.i) ? 1 : 0) || b.r.value - a.r.value).slice(0, ctx.options.names || 5);
    const lab = g.append("g").attr("id", "labels");
    for (const p of top) geo.marker(lab, p.xy, ctx, { r: S * 0.006 });
    geo.labelPoints(lab, top.map((p) => ({ xy: p.xy, text: p.r.label, face: P.on(p.i) ? "arvoBold" : "arvo", px: S * 0.021 })), box, ctx);
    return null;
  },
};
