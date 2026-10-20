// Parliament arc — FT Part-to-whole. Seats in a half circle: one dot per unit of each row's value,
// laid in rows from the inside out, each part one wedge. Coloured by `party` when rows have one, else by part in the
// fixed series order (a fifth part and beyond share the neutral). The total sits in the middle in Depot.
// Redesigned 20 Oct 2026 after Otto's note, from how other parliament charts do it: a short tick at the seat that makes
// a majority (instead of a dotted frame and a long line), and a key that flows as one line of "name count" pairs
// instead of a two-column table.
import * as core from "../core.js";
import { mix, partyKey } from "../theme.js";

const d3 = globalThis.d3;

export default {
  id: "arc",
  name: "Parliament arc",
  needs: () => ["label", "value"],
  insight: "max",
  ringOnHue: true,
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th, paint: P } = ctx;
    const byParty = rows.some((r) => r.party);
    // with parties the data's own order is the chamber's order, left to right; without, the biggest part leads
    const order = rows.map((_, i) => i);
    if (!byParty) order.sort((a, b) => rows[b].value - rows[a].value);
    const colour = (k, i) => (byParty && rows[i] && rows[i].party ? th.parties[partyKey(rows[i].party)] : k < th.series.length ? th.series[k] : mix(th.roles.neutral, th.ground, 0.3));
    const seats = Math.round(d3.sum(rows, (r) => Math.max(0, r.value)));
    if (seats > 800) ctx.warn(`${seats} seats; past about 800 the dots are too small to count`);
    const majority = Math.floor(seats / 2) + 1;

    // the key: one flowing line of "dot name count", centred, wrapping when it must. No columns.
    const namePx = S * 0.022, numPx = S * 0.034, sw = S * 0.02, gapA = S * 0.012, gapB = S * 0.016, gapItem = S * 0.04, W = x1 - x0;
    const items = order.map((i) => {
      const num = core.num(rows[i].value, ctx), nw = core.measure(num, "bebas", numPx).w, name = String(rows[i].label || "");
      const px = core.shrinkTo(name, "arvoBold", namePx, W - sw - gapA - gapB - nw, S * 0.017);
      return { i, num, nw, name, px, w: sw + gapA + core.measure(name, "arvoBold", px).w + gapB + nw };
    });
    const lines = [];
    let cur = [], cw = 0;
    items.forEach((it) => { if (cur.length && cw + gapItem + it.w > W) { lines.push(cur); cur = []; cw = 0; } cw += (cur.length ? gapItem : 0) + it.w; cur.push(it); });
    if (cur.length) lines.push(cur);
    const lrow = S * 0.046, keyH = lines.length * lrow + S * 0.025;

    const tickGap = S * 0.012, tickLen = S * 0.034, labelRoom = tickGap + tickLen + S * 0.036;
    const R = Math.min((x1 - x0) / 2 - S * 0.03, (y1 - y0) - keyH - labelRoom - S * 0.02), cx = (x0 + x1) / 2, cy = y0 + labelRoom + R;
    const r0 = R * 0.38;
    // rows of seats from the inside out: pick the count that fills the band with round dots
    let nRows = 1;
    for (; nRows < 40; nRows++) {
      const dr = (R - r0) / nRows, cap = d3.sum(d3.range(nRows), (k) => Math.floor(Math.PI * (r0 + dr * (k + 0.5)) / dr));
      if (cap >= seats) break;
    }
    const dr = (R - r0) / nRows, spots = [];
    const caps = d3.range(nRows).map((k) => Math.floor(Math.PI * (r0 + dr * (k + 0.5)) / dr)), cap = d3.sum(caps);
    const share = caps.map((c) => Math.floor(seats * c / cap));
    caps.map((c, k) => [seats * c / cap - share[k], k]).sort((a, b) => b[0] - a[0]).slice(0, seats - d3.sum(share)).forEach(([, k]) => { share[k] += 1; });
    for (let k = 0; k < nRows; k++) {
      const rr = r0 + dr * (k + 0.5), n = share[k];
      for (let j = 0; j < n; j++) { const a = Math.PI * (1 - (n === 1 ? 0.5 : j / (n - 1))); spots.push({ a, x: cx + rr * Math.cos(a), y: cy - rr * Math.sin(a) }); }
    }
    spots.sort((p, q) => q.a - p.a);                       // left to right across every row, so each part is a wedge
    const used = spots.slice(0, seats), marks = g.append("g").attr("id", "marks");
    let s = 0;
    order.forEach((i, k) => {
      const row = core.rowGroup(marks, i, k, P), n = Math.round(Math.max(0, rows[i].value)), pts = used.slice(s, s + n);
      for (const p of pts) core.dot(row, p.x, p.y, dr * 0.40, colour(k, i));
      s += n;
    });

    // the majority: a short tick just outside the rim, at the seat that makes it, with its number
    if (seats >= 3 && used[majority - 1]) {
      const a = (used[majority - 1].a + used[Math.min(majority, seats - 1)].a) / 2, c = Math.cos(a), sn = Math.sin(a);
      const ra = R + tickGap, rb = R + tickGap + tickLen;
      g.append("line").attr("id", "majority").attr("x1", cx + ra * c).attr("y1", cy - ra * sn).attr("x2", cx + rb * c).attr("y2", cy - rb * sn)
        .attr("stroke", th.ink).attr("stroke-width", Math.max(2, S * 0.0045)).attr("stroke-linecap", "round");
      const lx = cx + (rb + S * 0.012) * c, ly = cy - (rb + S * 0.012) * sn, side = Math.abs(c) < 0.4 ? "c" : c < 0 ? "r" : "l";
      core.text(g, `${majority} for a majority`, { x: lx, y: ly, face: "arvo", px: S * 0.024, fill: th.body, align: side, valign: side === "c" ? "bottom" : "mid" });
    }
    core.stat(g, core.num(seats, ctx), { x: cx, y: cy - S * 0.004, px: Math.min(S * 0.08, r0 * 0.6), fill: th.ink, valign: "bottom" });

    // the key
    const key = g.append("g").attr("id", "key");
    lines.forEach((ln, li) => {
      const total = ln.reduce((t, it) => t + it.w, 0) + gapItem * (ln.length - 1);
      let lx = x0 + (W - total) / 2;
      const ly = cy + S * 0.05 + li * lrow;
      ln.forEach((it) => {
        core.dot(key, lx + sw / 2, ly + sw / 2, sw / 2, colour(order.indexOf(it.i), it.i));
        const tx = lx + sw + gapA, nameBox = core.text(key, it.name, { x: tx, y: ly + sw / 2, face: "arvoBold", px: it.px, fill: P.on(it.i) ? th.ink : th.body, valign: "fmid" });
        core.text(key, it.num, { x: nameBox[2] + gapB, y: ly + sw / 2, face: "bebas", px: numPx, fill: th.ink, valign: "mid" });
        lx += it.w + gapItem;
      });
    });
    return null;
  },
};
