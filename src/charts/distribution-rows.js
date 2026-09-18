// Shared by the dot strip, the barcode and the violin: one horizontal line per "group" (or one line
// for the whole table), on a shared scale, with the group names on the left and the insight named
// above its mark. Each chart draws its own marks along each line. Not a chart of its own.
import * as core from "../core.js";
import { mix } from "../theme.js";

const d3 = globalThis.d3;

export function lines(g, rows, [x0, y0, x1, y1], ctx, drawLine, { insightTop = true } = {}) {
  const { S, th, paint: P } = ctx;
  const groups = d3.groups(rows.map((r, i) => ({ ...r, _i: i })), (r) => r.group ?? "");
  const grouped = groups.length > 1 || groups[0][0] !== "", lp = S * 0.025;
  const labW = grouped ? Math.min(Math.max(...groups.map(([k]) => core.measure(String(k), "arvoBold", lp).w)), (x1 - x0) * 0.3) + S * 0.03 : 0;
  const [lo, hi, ticks] = core.spanOf(rows.map((r) => r.value), false);
  const px0 = x0 + labW, px1 = x1 - S * 0.02, X = (v) => px0 + (px1 - px0) * (v - lo) / ((hi - lo) || 1);
  const top = y0 + (insightTop ? S * 0.14 : S * 0.02), bottom = y1 - S * 0.06;
  const rowH = Math.min((bottom - top) / groups.length, S * 0.18), start = top + ((bottom - top) - rowH * groups.length) / 2;
  const grid = g.append("g").attr("id", "grid"), faint = mix(th.roles.neutral, th.ground, 0.5);
  for (const t of ticks) {
    core.dottedLine(grid, [X(t), start], [X(t), start + rowH * groups.length], faint, S);
    core.text(grid, core.num(t, ctx, true), { x: X(t), y: start + rowH * groups.length + S * 0.016, face: "arvo", px: S * 0.021, fill: th.body, align: "c", valign: "asc" });
  }
  const marks = g.append("g").attr("id", "marks");
  let hot = null;
  groups.forEach(([name, rs], k) => {
    const gg = marks.append("g").attr("class", "group").attr("data-group", name).attr("data-order", k), yc = start + rowH * (k + 0.5);
    if (grouped) core.text(gg, String(name), { x: px0 - S * 0.03, y: yc, face: "arvoBold", px: lp, fill: rs.some((r) => P.on(r._i)) ? th.ink : th.body, align: "r", valign: "fmid" });
    const h = drawLine(gg, rs, X, yc, rowH);
    const on = rs.find((r) => P.on(r._i));
    if (on) hot = { r: on, x: X(on.value), y: yc, h };
  });
  if (!hot) return null;
  const ins = g.append("g").attr("id", "insight"), bw = S * 0.42, lx = Math.min(Math.max(hot.x - bw / 2, x0), x1 - bw);
  const vb = core.stat(ins, core.num(hot.r.value, ctx), { x: lx + bw / 2, y: y0, px: S * 0.050, fill: P.words(hot.r._i) });
  const [b1] = core.para(ins, hot.r.label || "", { x: lx + bw / 2, y: vb[3] + S * 0.012 + S * 0.023 * 0.4, px: S * 0.023, width: bw, fill: th.ink, align: "c", bold: true, maxLines: 1 });
  core.dottedLine(ins, [hot.x, b1 + S * 0.014], [hot.x, hot.y - (hot.h || S * 0.02)], th.roles.neutral, S);
  return core.union([lx, vb[1], lx + bw, b1], [hot.x - S * 0.02, hot.y - S * 0.02, hot.x + S * 0.02, hot.y + S * 0.02]);
}
