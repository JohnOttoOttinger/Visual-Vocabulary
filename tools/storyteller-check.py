#!/usr/bin/env python3
"""Does the library draw the Storyteller's charts the way the Storyteller does?

The Storyteller's chart_lab.py asks the library for every chart it has (USE_LIBRARY). For every
worked example in chart_lab.py, this renders the slide twice — once with the drawing chart_lab
made before the library, once as the Storyteller draws it now — and compares them. The mean difference is out of 255: on the 18 Sep
2026 examples 0.9 to 3.6, which is text anti-aliasing plus the library's deliberate fixes. A jump
well past that is a drawing difference; look at check.jpg.

    python3 tools/storyteller-check.py [--format 4x5] [--out DIR]

Writes <mode>-storyteller.jpg, <mode>-library.jpg and check.jpg (all pairs side by side) to DIR.
The Storyteller is read, never written: its slides go to DIR.
"""
import argparse
import importlib.util
import os
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent.parent
STORYTELLER = Path(os.environ.get("VV_STORYTELLER", Path.home() /
                   "Claude-Projects-2026/Oddtoe-Instagram-Boost-Ads/creative"))

# Storyteller mode (and sub-mode) -> library chart. A mode missing here is not ported yet.
PORTED = {
    ("timeline", None): "event-timeline",
    ("trend", None): "line",
    ("ranking", None): "bar-ordered",
    ("proportions", None): "donut",
    ("comparison", None): "butterfly",
    ("comparison", "dumbbell"): "dumbbell",
    ("outlier", None): "beeswarm",
    ("correlation", None): "scatterplot",
    ("process", None): "process-spine",
    ("network", None): "network",
    ("comparison", "windows"): "windows",
}


def load_chart_lab():
    spec = importlib.util.spec_from_file_location("chart_lab", STORYTELLER / "chart_lab.py")
    cl = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(cl)
    return cl


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--format", default="4x5")
    ap.add_argument("--out", default=str(HERE / "out/storyteller-check"))
    a = ap.parse_args()
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    cl = load_chart_lab()
    cl.HERE = out
    W, H = cl.bc.FORMATS[a.format]

    pairs = []
    for n, (mode, kw) in enumerate(cl.EXAMPLES, 1):
        sub = kw.get("submode")
        if (mode, sub) not in PORTED:
            continue
        name = f"{mode}{'-' + sub if sub else ''}"
        # the reference: the drawing chart_lab made before the library; then the slide as it is now
        for side, on in (("storyteller", False), ("library", True)):
            cl.USE_LIBRARY = on
            cl.build(f"{name}-{side}.jpg", mode, page=n, pages=len(cl.EXAMPLES), size=W, height=H, **kw)
        A = np.asarray(Image.open(out / f"{name}-storyteller.jpg").convert("RGB")).astype(float)
        B = np.asarray(Image.open(out / f"{name}-library.jpg").convert("RGB")).astype(float)
        diff = float(np.abs(A - B).mean())
        pairs.append((name, diff))
        print(f"{name:<22} -> {PORTED[(mode, sub)]:<16} mean difference {diff:5.2f}")

    # everything side by side, the old drawing left, the library right
    tw, th = W // 3, H // 3
    sheet = Image.new("RGB", (4 * tw + 3 * 12 + 40, (len(pairs) + 1) // 2 * (th + 12)), (255, 255, 255))
    for k, (name, _) in enumerate(pairs):
        x = (k % 2) * (2 * tw + 52)
        y = (k // 2) * (th + 12)
        for j, side in enumerate(("storyteller", "library")):
            im = Image.open(out / f"{name}-{side}.jpg").resize((tw, th), Image.LANCZOS)
            sheet.paste(im, (x + j * (tw + 6), y))
    sheet.save(out / "check.jpg", quality=88)
    print(f"side by side: {out / 'check.jpg'}")


if __name__ == "__main__":
    main()
