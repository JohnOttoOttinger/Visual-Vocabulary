// Family tree — the network's table drawn as a tree. Each row is a person, `to` lists their
// children, and an optional `note` is the small line under the name (dates, a marriage). The same
// table draws as a `network` web or as either tree, so a family can be shown both ways.
//
// Two charts share one layout (the way venn.js holds the venn and the venn in words):
//   family-tree       left to right: the oldest at the left, each generation a column, the names
//                     beside their dots. The Storyteller's network › tree.
//   family-tree-down  top to bottom: the oldest at the top, each generation a row, the names under
//                     their dots. The Storyteller's network › descent.
//
// The insight is a person, and the line of descent from the root down to them is drawn in the
// insight colour. With none named it is the first of the deepest generation. Links start at the
// end of a parent's name rather than at the dot, so a line never runs through a word.
import * as core from "../core.js";
import { mix } from "../theme.js";

// Who is under whom. A name that only appears in someone's `to` is a person with no row of their
// own (a leaf with no note). A child named under two parents keeps the first, so the tree stays a
// tree. Separate trees in one table sit side by side, a half-slot apart.
export function build(rows, id) {
  const to = core.listOf(rows, "to", id);
  const names = rows.map((r) => String(r.label));
  for (const ts of to) for (const t of ts) if (!names.includes(t)) names.push(t);
  const ix = Object.fromEntries(names.map((nm, i) => [nm, i]));
  const kids = names.map(() => []), parent = names.map(() => -1);
  rows.forEach((r, k) => {
    for (const t of to[k]) {
      const c = ix[t];
      if (c !== k && parent[c] === -1) { parent[c] = k; kids[k].push(c); }
    }
  });
  const roots = names.map((_, i) => i).filter((i) => parent[i] === -1);
  if (!roots.length) throw new Error(`${id}: every person is somebody's child, so there is no top of the tree`);
  const depth = names.map(() => 0), slot = names.map(() => 0), lo = names.map(() => 0), hi = names.map(() => 0), seen = new Set();
  let leaf = 0;
  const place = (i, d) => {
    if (seen.has(i)) throw new Error(`${id}: ${names[i]} is their own ancestor`);
    seen.add(i); depth[i] = d;
    if (!kids[i].length) { slot[i] = leaf++; lo[i] = hi[i] = slot[i]; return; }
    kids[i].forEach((c) => place(c, d + 1));
    slot[i] = (slot[kids[i][0]] + slot[kids[i][kids[i].length - 1]]) / 2;
    lo[i] = lo[kids[i][0]]; hi[i] = hi[kids[i][kids[i].length - 1]];
  };
  roots.forEach((r, k) => { place(r, 0); if (k < roots.length - 1) leaf += 0.5; });
  if (seen.size < names.length) throw new Error(`${id}: ${names.filter((_, i) => !seen.has(i)).join(", ")} loop back on themselves`);
  return { names, kids, parent, depth, slot, lo, hi, maxSlot: Math.max(0, leaf - 1), maxDepth: Math.max(...depth), roots };
}

// the first person of the deepest generation: who the eye should go to when nobody is named
const deepest = (rows) => {
  const T = build(rows, "family-tree");
  return T.depth.indexOf(T.maxDepth);
};

// the chain from the root to person i, as a set of people
const lineTo = (T, i) => {
  const s = new Set();
  for (let k = i; k !== -1 && k !== undefined; k = T.parent[k]) s.add(k);
  return s;
};

const linkStyle = (th, P, T, line, p, c) => {
  const R = th.roles, hot = P.ins !== null && P.ins !== undefined && P.how === "hue" && line.has(p) && line.has(c);
  return { stroke: hot ? R.main : mix(R.neutral, th.ground, 0.45), width: hot ? 0.005 : 0.003 };
};

const faceOf = (T, P, i) => (P.on(i) || T.kids[i].length ? "arvoBold" : "arvo");

