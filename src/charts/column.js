// Column — FT Magnitude. The ordered column in the table's own order. Seven at most; negatives hang
// below the zero line.
import { columns } from "./column-ordered.js";

export default {
  id: "column",
  name: "Column",
  needs: () => ["label", "value"],
  insight: "max",
  draw: (g, rows, box, ctx) => columns(g, rows, box, ctx, { sorted: false }),
};
