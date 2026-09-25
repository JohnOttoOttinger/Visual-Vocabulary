#!/usr/bin/env python3
"""A poster of everything the library can draw: a wall of charts under a headline.

For the Datalabs pages and decks, where one picture has to say "any chart you need, in your
brand". The charts come from the transparent renders, so the wall is drawings, not slides:

    node bin/vv.mjs render specs/examples/*.json --out out/chart-only-dark  --mode marquee
    node bin/vv.mjs render specs/examples/*.json --out out/chart-only-light --mode plaster
    python3 tools/poster.py every-drawing --mode dark
    python3 tools/poster.py every-map --mode light --out out/posters

Writes out/posters/<name>-<mode>.jpg at 2400x1500 (a wide web image), or --size square.
"""
import argparse
import json
import math
import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent.parent
FONTS = Path.home() / "Library/Fonts"
TEXTURES = Path(os.environ.get("VV_TEXTURES", Path.home() /
                "Claude-Projects-2026/Oddtoe-Visual-Storyteller/creative/textures"))

# ground, ink, body text, where the drawings are, the card each drawing sits on, and the logo
LOGOS = Path.home() / "Documents/Datalabs - iCloud Apple/Datalabs Illustrations - Overlord Folder/Datalabs Logos"
GROUND = {
    "dark": dict(bg=(38, 43, 42), ink=(255, 255, 255), body=(221, 204, 177), src="out/chart-only-dark",
                 card=(52, 58, 57), edge=(72, 79, 77), logo="Datalabs-Agency-Data-Visualization-Logo-White-Filled-Text.png"),
    "light": dict(bg=(236, 233, 227), ink=(26, 24, 22), body=(62, 54, 45), src="out/chart-only-light",
                  card=(250, 248, 244), edge=(216, 210, 199), logo="Datalabs-Agency-Data-Visualization-Logo-Filled-Text.png"),
}
OLIVE = (138, 143, 106)
SIZES = {"wide": (2400, 1500), "square": (2000, 2000), "tall": (1600, 2000)}

# the three posters, and what goes on each
SETS = {
    "every-drawing": dict(maps=False, one_per_chart=True,
                          lead="Every drawing in the library...", title="EVERY CHART",
                          line="{n} chart types, one system, drawn in your brand."),
    "every-map": dict(maps=True, one_per_chart=False,
                      lead="Where the numbers are...", title="EVERY MAP",
                      line="World, country, state and council maps, drawn from open data."),
    "everything": dict(maps=None, one_per_chart=False,
                       lead="Every drawing in the library...", title="EVERY CHART AND MAP",
                       line="{n} drawings, one system, drawn in your brand."),
}


def face(name, px):
    return ImageFont.truetype(str(FONTS / name), px)


def examples(spec):
    """The renders to tile: one per chart, or every worked example; maps in, out, or only."""
    cat = {c["id"]: c for c in json.loads((HERE / "catalog/charts.json").read_text())["charts"]}
    out, seen = [], set()
    for p in sorted((HERE / "specs/examples").glob("*.json")):
        j = json.loads(p.read_text())
        for k, sp in enumerate(j.get("charts") or [j]):
            name = sp.get("name") or (f"{p.stem}-{k + 1}" if "charts" in j else p.stem)
            is_map = cat.get(sp["chart"], {}).get("group") == "Spatial"
            if spec["maps"] is not None and is_map != spec["maps"]:
                continue
            if spec["one_per_chart"] and sp["chart"] in seen:
                continue
            seen.add(sp["chart"])
            out.append(name)
    return out


def tile(path, box, pad=0.06):
    """One chart, trimmed of its transparent bleed and fitted into the box."""
    im = Image.open(path).convert("RGBA")
    im = im.crop(im.getbbox() or (0, 0, im.width, im.height))
    w, h = box[0] * (1 - pad * 2), box[1] * (1 - pad * 2)
    s = min(w / im.width, h / im.height)
    return im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)


