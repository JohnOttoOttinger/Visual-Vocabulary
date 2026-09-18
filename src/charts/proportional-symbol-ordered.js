// Ordered proportional symbols — FT Ranking. The proportional circles, biggest first.
import { symbols } from "./proportional-symbol.js";

export default {
  id: "proportional-symbol-ordered",
  name: "Ordered proportional symbols",
  needs: () => ["label", "value"],
  insight: "max",
  draw: (g, rows, box, ctx) => symbols(g, rows, box, ctx, { sorted: true }),
};
