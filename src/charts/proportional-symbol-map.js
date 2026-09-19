// Proportional symbol map — FT Spatial. Totals at places: each row a place ("label" a city, with
// "country" when names repeat, or "lat" and "lon") and its "value", a circle whose area is the
// value, the biggest drawn first so small ones sit on top. The biggest few are named; the insight
// in olive. A key of two circles gives the scale. options.focus as for every map.
import * as core from "../core.js";
import * as geo from "../geo.js";
import { mix } from "../theme.js";

const d3 = globalThis.d3;

export default {
  id: "proportional-symbol-map",
  name: "Proportional symbol map",
  needs: () => ["label", "value"],
  insight: "max",
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th, paint: P } = ctx, focus = ctx.options.focus || "world", keyH = S * 0.10;
    const vmax = Math.max(...rows.map((r) => r.value)) || 1, rmax = ctx.options.maxRadius || S * 0.07;
    const R = d3.scaleSqrt().domain([0, vmax]).range([0, rmax]);
    // the key's two circles and their numbers, measured so the map knows the room they take
    const keyVals = [vmax, vmax / 4], kr = (v) => Math.min(R(v), keyH * 0.42);
    const keyW = keyVals.reduce((w, v) => w + kr(v) * 2 + S * 0.012 + core.measure(core.num(Math.round(v), ctx), "arvo", S * 0.020).w + S * 0.04, 0);
    const room = geo.mapRoom(focus, [x0, y0, x1, y1], ctx, { bottom: [keyW, keyH * 0.9] });
    const base = geo.basemap(g, focus, [x0, y0, x1, y1], ctx, { fit: room.fit, terrain: ctx.options.terrain ?? true });
    const pts = rows.map((r, i) => ({ r, i, xy: base.proj(geo.place(r)) })).filter((p) => p.xy);
    const marks = g.append("g").attr("id", "marks");
    [...pts].sort((a, b) => b.r.value - a.r.value).forEach((p, o) => {
      core.dot(core.rowGroup(marks, p.i, o, P), p.xy[0], p.xy[1], Math.max(S * 0.003, R(p.r.value)),
        P.on(p.i) ? mix(th.roles.main, th.ground, 0.1) : mix(th.roles.muted, th.roles.neutral, 0.2), th.ground, Math.max(1, S * 0.002)).attr("fill-opacity", 0.9);
    });
    const named = [...pts].sort((a, b) => (P.on(b.i) ? 1 : 0) - (P.on(a.i) ? 1 : 0) || b.r.value - a.r.value).slice(0, ctx.options.names || 6);
    const items = named.map((p) => ({ xy: p.xy, r: R(p.r.value), text: `${p.r.label} ${core.num(p.r.value, ctx)}`,
      face: P.on(p.i) ? "arvoBold" : "arvo", px: S * (P.on(p.i) ? 0.024 : 0.020), fill: P.on(p.i) ? P.words(p.i) : th.ink }));
    items.blocks = [[room.bottom[0], room.bottom[1], room.bottom[0] + keyW, room.bottom[1] + keyH]];   // names keep off the key
    geo.labelPoints(g.append("g").attr("id", "labels"), items, [x0, y0, x1, y1], ctx);
    // the scale: the biggest value and a quarter of it
    const key = g.append("g").attr("id", "key"), ky = room.bottom[1] + keyH * 0.45;
    let kx = room.bottom[0];
    for (const v of keyVals) {
      const rr = kr(v);
      core.dot(key, kx + rr, ky, rr, "none", th.roles.neutral, S * 0.002);
      const tb = core.text(key, core.num(Math.round(v), ctx), { x: kx + rr * 2 + S * 0.012, y: ky, face: "arvo", px: S * 0.020, fill: th.body, valign: "fmid" });
      kx = tb[2] + S * 0.04;
    }
    const hot = pts.find((p) => P.on(p.i));
    return hot ? [hot.xy[0] - R(hot.r.value), hot.xy[1] - R(hot.r.value), hot.xy[0] + R(hot.r.value), hot.xy[1] + R(hot.r.value)] : null;
  },
};
