#!/usr/bin/env python3
"""Writes specs/examples/*.json: one worked example per built chart, every number counted from disk.

    python3 tools/examples.py

Three sources, each named in the example's "source":
  - the FT originals in reference/ft-2021 (the poster's list, the template code, the git history)
  - this library's own catalogue (catalog/charts.json)
  - the Visual Storyteller's story folders, as counted in its chart_lab.py on 18 Sep 2026
"""
import collections
import csv
import glob
import io
import json
import os
import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
OUT = HERE / "specs/examples"
STORIES_DIR = Path.home() / "Documents/Oddtoe - iCloud Apple/Marketing/Stories"


def put(name, spec):
    (OUT / f"{name}.json").write_text(json.dumps(spec, indent=1, ensure_ascii=False) + "\n")


# ---------------------------------------------------------------- sources

# The Storyteller's nine story folders: pictures dropped in (value), slides drafted (value2).
STORIES = [
    {"label": "trump-balloon", "value": 8, "value2": 7, "note": "bulletin, the first posted"},
    {"label": "inflatables", "value": 8, "value2": 4, "note": "gallery: 8 pictures, 2 grids"},
    {"label": "experience-gardens", "value": 8, "value2": 9, "note": "list"},
    {"label": "sidehatch", "value": 6, "value2": 6, "note": "walkthrough"},
    {"label": "babbling-with-baobabs", "value": 5, "value2": 6, "note": "conversation"},
    {"label": "bab-arrives", "value": 6, "value2": 7, "note": "build"},
    {"label": "sweaty-cabbage", "value": 2, "value2": 3, "note": "single"},
    {"label": "a-wall-is-an-argument", "value": 4, "value2": 5, "note": "argument"},
    {"label": "top-5-caricatures", "value": 7, "value2": 8, "note": "list, Top 5s"},
]
STYLES = [{"label": "divider", "value": 24}, {"label": "article", "value": 10}, {"label": "bleed", "value": 5},
          {"label": "panel", "value": 4}, {"label": "ask", "value": 4}, {"label": "everything else", "value": 8}]

catalogue = json.loads((HERE / "catalog/charts.json").read_text())["charts"]
library = collections.Counter(c["group"] for c in catalogue)

# the FT poster, by family: listed, and built
RENAME = {"Change v Time": "Change over time", "Part to whole": "Part-to-whole"}
poster = collections.OrderedDict()
raw = (HERE / "reference/ft-2021/chartTypes.csv").read_text().replace("\r", "\n")
for r in csv.DictReader(io.StringIO(raw)):
    f = poster.setdefault(RENAME.get(r["category"], r["category"]), {"listed": 0, "built": 0})
    f["listed"] += 1
    f["built"] += r["avail"].strip().upper() == "TRUE"

# lines of code in each FT template (its own scripts, not the shared libraries)
LIBS = {"d3.min.js", "saveSvgAsPng.js", "styles.js", "drawFrame.js", "drawFrameOLD.js", "queue.min.js",
        "topojson.js", "svg2png.js", "d3.v3.min.js"}
lines = {}
for d in sorted(glob.glob(str(HERE / "reference/ft-2021") + "/*/")):   # a Path drops the trailing slash
    name = os.path.basename(d.rstrip("/"))
    if name in ("shared", "template", "wrapper-starter"):
        continue
    js = [f for f in glob.glob(d + "*.js") if os.path.basename(f) not in LIBS]
    if js:
        lines[name] = sum(sum(1 for _ in open(f, errors="ignore")) for f in js)
family_of = {c["ft"]: c["group"] for c in catalogue if c["ft"] not in (None, "storyteller")}
family_of.update({"uk-constituency-map-2017": "Spatial", "uk-constituency-cartogram-2017": "Spatial",
                  "map-us-choropleth": "Spatial", "column-political": "Magnitude",
                  "small-multiples-multiple-line": "Change over time",
                  "small-multiples-column-timeline": "Magnitude", "scatterplot-line-date": "Correlation"})
by_family = collections.defaultdict(list)
for k, v in lines.items():
    by_family[family_of[k]].append((k, v))

# the FT's git history, 2015 to 2017, by quarter; usernames merged with the names they sit beside
ALIAS = {"bobhaslett": "Bob Haslett", "tomgp": "Tom Pearson", "alansmithy": "Alan Smith", "sdbernard": "Steve Bernard"}
log = subprocess.run(["git", "log", "--format=%ad|%an", "--date=format:%Y-%m"], cwd=HERE,
                     capture_output=True, text=True, check=True).stdout.splitlines()
quarters = collections.OrderedDict()
for entry in sorted(log):
    ym, who = entry.split("|", 1)
    y, m = ym.split("-")
    if "2015" <= y <= "2017":
        quarters.setdefault(f"{y} Q{(int(m) - 1) // 3 + 1}", collections.Counter())[ALIAS.get(who, who)] += 1
qlabel = lambda k: k if (k.endswith("Q1") or k == next(iter(quarters))) else k.split()[1]

# ---------------------------------------------------------------- the examples

put("bar-ordered", {"chart": "bar-ordered", "kicker": "The longest carousels...", "title": "SLIDES PER STORY",
    "line": "The seven longest stories, *most slides first*.", "source": "Marketing/Stories/*/draft/story.json",
    "data": sorted(({"label": s["label"], "value": s["value2"], "note": s["note"]} for s in STORIES), key=lambda r: -r["value"])[:7]})
put("column-ordered", {"chart": "column-ordered", "kicker": "Where the slides went...", "title": "SLIDES by STYLE",
    "line": "All 55 slides, *the busiest style first*.", "source": "nine story folders, 55 slides", "data": STYLES})
top10 = sorted(lines.items(), key=lambda t: -t[1])[:10]
put("lollipop-h", {"chart": "lollipop-h", "kicker": "The heavy lifters...", "title": "the LONGEST FT TEMPLATES",
    "line": "Lines of code in each FT chart, *the longest first*.", "source": "reference/ft-2021/*/*.js",
    "data": [{"label": k, "value": v} for k, v in top10]})
