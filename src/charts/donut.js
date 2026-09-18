// Donut — FT Part-to-whole; the Storyteller's `proportions` mode. One whole split by share: the
// insight's slice in olive with its share in Depot in the hole, the rest in a run of creams
// stepping darker by size, a key underneath with each share.
//
// Pie is the same drawing with no hole ({"hole": 0}); the pie chart module sets that.
import * as core from "../core.js";
import { mix } from "../theme.js";

const d3 = globalThis.d3;

export function drawDonut(g, rows, [x0, y0, x1, y1], ctx, hole = 0.29) {
  const { S, th, paint: P } = ctx, R = th.roles;
  const total = d3.sum(rows, (r) => r.value) || 1;
  const share = rows.map((r) => r.value / total);
  const cols = rows.length > 3 ? 2 : 1, lrow = S * 0.056;
  const legendH = Math.ceil(rows.length / cols) * lrow;
  const D = Math.min((x1 - x0) * 0.64, (y1 - y0) - legendH - S * 0.06);
  const cx = (x0 + x1) / 2, cy = y0 + D / 2;
  const rank = rows.map((_, i) => i).sort((a, b) => share[b] - share[a]);
  const others = rank.filter((i) => !P.on(i));
  const colour = (i) => {
    if (P.on(i)) return P.how !== "enclosure" ? P.mark(i) : R.main;
    const t = others.indexOf(i) / Math.max(1, others.length - 1);
    const base = mix(th.ramp[0], th.ramp[1], t);
    return P.how === "intensity" ? mix(base, th.ground, 0.30) : base;
  };
  const marks = g.append("g").attr("id", "marks").attr("transform", `translate(${cx},${cy})`);
  let a = 0;
  rows.forEach((r, i) => {
    const sweep = 2 * Math.PI * share[i], grow = (P.grow(i) - 1) * D * 0.05;
    const arc = d3.arc().innerRadius(D * hole).outerRadius(D / 2 + grow)
      .startAngle(a).endAngle(a + sweep);
    core.rowGroup(marks, i, rank.indexOf(i), P).append("path").attr("d", arc())
      .attr("fill", colour(i)).attr("stroke", th.ground).attr("stroke-width", S * 0.006).attr("stroke-linejoin", "round");
    a += sweep;
  });
  let ib = null;
  if (hole) {
    const ins = g.append("g").attr("id", "insight");
    if (P.ins !== null && P.ins !== undefined) {
      const pct = `${Math.round(share[P.ins] * 100)}%`;
      let sp = D * 0.19;
      while (sp > D * 0.08 && core.measure(pct, core.statFace(pct), sp).w > D * 0.44) sp -= 2;
      const lp = S * 0.024, gap = S * 0.018, name = rows[P.ins].label || "";
      const sm = core.measure(pct, core.statFace(pct), sp), sh = sm.asc + sm.desc;
      const lh = core.paraHeight(name, lp, D * 0.46, 2);
      const top = cy - (sh + gap + lh) / 2;
      const hb = core.stat(ins, pct, { x: cx, y: top, px: sp, fill: P.words(P.ins) });
      core.para(ins, name, { x: cx, y: hb[3] + gap, px: lp, width: D * 0.46, fill: th.body, align: "c", bold: true, maxLines: 2 });
      ib = [cx - D / 2, cy - D / 2, cx + D / 2, cy + D / 2];
    } else {
      const t = core.num(total, ctx);
      let sp = D * 0.19;
      while (sp > D * 0.08 && core.measure(t, core.statFace(t), sp).w > D * 0.44) sp -= 2;
      core.stat(ins, t, { x: cx, y: cy, px: sp, fill: th.ink, valign: "mid" });
    }
  }
  // the key: swatch, name, share
  const key = g.append("g").attr("id", "key"), ly0 = cy + D / 2 + S * 0.05, colw = (x1 - x0) / cols;
  rank.forEach((i, n) => {
    const lx = x0 + (n % cols) * colw, ly = ly0 + Math.floor(n / cols) * lrow, sw = S * 0.028;
    const kg = key.append("g").attr("class", "key-row").attr("data-row", i);
    kg.append("rect").attr("x", lx).attr("y", ly).attr("width", sw).attr("height", sw).attr("fill", colour(i));
    const pct = `${Math.round(share[i] * 100)}%`;
    const pw = core.measure(pct, "bebas", S * 0.036).w;
    const px = core.shrinkTo(rows[i].label || "", "arvoBold", S * 0.025, colw - sw - S * 0.05 - pw, S * 0.018);
    core.text(kg, rows[i].label || "", { x: lx + sw + S * 0.018, y: ly + sw / 2, face: "arvoBold", px, fill: P.on(i) ? P.words(i) : th.body, valign: "mid" });
    core.text(kg, pct, { x: lx + colw - S * 0.03, y: ly + sw / 2, face: "bebas", px: S * 0.036, fill: P.on(i) ? P.words(i) : th.ink, align: "r", valign: "mid" });
  });
  return ib;
}

export default {
  id: "donut",
  name: "Donut",
  needs: () => ["label", "value"],
  insight: "max",
  draw: (g, rows, box, ctx) => drawDonut(g, rows, box, ctx, ctx.options.hole ?? 0.29),
};
