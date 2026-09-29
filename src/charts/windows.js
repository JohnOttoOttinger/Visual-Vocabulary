// Two windows — the Storyteller's `comparison / windows` (not in the FT set). A against B as two
// pictures: the collage's two-window block, each window wearing the circle-number with its letter,
// the side's name under it, and the table's numbers set under each window — value under A, value2
// under B. Without pictures the windows are cream, and it is a plain head-to-head card.
// Pictures come as "images": [a, b] (file paths; the render tool reads them in).
//
// The block is sized from the room the table leaves, and the windows are never wider than 1.9:1,
// so a landscape frame gets two pictures rather than two letterbox slots (Otto, 29 Sep 2026).
import * as core from "../core.js";
import { mix } from "../theme.js";

const BLOCK = "#000000";   // the collage's block, black as in the Storyteller's approved design

export default {
  id: "windows",
  name: "Two windows",
  needs: () => ["label", "value", "value2"],
  insight: "change",
  ringOnHue: true,
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th, paint: P } = ctx, R = th.roles;
    const heads = (ctx.axes || ["A", "B"]).slice(0, 2), imgs = (ctx.images || []).slice(0, 2);
    const W = x1 - x0, pad = S * 0.037, gut = pad, rad = S * 0.037, dia = S * 0.080, n = rows.length;
    const namesH = S * 0.085, top = y0 + dia / 2, H = y1 - top;
    // the table takes what its rows want, but never more than a share of the box — less of it
    // lying down, where the height is what the pictures are short of
    const share = W > (y1 - y0) * 1.2 ? 0.42 : 0.50;
    const rowH = Math.max(Math.min(S * 0.105, (H - namesH) * share / n), S * 0.055);
    const maxWH = H - (namesH + rowH * n) - 2 * pad;
    let ww = (W - 2 * pad - gut) / 2;
    let wh = Math.max(Math.min(ww * 1.05, maxWH), S * 0.16);
    if (ww > wh * 1.9) ww = wh * 1.9;
    const bw = 2 * ww + gut + 2 * pad, bx = x0 + (W - bw) / 2, bh = wh + 2 * pad;
    const block = g.append("g").attr("id", "windows");
    block.append("rect").attr("x", bx).attr("y", top).attr("width", bw).attr("height", bh).attr("rx", rad).attr("fill", BLOCK);
    const centres = [];
    for (let k = 0; k < 2; k++) {
      const wx = bx + pad + k * (ww + gut), wy = top + pad, id = `vv-window-${k}-${Math.round(wx)}`;
      block.append("clipPath").attr("id", id).append("rect").attr("x", wx).attr("y", wy).attr("width", ww).attr("height", wh).attr("rx", rad * 0.6);
      const im = imgs[k];
      if (im && im.href) {
        // cover the window, never stretched: centred across, 40% down (the Storyteller's band)
        const s = Math.max(ww / im.width, wh / im.height), iw = im.width * s, ih = im.height * s;
        block.append("image").attr("href", im.href).attr("x", wx - (iw - ww) * 0.5).attr("y", wy - (ih - wh) * 0.4)
          .attr("width", iw).attr("height", ih).attr("preserveAspectRatio", "none").attr("clip-path", `url(#${id})`);
      } else {
        block.append("rect").attr("x", wx).attr("y", wy).attr("width", ww).attr("height", wh).attr("rx", rad * 0.6)
          .attr("fill", mix(R.muted, R.neutral, 0.2 * k));
      }
      const cx = wx + ww / 2;
      core.badge(block, cx, top, dia, "AB"[k], th, "bebas");
      centres.push(cx);
    }
    const ny = top + bh + S * 0.026;
    centres.forEach((cx, k) => core.text(block, (heads[k] || "").toUpperCase(), { x: cx, y: ny, face: "bebas", px: Math.min(S * 0.044, ww * 0.20), fill: th.ink, align: "c" }));
    // The table: three columns on the block's width, the rules under the names and under every
    // row but the last, the type off the row rather than off the frame.
    const ry = ny + namesH - S * 0.01;
    const faint = mix(R.neutral, th.ground, 0.45);
    const vpx = Math.min(S * 0.062, rowH * 0.74);
    const gap = centres[1] - centres[0];
    const valW = Math.max(...rows.map((r) => Math.max(core.measure(core.num(r.value, ctx), "bebas", vpx).w,
                                                      core.measure(core.num(r.value2, ctx), "bebas", vpx).w)));
    const lw = gap - valW - S * 0.085;
    const lpx = Math.min(...rows.map((r) => core.shrinkTo(r.label || "", "arvoBold", Math.min(S * 0.030, rowH * 0.44), lw, S * 0.016)));
    core.dottedLine(block, [bx, ry], [bx + bw, ry], faint, S);
    const marks = g.append("g").attr("id", "marks");
    let ib = null;
    rows.forEach((r, i) => {
      const row = core.rowGroup(marks, i, i, P), yc = ry + rowH * (i + 0.5);
      if (i) core.dottedLine(row, [bx, ry + rowH * i], [bx + bw, ry + rowH * i], faint, S);
      const fill = P.on(i) ? P.words(i) : (P.ins === null || P.ins === undefined ? th.ink : th.body);
      core.stat(row, core.num(r.value, ctx), { x: centres[0], y: yc, px: vpx, fill, valign: "mid" });
      core.stat(row, core.num(r.value2, ctx), { x: centres[1], y: yc, px: vpx, fill, valign: "mid" });
      core.text(row, r.label || "", { x: bx + bw / 2, y: yc, face: "arvoBold", px: lpx, fill: P.on(i) ? th.ink : th.body, align: "c", valign: "fmid" });
      if (P.on(i)) ib = [bx, yc - rowH / 2 + S * 0.006, bx + bw, yc + rowH / 2 - S * 0.006];
    });
    return ib;
  },
};
