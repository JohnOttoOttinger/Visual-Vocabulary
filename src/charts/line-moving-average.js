// Line with moving average — FT Change over time. The raw numbers as a faint line with small dots,
// the moving average over them as the heavy line that carries the story, its last point marked with
// its value. options.window sets how many periods are averaged (default 4, or 7 past 30 rows);
// options.period names them ("week").
import * as core from "../core.js";
import { mix } from "../theme.js";

const d3 = globalThis.d3;

export default {
  id: "line-moving-average",
  name: "Line with moving average",
  needs: () => ["value"],
  insight: "last",
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th, paint: P } = ctx, n = rows.length, win = ctx.options.window || (n > 30 ? 7 : 4);
    const vals = rows.map((r) => r.value);
    const avg = vals.map((_, i) => (i + 1 >= win ? d3.mean(vals.slice(i + 1 - win, i + 1)) : NaN));
    const [lo, hi, ticks] = core.spanOf(vals);
    const lp = S * 0.024, tag = ctx.options.period ? `${win}-${ctx.options.period} average` : `average of the last ${win}`;
    const px0 = x0 + core.tickWidth(ticks, ctx) + S * 0.03;
    // names, not dates, under the points: wrapped under every point instead of every few
    const tp = S * 0.022, step = (x1 - x0) / Math.max(1, n - 1);
    const long = rows.some((r) => core.measure(String(r.label ?? ""), "arvo", tp).w > step * Math.max(1, Math.ceil(n / 7)) * 0.95);
    const py0 = y0 + S * 0.12, py1 = y1 - (long ? S * 0.11 : S * 0.07);
    const px1 = x1 - (long ? (x1 - px0) / Math.max(1, n - 1) * 0.47 : S * 0.01);   // room for the last name
    const X = (i) => px0 + (px1 - px0) * i / Math.max(1, n - 1), Y = (v) => py1 - (py1 - py0) * (v - lo) / ((hi - lo) || 1);
    core.yGrid(g, ticks, Y, px0, px1, ctx);
    const every = Math.max(1, Math.ceil(n / 7)), xl = g.append("g").attr("id", "axis-x");
    const lpx = long ? core.fitWords(rows.map((r) => r.label), "arvo", tp, (px1 - px0) / Math.max(1, n - 1) * 0.94, S * 0.013) : tp;
    rows.forEach((r, i) => {
      if (long) core.para(xl, String(r.label ?? ""), { x: X(i), y: py1 + S * 0.03, px: lpx, width: (px1 - px0) / Math.max(1, n - 1) * 0.94, fill: th.body, align: "c", maxLines: 3 });
      else if (i % every === 0 || i === n - 1) core.text(xl, r.label ?? "", { x: X(i), y: py1 + S * 0.03, face: "arvo", px: tp, fill: th.body, align: "c", valign: "asc" });
    });
    const marks = g.append("g").attr("id", "marks");
    const raw = vals.map((v, i) => [X(i), Y(v)]);
    marks.append("path").attr("d", d3.line()(raw)).attr("fill", "none").attr("stroke", mix(th.roles.neutral, th.ground, 0.45)).attr("stroke-width", S * 0.003);
    if (n <= 60) raw.forEach(([x, y]) => core.dot(marks, x, y, S * 0.006, mix(th.roles.neutral, th.ground, 0.3)));
    const ma = avg.map((v, i) => [X(i), Number.isFinite(v) ? Y(v) : NaN]);
    marks.append("path").attr("id", "average").attr("d", d3.line().defined((p) => Number.isFinite(p[1]))(ma)).attr("fill", "none")
      .attr("stroke", th.roles.main).attr("stroke-width", S * 0.009).attr("stroke-linecap", "round").attr("stroke-linejoin", "round");
    const k = n - 1;
    if (!Number.isFinite(avg[k])) return null;
    const x = X(k), y = Y(avg[k]), ins = g.append("g").attr("id", "insight");
    core.dot(ins, x, y, S * 0.018, th.roles.main, th.ground, S * 0.005);
    const cx = Math.min(x, x1 - core.measure(tag, "arvoBold", lp).w / 2 - S * 0.005);   // the words stay inside the box
    const vb = core.stat(ins, core.num(Math.round(avg[k] * 10) / 10, ctx), { x: cx, y: py0 - S * 0.10, px: S * 0.058, fill: P.words(k) });
    core.text(ins, tag, { x: cx, y: vb[3] + S * 0.012, face: "arvoBold", px: lp, fill: th.body, align: "c", valign: "asc" });
    return core.union(vb, [x - S * 0.018, y - S * 0.018, x + S * 0.018, y + S * 0.018]);
  },
};