function across(g, rows, [x0, y0, x1, y1], ctx) {
  const { S, th, paint: P } = ctx, R = th.roles;
  const T = build(rows, "family-tree");
  const note = (i) => (i < rows.length && rows[i].note ? String(rows[i].note) : "");
  const anyNote = rows.some((r) => r.note);
  const sp = (y1 - y0) / (T.maxSlot + 1);
  const Y = (i) => y0 + (T.slot[i] + 0.5) * sp;
  let px = Math.min(S * 0.034, sp / (anyNote ? 1.95 : 1.35));
  const maxName = (x1 - x0) * 0.26;                    // a longer name wraps than lets the type shrink
  const bold = (nm, i) => (faceOf(T, P, i) === "arvoBold" ? `*${nm}*` : nm);
  const lay = (px) => {
    const r = px * 0.34, pad = px * 0.6, gap = px * 1.7, np = px * 0.72;
    const nameW = T.names.map((nm, i) => Math.max(...core.wrap(bold(nm, i), px, maxName).map((ln) => ln.w)));
    const nameH = T.names.map((nm, i) => core.paraHeight(bold(nm, i), px, maxName, 3, 1.15));
    const blockW = T.names.map((_, i) => Math.max(nameW[i], note(i) ? core.measure(note(i), "arvo", np).w : 0));
    const blockH = T.names.map((_, i) => nameH[i] + (note(i) ? px * 0.14 + np * 1.25 : 0));
    const colW = Array.from({ length: T.maxDepth + 1 }, (_, d) => Math.max(0, ...T.names.map((_, i) => (T.depth[i] === d ? blockW[i] : 0))));
    const xd = [];
    let x = x0 + r;
    colW.forEach((w, d) => { xd[d] = x; x += 2 * r + pad + w + gap; });
    const end = xd[T.maxDepth] + r + pad + colW[T.maxDepth];
    return { r, pad, np, blockW, blockH, nameH, xd, end };
  };
  let L = lay(px);
  while (L.end > x1 && px > S * 0.014) { px *= 0.97; L = lay(px); }
  const { r, pad, np, blockW, blockH, nameH, xd } = L;
  const line = P.ins !== null && P.ins !== undefined ? lineTo(T, P.ins) : new Set();

  const links = g.append("g").attr("id", "links");
  T.names.forEach((_, c) => {
    const p = T.parent[c]; if (p === -1) return;
    const xs = xd[T.depth[p]] + r + pad + blockW[p] + px * 0.35, xe = xd[T.depth[c]] - r - px * 0.2, xm = (xs + xe) / 2;
    const st = linkStyle(th, P, T, line, p, c);
    links.append("path").attr("d", `M${xs},${Y(p)} C${xm},${Y(p)} ${xm},${Y(c)} ${xe},${Y(c)}`)
      .attr("fill", "none").attr("stroke", st.stroke).attr("stroke-width", S * st.width).attr("stroke-linecap", "round");
  });
  const marks = g.append("g").attr("id", "marks");
  let ib = null;
  T.names.forEach((nm, i) => {
    const x = xd[T.depth[i]], y = Y(i), face = faceOf(T, P, i), rr = r * P.grow(i);
    const grp = i < rows.length ? core.rowGroup(marks, i, i, P) : marks.append("g");
    core.dot(grp, x, y, rr, P.mark(i), P.on(i) ? th.ground : R.neutral, Math.max(2, S * 0.003));
    const lx = x + r + pad, fill = P.on(i) ? P.words(i) : th.ink, top = y - blockH[i] / 2;
    core.para(grp, bold(nm, i), { x: lx, y: top, px, width: maxName, fill, maxLines: 3, lead: 1.15 });
    if (note(i)) core.text(grp, note(i), { x: lx, y: top + nameH[i] + px * 0.14, face: "arvo", px: np, fill: mix(th.ink, th.ground, 0.35), valign: "asc" });
    const box = [lx, top, lx + blockW[i], top + blockH[i]];
    if (P.on(i)) ib = core.union([x - rr, y - rr, x + rr, y + rr], box);
  });
  return ib;
}