put("lollipop-v", {"chart": "lollipop-v", "kicker": "The FT's poster...", "title": "CHARTS by FAMILY",
    "line": "Every chart on the FT's poster, *the biggest family first*.", "source": "reference/ft-2021/chartTypes.csv",
    "data": [{"label": f, "value": v["listed"]} for f, v in poster.items()]})
families = [f for f in poster if f in library]
put("slope", {"chart": "slope", "kicker": "From the FT to us...", "title": "WHAT GETS DRAWN",
    "line": "Charts the FT built, *against what the library will draw*.", "source": "chartTypes.csv and catalog/charts.json",
    "axes": ["FT built", "Library"], "data": [{"label": f, "value": poster[f]["built"], "value2": library[f]} for f in families]})
put("bump", {"chart": "bump", "kicker": "Which family leads...", "title": "THE FAMILIES, RANKED",
    "line": "Each family's place by count, *from poster to library*.", "source": "chartTypes.csv and catalog/charts.json",
    "series": ["Poster", "FT built", "Library"],
    "data": [{"label": f, "Poster": poster[f]["listed"], "FT built": poster[f]["built"], "Library": library[f]} for f in families]})
put("line", {"chart": "line", "kicker": "Slides drafted so far...", "title": "FIFTY-FIVE SLIDES",
    "line": "Slides drafted, *a running total by story*.", "source": "Marketing/Stories/*/draft, in the order drafted",
    "data": [{"label": "16 Sep", "value": 7}, {"label": "", "value": 11}, {"label": "17 Sep", "value": 20},
             {"label": "", "value": 26}, {"label": "", "value": 32}, {"label": "", "value": 39},
             {"label": "", "value": 42}, {"label": "", "value": 47},
             {"label": "18 Sep", "value": 55, "note": "nine stories, running total"}]})
TOP3 = ["Bob Haslett", "Tom Pearson", "Alan Smith"]
running, area_rows = collections.Counter(), []
for k, q in quarters.items():
    for p in TOP3:
        running[p] += q[p]
    running["Everyone else"] += sum(v for w, v in q.items() if w not in TOP3)
    area_rows.append({"label": qlabel(k), **{p: running[p] for p in TOP3 + ["Everyone else"]}})
put("area", {"chart": "area", "kicker": "Who built it...", "title": "FOUR HANDS on the FT SET",
    "line": "Changes to date, *stacked by who made them*.", "source": "git log of reference/ft-2021, usernames merged with names",
    "series": TOP3 + ["Everyone else"], "data": area_rows})
put("column-timeline", {"chart": "column-timeline", "kicker": "How the FT built it...", "title": "COMMITS by QUARTER",
    "line": "Changes to the FT's templates, *the big push in 2016*.", "source": "git log of reference/ft-2021, 2015 to 2017",
    "insight": "max", "data": [{"label": qlabel(k), "value": sum(q.values())} for k, q in quarters.items()]})
put("event-timeline", {"chart": "event-timeline", "kicker": "How it grew...", "title": "FOUR DAYS of the STORYTELLER",
    "line": "What happened each day, *oldest at the top*.", "data": [
        {"label": "15 SEP", "note": "Named Oddview-20. The Trump Balloon story goes out."},
        {"label": "16 SEP", "note": "Four formats, three brands, the folder drafts itself."},
        {"label": "17 SEP", "note": "Six shapes run end to end on Otto's own pictures."},
        {"label": "18 SEP", "note": "Shape, purpose, close, series. *And now charts.*"}]})
put("donut", {"chart": "donut", "kicker": "Where the slides went...", "title": "SLIDES by STYLE",
    "line": "All 55 slides, *split by the style that drew them*.", "source": "nine story folders, 55 slides", "data": STYLES})
waves = collections.Counter(c["wave"] for c in catalogue)
put("pie", {"chart": "pie", "kicker": "What is left to draw...", "title": "the LIBRARY by WAVE",
    "line": f"{sum(waves.values())} charts in four waves, *maps last*.", "source": "catalog/charts.json",
    "insight": "Wave 1", "data": [{"label": f"Wave {w}", "value": waves[w]} for w in (1, 2, 3, 4)]})
sources = collections.Counter("FT built it" if c["ft"] not in (None, "storyteller") else
                              ("FT listed it" if c["ft"] is None else "The Storyteller") for c in catalogue)
put("bar-stacked-proportional", {"chart": "bar-stacked-proportional", "kicker": "Where they come from...",
    "title": "EIGHTY CHARTS, THREE SOURCES", "line": "The catalogue by where each chart started, *most from the FT's own set*.",
    "source": "catalog/charts.json", "data": [{"label": k, "value": v} for k, v in sources.most_common()]})
put("treemap", {"chart": "treemap", "kicker": "Eighty charts...", "title": "the LIBRARY by FAMILY",
    "line": "Every chart in the catalogue, *sized by its family*.", "source": "catalog/charts.json",
    "data": [{"label": k, "value": v} for k, v in library.most_common()]})
put("scatterplot", {"chart": "scatterplot", "kicker": "More pictures, more slides?", "title": "MOSTLY, YES",
    "line": "Each dot is a story: *pictures across, slides up*.", "axes": ["Pictures", "Slides"], "data": STORIES})
put("bubble", {"chart": "bubble", "kicker": "Listed, built, written...", "title": "the FT's FAMILIES",
    "line": "Charts listed across, *built up*, sized by lines of code.", "source": "chartTypes.csv and reference/ft-2021/*/*.js",
    "axes": ["Listed", "Built"], "data": [{"label": f, "value": v["listed"], "value2": v["built"],
                                           "size": sum(n for _, n in by_family.get(f, []))} for f, v in poster.items()]})
put("butterfly", {"chart": "butterfly", "kicker": "Pictures against slides...", "title": "IN and OUT",
    "line": "Pictures on the left, *slides on the right*.", "axes": ["Pictures", "Slides"],
    "data": [STORIES[k] for k in (0, 1, 2, 3, 4, 5, 8)]})
