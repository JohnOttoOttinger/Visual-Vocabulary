#!/usr/bin/env python3
"""Do the Storyteller's chart slides still look the way they looked?

The library draws every chart on every Storyteller slide, so a change here shows up there. This
renders the Storyteller's worked chart examples and compares each with its snapshot in
`reference/storyteller-slides/`, printing the mean difference out of 255. Anything past the floor
of JPEG noise is a change in the drawing: look at check.jpg, and if the change is wanted, take the
new picture with --accept.

    python3 tools/storyteller-check.py [--format 4x5] [--accept] [--out DIR]

It replaced the parity check against chart_lab's own drawings, which were deleted on 20 Sep 2026
once the library drew everything; those eleven slides are kept, with what they proved, in
`reference/storyteller-before-library/`.
"""
import argparse
import importlib.util
import io
import os
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent.parent
SNAPS = HERE / "reference/storyteller-slides"
STORYTELLER = Path(os.environ.get("VV_STORYTELLER", Path.home() /
                   "Claude-Projects-2026/Oddtoe-Visual-Storyteller/creative"))
WIDE = 540          # snapshots are kept at this width; the fresh slide comes down to it to compare
FLOOR = 0.6         # mean difference out of 255 under which two renders count as the same


def load_chart_lab():
    spec = importlib.util.spec_from_file_location("chart_lab", STORYTELLER / "chart_lab.py")
    cl = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(cl)
    return cl


QUALITY = 88


def small(path):
    """The slide at snapshot size, through the same JPEG a snapshot went through, so a slide that
    has not changed compares as not changed."""
    im = Image.open(path).convert("RGB")
    if im.width != WIDE:
        im = im.resize((WIDE, round(im.height * WIDE / im.width)), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=QUALITY, optimize=True)
    return Image.open(io.BytesIO(buf.getvalue())).convert("RGB")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--format", default="4x5")
    ap.add_argument("--accept", action="store_true", help="take the new pictures as the snapshots")
    ap.add_argument("--out", default=str(HERE / "out/storyteller-check"))
    a = ap.parse_args()
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    for old in out.glob("*.jpg"):        # last run's slides are not this run's
        old.unlink()
    SNAPS.mkdir(parents=True, exist_ok=True)
    cl = load_chart_lab()
    cl.HERE = out                      # the Storyteller is read, never written: slides go to DIR
    cl.examples(a.format, out=lambda mode, sub: f"{mode}{'-' + sub if sub else ''}.jpg")

    rows, changed = [], []
    for f in sorted(out.glob("*.jpg")):
        if f.name == "check.jpg":
            continue
        fresh, snap = small(f), SNAPS / f.name
        if a.accept or not snap.exists():
            fresh.save(snap, quality=QUALITY, optimize=True)
            rows.append((f.stem, None))
            continue
        d = float(np.abs(np.asarray(fresh).astype(float) - np.asarray(small(snap)).astype(float)).mean())
        rows.append((f.stem, d))
        if d > FLOOR:
            changed.append(f.stem)

    for name, d in rows:
        print(f"{name:<24} {'taken' if d is None else f'{d:5.2f}' + ('  CHANGED' if d > FLOOR else '')}")

    # the ones that changed, snapshot left and fresh right, so the eye can settle it
    if changed:
        w = WIDE // 2
        sheet = Image.new("RGB", (2 * w + 18, len(changed) * (round(w * 1.25) + 12)), (255, 255, 255))
        for k, name in enumerate(changed):
            for j, im in enumerate((small(SNAPS / f"{name}.jpg"), small(out / f"{name}.jpg"))):
                im = im.resize((w, round(w * im.height / im.width)), Image.LANCZOS)
                sheet.paste(im, (6 + j * (w + 6), k * (round(w * 1.25) + 12)))
        sheet.save(out / "check.jpg", quality=88)
        print(f"\n{len(changed)} changed; snapshot left, fresh right: {out / 'check.jpg'}")
        print("if the change is wanted: python3 tools/storyteller-check.py --accept")
        raise SystemExit(1)
    print(f"\n{len(rows)} slides, none changed")


if __name__ == "__main__":
    main()
