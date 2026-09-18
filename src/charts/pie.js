// Pie — FT Part-to-whole. The donut with no hole: the insight's slice in olive, its share named in
// the key. Hard to compare slices by eye, so keep it to a few.
import { drawDonut } from "./donut.js";

export default {
  id: "pie",
  name: "Pie",
  needs: () => ["label", "value"],
  insight: "max",
  draw(g, rows, box, ctx) {
    if (rows.length > 5) ctx.warn(`${rows.length} slices; a pie reads best with five or fewer`);
    return drawDonut(g, rows, box, ctx, 0);
  },
};