put("dumbbell", {"chart": "dumbbell", "kicker": "Pictures against slides...", "title": "HOW FAR APART",
    "line": "Each story runs *from pictures in to slides out*.", "axes": ["Pictures", "Slides"], "data": STORIES})
put("windows", {"chart": "windows", "kicker": "Two stories, side by side...", "title": "BULLETIN against GALLERY",
    "line": "The same eight pictures in, *three fewer slides out*.", "source": "trump-balloon and inflatables drafts",
    "axes": ["The bulletin", "The gallery"], "insight": "Slides drafted",
    "images": ["~/Documents/Oddtoe - iCloud Apple/Marketing/Stories/trump-balloon/02-balloon-field.jpg",
               "~/Documents/Oddtoe - iCloud Apple/Marketing/Stories/inflatables/06-dome-installed.jpg"],
    "data": [{"label": "Pictures dropped in", "value": 8, "value2": 8}, {"label": "Slides drafted", "value": 7, "value2": 4},
             {"label": "Slides per picture", "value": 0.9, "value2": 0.5}]})
put("bar-grouped", {"chart": "bar-grouped", "kicker": "What the FT drew...", "title": "BUILT or ONLY DRAWN",
    "line": "Charts on the FT poster, *built or only drawn*.", "source": "reference/ft-2021/chartTypes.csv",
    "series": ["Built", "Never built"], "insight": "Spatial",
    "data": [{"label": f, "Built": v["built"], "Never built": v["listed"] - v["built"]} for f, v in poster.items()]})
put("column-grouped", {"chart": "column-grouped", "kicker": "Pictures against slides...", "title": "IN and OUT",
    "line": "Pictures dropped in, *slides drafted*.", "source": "Marketing/Stories/*/draft", "axes": ["Pictures", "Slides"],
    "data": [STORIES[k] for k in (0, 1, 2, 3, 5, 8)]})
put("beeswarm", {"chart": "beeswarm", "kicker": "Slides per picture...", "title": "the ODD ONE OUT",
    "line": "Slides per picture, *one story on its own*.", "insight": "inflatables",
    "data": [{"label": s["label"], "value": round(s["value2"] / s["value"], 2), "note": s["note"]} for s in STORIES]})
put("histogram", {"chart": "histogram", "kicker": "How long is a chart?", "title": "LINES per TEMPLATE",
    "line": "Lines of code in each FT chart, *counted into bands*.", "source": f"reference/ft-2021/*/*.js, {len(lines)} charts",
    "data": [{"label": k, "value": v} for k, v in sorted(lines.items())]})
BOX = [f for f in ["Change over time", "Magnitude", "Part-to-whole", "Correlation", "Ranking", "Distribution"] if len(by_family[f]) >= 4]
put("boxplot", {"chart": "boxplot", "kicker": "How long is a chart?", "title": "LINES by FAMILY",
    "line": "Lines of code in each FT template, *one line per family*.", "source": "reference/ft-2021/*/*.js",
    "insight": "line-dual-axis", "data": [{"label": k, "value": v, "group": f} for f in BOX for k, v in by_family[f]]})
put("process-spine", {"chart": "process-spine", "kicker": "From numbers to a story...", "title": "the DATA STORY PROCESS",
    "line": "Five stages, *from raw table to final deck*.", "insight": "Infographic story", "data": [
        ["Zeros and ones", "The raw table, before anyone has looked."],
        ["Data analysis", "Find the microstories: gaps, overlaps, superlatives."],
        ["Infographic story", "One insight per slide, in the right order."],
        ["The deck", "PowerPoint in the workshop; a carousel here."],
        ["Final presentation", "Context, insight, call-to-action."]]})
put("network", {"chart": "network", "kicker": "What calls what...", "title": "INSIDE the ENGINE",
    "line": "Each module, *linked to the ones it loads*.", "source": "the _load and lab() calls in the Storyteller's creative/*.py",
    "insight": "build_creative", "data": [
        {"label": "build_creative", "to": ["framing", "brand", "callout", "bleed_lab", "slide2_lab", "slide34_lab", "infographic_lab", "lastslide_lab"]},
        {"label": "infographic_lab", "to": ["slide2_lab", "slide34_lab"]},
        {"label": "lastslide_lab", "to": ["bleed_lab", "infographic_lab", "slide2_lab", "slide34_lab"]},
        {"label": "slide34_lab", "to": ["bleed_lab", "popup_lab", "slide2_lab"]},
        {"label": "popup_lab", "to": ["bleed_lab", "callout", "slide2_lab"]},
        {"label": "chart_lab", "to": ["infographic_lab"]}]})

# ---------------------------------------------------------------- wave 2

import datetime as dt

# every commit's author and local time (the author's own clock), 2015 to 2017
stamps = []
for entry in subprocess.run(["git", "log", "--format=%aI|%an"], cwd=HERE, capture_output=True, text=True, check=True).stdout.splitlines():
    iso, who = entry.split("|", 1)
    t = dt.datetime.fromisoformat(iso)
    if 2015 <= t.year <= 2017:
        stamps.append((t, ALIAS.get(who, who)))
by_person = collections.Counter(w for _, w in stamps)
first_seen = {}
for t, w in sorted(stamps):
    first_seen.setdefault(w, t)
last_seen = {w: max(t for t, x in stamps if x == w) for w in by_person}
quarter = lambda t: f"{t.year} Q{(t.month - 1) // 3 + 1}"
qkeys = list(quarters)
per_q = {k: sum(q.values()) for k, q in quarters.items()}
people_q = {k: len(q) for k, q in quarters.items()}
MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
y16 = [(t, w) for t, w in stamps if t.year == 2016]
GIT = "git log of reference/ft-2021"

put("bar", {"chart": "bar", "kicker": "Eighty charts...", "title": "CHARTS per WAVE",
    "line": "The catalogue in the order it gets drawn, *maps last*.", "source": "catalog/charts.json",
    "insight": "Wave 2", "data": [{"label": f"Wave {w}", "value": waves[w]} for w in (1, 2, 3, 4)]})
