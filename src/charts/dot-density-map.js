// Dot density map — FT Spatial. One dot for every so many ("options.per"): rows name a region, and
// its dots are scattered inside it at random (the same scatter every time); or rows name a place,
// and its dots gather round it. For showing where things are, one mark per unit; the key says
// what a dot is worth.
import * as core from "../core.js";
import * as geo from "../geo.js";
import { mix } from "../theme.js";

const d3 = globalThis.d3;

export default {
  id: "dot-density-map",
  name: "Dot density map",
  needs: () => ["label", "value"],
  insight: "max",
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th, paint: P } = ctx, focus = ctx.options.focus || "world", keyH = S * 0.07;
    const fs = geo.focusShape(focus), feats = geo.layer(ctx.options.layer || (fs.world || !fs.australian ? "world" : "states"));
    const base = geo.basemap(g, focus, [x0, y0, x1, y1 - keyH], ctx);
    const total = d3.sum(rows, (r) => r.value), per = ctx.options.per || Math.max(1, Math.round(total / 3000));
    const rnd = d3.randomLcg(7), gauss = d3.randomNormal.source(rnd)(0, 1);
    // dots stay on the land
    const clip = `vv-dots-${Math.round(x0)}-${Math.round(y0)}`, cp = g.append("clipPath").attr("id", clip);
    for (const f of base.fs.australian ? geo.GEO.states : geo.GEO.world) cp.append("path").attr("d", base.path(f));
    const marks = g.append("g").attr("id", "marks").attr("clip-path", `url(#${clip})`);
    const dr = Math.max(0.8, S * (ctx.options.dot || 0.0028));
    rows.forEach((r, i) => {
      const n = Math.round(r.value / per), f = geo.region(feats, r.label), row = core.rowGroup(marks, i, i, P);
      const fill = P.on(i) ? th.roles.main : th.strong;
      if (f) {
        const [[w, s], [e, nn]] = d3.geoBounds(f);
        for (let k = 0, tries = 0; k < n && tries < n * 60; tries++) {
          const pt = [w + (e - w) * rnd(), s + (nn - s) * rnd()];
          if (!d3.geoContains(f, pt)) continue;
          const xy = base.proj(pt); if (xy) row.append("circle").attr("cx", xy[0]).attr("cy", xy[1]).attr("r", dr).attr("fill", fill);
          k++;
        }
      } else {
        const c = base.proj(geo.place(r)), spread = S * 0.0012 * Math.sqrt(n);
        for (let k = 0; k < n; k++) row.append("circle").attr("cx", c[0] + gauss() * spread).attr("cy", c[1] + gauss() * spread).attr("r", dr).attr("fill", fill).attr("fill-opacity", 0.8);
      }
    });
    const key = g.append("g").attr("id", "key");
    core.dot(key, x0 + dr * 3, y1 - keyH / 2, dr * 2, th.strong);
    core.text(key, `one dot = ${core.num(per, ctx)}`, { x: x0 + dr * 6 + S * 0.01, y: y1 - keyH / 2, face: "arvo", px: S * 0.021, fill: th.body, valign: "fmid" });
    const hot = rows.findIndex((_, i) => P.on(i));
    if (hot >= 0) {
      const r = rows[hot], f = geo.region(feats, r.label), c = base.proj(f ? d3.geoCentroid(f) : geo.place(r));
      geo.labelPoints(g.append("g").attr("id", "labels"), [{ xy: c, r: S * 0.02, text: `${r.label} ${core.num(r.value, ctx)}`, face: "arvoBold", px: S * 0.024, fill: P.words(hot) }], [x0, y0, x1, y1 - keyH], ctx);
    }
    return null;
  },
};
