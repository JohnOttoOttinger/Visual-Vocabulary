#!/usr/bin/env python3
"""The review page: every built chart on plaster and on dark, the Storyteller's chart slides, and
the whole catalogue by wave. Any chart or slide opens large, to zoom into and pan around.

    node bin/vv.mjs gallery
    node bin/vv.mjs gallery --only <the map charts> --scale 2 --out out/gallery-2x
    python3 tools/gallery_page.py

Writes out/page/index.html and out/page/img/*.jpg: charts at full slide size (1080 wide), maps as a
720 thumbnail and a 2160 zoom (from the double-resolution renders), the Storyteller's map slides one
by one, and its sub-mode deck as a contact sheet.
"""
import html
import json
import os
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent.parent
SRC, SRC2X, OUT = HERE / "out/gallery", HERE / "out/gallery-2x", HERE / "out/page"
(OUT / "img").mkdir(parents=True, exist_ok=True)
CREATIVE = Path(os.environ.get("VV_STORYTELLER", Path.home() /
                "Claude-Projects-2026/Oddtoe-Visual-Storyteller/creative"))

cat = json.loads((HERE / "catalog/charts.json").read_text())
charts = cat["charts"]
# every example spec, by chart; a file of several ({"charts": [...]}) gives one card per variant
variants = {}
for p in sorted((HERE / "specs/examples").glob("*.json")):
    j = json.loads(p.read_text())
    for k, sp in enumerate(j.get("charts") or [j]):
        name = sp.get("name") or (f"{p.stem}-{k + 1}" if "charts" in j else p.stem)
        variants.setdefault(sp["chart"], []).append({**sp, "name": name})
built = [c for c in charts if c["status"] == "built" and c["id"] in variants]
# gallery order: the Storyteller's methods first, in the pack's order, then the rest; maps last
ORDER = ["timeline", "trend", "ranking", "cause-effect", "process", "proportions", "comparison", "outlier", "network", "correlation", "place"]
built.sort(key=lambda c: (min((ORDER.index(m) for m in c["methods"] if m in ORDER), default=99), not c.get("replaces"), not c.get("storyteller"), c["name"]))
is_map = lambda c: c["group"] == "Spatial"


def jpg(src, dst, width, quality=82):
    im = Image.open(src).convert("RGB")
    if im.width != width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(OUT / "img" / dst, quality=quality, optimize=True)
    return im.size


for c in built:
    for v in variants[c["id"]]:
        for mode in ("plaster", "marquee"):
            frame = SRC / f"{v['name']}-{mode}-frame.png"
            if is_map(c):
                big = SRC2X / f"{v['name']}-{mode}-frame.png"
                jpg(frame, f"{v['name']}-{mode}.jpg", 720, 84)
                jpg(big if big.exists() else frame, f"{v['name']}-{mode}-zoom.jpg", 2160 if big.exists() else 1080, 80)
            else:
                jpg(frame, f"{v['name']}-{mode}.jpg", 1080)

# the Storyteller: its map slides one by one, its sub-mode deck as one sheet
place_slides = sorted(CREATIVE.glob("chart-place-example-slide-*.jpg"))
for k, f in enumerate(place_slides, 1):
    jpg(f, f"st-place-{k:02d}.jpg", 1080)
place_deck = json.loads((CREATIVE / "chart-place-deck-example.json").read_text())["slides"] if (CREATIVE / "chart-place-deck-example.json").exists() else []
sheet_size = jpg(CREATIVE / "chart-submodes-contact-sheet.jpg", "storyteller-submodes.jpg", 2000) if (CREATIVE / "chart-submodes-contact-sheet.jpg").exists() else (2000, 1500)
lib_size = jpg(CREATIVE / "chart-library-contact-sheet.jpg", "storyteller-library.jpg", 3088, 80) if (CREATIVE / "chart-library-contact-sheet.jpg").exists() else None

e = html.escape


