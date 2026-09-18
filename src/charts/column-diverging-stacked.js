// Diverging stacked column — FT Deviation. The diverging stacked bar stood upright: positive answers
// above the midline, negative below, a middle answer split across it.
import { diverging, leaning } from "./bar-diverging-stacked.js";

export default {
  id: "column-diverging-stacked",
  name: "Diverging stacked column",
  needs: () => ["label"],
  insight: leaning,
  ringOnHue: true,
  draw: (g, rows, box, ctx) => diverging(g, rows, box, ctx, { upright: true }),
};