def poster(set_name, mode, size, cols=None, out_dir=None, plain=False):
    spec, g = SETS[set_name], GROUND[mode]
    bg, ink, body, src = g["bg"], g["ink"], g["body"], g["src"]
    names = examples(spec)
    W, H = SIZES[size]
    im = Image.new("RGB", (W, H), bg)

    texture = TEXTURES / ("grunge.jpg" if mode == "light" else "concrete.jpg")
    if texture.exists():                       # the house ground, never copied into this repo
        t = Image.open(texture).convert("RGB").resize((W, H), Image.LANCZOS)
        im = Image.blend(im, t, 0.16 if mode == "light" else 0.10)

    d = ImageDraw.Draw(im)
    pad = round(W * 0.04)
    if plain:
        # just the wall, edge to edge: for use as a page background, where the page carries the words
        grid = (0, 0, W, H)
        gw, gh = W, H
    lead = face("Qwigley-Regular.ttf", round(W * 0.040))
    title = face("BebasNeue-Regular.ttf", round(W * 0.072))
    line = face("Arvo-Regular.ttf", round(W * 0.0145))
    # Qwigley hangs a long way under its baseline, so set every line by its own ink, not by the
    # font's box: the script sits a hair above the headline's caps, the way the slides do it.
    y = pad
    cap = d.textbbox((0, 0), spec["title"], font=title)          # (l, top, r, bottom) of the caps
    if not plain:
        lead_ink = d.textbbox((0, 0), spec["lead"], font=lead, anchor="ls")
        y = pad - lead_ink[1]                                        # the script's top edge at the pad
        d.text((pad, y), spec["lead"], font=lead, fill=OLIVE, anchor="ls")
        y += round(W * 0.012)                                        # a hair, not a line
        d.text((pad - cap[0], y - cap[1]), spec["title"], font=title, fill=ink)
        y += cap[3] - cap[1] + round(W * 0.022)
        d.text((pad, y), spec["line"].format(n=len(names)), font=line, fill=body)
        y += round(W * 0.032)
    if not plain:
        grid = (pad, y, W - pad, H - round(H * 0.085))
        gw, gh = grid[2] - grid[0], grid[3] - grid[1]
    if not cols:
        want = max(1, round(math.sqrt(len(names) * gw / gh * 0.62)))
        # nudge to a count that fills its last row, so the wall has no ragged corner
        cols = min(range(max(1, want - 2), want + 3), key=lambda c: ((-len(names)) % c, abs(c - want)))
    rows = math.ceil(len(names) / cols)
    box = (gw / cols, gh / rows)
    gap, radius = box[0] * 0.05, round(10 * W / 2400)
    for k, name in enumerate(names):
        f = HERE / src / f"{name}.png"
        if not f.exists():
            print(f"! missing {f}")
            continue
        cx, cy = grid[0] + (k % cols) * box[0], grid[1] + (k // cols) * box[1]
        d.rounded_rectangle((round(cx + gap / 2), round(cy + gap / 2),
                             round(cx + box[0] - gap / 2), round(cy + box[1] - gap / 2)),
                            radius=radius, fill=g["card"], outline=g["edge"], width=max(1, round(W / 1600)))
        t = tile(f, (box[0] - gap, box[1] - gap))
        im.paste(t, (round(cx + (box[0] - t.width) / 2), round(cy + (box[1] - t.height) / 2)), t)

    logo = LOGOS / g["logo"]
    if logo.exists() and not plain:
        mark = Image.open(logo).convert("RGBA")
        mark = mark.crop(mark.getbbox())
        mw = round(W * 0.20)
        mark = mark.resize((mw, max(1, round(mark.height * mw / mark.width))), Image.LANCZOS)
        im.paste(mark, (W - pad - mark.width, pad), mark)
    else:
        print(f"! no logo at {logo}")

    if not plain:
        foot = face("Arvo-Bold.ttf", round(W * 0.012))
        d.text((pad, H - round(H * 0.040)), "datalabsagency.com", font=foot, fill=body)
    out = Path(out_dir or HERE / "out/posters")
    out.mkdir(parents=True, exist_ok=True)
    f = out / f"{set_name}-{mode}{'-plain' if plain else ''}.jpg"
    im.save(f, quality=88, optimize=True)
    print(f"{f}  {len(names)} drawings, {cols} across, {W}x{H}")
    return f


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("set", nargs="?", default="every-drawing", choices=list(SETS))
    ap.add_argument("--mode", default="dark", choices=list(GROUND))
    ap.add_argument("--size", default="wide", choices=list(SIZES))
    ap.add_argument("--cols", type=int)
    ap.add_argument("--out")
    ap.add_argument("--plain", action="store_true", help="the wall alone, for use as a page background")
    a = ap.parse_args()
    poster(a.set, a.mode, a.size, a.cols, a.out, a.plain)


if __name__ == "__main__":
    main()