def zoomable(inner, caption, set_, plaster, marquee=None, zp=None, zm=None):
    """A button that opens its picture large. The zoom pictures default to the thumbnails."""
    attrs = f'data-set="{set_}" data-caption="{e(caption)}" data-plaster="{plaster}" data-zoom-plaster="{zp or plaster}"'
    if marquee:
        attrs += f' data-marquee="{marquee}" data-zoom-marquee="{zm or marquee}"'
    return f'<button type="button" class="zoom" {attrs} aria-label="Open {e(caption)} large">{inner}</button>'


def card(c, v, many):
    meta = f"FT family: {e(c['group'])}"
    if c.get("storyteller"):
        rep = f'<p class="rep">Storyteller: <b>{e(c["storyteller"])}</b></p>'
    else:
        why = c.get("storyteller_note")
        rep = f'<p class="rep">In the library only{": " + e(why) if why else ""}</p>'
    title = e(c["name"]) + (f' <span class="var">· {e(v.get("title", "").title())}</span>' if many else "")
    n, big = v["name"], is_map(c)
    thumb_w, thumb_h = (720, 900) if big else (1080, 1350)
    img = f'<img src="img/{n}-plaster.jpg" width="{thumb_w}" height="{thumb_h}" loading="lazy" decoding="async" alt="{e(c["name"])}: {e(v.get("title", ""))}">'
    caption = f'{c["name"]}' + (f' · {v.get("title", "").title()}' if many else "")
    button = zoomable(img, caption, "charts", f"img/{n}-plaster.jpg", f"img/{n}-marquee.jpg",
                      f"img/{n}-plaster-zoom.jpg" if big else None, f"img/{n}-marquee-zoom.jpg" if big else None)
    return f'''<figure class="card" id="{e(n)}">
  {button}
  <figcaption><h3>{title}</h3><p class="meta">{meta}</p>{rep}</figcaption>
</figure>'''


def place_card(k, sl):
    title, sub = sl.get("title", ""), sl.get("submode", "pins")
    caption = f'place › {sub} · {title.title()}'
    img = f'<img src="img/st-place-{k:02d}.jpg" width="1080" height="1350" loading="lazy" decoding="async" alt="Storyteller slide: {e(title)}">'
    return f'''<figure class="card">
  {zoomable(img, caption, "place", f"img/st-place-{k:02d}.jpg")}
  <figcaption><h3>{e(title.title())}</h3><p class="meta">place › <b>{e(sub)}</b></p></figcaption>
</figure>'''


def rows(w):
    out = []
    for c in (x for x in charts if x["wave"] == w):
        status = '<span class="pill on">Built</span>' if c["status"] == "built" else '<span class="pill">To build</span>'
        methods = ", ".join(m.replace("-", " ") for m in c["methods"]) or "—"
        out.append(f'<tr><td class="nm">{e(c["name"])}</td><td>{e(c["group"])}</td><td>{e(methods)}</td>'
                   f'<td>{e(c.get("storyteller") or "")}</td><td>{status}</td></tr>')
    return "\n".join(out)


waves = cat["waves"]
n_built = sum(c["status"] == "built" for c in charts)
n_offered = sum(bool(c.get("storyteller")) for c in charts)
tables = "\n".join(f'''<section class="wave">
  <h3><span class="wn">Wave {w}</span> {e(waves[w])} <span class="count">{sum(c["wave"] == int(w) for c in charts)} charts</span></h3>
  <div class="scroll"><table>
    <thead><tr><th>Chart</th><th>FT family</th><th>Pack methods</th><th>In the Storyteller</th><th>Status</th></tr></thead>
    <tbody>{rows(int(w))}</tbody>
  </table></div>
</section>''' for w in waves)