joined = sorted((w for w in by_person if by_person[w] >= 20), key=lambda w: first_seen[w])
put("column", {"chart": "column", "kicker": "Who built the FT set...", "title": "IN the ORDER THEY JOINED",
    "line": "Changes by each regular hand, *first to arrive on the left*.", "source": f"{GIT}, 2015 to 2017",
    "data": [{"label": w, "value": by_person[w]} for w in joined]})
delta = [{"label": s["label"], "value": s["value2"] - s["value"]} for s in STORIES]
put("bar-diverging", {"chart": "bar-diverging", "kicker": "Pictures in, slides out...", "title": "MORE or FEWER",
    "line": "Slides drafted less pictures dropped in, *story by story*.", "source": "Marketing/Stories/*/draft", "data": delta})

# each drafted story's slides, from picture-led to word-led
PICTURE = {"divider", "bleed", "panel", "opener", "collage", "post"}
BOTH = {"article"}
lean = []
for s in STORIES:
    deck = STORIES_DIR / s["label"] / "draft/story.json"
    if not deck.exists():
        continue
    d = json.loads(deck.read_text())
    c = collections.Counter(sl.get("style", d.get("style")) for sl in d.get("slides", []))
    lean.append({"label": s["label"], "Picture only": sum(v for k, v in c.items() if k in PICTURE),
                 "Picture and words": sum(v for k, v in c.items() if k in BOTH),
                 "Words only": sum(v for k, v in c.items() if k not in PICTURE | BOTH)})
LEAN = ["Picture only", "Picture and words", "Words only"]
put("bar-diverging-stacked", {"chart": "bar-diverging-stacked", "kicker": "Pictures or words...", "title": "HOW EACH STORY LEANS",
    "line": "Each story's slides, *picture-led on the left, word-led on the right*.", "source": "Marketing/Stories/*/draft/story.json",
    "series": LEAN, "data": lean})
put("column-diverging-stacked", {"chart": "column-diverging-stacked", "kicker": "Pictures or words...", "title": "HOW EACH STORY LEANS",
    "line": "Each story's slides, *word-led above, picture-led below*.", "source": "Marketing/Stories/*/draft/story.json",
    "series": LEAN, "data": lean})
put("spine", {"chart": "spine", "kicker": "What the FT drew...", "title": "BUILT or ONLY DRAWN",
    "line": "Each family on the FT's poster, *as shares of what it listed*.", "source": "reference/ft-2021/chartTypes.csv",
    "axes": ["Built", "Never built"], "data": [{"label": f, "value": v["built"], "value2": v["listed"] - v["built"]} for f, v in poster.items()]})
by_month = {y: collections.Counter(t.month for t, _ in stamps if t.year == y) for y in (2016, 2017)}
put("pyramid", {"chart": "pyramid", "kicker": "Two years of the FT set...", "title": "2016 against 2017",
    "line": "Changes in each month, *the busy year on the left*.", "source": GIT,
    "axes": ["2016", "2017"], "data": [{"label": m, "value": by_month[2016][k + 1], "value2": by_month[2017][k + 1]} for k, m in enumerate(MONTHS)]})
done = collections.Counter(c["wave"] for c in catalogue if c["status"] == "built")
put("bullet", {"chart": "bullet", "kicker": "How far along...", "title": "BUILT per WAVE",
    "line": "Charts built in each wave, *against the charts it holds*.", "source": "catalog/charts.json",
    "data": [{"label": f"Wave {w}", "value": done[w], "target": waves[w], "ranges": [round(waves[w] / 2), waves[w]]} for w in (1, 2, 3, 4)]})
top6 = [w for w, _ in by_person.most_common(5)]
put("proportional-squares", {"chart": "proportional-squares", "kicker": "Who built the FT set...", "title": "ONE HAND, MOSTLY",
    "line": "Changes by the five busiest hands, *one far ahead*.", "source": f"{GIT}, 2015 to 2017",
    "data": [{"label": w, "value": by_person[w]} for w in top6]})
fam_wave = collections.defaultdict(collections.Counter)
for c in catalogue:
    fam_wave[c["group"]][f"Wave {c['wave']}"] += 1
put("bar-stacked", {"chart": "bar-stacked", "kicker": "Eighty charts...", "title": "EACH FAMILY by WAVE",
    "line": "Every family's charts, *stacked by when they get drawn*.", "source": "catalog/charts.json",
    "series": ["Wave 1", "Wave 2", "Wave 3", "Wave 4"],
    "data": [{"label": f, **{f"Wave {w}": fam_wave[f][f"Wave {w}"] for w in (1, 2, 3, 4)}} for f, _ in library.most_common()]})
put("column-stacked", {"chart": "column-stacked", "kicker": "Who built it...", "title": "EACH QUARTER'S HANDS",
    "line": "Changes each quarter, *stacked by who made them*.", "source": f"{GIT}, usernames merged with names",
    "series": TOP3 + ["Everyone else"],
    "data": [{"label": qlabel(k), **{p: q[p] for p in TOP3}, "Everyone else": sum(v for w, v in q.items() if w not in TOP3)} for k, q in quarters.items()]})
pics = sum(s["value"] for s in STORIES)
put("waterfall", {"chart": "waterfall", "kicker": "Pictures in, slides out...", "title": f"{pics} IN, {sum(s['value2'] for s in STORIES)} OUT",
    "line": "From the pictures dropped in *to the slides drafted*, story by story.", "source": "Marketing/Stories/*/draft",
    "data": [{"label": "Pictures in", "value": pics, "total": True}] + delta + [{"label": "Slides out", "value": sum(s["value2"] for s in STORIES), "total": True}]})
flows = collections.Counter()
for c in catalogue:
    origin = "FT built it" if c["ft"] not in (None, "storyteller") else ("FT listed it" if c["ft"] is None else "The Storyteller")
    flows[(origin, f"Wave {c['wave']}")] += 1
    flows[(f"Wave {c['wave']}", "Built" if c["status"] == "built" else "To build")] += 1
put("sankey", {"chart": "sankey", "kicker": "Where they come from...", "title": "EIGHTY CHARTS, THREE ROADS",
    "line": "Each chart from where it started, *through its wave, to done*.", "source": "catalog/charts.json",
    "data": [{"source": a, "target": b, "value": v} for (a, b), v in flows.items()]})
