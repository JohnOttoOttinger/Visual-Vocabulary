// Network — FT Flow (listed, never built); the Storyteller's `network` mode. Who connects to whom:
// nodes sized by their value or their links, the links thin, the insight's node and its links in
// olive. Laid out by a seeded force layout, so the same table always draws the same picture — the
// same picture the Storyteller drew, because the seed and the random numbers are Python's own.
import * as core from "../core.js";
import { mix } from "../theme.js";

// Python's random.Random(seed): MT19937 seeded by init_by_array, random() from two draws.
function pyRandom(seed) {
  const mt = new Uint32Array(624); let idx = 625;
  const init = (s) => { mt[0] = s >>> 0; for (idx = 1; idx < 624; idx++) { const p = mt[idx - 1] ^ (mt[idx - 1] >>> 30); mt[idx] = (Math.imul(1812433253, p) + idx) >>> 0; } };
  init(19650218);
  const key = [seed >>> 0]; let i = 1, j = 0;
  for (let k = Math.max(624, key.length); k; k--) {
    const p = mt[i - 1] ^ (mt[i - 1] >>> 30);
    mt[i] = ((mt[i] ^ Math.imul(p, 1664525)) + key[j] + j) >>> 0; i++; j++;
    if (i >= 624) { mt[0] = mt[623]; i = 1; } if (j >= key.length) j = 0;
  }
  for (let k = 623; k; k--) {
    const p = mt[i - 1] ^ (mt[i - 1] >>> 30);
    mt[i] = ((mt[i] ^ Math.imul(p, 1566083941)) - i) >>> 0; i++;
    if (i >= 624) { mt[0] = mt[623]; i = 1; }
  }
  mt[0] = 0x80000000; idx = 624;
  const next = () => {
    if (idx >= 624) {
      for (let k = 0; k < 624; k++) {
        const y = (mt[k] & 0x80000000) | (mt[(k + 1) % 624] & 0x7fffffff);
        mt[k] = mt[(k + 397) % 624] ^ (y >>> 1) ^ (y & 1 ? 0x9908b0df : 0);
      }
      idx = 0;
    }
    let y = mt[idx++];
    y ^= y >>> 11; y ^= (y << 7) & 0x9d2c5680; y ^= (y << 15) & 0xefc60000; y ^= y >>> 18;
    return y >>> 0;
  };
  const random = () => ((next() >>> 5) * 67108864 + (next() >>> 6)) / 9007199254740992;
  return { uniform: (a, b) => a + (b - a) * random() };
}

// Fruchterman-Reingold, seeded, as chart_lab.layout_network.
export function layout(n, edges, seed = 7, iters = 600) {
  const rnd = pyRandom(seed);
  const pos = [];
  for (let i = 0; i < n; i++) {
    const x = 0.5 + 0.35 * Math.cos(2 * Math.PI * i / n) + rnd.uniform(-0.02, 0.02);
    const y = 0.5 + 0.35 * Math.sin(2 * Math.PI * i / n) + rnd.uniform(-0.02, 0.02);
    pos.push([x, y]);
  }
  const k = 1.9 * Math.sqrt(1 / n);
  for (let it = 0; it < iters; it++) {
    const disp = pos.map(() => [0, 0]);
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const dx = pos[i][0] - pos[j][0], dy = pos[i][1] - pos[j][1];
      const dist = Math.max(1e-4, Math.hypot(dx, dy)), f = k * k / dist;
      disp[i][0] += dx / dist * f; disp[i][1] += dy / dist * f;
      disp[j][0] -= dx / dist * f; disp[j][1] -= dy / dist * f;
    }
    for (const [a, b] of edges) {
      const dx = pos[a][0] - pos[b][0], dy = pos[a][1] - pos[b][1];
      const dist = Math.max(1e-4, Math.hypot(dx, dy)), f = dist * dist / k;
      disp[a][0] -= dx / dist * f; disp[a][1] -= dy / dist * f;
      disp[b][0] += dx / dist * f; disp[b][1] += dy / dist * f;
    }
    const t = 0.08 * (1 - it / iters) + 0.002;
    for (let i = 0; i < n; i++) {
      disp[i][0] -= (pos[i][0] - 0.5) * 0.03; disp[i][1] -= (pos[i][1] - 0.5) * 0.03;
      const L = Math.hypot(...disp[i]) || 1;
      pos[i][0] += disp[i][0] / L * Math.min(L, t); pos[i][1] += disp[i][1] / L * Math.min(L, t);
    }
  }
  const xs = pos.map((p) => p[0]), ys = pos.map((p) => p[1]);
  const [ax, bx, ay, by] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  return pos.map(([x, y]) => [(x - ax) / ((bx - ax) || 1), (y - ay) / ((by - ay) || 1)]);
}

