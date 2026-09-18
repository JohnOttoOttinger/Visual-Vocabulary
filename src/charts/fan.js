// Fan — FT Change over time. What has happened, then a range of what could: rows with a "value"
// are the record, drawn as the heavy line; rows with "low" and "high" (and a central "value") are
// the projection, drawn as a band that widens with a dashed central line. The last recorded point
// is marked with its value.
import * as core from "../core.js";
import { mix, seq } from "../theme.js";

const d3 = globalThis.d3;

export default {
  id: "fan",
  name: "Fan",
  needs: () => ["label", "value"],
  insight: "none",
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th } = ctx, n = rows.length;
    const proj = (r) => core.isNum(r.low) && core.isNum(r.high);
    const [lo, hi, ticks] = core.spanOf(rows.flatMap((r) => [r.value, r.low, r.high]).filter(core.isNum));
    const px0 = x0 + core.tickWidth(ticks, ctx) + S * 0.03, px1 = x1 - S * 0.02, py0 = y0 + S * 0.08, py1 = y1 - S * 0.07;
    const X = (i) => px0 + (px1 - px0) * i / Math.max(1, n - 1), Y = (v) => py1 - (py1 - py0) * (v - lo) / ((hi - lo) || 1);
    core.yGrid(g, ticks, Y, px0, px1, ctx);
    core.axisLabels(g.append("g").attr("id", "axis-x"), rows.map((r) => r.label), X, py1 + S * 0.03, ctx);
    const first = rows.findIndex(proj), lastRec = first > 0 ? first - 1 : n - 1;
    const marks = g.append("g").attr("id", "marks");
    if (first >= 0) {
      // the fan starts at the last recorded point, so it opens out of the line
      const fanRows = rows.map((r, i) => ({ r, i })).filter(({ r, i }) => proj(r) || i === lastRec);
      const lowOf = ({ r }) => (proj(r) ? r.low : r.value), highOf = ({ r }) => (proj(r) ? r.high : r.value);
      marks.append("path").attr("class", "fan").attr("fill", seq(th, 0.25))
        .attr("d", d3.area().x(({ i }) => X(i)).y0((p) => Y(lowOf(p))).y1((p) => Y(highOf(p)))(fanRows));
      marks.append("path").attr("class", "projection").attr("fill", "none").attr("stroke", th.roles.main).attr("stroke-width", S * 0.005)
        .attr("stroke-dasharray", `${S * 0.012} ${S * 0.009}`).attr("d", d3.line().defined(({ r }) => core.isNum(r.value)).x(({ i }) => X(i)).y(({ r }) => Y(r.value))(fanRows));
      const last = rows[n - 1];
      for (const [v, word] of [[last.high, "high"], [last.low, "low"]])
        core.text(marks, `${core.num(v, ctx)} ${word}`, { x: X(n - 1) - S * 0.01, y: Y(v) + (word === "high" ? -S * 0.012 : S * 0.012), face: "arvo", px: S * 0.021, fill: th.body, align: "r", valign: word === "high" ? "bottom" : "top" });
      core.text(marks, "projected", { x: (X(lastRec) + X(n - 1)) / 2, y: py0, face: "arvoBold", px: S * 0.022, fill: th.body, align: "c" });
      core.dottedLine(marks, [X(lastRec), py0 + S * 0.03], [X(lastRec), py1], mix(th.roles.neutral, th.ground, 0.4), S);
    }
    const rec = rows.slice(0, lastRec + 1).map((r, i) => [X(i), Y(r.value)]);
    marks.append("path").attr("class", "record").attr("fill", "none").attr("stroke", th.strong).attr("stroke-width", S * 0.007).attr("stroke-linejoin", "round").attr("d", d3.line()(rec));
    const [x, y] = rec[rec.length - 1], ins = g.append("g").attr("id", "insight");
    core.dot(ins, x, y, S * 0.016, th.roles.main, th.ground, S * 0.004);
    const vb = core.stat(ins, core.num(rows[lastRec].value, ctx), { x: x - S * 0.02, y: y - S * 0.03, px: S * 0.050, fill: th.ink, valign: "bottom" });
    return core.union(vb, [x - S * 0.016, y - S * 0.016, x + S * 0.016, y + S * 0.016]);
  },
};