put("line-two-panel", {"chart": "line-two-panel", "kicker": "How the FT built it...", "title": "CHANGES and PEOPLE",
    "line": "Changes each quarter, *and how many hands made them*.", "source": GIT,
    "series": ["Changes", "People"], "data": [{"label": qlabel(k), "Changes": per_q[k], "People": people_q[k]} for k in qkeys]})
put("column-line", {"chart": "column-line", "kicker": "How the FT built it...", "title": "BUSY, then SPREAD",
    "line": "Changes each quarter, *and changes per person*.", "source": GIT, "axes": ["Changes", "Changes per person"],
    "data": [{"label": qlabel(k), "value": per_q[k], "value2": round(per_q[k] / people_q[k], 1)} for k in qkeys]})
put("scatterplot-connected", {"chart": "scatterplot-connected", "kicker": "More hands, more changes?", "title": "the PATH of the FT SET",
    "line": "Each quarter a point: *people across, changes up*.", "source": GIT, "axes": ["People", "Changes"],
    "data": [{"label": k, "value": people_q[k], "value2": per_q[k]} for k in qkeys]})
weekly = collections.Counter(t.isocalendar()[1] for t, _ in y16 if t.isocalendar()[0] == 2016)
put("line-moving-average", {"chart": "line-moving-average", "kicker": "Week by week...", "title": "THE FT SET in 2016",
    "line": "Changes each week, *the four-week average in olive*.", "source": f"{GIT}, 2016", "options": {"window": 4, "period": "week"},
    "data": [{"label": MONTHS[dt.date.fromisocalendar(2016, w, 1).month - 1] if dt.date.fromisocalendar(2016, w, 1).day <= 7 else "", "value": weekly[w]} for w in range(1, 53)]})
busiest = max({t.date().isocalendar()[:2] for t, _ in y16}, key=lambda wk: sum(1 for t, _ in y16 if t.date().isocalendar()[:2] == wk))
week = [(t, w) for t, w in y16 if t.date().isocalendar()[:2] == busiest and t.weekday() < 5]
hours = collections.Counter((t.date(), t.hour) for t, _ in week)
days = sorted({t.date() for t, _ in week})
put("line-interday", {"chart": "line-interday", "kicker": "The busiest week...", "title": "HOUR by HOUR",
    "line": f"Changes each hour, *the week of {days[0].strftime('%-d %B %Y')}*.", "source": GIT,
    "data": [{"day": d.strftime("%a %-d"), "time": f"{h:02d}:00", "value": hours[(d, h)]} for d in days for h in range(8, 21)]})
daily = collections.Counter(t.date().isoformat() for t, _ in y16)
put("calendar-heatmap", {"chart": "calendar-heatmap", "kicker": "Every day of 2016...", "title": "THE FT SET, DAY by DAY",
    "line": "Changes on each day of 2016, *darker is busier*.", "source": f"{GIT}, 2016",
    "data": [{"date": d, "value": v} for d, v in sorted(daily.items())]})
wd_m = collections.defaultdict(collections.Counter)
for t, _ in y16:
    wd_m[DAYS[t.weekday()]][MONTHS[t.month - 1]] += 1
put("heatmap-category", {"chart": "heatmap-category", "kicker": "When the work happened...", "title": "DAY by MONTH",
    "line": "Changes in 2016 by weekday and month, *darker is busier*.", "source": f"{GIT}, 2016", "series": MONTHS,
    "data": [{"label": d, **{m: wd_m[d][m] for m in MONTHS}} for d in DAYS]})
hm = collections.Counter((t.hour, t.month) for t, _ in y16)
put("heatmap-quantity", {"chart": "heatmap-quantity", "kicker": "When the work happened...", "title": "HOUR by MONTH",
    "line": "Changes in 2016 by the hour and the month, *darker is busier*.", "source": f"{GIT}, 2016, the author's own clock",
    "axes": ["Hour of day", "Month"], "data": [{"x": h, "y": m, "value": v} for (h, m), v in sorted(hm.items())]})
top10 = [w for w, _ in by_person.most_common(10)]
put("priestley-timeline", {"chart": "priestley-timeline", "kicker": "Who was there when...", "title": "TEN HANDS, THREE YEARS",
    "line": "Each regular from first change *to last*.", "source": f"{GIT}, 2015 to 2017",
    "data": [{"label": w, "start": first_seen[w].date().isoformat(), "end": last_seen[w].date().isoformat()} for w in top10]})
top5 = [w for w, _ in by_person.most_common(5)]
monthly = collections.Counter((w, t.strftime("%Y-%m")) for t, w in stamps if w in top5)
put("circles-timeline", {"chart": "circles-timeline", "kicker": "Who was busy when...", "title": "FIVE HANDS by MONTH",
    "line": "Each circle a month's changes, *sized by how many*.", "source": f"{GIT}, 2015 to 2017",
    "data": [{"label": w, "date": ym, "value": v} for (w, ym), v in sorted(monthly.items())]})
SM = TOP3 + ["Steve Bernard"]
for kind, title, line in [("line", "FOUR HANDS, QUARTER by QUARTER", "Changes each quarter, *one panel per person*."),
                          ("area", "FOUR HANDS, QUARTER by QUARTER", "Changes each quarter, *one panel per person*."),
                          ("column", "FOUR HANDS, QUARTER by QUARTER", "Changes each quarter, *one panel per person*.")]:
    put(f"small-multiples-{kind}", {"chart": f"small-multiples-{kind}", "kicker": "Who built it...", "title": title, "line": line,
        "source": f"{GIT}, usernames merged with names",
        "data": [{"panel": p, "label": qlabel(k), "value": q[p]} for p in SM for k, q in quarters.items()]})
top_fams = [f for f, _ in library.most_common(5)]
put("small-multiples-bar", {"chart": "small-multiples-bar", "kicker": "Eighty charts...", "title": "EACH WAVE by FAMILY",
    "line": "The five biggest families, *one panel per wave*.", "source": "catalog/charts.json",
    "data": [{"panel": f"Wave {w}", "label": f, "value": fam_wave[f][f"Wave {w}"]} for w in (1, 2, 3, 4) for f in top_fams]})

