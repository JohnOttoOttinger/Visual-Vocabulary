// Waffle — FT Part-to-whole (FT: gridplot). A hundred squares, ten by ten, each one per cent of the
// whole: the parts fill them in order, biggest first, the insight in olive and the rest stepping
// through the ground's ramp; a key underneath with each share. Whole squares only, so shares are
// rounded to add to a hundred.
import * as core from "../core.js";
import { mix, onFill } from "../theme.js";

const d3 = globalThis.d3;

export default {
  id: "waffle",
  name: "Waffle",
  needs: () => ["label", "value"],
  insight: "max",
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th, paint: P } = ctx;
    const total = d3.sum(rows, (r) => r.value) || 1;
    const order = rows.map((_, i) => i).sort((a, b) => rows[b].value - rows[a].value);
    // largest remainder, so the squares add to exactly a hundred
    const exact = order.map((i) => rows[i].value / total * 100), cells = exact.map(Math.floor);
    exact.map((e, k) => [e - Math.floor(e), k]).sort((a, b) => b[0] - a[0]).slice(0, 100 - d3.sum(cells)).forEach(([, k]) => { cells[k] += 1; });
    const others = order.filter((i) => !P.on(i));
    const fill = (i) => (P.on(i) ? (P.how !== "enclosure" ? P.mark(i) : th.roles.main) : mix(th.ramp[0], th.ramp[1], others.indexOf(i) / Math.max(1, others.length - 1)));
    const lrow = S * 0.058, keyH = Math.ceil(order.length / (order.length > 3 ? 2 : 1)) * lrow;
    const side = Math.min(x1 - x0, (y1 - y0) - keyH - S * 0.06), cell = side / 10, gap = Math.max(1.5, cell * 0.12);
    const gx = x0 + ((x1 - x0) - side) / 2, marks = g.append("g").attr("id", "marks");
    let c = 0, ib = null;
    order.forEach((i, k) => {
      const row = core.rowGroup(marks, i, k, P), boxes = [];
      for (let j = 0; j < cells[k]; j++, c++) {
        // fill column by column from the bottom left, so each part reads as one block
        const col = Math.floor(c / 10), rw = 9 - (c % 10), x = gx + col * cell, y = y0 + rw * cell;
        row.append("rect").attr("x", x + gap / 2).attr("y", y + gap / 2).attr("width", cell - gap).attr("height", cell - gap).attr("rx", cell * 0.12).attr("fill", fill(i));
        boxes.push([x, y, x + cell, y + cell]);
      }
      if (P.on(i) && boxes.length) ib = core.union(...boxes);
    });
    const cols = order.length > 3 ? 2 : 1, colw = (x1 - x0) / cols, ky = y0 + side + S * 0.05, key = g.append("g").attr("id", "key");
    order.forEach((i, n) => {
      const lx = x0 + (n % cols) * colw, ly = ky + Math.floor(n / cols) * lrow, sw = S * 0.028;
      key.append("rect").attr("x", lx).attr("y", ly).attr("width", sw).attr("height", sw).attr("rx", sw * 0.15).attr("fill", fill(i));
      const pct = `${cells[order.indexOf(i)]}%`, pw = core.measure(pct, "bebas", S * 0.036).w;
      const px = core.shrinkTo(rows[i].label || "", "arvoBold", S * 0.025, colw - sw - S * 0.06 - pw, S * 0.017);
      core.text(key, rows[i].label || "", { x: lx + sw + S * 0.018, y: ly + sw / 2, face: "arvoBold", px, fill: P.on(i) ? P.words(i) : th.body, valign: "fmid" });
      core.text(key, pct, { x: lx + colw - S * 0.03, y: ly + sw / 2, face: "bebas", px: S * 0.036, fill: P.on(i) ? P.words(i) : th.ink, align: "r", valign: "mid" });
    });
    void onFill;
    return ib;
  },
};