export default {
  id: "network",
  name: "Network",
  needs: () => ["label", "to"],
  insight: "degree",
  draw(g, rows, [x0, y0, x1, y1], ctx) {
    const { S, th, paint: P } = ctx, R = th.roles;
    const names = rows.map((r) => r.label);
    for (const r of rows) for (const t of r.to || []) if (!names.includes(t)) names.push(t);
    const ix = Object.fromEntries(names.map((nm, i) => [nm, i]));
    const keys = new Set();
    for (const r of rows) for (const t of r.to || []) { const [a, b] = [ix[r.label], ix[t]].sort((p, q) => p - q); keys.add(`${a},${b}`); }
    const edges = [...keys].map((k) => k.split(",").map(Number)).sort((p, q) => p[0] - q[0] || p[1] - q[1]);
    const deg = core.degrees(rows);
    const size = names.map((nm, i) => (i < rows.length && core.isNum(rows[i].value) ? rows[i].value : deg[nm] || 1));
    const smax = Math.max(...size) || 1;
    const rad = size.map((s) => S * (0.014 + 0.026 * Math.sqrt(s / smax)));
    const pos = layout(names.length, edges);
    const mx = S * 0.10, my = S * 0.06;
    const Pt = pos.map(([u, v]) => [x0 + mx + (x1 - x0 - 2 * mx) * u, y0 + my + (y1 - y0 - 2 * my - S * 0.03) * v]);
    const links = g.append("g").attr("id", "links");
    for (const [a, b] of edges) {
      const hot = P.ins !== null && P.ins !== undefined && (a === P.ins || b === P.ins);
      links.append("line").attr("x1", Pt[a][0]).attr("y1", Pt[a][1]).attr("x2", Pt[b][0]).attr("y2", Pt[b][1])
        .attr("stroke", hot && P.how === "hue" ? R.main : mix(R.neutral, th.ground, 0.45)).attr("stroke-width", S * (hot ? 0.005 : 0.003));
    }
    const marks = g.append("g").attr("id", "marks");
    names.forEach((nm, i) => {
      core.dot(core.rowGroup(marks, i, i, P), Pt[i][0], Pt[i][1], rad[i] * P.grow(i), P.mark(i), P.on(i) ? th.ground : R.neutral, Math.max(2, S * 0.003));
    });
    // labels last, each in the first of four spots clear of every node and every label placed so
    // far; the insight and the busiest nodes choose first
    const blocks = Pt.map(([x, y], i) => [x - rad[i], y - rad[i], x + rad[i], y + rad[i]]);
    const clash = (b, o) => !(b[2] < o[0] || b[0] > o[2] || b[3] < o[1] || b[1] > o[3]);
    const labels = g.append("g").attr("id", "labels"), lp = S * 0.023;
    let ib = null;
    const order = names.map((_, i) => i).sort((a, b) => (P.on(a) ? 0 : 1) - (P.on(b) ? 0 : 1) || (deg[names[b]] || 0) - (deg[names[a]] || 0));
    for (const i of order) {
      const nm = names[i], [x, y] = Pt[i], r = rad[i] * P.grow(i);
      const face = P.on(i) || (deg[nm] || 0) >= 3 ? "arvoBold" : "arvo";
      const tw = core.measure(nm, face, lp).w, th_ = lp * 1.1, gp = S * 0.010;
      const spots = [
        [x, y + r + gp, "c", "asc", [x - tw / 2, y + r + gp, x + tw / 2, y + r + gp + th_]],
        [x, y - r - gp, "c", "fbottom", [x - tw / 2, y - r - gp - th_, x + tw / 2, y - r - gp]],
        [x + r + gp, y, "l", "fmid", [x + r + gp, y - th_ / 2, x + r + gp + tw, y + th_ / 2]],
        [x - r - gp, y, "r", "fmid", [x - r - gp - tw, y - th_ / 2, x - r - gp, y + th_ / 2]],
      ];
      const own = blocks[i];
      const pick = spots.find((s) => s[4][0] >= x0 && s[4][2] <= x1 && !blocks.some((o) => o !== own && clash(s[4], o))) || spots[0];
      core.text(labels, nm, { x: pick[0], y: pick[1], face, px: lp, fill: P.on(i) ? P.words(i) : th.ink, align: pick[2], valign: pick[3], halo: [th.ground, S * 0.004] });
      blocks.push(pick[4]);
      if (P.on(i)) ib = core.union([x - r, y - r, x + r, y + r], pick[4]);
    }
    return ib;
  },
};