# ---------------------------------------------------------------- wave 3

put("line-surplus-deficit", {"chart": "line-surplus-deficit", "kicker": "Two years of the FT set...", "title": "2017 against 2016",
    "line": "Changes each month, *olive where 2017 ran ahead, mauve where it fell behind*.", "source": GIT, "axes": ["2017", "2016"],
    "data": [{"label": m, "value": by_month[2017][k + 1], "value2": by_month[2016][k + 1]} for k, m in enumerate(MONTHS)]})
day16 = collections.Counter(t.date() for t, _ in y16)
candles = []
for w in range(1, 53):
    days_ = [dt.date.fromisocalendar(2016, w, d) for d in range(1, 6)]
    counts = [day16[d] for d in days_]
    candles.append({"label": MONTHS[days_[0].month - 1] if days_[0].day <= 7 else "", "open": counts[0], "close": counts[-1], "high": max(counts), "low": min(counts)})
put("candlestick", {"chart": "candlestick", "kicker": "Week by week...", "title": "THE WORKING WEEK, 2016",
    "line": "Each week's Monday and Friday, *its busiest and quietest day*.", "source": f"{GIT}, 2016, weekdays", "data": candles})
run, fan_rows = 0, []
for s_ in STORIES:
    run += s_["value2"]
    fan_rows.append({"label": s_["label"], "value": run})
per_story = [s_["value2"] for s_ in STORIES]
avg_s, lo_s, hi_s = sum(per_story) / len(per_story), min(per_story), max(per_story)
for k in range(1, 5):
    fan_rows.append({"label": f"next {k}", "value": round(run + k * avg_s, 1), "low": run + k * lo_s, "high": run + k * hi_s})
put("fan", {"chart": "fan", "kicker": "Slides so far...", "title": "FOUR MORE STORIES",
    "line": "Slides drafted so far, *and where four more stories could take it*.",
    "source": "Marketing/Stories/*/draft; the fan spans the fewest to the most slides per story", "data": fan_rows})
d0 = dt.date(2016, 1, 1)
put("seismogram", {"chart": "seismogram", "kicker": "Every day of 2016...", "title": "THE BIG DAYS",
    "line": "Changes on each day of the year, *one spike per day*.", "source": f"{GIT}, 2016",
    "data": [{"label": (d0 + dt.timedelta(days=k)).strftime("%-d %b"), "value": day16[d0 + dt.timedelta(days=k)]} for k in range(366)]})
put("proportional-symbol-ordered", {"chart": "proportional-symbol-ordered", "kicker": "Where the slides went...", "title": "SLIDES by STYLE",
    "line": "Every style as a circle, *its area the slides it drew*.", "source": "nine story folders, 55 slides", "data": STYLES})
put("proportional-symbol", {"chart": "proportional-symbol", "kicker": "Eighty charts...", "title": "CHARTS per WAVE",
    "line": "The catalogue in the order it gets drawn, *each wave a circle*.", "source": "catalog/charts.json", "insight": "Wave 3",
    "data": [{"label": f"Wave {w}", "value": waves[w]} for w in (1, 2, 3, 4)]})
fam_lines = [{"label": k, "value": v, "group": f} for f in BOX for k, v in by_family[f]]
put("dot-strip", {"chart": "dot-strip", "kicker": "How long is a chart?", "title": "LINES by FAMILY",
    "line": "Lines of code in each FT template, *one strip per family*.", "source": "reference/ft-2021/*/*.js", "insight": "line-dual-axis", "data": fam_lines})
put("violin", {"chart": "violin", "kicker": "How long is a chart?", "title": "THE SHAPE of EACH FAMILY",
    "line": "Lines of code in each FT template, *the middle half as a bar*.", "source": "reference/ft-2021/*/*.js", "insight": "line-dual-axis", "data": fam_lines})
TOP4 = [w for w, _ in by_person.most_common(4)]
put("barcode", {"chart": "barcode", "kicker": "When each hand worked...", "title": "EVERY CHANGE by the HOUR",
    "line": "Each change at the hour it was made, *one strip per person*.", "source": f"{GIT}, 2015 to 2017, the author's own clock",
    "data": [{"label": w, "group": w, "value": round(t.hour + t.minute / 60, 2)} for t, w in stamps if w in TOP4]})
put("cumulative-curve", {"chart": "cumulative-curve", "kicker": "Who did the work...", "title": "A FEW HANDS, MOSTLY",
    "line": "Every person by the changes they made, *counted up from the fewest*.", "source": f"{GIT}, 2015 to 2017",
    "axes": ["Changes per person"], "data": [{"label": w, "value": v} for w, v in by_person.items()]})
put("waffle", {"chart": "waffle", "kicker": "Where they come from...", "title": "EIGHTY CHARTS, THREE SOURCES",
    "line": "The catalogue by where each chart started, *one square a per cent*.", "source": "catalog/charts.json",
    "data": [{"label": k, "value": v} for k, v in sources.most_common()]})
put("sunburst", {"chart": "sunburst", "kicker": "Eighty charts...", "title": "EACH WAVE by FAMILY",
    "line": "Waves inside, *their families around them*.", "source": "catalog/charts.json",
    "data": [{"parent": f"Wave {c['wave']}", "label": f, "value": n_} for (c_w, f), n_ in collections.Counter((c["wave"], c["group"]) for c in catalogue).items() for c in [{"wave": c_w}]]})
# changes that touched each FT template's folder
touched, who_touched = collections.Counter(), collections.defaultdict(set)
author = None
for line in subprocess.run(["git", "log", "--format=@%an", "--name-only"], cwd=HERE, capture_output=True, text=True, check=True).stdout.splitlines():
    if line.startswith("@"):
        author, seen = ALIAS.get(line[1:], line[1:]), set()
    elif line.strip():
        folder = line.split("/")[0] if not line.startswith("reference/") else line.split("/")[2] if line.count("/") >= 2 else ""
        if folder in lines and folder not in seen:
            seen.add(folder); touched[folder] += 1; who_touched[author].add(folder)
