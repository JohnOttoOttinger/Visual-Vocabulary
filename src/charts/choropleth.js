// Choropleth — FT Spatial. Regions shaded by a rate: each row names a region ("label": a country,
// an Australian state or a council) and its "value", shaded in one hue in five steps of equal
// counts (options.classes to change), with a key of the breaks. Always a rate, never a total, or
// the biggest places win by size alone. The insight region is outlined and named with its value.
// options.focus: what the map shows (world, australia, a state, a capital, a box); options.layer:
// world, states or councils (default: the finest the focus suits).
import * as core from "../core.js";
import * as geo from "../geo.js";
import { seq } from "../theme.js";

const d3 = globalThis.d3;

export default {
  id: "choropleth",
  name: "Choropleth",
  needs: () => ["label", "value"],
  insight: "max",
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th, paint: P } = ctx, focus = ctx.options.focus || "world";
    const fs = geo.focusShape(focus);
    const layerName = ctx.options.layer || (fs.world || !fs.australian ? "world" : fs.state || fs.capital || fs.box ? "councils" : "states");
    const feats = geo.layer(layerName), keyH = S * 0.11;
    const base = geo.basemap(g, focus, [x0, y0 + S * 0.10, x1, y1 - keyH], ctx);
    const vals = rows.map((r) => r.value), k = ctx.options.classes || 5;
    const scale = d3.scaleQuantile().domain(vals).range(d3.range(k));
    const colours = d3.range(k).map((i) => seq(th, 0.12 + 0.88 * i / (k - 1)));
    const shade = base.layer.append("g").attr("id", "marks"), missing = [];
    let hot = null;
    rows.forEach((r, i) => {
      const f = geo.region(feats, r.label);
      if (!f) { missing.push(r.label); return; }
      const p = shade.append("path").attr("data-row", i).attr("d", base.path(f)).attr("fill", colours[scale(r.value)]).attr("stroke", th.ground).attr("stroke-width", Math.max(0.5, S * 0.0012));
      if (P.on(i)) { hot = { f, r }; p.attr("data-insight", "true"); }
    });
    if (missing.length) ctx.warn(`${missing.length} rows name no ${layerName} region: ${missing.slice(0, 5).join(", ")}${missing.length > 5 ? "…" : ""}`);
    const q = scale.quantiles(), fmt = (v) => core.num(v >= 100 ? Math.round(v) : Math.round(v * 10) / 10, ctx, true);
    geo.shadeKey(g, colours, q.map(fmt), [x0, y1 - keyH + S * 0.04], ctx);
    if (!hot) return null;
    const ins = g.append("g").attr("id", "insight");
    ins.append("path").attr("d", base.path(hot.f)).attr("fill", "none").attr("stroke", th.ink).attr("stroke-width", S * 0.004).attr("clip-path", `url(#${base.clipId})`);
    const [cx, cy] = base.path.centroid(hot.f);
    const vb = core.stat(ins, core.num(hot.r.value, ctx), { x: x0 + S * 0.10, y: y0, px: S * 0.056, fill: P.words(P.ins) });
    const lb = core.text(ins, hot.r.label, { x: vb[2] + S * 0.016, y: (vb[1] + vb[3]) / 2, face: "arvoBold", px: S * 0.026, fill: th.ink, valign: "fmid" });
    if (Number.isFinite(cx)) core.dottedLine(ins, [x0 + S * 0.10, vb[3] + S * 0.012], [cx, cy], th.ink, S);
    return core.union(vb, lb);
  },
};
