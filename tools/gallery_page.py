#!/usr/bin/env python3
"""The review page: every built chart on plaster and on dark, and the whole catalogue by wave.

    node bin/vv.mjs gallery && python3 tools/gallery_page.py

Writes out/page/index.html and out/page/img/*.jpg (the gallery frames, brought down to 720 wide).
"""
import html
import json
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent.parent
SRC, OUT = HERE / "out/gallery", HERE / "out/page"
(OUT / "img").mkdir(parents=True, exist_ok=True)

cat = json.loads((HERE / "catalog/charts.json").read_text())
charts = cat["charts"]
# every example spec, by chart; a file of several ({"charts": [...]}) gives one card per variant
variants = {}
for p in sorted((HERE / "specs/examples").glob("*.json")):
    j = json.loads(p.read_text())
    for k, sp in enumerate(j.get("charts") or [j]):
        name = sp.get("name") or (f"{p.stem}-{k + 1}" if "charts" in j else p.stem)
        variants.setdefault(sp["chart"], []).append({**sp, "name": name})
examples = {cid: vs[0] for cid, vs in variants.items()}
built = [c for c in charts if c["status"] == "built" and c["id"] in variants]
# gallery order: the Storyteller's methods first, in the pack's order, then the rest
ORDER = ["timeline", "trend", "ranking", "cause-effect", "process", "proportions", "comparison", "outlier", "network", "correlation"]
# maps (no pack method) come last
built.sort(key=lambda c: (min((ORDER.index(m) for m in c["methods"] if m in ORDER), default=99), not c.get("replaces"), not c.get("storyteller"), c["name"]))

# the Storyteller's sub-mode deck, drawn through the library (its own contact sheet)
STORYTELLER_SHEET = Path.home() / "Claude-Projects-2026/Oddtoe-Instagram-Boost-Ads/creative/chart-submodes-contact-sheet.jpg"
if STORYTELLER_SHEET.exists():
    im = Image.open(STORYTELLER_SHEET).convert("RGB")
    im.resize((1600, round(im.height * 1600 / im.width)), Image.LANCZOS).save(OUT / "img/storyteller-submodes.jpg", quality=84)

for c in built:
    for v in variants[c["id"]]:
        for mode in ("plaster", "marquee"):
            f = SRC / f"{v['name']}-{mode}-frame.png"
            Image.open(f).convert("RGB").resize((720, 900), Image.LANCZOS).save(OUT / f"img/{v['name']}-{mode}.jpg", quality=84)

e = html.escape
METHOD = {m: m.replace("-", " ") for m in ORDER}


def card(c, v, many):
    meta = f"FT family: {e(c['group'])}"
    if c.get("storyteller"):
        rep = f'<p class="rep">Storyteller: <b>{e(c["storyteller"])}</b></p>'
    else:
        rep = '<p class="rep">In the library; not offered in the Storyteller yet</p>' if c["wave"] < 4 else '<p class="rep">A map: world, Australia, a state or a capital area</p>'
    title = e(c["name"]) + (f' <span class="var">· {e(v.get("title", "").title())}</span>' if many else "")
    return f'''<figure class="card" id="{e(v['name'])}">
  <img src="img/{e(v['name'])}-plaster.jpg" data-plaster="img/{e(v['name'])}-plaster.jpg" data-marquee="img/{e(v['name'])}-marquee.jpg" width="720" height="900" loading="lazy" alt="{e(c['name'])}: {e(v.get('title', ''))}">
  <figcaption><h3>{title}</h3><p class="meta">{meta}</p>{rep}</figcaption>
</figure>'''


def rows(w):
    out = []
    for c in (x for x in charts if x["wave"] == w):
        status = '<span class="pill on">Built</span>' if c["status"] == "built" else '<span class="pill">To build</span>'
        methods = ", ".join(METHOD.get(m, m) for m in c["methods"]) or "—"
        out.append(f'<tr><td class="nm">{e(c["name"])}</td><td>{e(c["group"])}</td><td>{e(methods)}</td>'
                   f'<td>{e(c.get("storyteller") or "")}</td><td>{status}</td></tr>')
    return "\n".join(out)


sheet_h = round(Image.open(OUT / "img/storyteller-submodes.jpg").height) if (OUT / "img/storyteller-submodes.jpg").exists() else 800
waves = cat["waves"]
n_built = sum(c["status"] == "built" for c in charts)
tables = "\n".join(f'''<section class="wave">
  <h3><span class="wn">Wave {w}</span> {e(waves[w])} <span class="count">{sum(c["wave"] == int(w) for c in charts)} charts</span></h3>
  <div class="scroll"><table>
    <thead><tr><th>Chart</th><th>FT family</th><th>Pack methods</th><th>In the Storyteller</th><th>Status</th></tr></thead>
    <tbody>{rows(int(w))}</tbody>
  </table></div>
</section>''' for w in waves)

page = f'''<title>Visual Vocabulary</title>
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
  .seg button:focus-visible, a:focus-visible {{ outline: 2px solid var(--olive); outline-offset: 2px; }}
  .grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr)); gap: 32px 24px; }}
  .card {{ margin: 0; display: grid; gap: 12px; align-content: start; }}
  .card img {{ display: block; width: 100%; height: auto; aspect-ratio: 4 / 5; background: var(--surface); }}
  .card h3 {{ font: 400 26px/1 "Bebas Neue", Impact, sans-serif; letter-spacing: -.01em; margin: 0; }}
  .card p {{ margin: 4px 0 0; font-size: 13px; line-height: 1.45; color: var(--muted); }}
  .card .rep b {{ color: var(--ink); }}
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
    <div class="grid">
{chr(10).join(card(c, v, len(variants[c["id"]]) > 1) for c in built for v in variants[c["id"]])}
    </div>
  </section>

  <section class="sect" aria-labelledby="st">
    <h2 id="st">In the Storyteller</h2>
    <p>The Storyteller now asks the library for every chart slide and keeps its own headline, line, source and wayfinder. These are the sub-modes the library added, rendered by the Storyteller from one deck file.</p>
    <img class="sheet" src="img/storyteller-submodes.jpg" width="1600" height="{sheet_h}" loading="lazy" alt="Sixteen Storyteller chart slides drawn by the library, one for each sub-mode it added">
  </section>

  <section class="sect" aria-labelledby="cat">
    <h2 id="cat">All eighty, by wave</h2>
    <p>The FT's 49 general charts, the 19 it listed and never built, the Storyteller's own drawings, and eight maps. Pack methods are the Storyteller chart modes each chart can draw.</p>
    {tables}
  </section>

  <footer>Visual-Vocabulary repo, branch <code>oddtoe-rebuild</code>. Oddtoe design system v1.7.0.</footer>
</div>

<script>
  const btns = document.querySelectorAll(".seg button");
  function show(ground) {{
    btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.ground === ground)));
    document.querySelectorAll(".card img").forEach((img) => {{ img.src = img.dataset[ground]; }});
    try {{ localStorage.setItem("vv-ground", ground); }} catch (e) {{}}
  }}
  btns.forEach((b) => b.addEventListener("click", () => show(b.dataset.ground)));
  let saved = null;
  try {{ saved = localStorage.getItem("vv-ground"); }} catch (e) {{}}
  if (saved === "marquee") show("marquee");
</script>
'''
(OUT / "index.html").write_text(page)
print(f"{OUT / 'index.html'}: {len(built)} charts, {len(charts)} in the catalogue")