start = min(first_seen.values())
put("voronoi", {"chart": "voronoi", "kicker": "Who came and went...", "title": "EACH HAND'S GROUND",
    "line": "First change across, last up, *each area the ground nearest*.",
    "source": f"{GIT}, 2015 to 2017", "axes": ["First change, days in", "Last change"], "insight": "Bob Haslett",
    "data": [{"label": w, "value": (first_seen[w] - start).days, "value2": (last_seen[w] - start).days} for w in by_person]})
put("arc", {"chart": "arc", "kicker": "Fifty-five seats...", "title": "the SLIDE PARLIAMENT",
    "line": "Every slide drafted as a seat, *by the style that drew it*.", "source": "nine story folders, 55 slides",
    "data": [{"label": "divider", "value": 24}, {"label": "article", "value": 10}, {"label": "bleed", "value": 5}, {"label": "the rest", "value": 16}]})
SETS = ["ranking", "comparison", "trend"]
regions = collections.Counter(tuple(m for m in SETS if m in c["methods"]) for c in catalogue)
put("venn", {"chart": "venn", "kicker": "Which charts draw what...", "title": "RANK, COMPARE, TREND",
    "line": "Charts in the catalogue by the pack's methods they can draw, *each overlap counted*.", "source": "catalog/charts.json",
    "data": [{"sets": list(k), "value": v} for k, v in regions.items() if k]})
put("pictogram", {"chart": "pictogram", "kicker": "What went in...", "title": "PICTURES per STORY",
    "line": "One square for each picture dropped in, *story by story*.", "source": "Marketing/Stories/*",
    "data": [{"label": s_["label"], "value": s_["value"]} for s_ in STORIES]})
wd_person = collections.defaultdict(collections.Counter)
for t, w in stamps:
    wd_person[w][DAYS[t.weekday()]] += 1
put("radar", {"chart": "radar", "kicker": "When each hand worked...", "title": "THE WEEK of THREE HANDS",
    "line": "Each person's changes by day of the week, *as shares of their own week*.", "source": f"{GIT}, 2015 to 2017", "series": DAYS, "unit": "%",
    "data": [{"label": w, **{d: round(100 * wd_person[w][d] / by_person[w]) for d in DAYS}} for w in [w for w, _ in by_person.most_common(3)]]})
put("parallel-coordinates", {"chart": "parallel-coordinates", "kicker": "Five ways to size a family...", "title": "THE FT's FAMILIES",
    "line": "Each family across five counts, *each on its own scale*.", "source": "chartTypes.csv, reference/ft-2021 and catalog/charts.json",
    "series": ["Listed", "Built", "Library", "Wave 1", "Lines of code"], "insight": "Change over time",
    "data": [{"label": f, "Listed": poster[f]["listed"], "Built": poster[f]["built"], "Library": library[f],
              "Wave 1": sum(1 for c in catalogue if c["group"] == f and c["wave"] == 1), "Lines of code": sum(v for _, v in by_family.get(f, []))} for f in families]})
pairs = []
crew = [w for w, _ in by_person.most_common(6)]
for a in range(len(crew)):
    for b in range(a + 1, len(crew)):
        shared = len(who_touched[crew[a]] & who_touched[crew[b]])
        if shared:
            pairs.append({"source": crew[a], "target": crew[b], "value": shared})
put("chord", {"chart": "chord", "kicker": "Who worked on what...", "title": "SHARED TEMPLATES",
    "line": "Each ribbon the FT templates two people both changed, *the widest in olive*.", "source": GIT, "data": pairs})

# ---------------------------------------------------------------- wave 4: maps

import math
countries = [g["properties"] for g in json.loads((HERE / "geo/world.json").read_text())["objects"]["countries"]["geometries"]]
states_ = [g["properties"] for g in json.loads((HERE / "geo/australia-states.json").read_text())["objects"]["states"]["geometries"]]
caps = {g["properties"]["state"]: g["properties"] for g in json.loads((HERE / "geo/australia-capitals.json").read_text())["objects"]["capitals"]["geometries"]}
councils = [g["properties"] for g in json.loads((HERE / "geo/australia-councils.json").read_text())["objects"]["councils"]["geometries"]]
cities = json.loads((HERE / "geo/cities.json").read_text())
au_cities = sorted((c for c in cities if c["country"] == "Australia"), key=lambda c: -c["pop"])
NE, ABS = "Natural Earth, 2019 population estimates", "ABS boundaries (ASGS 2021, councils 2025)"
TER = "RESOLVE Ecoregions"   # the terrain under locator, flow and symbol maps (CC BY 4.0)
city = lambda n: next(c for c in au_cities if c["name"] == n)

def charts(name, specs):
    (OUT / f"{name}.json").write_text(json.dumps({"charts": [dict(sp, name=f"{name}-{k}") for k, sp in enumerate(specs, 1)]}, indent=1, ensure_ascii=False) + "\n")

dense = [{"label": c["NAME"], "value": round(c["POP_EST"] / c["AREA_KM2"], 1)} for c in countries if c["AREA_KM2"] > 0 and c["POP_EST"] > 0]
share = [{"label": st["name"], "value": round(100 * caps[st["name"]]["area"] / st["area"], 1)} for st in states_ if st["name"] in caps]
charts("choropleth", [
    {"chart": "choropleth", "kicker": "Room to spare...", "title": "PEOPLE per SQUARE KILOMETRE",
     "line": "Every country by how crowded it is, *Australia among the emptiest*.", "source": NE, "insight": "Australia",
     "options": {"focus": "world"}, "data": dense},
    {"chart": "choropleth", "kicker": "City and country...", "title": "HOW MUCH is the CAPITAL",
     "line": "Each capital area as a share of its state, *Melbourne's the biggest*.", "source": ABS,
     "unit": "%", "insight": "Victoria", "options": {"focus": "australia", "layer": "states"}, "data": share}])
