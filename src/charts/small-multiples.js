// Small multiples — FT's panels of one chart repeated. Rows carry "panel", "label" and "value"
// (long form); one panel per distinct "panel", in the table's order, all on the same scale so they
// compare. The panel with the biggest total (unless one is named as the insight) is drawn in olive;
// the rest in the neutral. Four kinds share this: line, area, column and bar.
import * as core from "../core.js";
import { mix } from "../theme.js";
import { timePanel, xLabels } from "./panel-line.js";

const d3 = globalThis.d3;

export function multiples(kind) {
  return {
    id: `small-multiples-${kind}`,
    name: `Small multiples: ${kind}`,
    needs: () => ["panel", "label", "value"],
    insight: "none",
    draw(g, rows, box, ctx) {
      const { S, th } = ctx;
      const names = [...new Set(rows.map((r) => r.panel))];
      if (names.length > 9) ctx.warn(`${names.length} panels; nine is the most that read at this size`);
      const want = ctx.options.insightPanel ?? names.reduce((m, p) => (d3.sum(rows.filter((r) => r.panel === p), (r) => r.value) > d3.sum(rows.filter((r) => r.panel === m), (r) => r.value) ? p : m), names[0]);
      const cells = core.panels(Math.min(9, names.length), box, S, ctx.options.cols);
      const all = rows.map((r) => r.value), shared = kind === "bar" ? [0, Math.max(...all)] : core.spanOf(all, true).slice(0, 2);
      const labelsOf = [...new Set(rows.map((r) => r.label))];
      let ib = null;
      names.slice(0, 9).forEach((p, k) => {
        const cell = cells[k], pg = g.append("g").attr("class", "panel").attr("data-panel", p).attr("data-order", k);
        const rs = labelsOf.map((l) => rows.find((r) => r.panel === p && r.label === l) || { label: l, value: NaN });
        const hot = p === want;
        if (kind === "bar") {
          const tb = core.text(pg, String(p), { x: cell[0], y: cell[1], face: "arvoBold", px: S * 0.026, fill: hot ? th.ink : th.body });
          const lp = S * 0.018, lw = Math.min(Math.max(...labelsOf.map((l) => core.measure(String(l), "arvo", lp).w)), (cell[2] - cell[0]) * 0.4);
          const top = tb[3] + S * 0.02, rh = (cell[3] - top) / rs.length, bx0 = cell[0] + lw + S * 0.012, vw = S * 0.05;
          rs.forEach((r, j) => {
            const yc = top + rh * (j + 0.5), ln = (cell[2] - vw - bx0) * Math.max(0, r.value || 0) / (shared[1] || 1);
            core.text(pg, String(r.label), { x: bx0 - S * 0.012, y: yc, face: "arvo", px: Math.min(lp, core.shrinkTo(String(r.label), "arvo", lp, lw, S * 0.012)), fill: th.body, align: "r", valign: "fmid" });
            if (ln > 0) core.bar(pg, bx0, yc - rh * 0.3, bx0 + ln, yc + rh * 0.3, hot ? th.roles.main : th.roles.muted, "right", S * 0.008);
            if (core.isNum(r.value)) core.text(pg, core.num(r.value, ctx), { x: bx0 + ln + S * 0.008, y: yc, face: "bebas", px: S * 0.024, fill: th.ink, valign: "mid" });
          });
          if (hot) ib = cell;
        } else {
          const res = timePanel(pg, rs, (r) => r.value, cell, ctx, { title: String(p), kind: kind === "column" ? "column" : kind, hot, scale: shared, mark: "last", xLabels: true });
          xLabels(pg, rs, res.X, res.py1 + S * 0.012, ctx, { every: Math.max(1, rs.length - 1) });
          if (hot) ib = [cell[0], cell[1], cell[2], cell[3]];
        }
      });
      return ib;
    },
  };
}
