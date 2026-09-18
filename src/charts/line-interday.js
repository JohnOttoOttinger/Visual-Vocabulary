// Intraday line — FT Change over time. A number through the hours of one or more days: rows carry
// "time" ("09:30") and "value", and a "day" when there is more than one; each day gets its own
// stretch of the axis with its name above, the line breaking between days. The day's peak is marked.
import * as core from "../core.js";
import { mix } from "../theme.js";

const d3 = globalThis.d3;

export default {
  id: "line-interday",
  name: "Intraday line",
  needs: () => ["time", "value"],
  insight: "max",
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th, paint: P } = ctx;
    const days = [...new Set(rows.map((r) => r.day ?? ""))];
    const [lo, hi, ticks] = core.spanOf(rows.map((r) => r.value));
    const px0 = x0 + core.tickWidth(ticks, ctx) + S * 0.03, px1 = x1, py0 = y0 + S * 0.14, py1 = y1 - S * 0.07;
    const Y = (v) => py1 - (py1 - py0) * (v - lo) / ((hi - lo) || 1);
    core.yGrid(g, ticks, Y, px0, px1, ctx);
    const gapX = days.length > 1 ? S * 0.02 : 0, dw = (px1 - px0 - gapX * (days.length - 1)) / days.length;
    const mins = rows.map((r) => core.when(r.time)), t0 = Math.min(...mins), t1 = Math.max(...mins);
    const X = (r) => { const d = days.indexOf(r.day ?? ""); return px0 + d * (dw + gapX) + dw * (core.when(r.time) - t0) / ((t1 - t0) || 1); };
    const axis = g.append("g").attr("id", "axis-x"), marks = g.append("g").attr("id", "marks"), tp = S * 0.021;
    days.forEach((day, d) => {
      const dx0 = px0 + d * (dw + gapX);
      if (day) core.text(axis, String(day).toUpperCase(), { x: dx0 + dw / 2, y: py0 - S * 0.07, face: "bebas", px: S * 0.030, fill: th.roles.neutral, align: "c" });
      if (d) core.dottedLine(axis, [dx0 - gapX / 2, py0 - S * 0.04], [dx0 - gapX / 2, py1], th.roles.neutral, S);
      const rs = rows.map((r, i) => ({ r, i })).filter(({ r }) => (r.day ?? "") === day);
      marks.append("path").attr("d", d3.line()(rs.map(({ r }) => [X(r), Y(r.value)]))).attr("fill", "none")
        .attr("stroke", th.strong).attr("stroke-width", S * 0.005).attr("stroke-linejoin", "round");
      const firstT = rs[0]?.r.time, lastT = rs[rs.length - 1]?.r.time;
      for (const t of [firstT, lastT]) if (t) core.text(axis, t, { x: X({ time: t, day }), y: py1 + S * 0.026, face: "arvo", px: tp, fill: th.body, align: t === firstT ? "l" : "r", valign: "asc" });
    });
    if (P.ins === null || P.ins === undefined) return null;
    const r = rows[P.ins], x = X(r), y = Y(r.value), ins = g.append("g").attr("id", "insight");
    core.dot(ins, x, y, S * 0.016, th.roles.main, th.ground, S * 0.004);
    const vb = core.stat(ins, core.num(r.value, ctx), { x: Math.min(Math.max(x, x0 + S * 0.08), x1 - S * 0.08), y: y - S * 0.022, px: S * 0.050, fill: P.words(P.ins), valign: "bottom" });
    const tb = core.text(ins, `${r.day ? r.day + ", " : ""}${r.time}`, { x: Math.min(Math.max(x, x0 + S * 0.08), x1 - S * 0.08), y: vb[1] - S * 0.008, face: "arvoBold", px: S * 0.021, fill: th.body, align: "c", valign: "bottom", halo: [th.ground, S * 0.003] });
    return core.union(vb, tb, [x - S * 0.016, y - S * 0.016, x + S * 0.016, y + S * 0.016]);
  },
};