vic = [{"label": c["name"], "value": round(c["area"])} for c in councils if c["state"] == "Victoria" and "Unincorporated" not in c["name"]]
charts("choropleth-councils", [
    {"chart": "choropleth", "kicker": "Close in...", "title": "VICTORIA'S COUNCILS by SIZE",
     "line": "Every council by its area in square kilometres, *the biggest in the far north-west*.", "source": ABS, "unit": " km²",
     "options": {"focus": "Victoria", "layer": "councils"}, "data": vic}])
put("proportional-symbol-map", {"chart": "proportional-symbol-map", "kicker": "Where the people are...", "title": "AUSTRALIA'S CITIES",
    "line": "Every city of 20,000 people or more, *each circle its population*.", "source": f"{NE}; {TER}", "options": {"focus": "australia"},
    "data": [{"label": c["name"], "country": "Australia", "value": c["pop"]} for c in au_cities]})
def dist(a, b):
    la1, lo1, la2, lo2 = map(math.radians, (a["lat"], a["lon"], b["lat"], b["lon"]))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return round(2 * 6371 * math.asin(math.sqrt(h)))
cb = city("Canberra")
put("flow-map", {"chart": "flow-map", "kicker": "All lines lead to...", "title": "HOW FAR to CANBERRA",
    "line": "Each capital to Canberra as the crow flies, *thicker the further*.", "source": f"Natural Earth city points; distances on a sphere; {TER}",
    "unit": " km", "options": {"focus": "australia"},
    "data": [{"from": n, "from_country": "Australia", "to": "Canberra", "to_country": "Australia", "value": dist(city(n), cb)} for n in ("Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Hobart", "Darwin")]})
put("contour-map", {"chart": "contour-map", "kicker": "Where the people are...", "title": "WHERE AUSTRALIA LIVES",
    "line": "Cities of 20,000 or more, *smoothed into bands of people*.", "source": NE, "options": {"focus": "australia"},
    "data": [{"label": c["name"], "country": "Australia", "value": c["pop"]} for c in au_cities]})
charts("cartogram-equal", [
    {"chart": "cartogram-equal", "kicker": "Every country the same size...", "title": "THE CROWDED and the EMPTY",
     "line": "One square per country, *shaded by people per square kilometre*.", "source": NE, "insight": "Australia", "options": {"focus": "world"},
     "data": dense},
    {"chart": "cartogram-equal", "kicker": "Every council the same size...", "title": "VICTORIA'S COUNCILS, EVENED OUT",
     "line": "One square per council, *shaded by its area*, so the small city ones show.", "source": ABS, "unit": " km²",
     "options": {"focus": "Victoria", "layer": "councils"}, "data": vic}])
put("cartogram-scaled", {"chart": "cartogram-scaled", "kicker": "Every country by its people...", "title": "THE WORLD by PEOPLE",
    "line": "Each country a circle, *its area the people who live there*.", "source": NE, "options": {"focus": "world"},
    "data": [{"label": c["NAME"], "value": c["POP_EST"]} for c in countries if c["POP_EST"] > 0]})
put("dot-density-map", {"chart": "dot-density-map", "kicker": "Where the people are...", "title": "ONE DOT, TEN THOUSAND PEOPLE",
    "line": "Everyone in a city of 20,000 or more, *each dot gathered round its city*.", "source": NE, "options": {"focus": "australia", "per": 10000},
    "data": [{"label": c["name"], "country": "Australia", "value": c["pop"]} for c in au_cities]})
put("heatmap-map", {"chart": "heatmap-map", "kicker": "Where the big cities are...", "title": "FOUR THOUSAND CITIES",
    "line": "Capitals and cities of 100,000 or more, *counted into squares*.", "source": NE, "options": {"focus": "world"},
    "data": [{"label": c["name"], "lat": c["lat"], "lon": c["lon"]} for c in cities if c["pop"] >= 100000 or c["capital"]]})
tok = next(c for c in cities if c["name"] == "Tokyo")
sg = next(c for c in cities if c["name"] == "Singapore")
charts("locator-map", [
    {"chart": "locator-map", "kicker": "Where it is...", "title": "MELBOURNE and SYDNEY", "line": "Two capitals, *the pin on Melbourne*.",
     "source": f"{NE}; {TER}", "options": {"focus": "australia"},
     "data": [{"label": "Melbourne", "country": "Australia", "note": "Victoria's capital"}, {"label": "Sydney", "country": "Australia"}]},
    {"chart": "locator-map", "kicker": "Closer in...", "title": "VICTORIA", "line": "The state's four biggest cities, *Melbourne pinned*.",
     "source": f"{NE}; {ABS}; {TER}", "options": {"focus": "Victoria"},
     "data": [{"label": n, "country": "Australia"} for n in ("Melbourne", "Geelong", "Ballarat", "Bendigo")]},
    {"chart": "locator-map", "kicker": "Closer still...", "title": "GREATER MELBOURNE", "line": "The capital area and its councils, *the city pinned*.",
     "source": f"{ABS}; {TER}", "options": {"focus": "Greater Melbourne"},
     "data": [{"label": "Melbourne", "country": "Australia", "note": "Greater Melbourne, {:,} km²".format(round(caps["Victoria"]["area"]))}, {"label": "Geelong", "country": "Australia"}]},
    {"chart": "locator-map", "kicker": "The festival shortlist...", "title": "WHERE the FESTIVALS ARE",
     "line": "Five festivals on the list, *two of them in Melbourne*.", "source": f"project-manager-agent/australia_asia_art_light_experimental_festivals.csv; {TER}",
     "options": {"focus": [95, -46, 150, 42], "inset": False},
     "data": [{"label": "Melbourne", "country": "Australia", "note": "RISING and Melbourne Fringe"},
              {"label": "Vivid Sydney", "lat": city("Sydney")["lat"], "lon": city("Sydney")["lon"]},
              {"label": "i Light Singapore", "lat": sg["lat"], "lon": sg["lon"]},
              {"label": "MUTEK Japan", "lat": tok["lat"], "lon": tok["lon"]}]}])

print(f"{len(list(OUT.glob('*.json')))} examples in {OUT}")