function down(g, rows, [x0, y0, x1, y1], ctx) {
  const { S, th, paint: P } = ctx, R = th.roles;
  const T = build(rows, "family-tree-down");
  const note = (i) => (i < rows.length && rows[i].note ? String(rows[i].note) : "");
  const sp = (x1 - x0) / (T.maxSlot + 1);
  const X = (i) => x0 + (T.slot[i] + 0.5) * sp;
  let px = S * 0.032;
  const lay = (px) => {
    const r = px * 0.36, pad = px * 0.5, np = px * 0.72;
    // a parent has the width of everyone beneath it, so a long name over a wide family stays on a line or two
    const w = T.names.map((_, i) => Math.min((x1 - x0) * 0.6, sp * (T.hi[i] - T.lo[i] + 1) * 0.94));
    // names wrap to up to three lines rather than shrink (never cut off): only a single word wider than the slot shrinks the type
    const bold = (nm, i) => (faceOf(T, P, i) === "arvoBold" ? `*${nm}*` : nm);
    const tooWide = T.names.some((nm, i) => nm.split(/[\s-]+/).some((wd) => core.measure(wd, faceOf(T, P, i), px).w > w[i]));
    const nameH = T.names.map((nm, i) => core.paraHeight(bold(nm, i), px, w[i], 3, 1.15));
    const noteH = T.names.map((_, i) => core.paraHeight(note(i), np, w[i], 4, 1.25));
    const blockH = T.names.map((_, i) => nameH[i] + (noteH[i] ? px * 0.2 + noteH[i] : 0));
    const rowH = Array.from({ length: T.maxDepth + 1 }, (_, d) => Math.max(0, ...T.names.map((_, i) => (T.depth[i] === d ? blockH[i] : 0))));
    const used = rowH.reduce((a, h) => a + 2 * r + pad + h, 0);
    const gap = T.maxDepth ? (y1 - y0 - used) / T.maxDepth : 0;
    return { r, pad, np, w, tooWide, nameH, bold, blockH, rowH, gap };
  };
  let L = lay(px);
  // shrink until every name fits its slot and the generations have room between them
  while ((L.gap < px * 1.1 || L.tooWide) && px > S * 0.014) { px *= 0.97; L = lay(px); }
  const { r, pad, np, w, nameH, bold, blockH, rowH, gap } = L;
  const yd = [];
  let y = y0 + r;
  rowH.forEach((h, d) => { yd[d] = y; y += 2 * r + pad + h + Math.max(gap, 0); });
  const line = P.ins !== null && P.ins !== undefined ? lineTo(T, P.ins) : new Set();

  const links = g.append("g").attr("id", "links");
  T.names.forEach((_, c) => {
    const p = T.parent[c]; if (p === -1) return;
    const ys = yd[T.depth[p]] + r + pad + blockH[p] + px * 0.25, ye = yd[T.depth[c]] - r - px * 0.2, ym = (ys + ye) / 2;
    const st = linkStyle(th, P, T, line, p, c);
    links.append("path").attr("d", `M${X(p)},${ys} C${X(p)},${ym} ${X(c)},${ym} ${X(c)},${ye}`)
      .attr("fill", "none").attr("stroke", st.stroke).attr("stroke-width", S * st.width).attr("stroke-linecap", "round");
  });
  const marks = g.append("g").attr("id", "marks");
  let ib = null;
  T.names.forEach((nm, i) => {
    const x = X(i), yy = yd[T.depth[i]], face = faceOf(T, P, i), rr = r * P.grow(i);
    const grp = i < rows.length ? core.rowGroup(marks, i, i, P) : marks.append("g");
    core.dot(grp, x, yy, rr, P.mark(i), P.on(i) ? th.ground : R.neutral, Math.max(2, S * 0.003));
    const fill = P.on(i) ? P.words(i) : th.ink;
    const [, nameWide] = core.para(grp, bold(nm, i), { x, y: yy + r + pad, px, width: w[i], fill, align: "c", maxLines: 3, lead: 1.15 });
    let box = [x - nameWide / 2, yy + r + pad, x + nameWide / 2, yy + r + pad + nameH[i]];
    if (note(i)) {
      const [, wide] = core.para(grp, note(i), { x, y: yy + r + pad + nameH[i] + px * 0.2, px: np, width: w[i], fill: mix(th.ink, th.ground, 0.35), align: "c", maxLines: 4, lead: 1.25 });
      box = core.union(box, [x - wide / 2, yy + r + pad, x + wide / 2, yy + r + pad + blockH[i]]);
    }
    if (P.on(i)) ib = core.union([x - rr, yy - rr, x + rr, yy + rr], box);
  });
  return ib;
}

export default {
  id: "family-tree",
  name: "Family tree, across",
  needs: () => ["label", "to"],
  insight: deepest,
  draw: across,
};

export const familyTreeDown = {
  id: "family-tree-down",
  name: "Family tree, down",
  needs: () => ["label", "to"],
  insight: deepest,
  draw: down,
};
