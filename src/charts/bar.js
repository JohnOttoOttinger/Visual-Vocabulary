// Bar — FT Magnitude. The ordered bar in the table's own order, for when the order means something
// (a sequence, a list the reader knows); no ranks. Seven at most.
import { bars } from "./bar-ordered.js";

export default {
  id: "bar",
  name: "Bar",
  needs: () => ["label", "value"],
  insight: "max",
  draw: (g, rows, box, ctx) => bars(g, rows, box, ctx, { sorted: false }),
};