cards = "\n".join(card(c, v, len(variants[c["id"]]) > 1) for c in built for v in variants[c["id"]])
place_cards = "\n".join(place_card(k, sl) for k, sl in enumerate(place_deck, 1) if k <= len(place_slides))
sheet = zoomable(f'<img class="sheet" src="img/storyteller-submodes.jpg" width="{sheet_size[0]}" height="{sheet_size[1]}" loading="lazy" decoding="async" alt="Sixteen Storyteller chart slides drawn by the library, one for each sub-mode it added">',
                 "The Storyteller's chart sub-modes, sixteen slides", "sheet", "img/storyteller-submodes.jpg")
lib_sheet = zoomable(f'<img class="sheet" src="img/storyteller-library.jpg" width="{lib_size[0]}" height="{lib_size[1]}" loading="lazy" decoding="async" alt="Thirty-five Storyteller chart slides, one for each library chart it now offers">',
                     "Thirty-five more sub-modes, one slide each", "sheet", "img/storyteller-library.jpg") if lib_size else ""

page = f'''<meta charset="utf-8">
<title>Visual Vocabulary</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Arvo:ital,wght@0,400;0,700;1,400&family=Bebas+Neue&family=Qwigley&display=swap">
<style>
  /* Oddtoe design system v1.7.0: dark-first (marquee), light is longform's paper-light */
  :root {{
    --bg: #262B2A; --surface: #2F3534; --ink: #FFFFFF; --muted: #DDCCB1;
    --olive: #8A8F6A; --olive-ink: #F9F4EB; --rule: rgba(221, 221, 221, .18); --link: #8A8F6A;
    --pill: rgba(221, 204, 177, .12);
  }}
  @media (prefers-color-scheme: light) {{
    :root:not([data-theme="dark"]) {{
      --bg: #F9F4EB; --surface: #F2EDE3; --ink: #262B2A; --muted: #5C615C;
      --olive: #8A8F6A; --olive-ink: #F9F4EB; --rule: rgba(38, 43, 42, .14); --link: #4E5041;
      --pill: rgba(112, 98, 80, .12);
    }}
  }}
  :root[data-theme="light"] {{
    --bg: #F9F4EB; --surface: #F2EDE3; --ink: #262B2A; --muted: #5C615C;
    --olive: #8A8F6A; --olive-ink: #F9F4EB; --rule: rgba(38, 43, 42, .14); --link: #4E5041;
    --pill: rgba(112, 98, 80, .12);
  }}
  body {{ background: var(--bg); color: var(--ink); font: 400 16px/1.55 Arvo, Rockwell, "Roboto Slab", Georgia, serif; }}
  .wrap {{ max-width: 1240px; margin: 0 auto; padding-inline: clamp(16px, 4vw, 48px); padding-block: 48px 80px; }}
  header {{ max-width: 720px; }}
  .leadin {{ font-family: Qwigley, cursive; font-size: clamp(30px, 4.2vw, 44px); line-height: 1; color: var(--muted); margin: 0; }}
  h1 {{ font: 400 clamp(52px, 8vw, 96px)/.9 "Bebas Neue", Impact, "Arial Narrow", sans-serif; letter-spacing: -.025em; margin: -.12em 0 0; text-wrap: balance; }}
  .line {{ font-size: clamp(17px, 2vw, 20px); color: var(--muted); margin: 18px 0 0; }}
  .line b {{ color: var(--ink); }}
  h2 {{ font: 400 clamp(34px, 4.4vw, 48px)/1 "Bebas Neue", Impact, sans-serif; letter-spacing: -.02em; margin: 0; }}
  .sect {{ margin-top: 64px; display: grid; gap: 22px; }}
  .sect > p {{ margin: 0; color: var(--muted); max-width: 62ch; }}
  .bar {{ display: flex; flex-wrap: wrap; gap: 14px 24px; align-items: center; justify-content: space-between; }}
  .seg {{ display: inline-flex; border: 1px solid var(--rule); border-radius: 999px; padding: 3px; }}
  .seg button {{ font: 700 14px/1 Arvo, Georgia, serif; color: var(--muted); background: none; border: 0; border-radius: 999px; padding: 9px 16px; cursor: pointer; }}
  .seg button[aria-pressed="true"] {{ background: var(--olive); color: var(--olive-ink); }}
  button:focus-visible, a:focus-visible {{ outline: 2px solid var(--olive); outline-offset: 2px; }}
  .grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr)); gap: 32px 24px; }}
  .card {{ margin: 0; display: grid; gap: 12px; align-content: start; }}
  .zoom {{ display: block; position: relative; padding: 0; border: 0; background: none; cursor: zoom-in; }}
  .zoom img {{ display: block; width: 100%; height: auto; background: var(--surface); }}
  .card .zoom img {{ aspect-ratio: 4 / 5; }}
  .zoom::after {{ content: ""; position: absolute; right: 10px; bottom: 10px; width: 34px; height: 34px; border-radius: 50%;
    background: var(--olive) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23F9F4EB' stroke-width='2.4' stroke-linecap='round'%3E%3Ccircle cx='10.5' cy='10.5' r='6'/%3E%3Cpath d='M15 15l5 5M10.5 8v5M8 10.5h5'/%3E%3C/svg%3E") center / 20px no-repeat;
    opacity: 0; transition: opacity .15s; }}
  .zoom:hover::after, .zoom:focus-visible::after {{ opacity: 1; }}
  @media (hover: none) {{ .zoom::after {{ opacity: .9; }} }}
  .card h3 {{ font: 400 26px/1 "Bebas Neue", Impact, sans-serif; letter-spacing: -.01em; margin: 0; }}
  .card p {{ margin: 4px 0 0; font-size: 13px; line-height: 1.45; color: var(--muted); }}
  .card .rep b, .card .meta b {{ color: var(--ink); }}
  .card h3 .var {{ color: var(--muted); }}
  .sheet {{ display: block; width: 100%; height: auto; background: var(--surface); }}
  .wave {{ display: grid; gap: 10px; }}
  .wave h3 {{ font: 700 16px/1.3 Arvo, Georgia, serif; margin: 20px 0 0; display: flex; flex-wrap: wrap; gap: 4px 12px; align-items: baseline; }}
  .wn {{ font: 400 24px/1 "Bebas Neue", Impact, sans-serif; letter-spacing: .02em; color: var(--olive); }}
  .count {{ font-weight: 400; color: var(--muted); font-size: 14px; }}
  .scroll {{ overflow-x: auto; }}
  table {{ width: 100%; border-collapse: collapse; font-size: 14px; min-width: 640px; }}
  th {{ text-align: left; font: 700 12px/1.2 Arvo, Georgia, serif; letter-spacing: .06em; text-transform: uppercase; color: var(--muted); padding: 10px 12px 10px 0; border-bottom: 1px solid var(--rule); }}
  td {{ padding: 9px 12px 9px 0; border-bottom: 1px solid var(--rule); vertical-align: top; color: var(--muted); }}
  td.nm {{ color: var(--ink); font-weight: 700; }}
  .pill {{ display: inline-block; font-size: 12px; padding: 3px 10px; border-radius: 999px; background: var(--pill); color: var(--muted); white-space: nowrap; }}
  .pill.on {{ background: var(--olive); color: var(--olive-ink); }}
  footer {{ margin-top: 64px; color: var(--muted); font-size: 13px; }}

  /* the viewer: the picture fitted to the screen, then zoomed and dragged */
  #viewer {{ width: 100vw; height: 100dvh; max-width: none; max-height: none; margin: 0; padding: 0; border: 0;
    background: #1E2221; color: #F9F4EB; overflow: hidden; }}
  #viewer[open] {{ display: flex; flex-direction: column; }}
  #viewer::backdrop {{ background: rgba(0, 0, 0, .6); }}
  .vbar {{ display: flex; flex-wrap: wrap; gap: 8px 16px; align-items: center; justify-content: space-between;
    padding: calc(10px + env(safe-area-inset-top, 0px)) 16px 10px; }}
  .vcap {{ margin: 0; font: 400 24px/1.1 "Bebas Neue", Impact, sans-serif; letter-spacing: .01em; min-width: 0; overflow-wrap: anywhere; }}
  .vctl {{ display: flex; gap: 6px; flex-wrap: wrap; }}
  .vctl button {{ font: 700 14px/1 Arvo, Georgia, serif; color: #F9F4EB; background: rgba(249, 244, 235, .12); border: 0; border-radius: 999px;
    min-width: 40px; height: 40px; padding: 0 14px; cursor: pointer; }}
  .vctl button:hover {{ background: rgba(249, 244, 235, .22); }}
  .vctl button:disabled {{ opacity: .35; cursor: default; }}
  .vctl .close {{ background: #8A8F6A; }}
  .vstage {{ position: relative; flex: 1; overflow: hidden; touch-action: none; cursor: zoom-in; }}
  .vstage.zoomed {{ cursor: grab; }}
  .vstage.dragging {{ cursor: grabbing; }}
  #vimg {{ position: absolute; left: 0; top: 0; transform-origin: 0 0; max-width: none; user-select: none; -webkit-user-drag: none; }}
  .vhint {{ margin: 0; padding: 8px 16px calc(10px + env(safe-area-inset-bottom, 0px)); font-size: 13px; color: rgba(249, 244, 235, .7); }}
</style>

<div class="wrap">
  <header>
    <p class="leadin">The chart library...</p>
    <h1>Visual Vocabulary</h1>
    <p class="line">{n_built} of {len(charts)} charts built, <b>drawn the Storyteller's way</b>.</p>
  </header>

  <section class="sect" aria-labelledby="built">
    <div class="bar">
      <h2 id="built">Built so far</h2>
      <div class="seg" role="group" aria-label="Ground">
        <button type="button" id="g-plaster" data-ground="plaster" aria-pressed="true">Plaster</button>
        <button type="button" id="g-marquee" data-ground="marquee" aria-pressed="false">Dark</button>
      </div>
    </div>
    <p>Plaster is the Storyteller's slide. Dark is the ground for decks and After Effects. Every number is counted from disk: the Storyteller's story folders, the FT originals, Natural Earth and the ABS boundaries.</p>
    <p>Click any chart to open it large: click again to zoom where you point, drag to move, scroll or pinch to zoom further. Maps open at twice the size, so they stay sharp close in.</p>
    <div class="grid">
{cards}
    </div>
  </section>

  <section class="sect" aria-labelledby="st">
    <h2 id="st">In the Storyteller</h2>
    <p>The Storyteller asks the library for every chart slide and keeps its own headline, line, source and wayfinder. These are its map slides, the place mode, one for every map in the library.</p>
    <div class="grid">
{place_cards}
    </div>
    <p>The sub-modes the library added to its other chart modes, sixteen slides from one deck file.</p>
    {sheet}
    <p>And thirty-five more, one slide for each library chart the Storyteller now offers: {n_offered} of the {len(charts)} charts in all. The eight it leaves out say why on their cards above.</p>
    {lib_sheet}
  </section>

  <section class="sect" aria-labelledby="cat">
    <h2 id="cat">All {len(charts)}, by wave</h2>
    <p>The FT's 49 general charts, the 19 it listed and never built, the Storyteller's own drawings, and the maps. Pack methods are the Storyteller chart modes each chart can draw.</p>
    {tables}
  </section>

  <footer>Visual-Vocabulary repo. Oddtoe design system v1.7.0. Map data: Natural Earth; ABS boundaries (CC BY 4.0).</footer>
</div>

<dialog id="viewer" aria-labelledby="vcap">
  <div class="vbar">
    <p class="vcap" id="vcap"></p>
    <div class="vctl">
      <button type="button" id="vprev" aria-label="Previous">‹</button>
      <button type="button" id="vnext" aria-label="Next">›</button>
      <button type="button" id="vout" aria-label="Zoom out">−</button>
      <button type="button" id="vfit">Fit</button>
      <button type="button" id="vin" aria-label="Zoom in">+</button>
      <button type="button" class="close" id="vclose">Close</button>
    </div>
  </div>
  <div class="vstage" id="vstage"><img id="vimg" alt=""></div>
  <p class="vhint">Click to zoom where you point · drag to move · scroll or pinch to zoom · ‹ › or the arrow keys for the next · Esc to close</p>
</dialog>

<script>
  // the ground toggle: every chart picture follows it, and the viewer opens on the same ground
  const btns = document.querySelectorAll(".seg button");
  const ground = () => document.querySelector('.seg button[aria-pressed="true"]')?.dataset.ground || "plaster";
  function show(g) {{
    btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.ground === g)));
    document.querySelectorAll('.zoom[data-set="charts"] img').forEach((img) => {{ img.src = img.parentElement.dataset[g] || img.src; }});
    try {{ localStorage.setItem("vv-ground", g); }} catch (e) {{}}
  }}
  btns.forEach((b) => b.addEventListener("click", () => show(b.dataset.ground)));
  let saved = null;
  try {{ saved = localStorage.getItem("vv-ground"); }} catch (e) {{}}
  if (saved === "marquee") show("marquee");

  // the viewer
  const dlg = document.getElementById("viewer"), stage = document.getElementById("vstage"), vimg = document.getElementById("vimg");
  const vcap = document.getElementById("vcap"), prevB = document.getElementById("vprev"), nextB = document.getElementById("vnext");
  let list = [], at = 0, s = 1, fit = 1, tx = 0, ty = 0;
  const src = (el) => {{ const g = ground() === "marquee" ? "Marquee" : "Plaster"; return el.dataset["zoom" + g] || el.dataset.zoomPlaster; }};

  function apply() {{
    vimg.style.transform = `translate(${{tx}}px, ${{ty}}px) scale(${{s}})`;
    stage.classList.toggle("zoomed", s > fit * 1.02);
  }}
  function clamp() {{
    const W = stage.clientWidth, H = stage.clientHeight, w = vimg.naturalWidth * s, h = vimg.naturalHeight * s;
    tx = w <= W ? (W - w) / 2 : Math.min(0, Math.max(W - w, tx));
    ty = h <= H ? (H - h) / 2 : Math.min(0, Math.max(H - h, ty));
  }}
  function toFit() {{
    const W = stage.clientWidth, H = stage.clientHeight;
    if (!vimg.naturalWidth) return;
    vimg.style.width = vimg.naturalWidth + "px"; vimg.style.height = vimg.naturalHeight + "px";
    fit = Math.min(W / vimg.naturalWidth, H / vimg.naturalHeight); s = fit; clamp(); apply();
  }}
  function zoomTo(ns, cx, cy) {{
    const most = Math.max(fit * 5, 1.6);
    ns = Math.min(most, Math.max(fit, ns));
    const px = (cx - tx) / s, py = (cy - ty) / s;
    s = ns; tx = cx - px * s; ty = cy - py * s; clamp(); apply();
  }}
  function load() {{
    const el = list[at];
    vcap.textContent = el.dataset.caption || "";
    prevB.disabled = nextB.disabled = list.length < 2;
    vimg.alt = el.querySelector("img")?.alt || "";
    vimg.onload = toFit;
    vimg.src = src(el);
  }}
  function step(d) {{ if (list.length > 1) {{ at = (at + d + list.length) % list.length; load(); }} }}
  document.querySelectorAll(".zoom").forEach((el) => el.addEventListener("click", () => {{
    list = [...document.querySelectorAll(`.zoom[data-set="${{el.dataset.set}}"]`)];
    at = list.indexOf(el); dlg.showModal(); load();
  }}));
  prevB.addEventListener("click", () => step(-1));
  nextB.addEventListener("click", () => step(1));
  document.getElementById("vclose").addEventListener("click", () => dlg.close());
  document.getElementById("vfit").addEventListener("click", toFit);
  document.getElementById("vin").addEventListener("click", () => zoomTo(s * 1.6, stage.clientWidth / 2, stage.clientHeight / 2));
  document.getElementById("vout").addEventListener("click", () => zoomTo(s / 1.6, stage.clientWidth / 2, stage.clientHeight / 2));
  dlg.addEventListener("keydown", (ev) => {{
    if (ev.key === "ArrowRight") step(1);
    else if (ev.key === "ArrowLeft") step(-1);
    else if (ev.key === "+" || ev.key === "=") zoomTo(s * 1.6, stage.clientWidth / 2, stage.clientHeight / 2);
    else if (ev.key === "-") zoomTo(s / 1.6, stage.clientWidth / 2, stage.clientHeight / 2);
    else if (ev.key === "0") toFit();
    else return;
    ev.preventDefault();
  }});
  window.addEventListener("resize", () => {{ if (dlg.open) toFit(); }});
  stage.addEventListener("wheel", (ev) => {{
    ev.preventDefault();
    const r = stage.getBoundingClientRect();
    zoomTo(s * Math.exp(-ev.deltaY * 0.0015), ev.clientX - r.left, ev.clientY - r.top);
  }}, {{ passive: false }});

  // one finger or the mouse drags; two fingers pinch; a click without a drag zooms in or back out
  const pts = new Map();
  let moved = 0, pinch = null;
  stage.addEventListener("pointerdown", (ev) => {{
    stage.setPointerCapture(ev.pointerId); pts.set(ev.pointerId, [ev.clientX, ev.clientY]); moved = 0;
    if (pts.size === 2) {{ const [a, b] = [...pts.values()]; pinch = {{ d: Math.hypot(a[0] - b[0], a[1] - b[1]), s }}; }}
    stage.classList.add("dragging");
  }});
  stage.addEventListener("pointermove", (ev) => {{
    if (!pts.has(ev.pointerId)) return;
    const [ox, oy] = pts.get(ev.pointerId); pts.set(ev.pointerId, [ev.clientX, ev.clientY]);
    const r = stage.getBoundingClientRect();
    if (pts.size === 2 && pinch) {{
      const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      zoomTo(pinch.s * d / pinch.d, (a[0] + b[0]) / 2 - r.left, (a[1] + b[1]) / 2 - r.top); moved += 10; return;
    }}
    moved += Math.abs(ev.clientX - ox) + Math.abs(ev.clientY - oy);
    if (s > fit * 1.02) {{ tx += ev.clientX - ox; ty += ev.clientY - oy; clamp(); apply(); }}
  }});
  const up = (ev) => {{
    if (!pts.has(ev.pointerId)) return;
    pts.delete(ev.pointerId); if (pts.size < 2) pinch = null;
    if (!pts.size) {{
      stage.classList.remove("dragging");
      if (moved < 6) {{
        const r = stage.getBoundingClientRect();
        if (s > fit * 1.02) toFit(); else zoomTo(fit * 2.5, ev.clientX - r.left, ev.clientY - r.top);
      }}
    }}
  }};
  stage.addEventListener("pointerup", up);
  stage.addEventListener("pointercancel", (ev) => {{ pts.delete(ev.pointerId); pinch = null; stage.classList.remove("dragging"); }});
</script>
'''
(OUT / "index.html").write_text(page)
files = sorted(p.name for p in (OUT / "img").glob("*.jpg"))
print(f"{OUT / 'index.html'}: {len(built)} charts, {len(place_slides)} Storyteller map slides, {len(files)} pictures, "
      f"{sum((OUT / 'img' / f).stat().st_size for f in files) / 1e6:.1f} MB")
