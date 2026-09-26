// Stacked column — FT Part-to-whole. The stacked bar stood upright: one column per row, its series
// stacked in the fixed order, the total on top, a key above. Good over time when there are few parts.
import { stacked, biggest } from "./bar-stacked.js";

export default {
  id: "column-stacked",
  name: "Stacked column",
  needs: (spec) => (spec && spec.series && spec.series.length
    ? ["label", ...spec.series] : ["label"]),
  // A stack of one part is not a stack, so it reads two or more measures.
  measures: 2,
  insight: biggest,
  ringOnHue: true,
  draw: (g, rows, box, ctx) => stacked(g, rows, box, ctx, { upright: true }),
};
