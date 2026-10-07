// Venn — FT Part-to-whole (FT: generally schematic). Two or three sets and what they share: rows
// name the sets in "sets" (["A"], ["A", "B"], ...) with each region's count as "value" — a region
// counts only what is in exactly those sets. The circles are sized by each set's total; every
// region carries its count, the sets their names. The insight is the region shared by all.
import * as core from "../core.js";
import { mix } from "../theme.js";

const d3 = globalThis.d3;
// the three-way overlap is the darkest part of the diagram, so its words are cream (a paler cream than the accent cream, which was too close to the grey)
const CREAM = "#F3EDE2";
const keyOf = (sets) => [...sets].sort().join(" & ");

const mostShared = (rows) => rows.reduce((m, r, i) => ((r.sets || []).length > (rows[m].sets || []).length ? i : m), 0);

// a few words broken into lines no wider than `width`
function lines(str, face, px, width) {
  const out = []; let cur = "";
  for (const w of String(str).split(" ").filter(Boolean)) {
    const next = cur ? `${cur} ${w}` : w;
    if (cur && core.measure(next, face, px).w > width) { out.push(cur); cur = w; } else cur = next;
  }
  if (cur) out.push(cur);
  return out;
}

function drawVenn(g, rows, [x0, y0, x1, y1], ctx, words) {
    const { S, th, paint: P } = ctx;
    const sets = core.listOf(rows, "sets", "venn");
    const names = [...new Set(sets.flat())].slice(0, 3), n = names.length;
    if (n < 2) throw new Error("venn: name at least two sets");
    const region = new Map(rows.map((r, i) => [keyOf(sets[i]), { v: words ? r.label : r.value, i }]));
    const total = (nm) => (words ? 0 : d3.sum(rows.filter((r, i) => sets[i].includes(nm)), (r) => r.value));
    const cx = (x0 + x1) / 2, cy = y0 + (y1 - y0) * (n === 3 ? 0.47 : 0.5), span = Math.min(x1 - x0, (y1 - y0) * (n === 3 ? 1 : 1.3));
    const tmax = Math.max(...names.map(total)) || 1;
    const rBase = span * (n === 3 ? 0.363 : 0.396), rad = names.map((s) => rBase * (words ? 1 : 0.75 + 0.25 * Math.sqrt(total(s) / tmax)));
    // fixed, symmetric places: two side by side, three in a triangle
    const d = rBase * (n === 3 ? 0.95 : 1.05);
    const at = n === 2 ? [[cx - d / 2, cy], [cx + d / 2, cy]]
      : [[cx - d / 2, cy - d * 0.29], [cx + d / 2, cy - d * 0.29], [cx, cy + d * 0.58]];
    const colours = names.map((_, k) => th.series[[0, 2, 1][k]]);
    const marks = g.append("g").attr("id", "marks");
    names.forEach((s, k) => marks.append("circle").attr("class", "set").attr("data-set", s).attr("cx", at[k][0]).attr("cy", at[k][1]).attr("r", rad[k])
      .attr("fill", colours[k]).attr("fill-opacity", th.dark ? 0.32 : 0.30).attr("stroke", colours[k]).attr("stroke-width", S * 0.004));
    // where each region's count goes: away from the others for one set, between them for shared ones
    const centre = [d3.mean(at, (p) => p[0]), d3.mean(at, (p) => p[1])];
    const spot = (ks) => {
      if (ks.length === 1) { const k = ks[0], dx = at[k][0] - centre[0], dy = at[k][1] - centre[1], L = Math.hypot(dx, dy) || 1; return [at[k][0] + dx / L * rad[k] * (words ? 0.5 : 0.45), at[k][1] + dy / L * rad[k] * (words ? 0.5 : 0.45)]; }
      if (ks.length === n) return centre;
      const m = [d3.mean(ks, (k) => at[k][0]), d3.mean(ks, (k) => at[k][1])];
      if (n === 3) { const dx = m[0] - centre[0], dy = m[1] - centre[1], L = Math.hypot(dx, dy) || 1; const out = words ? 0.38 : 0.28; return [m[0] + dx / L * rBase * out, m[1] + dy / L * rBase * out]; }
      return m;
    };
    let ib = null;
    const subsets = n === 2 ? [[0], [1], [0, 1]] : [[0], [1], [2], [0, 1], [0, 2], [1, 2], [0, 1, 2]];
    for (const ks of subsets) {
      const hit = region.get(keyOf(ks.map((k) => names[k])));
      if (!hit) continue;
      const [x, y] = spot(ks), on = P.on(hit.i);
      let vb;
      if (words) {
        const px = S * 0.020 * (ks.length === n ? 1.12 : 1), fill = ks.length === n ? CREAM : on ? P.words(hit.i) : th.ink, face = on ? "arvoBold" : "arvo", lh = px * 1.25;
        // Put the words where they clear every circle's line: inside the circles the region is in,
        // outside the rest. Tries a few line widths and a grid of places, and keeps the one whose
        // nearest point to a line is farthest away (capped, so it then stays near its home spot).
        const clear = (px_, py_) => Math.min(...names.map((_, k) => {
          const dd = Math.hypot(px_ - at[k][0], py_ - at[k][1]);
          return ks.includes(k) ? rad[k] - dd : dd - rad[k];
        }));
        const cap = S * 0.03, step = S * 0.008, home = [x, y];
        let best = null;
        for (const wf of [0.5, 0.7, 0.9, 1.15]) {
          const ls = lines(hit.v, face, px, rBase * wf);
          const w = Math.max(...ls.map((ln) => core.measure(ln, face, px).w)), h = ls.length * lh;
          for (let gx = x0; gx <= x1; gx += step) for (let gy = y0; gy <= y1; gy += step) {
            let c = Infinity;
            for (const [u, v] of [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1], [-0.5, -1], [0.5, -1], [-0.5, 1], [0.5, 1]]) c = Math.min(c, clear(gx + u * w / 2, gy + v * h / 2));
            const sc = Math.min(c, cap) * 1000 - Math.hypot(gx - home[0], gy - home[1]) - ls.length * S * 0.002;
            if (!best || sc > best.sc) best = { sc, c, ls, x: gx, y: gy };
          }
        }
        if (best.c < 0) ctx.warn(`venn-words: "${hit.v}" does not fit inside its region`);
        const bx = [Infinity, Infinity, -Infinity, -Infinity];
        best.ls.forEach((ln, j) => {
          const b = core.text(marks, ln, { x: best.x, y: best.y + (j - (best.ls.length - 1) / 2) * lh, face, px, fill, align: "c", valign: "mid" });
          bx[0] = Math.min(bx[0], b[0]); bx[1] = Math.min(bx[1], b[1]); bx[2] = Math.max(bx[2], b[2]); bx[3] = Math.max(bx[3], b[3]);
        });
        vb = bx;
      } else vb = core.stat(marks, core.num(hit.v, ctx), { x, y, px: S * (on ? 0.060 : 0.044), fill: on ? P.words(hit.i) : th.ink, valign: "mid" });
      if (on) ib = [vb[0] - S * 0.02, vb[1] - S * 0.02, vb[2] + S * 0.02, vb[3] + S * 0.02];
    }
    // set names beside their circles, each tied to its circle by a 1 pt line
    const way = n === 2 ? [-125, -55] : [-125, -55, 150];
    names.forEach((s, k) => {
      const t = way[k] * Math.PI / 180, ux = Math.cos(t), uy = Math.sin(t);
      const ex = at[k][0] + ux * rad[k], ey = at[k][1] + uy * rad[k];
      const lx = ex + ux * S * 0.05, ly = ey + uy * S * 0.05;
      g.append("line").attr("class", "set-line").attr("x1", ex).attr("y1", ey).attr("x2", lx).attr("y2", ly)
        .attr("stroke", th.ink).attr("stroke-width", 1);
      core.text(g, words ? s : `${s} \u00b7 ${core.num(total(s), ctx)}`, { x: lx + (ux < 0 ? -1 : 1) * S * 0.01, y: ly, face: "arvoBold", px: S * 0.027, fill: th.ink, align: ux < 0 ? "r" : "l", valign: "mid" });
    });
    return ib;
}

export default {
  id: "venn",
  name: "Venn",
  needs: () => ["sets", "value"],
  insight: mostShared,
  draw: (g, rows, box, ctx) => drawVenn(g, rows, box, ctx, false),
  ringOnHue: false,
};

export const vennWords = {
  id: "venn-words",
  name: "Venn, in words",
  needs: () => ["sets", "label"],
  insight: mostShared,
  draw: (g, rows, box, ctx) => drawVenn(g, rows, box, ctx, true),
  ringOnHue: false,
};
