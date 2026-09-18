// Circles timeline — FT Change over time. Events of different sizes along time, one lane per
// category: each row a circle at its "date" in its "label"'s lane, its area the value. The lane
// names on the left, a time axis under. The biggest circle is the insight, its value given.
import * as core from "../core.js";
import { mix } from "../theme.js";

const d3 = globalThis.d3;

export default {
  id: "circles-timeline",
  name: "Circles timeline",
  needs: () => ["label", "date", "value"],
  insight: "max",
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th, paint: P } = ctx;
    const lanes = [...new Set(rows.map((r) => r.label))], lp = S * 0.024;
    const labW = Math.min(Math.max(...lanes.map((l) => core.measure(String(l), "arvoBold", lp).w)), (x1 - x0) * 0.3) + S * 0.03;
    const dates = rows.some((r) => /^\d{4}-/.test(String(r.date)));
    const t = rows.map((r) => core.when(r.date));
    const laneH = Math.min((y1 - y0 - S * 0.07) / lanes.length, S * 0.16), rmax = Math.min(laneH * 0.48, S * 0.05);
    const scale = (dates ? d3.scaleUtc().domain([new Date(Math.min(...t)), new Date(Math.max(...t))]) : d3.scaleLinear().domain([Math.min(...t), Math.max(...t)]))
      .range([x0 + labW + rmax, x1 - rmax]).nice();
    const X = (r) => scale(dates ? new Date(core.when(r.date)) : core.when(r.date));
    const Rz = d3.scaleSqrt().domain([0, Math.max(...rows.map((r) => r.value)) || 1]).range([0, rmax]);
    const start = y0 + ((y1 - y0 - S * 0.07) - laneH * lanes.length) / 2, axis = g.append("g").attr("id", "axis");
    lanes.forEach((l, k) => {
      const yc = start + laneH * (k + 0.5);
      core.dottedLine(axis, [x0 + labW, yc], [x1, yc], mix(th.roles.neutral, th.ground, 0.5), S);
      core.text(axis, String(l), { x: x0 + labW - S * 0.03, y: yc, face: "arvoBold", px: lp, fill: th.body, align: "r", valign: "fmid" });
    });
    for (const { t: tk, label } of dates ? core.dateTicks(scale) : scale.ticks(6).map((t) => ({ t, label: String(t) })))
      core.text(axis, label, { x: scale(tk), y: start + laneH * lanes.length + S * 0.02, face: "arvo", px: S * 0.021, fill: th.body, align: "c", valign: "asc" });
    const marks = g.append("g").attr("id", "marks");
    const order = rows.map((_, i) => i).sort((a, b) => rows[b].value - rows[a].value);   // big first, small on top
    order.forEach((i, k) => {
      const r = rows[i], yc = start + laneH * (lanes.indexOf(r.label) + 0.5);
      core.dot(core.rowGroup(marks, i, k, P), X(r), yc, Math.max(S * 0.004, Rz(r.value)), P.on(i) ? P.mark(i) : mix(th.roles.muted, th.ground, 0.1), P.on(i) ? th.ground : th.roles.neutral, Math.max(1, S * 0.0015));
    });
    if (P.ins === null || P.ins === undefined) return null;
    const r = rows[P.ins], x = X(r), yc = start + laneH * (lanes.indexOf(r.label) + 0.5), rr = Rz(r.value), ins = g.append("g").attr("id", "insight");
    const vb = core.stat(ins, core.num(r.value, ctx), { x: Math.min(Math.max(x, x0 + labW + S * 0.05), x1 - S * 0.05), y: yc - rr - S * 0.012, px: S * 0.040, fill: P.words(P.ins), valign: "bottom" });
    return core.union(vb, [x - rr, yc - rr, x + rr, yc + rr]);
  },
};
