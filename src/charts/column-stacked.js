// Stacked column — FT Part-to-whole. The stacked bar stood upright: one column per row, its series
// stacked in the fixed order, the total on top, a key above. Good over time when there are few parts.
import { stacked, biggest } from "./bar-stacked.js";

export default {
  id: "column-stacked",
  name: "Stacked column",
  needs: () => ["label"],
  insight: biggest,
  ringOnHue: true,
  draw: (g, rows, box, ctx) => stacked(g, rows, box, ctx, { upright: true }),
};
