// Locator map — where a place is. A view ("options.focus": the world, Australia, a state, a
// capital area, a country or a box) and one or more places: the first (or the insight) gets the
// olive pin and its name in Bebas, the rest a dot and their name in Arvo, each with its "note"
// under when given. A close-up gets a small overview map in a corner with the view outlined
// ("options.inset": "australia", "world" or false).
import * as core from "../core.js";
import * as geo from "../geo.js";

export default {
  id: "locator-map",
  name: "Locator map",
  needs: () => ["label"],
  insight: "first",
  draw(g, rows, box, ctx) {
    const { S, th, paint: P } = ctx, focus = ctx.options.focus || "australia", [x0, y0, x1, y1] = box;
    const base = geo.basemap(g, focus, box, ctx, { terrain: ctx.options.terrain ?? true });
    const fs = base.fs;
    const want = ctx.options.inset ?? (fs.world ? false : fs.australian ? (Array.isArray(focus) || fs.state || fs.capital ? "australia" : false) : "world");
    const pts = rows.map((r, i) => ({ r, i, xy: base.proj(geo.place(r)) })).filter((p) => p.xy);
    const marks = g.append("g").attr("id", "marks"), blocks = [];
    let insetBox = null;
    if (want) {
      const w = Math.min((x1 - x0) * 0.30, S * 0.28), h = w * 0.9;
      insetBox = [x1 - w, y1 - h, x1, y1];
      geo.inset(g, focus, want, insetBox, ctx);
      blocks.push(insetBox);
    }
    const main = pts.find((p) => P.on(p.i)) || pts[0];
    for (const p of pts) if (p !== main) { geo.marker(marks, p.xy, ctx); blocks.push([p.xy[0] - S * 0.01, p.xy[1] - S * 0.01, p.xy[0] + S * 0.01, p.xy[1] + S * 0.01]); }
    let ib = null;
    if (main) {
      const pin = geo.marker(marks, main.xy, ctx, { main: true });
      blocks.push(pin);
      // the main place's name in Bebas, its note under, beside the pin where there is room
      const name = String(main.r.label).toUpperCase(), px = S * 0.052, note = main.r.note || "";
      const w = Math.max(core.measure(name, "bebas", px).w, note ? Math.min(S * 0.34, core.measure(note, "arvo", S * 0.023).w) : 0);
      const h = px * 0.8 + (note ? S * 0.07 : 0);
      // beside the pin to the right, else the left, else below either side: the first spot clear of
      // the other places and the inset, and inside the box
      const spots = [[1, pin[1] - S * 0.005], [-1, pin[1] - S * 0.005], [1, main.xy[1] + S * 0.01], [-1, main.xy[1] + S * 0.01]];
      const fitsAt = ([side, top]) => {
        const bx = side > 0 ? [main.xy[0] + S * 0.025, top, main.xy[0] + S * 0.025 + w, top + h] : [main.xy[0] - S * 0.025 - w, top, main.xy[0] - S * 0.025, top + h];
        return bx[0] >= x0 && bx[2] <= x1 && bx[3] <= y1 && !blocks.slice(0, -1).some((t) => !(bx[2] < t[0] || bx[0] > t[2] || bx[3] < t[1] || bx[1] > t[3]));
      };
      const [side, ty] = spots.find(fitsAt) || spots[0], right = side > 0;
      const tx = right ? main.xy[0] + S * 0.025 : main.xy[0] - S * 0.025;
      const lb = core.text(marks, name, { x: tx, y: ty, face: "bebas", px, fill: th.ink, align: right ? "l" : "r", halo: [th.ground, S * 0.005] });
      let bottom = lb[3];
      if (note) [bottom] = core.para(marks, note, { x: tx, y: lb[3] + S * 0.012, px: S * 0.023, width: S * 0.34, fill: th.body, align: right ? "l" : "r", maxLines: 2 });
      ib = core.union(pin, [right ? tx : tx - w, lb[1], right ? tx + w : tx, bottom]);
      blocks.push(ib);
    }
    const others = pts.filter((p) => p !== main);
    const labels = others.map((p) => ({ xy: p.xy, text: p.r.label, face: "arvoBold", px: S * 0.024 }));
    labels.blocks = blocks;
    geo.labelPoints(g.append("g").attr("id", "labels"), labels, box, ctx);
    return null;
  },
};
