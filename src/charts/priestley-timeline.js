// Priestley timeline — FT Change over time. Spans in time: each row a bar from "start" to "end"
// (years or dates) in its own lane, ordered by start, the name beside it, a time axis underneath.
// The insight is the longest span.
import * as core from "../core.js";
import { mix, onFill } from "../theme.js";

const d3 = globalThis.d3;

export default {
  id: "priestley-timeline",
  name: "Priestley timeline",
  needs: () => ["label", "start", "end"],
  insight: (rows) => rows.reduce((m, r, i) => (core.when(r.end) - core.when(r.start) > core.when(rows[m].end) - core.when(rows[m].start) ? i : m), 0),
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th, paint: P } = ctx;
    const order = rows.map((_, i) => i).sort((a, b) => core.when(rows[a].start) - core.when(rows[b].start));
    const dates = rows.some((r) => /^\d{4}-/.test(String(r.start)));
    const t0 = Math.min(...rows.map((r) => core.when(r.start))), t1 = Math.max(...rows.map((r) => core.when(r.end)));
    const scale = (dates ? d3.scaleUtc().domain([new Date(t0), new Date(t1)]) : d3.scaleLinear().domain([t0, t1])).range([x0, x1]).nice();
    const X = (v) => scale(dates ? new Date(core.when(v)) : core.when(v));
    const n = order.length, axisH = S * 0.06, rowH = Math.min((y1 - y0 - axisH) / n, S * 0.085), lp = Math.min(S * 0.024, rowH * 0.42);
    const start = y0 + ((y1 - y0 - axisH) - rowH * n) / 2, t = rowH * 0.46;
    const axis = g.append("g").attr("id", "axis-x"), faint = mix(th.roles.neutral, th.ground, 0.5);
    for (const { t: tk, label } of dates ? core.dateTicks(scale) : scale.ticks(6).map((t) => ({ t, label: String(t) }))) {
      const x = scale(tk);
      core.dottedLine(axis, [x, start], [x, start + rowH * n], faint, S);
      core.text(axis, label, { x, y: start + rowH * n + S * 0.02, face: "arvo", px: S * 0.021, fill: th.body, align: "c", valign: "asc" });
    }
    const marks = g.append("g").attr("id", "marks");
    let ib = null;
    order.forEach((i, k) => {
      const r = rows[i], row = core.rowGroup(marks, i, k, P), yc = start + rowH * (k + 0.5);
      const a = X(r.start), b = Math.max(X(r.end), a + S * 0.012);
      const bb = [a, yc - t / 2, b, yc + t / 2];
      row.append("rect").attr("x", a).attr("y", bb[1]).attr("width", b - a).attr("height", t).attr("rx", t / 2).attr("fill", P.mark(i));
      // the name inside a long bar, else after it, else before it: never off the box
      const face = P.on(i) ? "arvoBold" : "arvo", w = core.measure(r.label || "", face, lp).w;
      const inside = b - a > w + S * 0.03, right = !inside && b + S * 0.014 + w < x1;
      const lx = inside ? a + S * 0.016 : right ? b + S * 0.014 : Math.max(x0 + w, a - S * 0.014);
      const lb = core.text(row, r.label || "", { x: lx, y: yc, face, px: lp, fill: inside ? onFill(P.mark(i)) : P.on(i) ? P.words(i) : th.body, align: inside || right ? "l" : "r", valign: "fmid", halo: inside ? undefined : [th.ground, S * 0.003] });
      if (P.on(i)) ib = core.union(bb, lb);
    });
    return ib;
  },
};
