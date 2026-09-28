// Process spine — the Storyteller's `process` mode (not in the FT set). Step by step: a narrow spine
// of nested chevrons down the left carrying only the step's number in Depot, each step's name and
// line on the ground beside it, level with the chevron's middle. Alternating tones, as in the pack;
// the insight in olive. (Otto, 18 Sep 2026: text inside angled chevrons did not look designed.)
import * as core from "../core.js";
import { mix } from "../theme.js";

export default {
  id: "process-spine",
  name: "Process spine",
  needs: () => ["label"],
  insight: null,
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    // A wide box runs the steps across instead of down: chevrons pointing right, each step's name
    // and line under its own chevron (Otto, 28 Sep 2026).
    if (x1 - x0 > (y1 - y0) * 1.25) return this.across(g, rows, [x0, y0, x1, y1], ctx);
    const { S, th, paint: P } = ctx, R = th.roles;
    const n = rows.length, gapv = S * 0.014;
    const h = Math.min((y1 - y0 - gapv * (n - 1)) / (n + 0.32), S * 0.17), point = h * 0.32, cw = S * 0.19;
    const total = n * h + (n - 1) * gapv + point, start = y0 + ((y1 - y0) - total) / 2;
    const sx0 = x0, sx1 = x0 + cw, scx = (sx0 + sx1) / 2, tx = sx1 + S * 0.050, tw = x1 - tx;
    const tones = [R.muted, mix(R.muted, R.neutral, 0.24)];
    let lpx = S * 0.050;
    while (lpx > S * 0.030 && Math.max(...rows.map((r) => core.measure((r.label || "").toUpperCase(), "bebas", lpx).w)) > tw) lpx -= 1;
    const marks = g.append("g").attr("id", "marks");
    let ib = null;
    rows.forEach((r, i) => {
      const row = core.rowGroup(marks, i, i, P), top = start + i * (h + gapv), notch = i ? point : 0;
      row.append("path").attr("fill", P.on(i) && P.how !== "enclosure" ? P.mark(i) : tones[i % 2])
        .attr("d", `M${sx0},${top}L${scx},${top + notch}L${sx1},${top}L${sx1},${top + h}L${scx},${top + h + point}L${sx0},${top + h}Z`);
      const mid = top + (notch * 0.5 + h + point * 0.5) / 2;
      const onFill = P.on(i) && ["hue", "intensity"].includes(P.how);
      core.stat(row, String(i + 1), { x: scx, y: mid, px: Math.min(S * 0.066, h * 0.46), fill: onFill ? R.onMain : mix(R.neutral, th.ink, 0.25), valign: "mid", face: "depot" });
      const cap = core.measure("H", "bebas", lpx).asc, npx = S * 0.025;
      const nh = core.paraHeight(r.note, npx, tw, 2), gap = r.note ? S * 0.014 : 0;
      const lb = core.text(row, (r.label || "").toUpperCase(), { x: tx, y: mid - (cap + gap + nh) / 2, face: "bebas", px: lpx, fill: P.words(i), ref: "H" });
      const [bottom, w] = core.para(row, r.note, { x: tx, y: lb[3] + gap, px: npx, width: tw, fill: th.body, maxLines: 2 });
      if (P.on(i)) ib = core.union([sx0, top, sx1, top + h + point], lb, [tx, lb[3], tx + w, bottom]);
    });
    return ib;
  },

  // The same steps laid across, for a landscape frame.
  across(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th, paint: P } = ctx, R = th.roles;
    const n = rows.length, gaph = S * 0.014;
    const w = Math.min((x1 - x0 - gaph * (n - 1)) / (n + 0.32), S * 0.30), point = w * 0.22;
    const ch = Math.min(S * 0.17, (y1 - y0) * 0.34);
    const total = n * w + (n - 1) * gaph + point, start = x0 + ((x1 - x0) - total) / 2;
    const cy0 = y0 + (y1 - y0) * 0.06, cy1 = cy0 + ch, ccy = (cy0 + cy1) / 2;
    const tones = [R.muted, mix(R.muted, R.neutral, 0.24)];
    const tw = w;
    let lpx = S * 0.044;
    while (lpx > S * 0.026 && Math.max(...rows.map((r) => core.measure((r.label || "").toUpperCase(), "bebas", lpx).w)) > tw) lpx -= 1;
    const marks = g.append("g").attr("id", "marks");
    let ib = null;
    rows.forEach((r, i) => {
      const row = core.rowGroup(marks, i, i, P), left = start + i * (w + gaph), notch = i ? point : 0;
      row.append("path").attr("fill", P.on(i) && P.how !== "enclosure" ? P.mark(i) : tones[i % 2])
        .attr("d", `M${left},${cy0}L${left + notch},${ccy}L${left},${cy1}L${left + w},${cy1}L${left + w + point},${ccy}L${left + w},${cy0}Z`);
      const mid = left + (notch * 0.5 + w + point * 0.5) / 2;
      const onFill = P.on(i) && ["hue", "intensity"].includes(P.how);
      core.stat(row, String(i + 1), { x: mid, y: ccy, px: Math.min(S * 0.066, ch * 0.46), fill: onFill ? R.onMain : mix(R.neutral, th.ink, 0.25), valign: "mid", face: "depot" });
      const npx = S * 0.024, ty = cy1 + S * 0.046;
      const lb = core.text(row, (r.label || "").toUpperCase(), { x: mid, y: ty, face: "bebas", px: lpx, fill: P.words(i), align: "m", ref: "H" });
      const [bottom] = core.para(row, r.note, { x: mid, y: lb[3] + S * 0.014, px: npx, width: tw, fill: th.body, align: "m", maxLines: 3 });
      if (P.on(i)) ib = core.union([left, cy0, left + w + point, cy1], lb, [mid - tw / 2, lb[3], mid + tw / 2, bottom]);
    });
    return ib;
  },
};
