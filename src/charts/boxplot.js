// Box plot — FT Distribution; an `outlier` sub-mode. Every row a dot on one scale, grouped by
// "group" when the rows name one (one line per group), with the box over the middle half, the
// median as a bar across it, whiskers to the furthest points within one and a half boxes, and the
// odd one out named. Without groups it is one line: the whole table's spread.
import * as core from "../core.js";
import { mix } from "../theme.js";

const d3 = globalThis.d3;

export default {
  id: "boxplot",
  name: "Box plot",
  needs: () => ["value"],
  insight: "outlier",
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th, paint: P } = ctx, R = th.roles;
    const byGroup = d3.groups(rows.map((r, i) => ({ ...r, _i: i })), (r) => r.group ?? "");
    const grouped = byGroup.length > 1 || byGroup[0][0] !== "";
    const lp = S * 0.025;
    const labW = grouped ? Math.min(Math.max(...byGroup.map(([k]) => core.measure(String(k), "arvoBold", lp).w)), (x1 - x0) * 0.3) + S * 0.03 : 0;
    const vals = rows.map((r) => r.value);
    const [lo, hi, ticks] = core.spanOf(vals, false);
    const px0 = x0 + labW, px1 = x1 - S * 0.02;
    const X = (v) => px0 + (px1 - px0) * (v - lo) / ((hi - lo) || 1);
    const insightH = S * 0.16, top = y0 + insightH, bottom = y1 - S * 0.06;
    const rowH = Math.min((bottom - top) / byGroup.length, S * 0.16), start = top + ((bottom - top) - rowH * byGroup.length) / 2;
    const grid = g.append("g").attr("id", "grid"), faint = mix(R.neutral, th.ground, 0.5);
    for (const t of ticks) {
      core.dottedLine(grid, [X(t), start], [X(t), start + rowH * byGroup.length], faint, S);
      core.text(grid, core.num(t, ctx, true), { x: X(t), y: start + rowH * byGroup.length + S * 0.016, face: "arvo", px: S * 0.021, fill: th.body, align: "c", valign: "asc" });
    }
    const marks = g.append("g").attr("id", "marks");
    let ib = null, insPoint = null;
    byGroup.forEach(([name, rs], k) => {
      const gg = marks.append("g").attr("class", "group").attr("data-group", name).attr("data-order", k);
      const yc = start + rowH * (k + 0.5), v = rs.map((r) => r.value).sort((a, b) => a - b);
      const m = core.median(v), [q1, q3] = core.quartiles(v), iqr = q3 - q1;
      const wlo = Math.min(...v.filter((x) => x >= q1 - 1.5 * iqr)), whi = Math.max(...v.filter((x) => x <= q3 + 1.5 * iqr));
      const bh = Math.min(rowH * 0.5, S * 0.09);
      gg.append("line").attr("x1", X(wlo)).attr("x2", X(whi)).attr("y1", yc).attr("y2", yc).attr("stroke", R.neutral).attr("stroke-width", S * 0.004);
      for (const w of [wlo, whi]) gg.append("line").attr("x1", X(w)).attr("x2", X(w)).attr("y1", yc - bh * 0.3).attr("y2", yc + bh * 0.3).attr("stroke", R.neutral).attr("stroke-width", S * 0.004).attr("stroke-linecap", "round");
      gg.append("rect").attr("x", X(q1)).attr("y", yc - bh / 2).attr("width", Math.max(1, X(q3) - X(q1))).attr("height", bh).attr("rx", S * 0.010)
        .attr("fill", mix(R.muted, th.ground, 0.25)).attr("stroke", R.neutral).attr("stroke-width", S * 0.003);
      gg.append("line").attr("x1", X(m)).attr("x2", X(m)).attr("y1", yc - bh / 2).attr("y2", yc + bh / 2).attr("stroke", th.strong).attr("stroke-width", S * 0.007);
      if (grouped) core.text(gg, String(name), { x: px0 - S * 0.03, y: yc, face: "arvoBold", px: lp, fill: rs.some((r) => P.on(r._i)) ? th.ink : th.body, align: "r", valign: "mid" });
      // every row as a dot along the line, nudged up and down so equal values stay visible
      rs.forEach((r, j) => {
        const on = P.on(r._i), rad = S * (on ? 0.017 : 0.010) * P.grow(r._i);
        const y = yc + (on ? 0 : ((j % 3) - 1) * bh * 0.22);
        core.dot(core.rowGroup(gg, r._i, j, P), X(r.value), y, rad, on ? P.mark(r._i) : mix(R.muted, R.neutral, 0.2), on ? th.ground : R.neutral, Math.max(1.5, S * 0.002));
        if (on) insPoint = [X(r.value), y, rad, r];
      });
    });
    if (insPoint) {
      const [x, y, rad, r] = insPoint, ins = g.append("g").attr("id", "insight"), bw = S * 0.42;
      const lx = Math.min(Math.max(x - bw / 2, x0), x1 - bw);
      const vb = core.stat(ins, core.num(r.value, ctx), { x: lx + bw / 2, y: y0, px: S * 0.058, fill: P.words(r._i) });
      const [b1] = core.para(ins, r.label || "", { x: lx + bw / 2, y: vb[3] + S * 0.014 + S * 0.024 * 0.4, px: S * 0.024, width: bw, fill: th.ink, align: "c", bold: true, maxLines: 1 });
      core.dottedLine(ins, [x, b1 + S * 0.016], [x, y - rad - S * 0.010], R.neutral, S);
      ib = core.union([lx, vb[1], lx + bw, b1], [x - rad, y - rad, x + rad, y + rad]);
    }
    return ib;
  },
};
