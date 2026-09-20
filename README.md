# Visual Vocabulary — Oddview-60

The Oddtoe and Datalabs chart library. One JSON spec in; one chart out, as a transparent PNG and a
layered SVG, in the house style.

It started as the Financial Times' *Visual Vocabulary* (the originals are kept, untouched, in
`reference/ft-2021/`). Every chart is being redrawn to the Oddtoe design system: Bebas, Arvo,
Qwigley and Numbers Depot; olive for the insight, cream for the rest; chunky bars with only the far
end rounded; one insight per chart, marked on purpose.

It is a standalone project. The Visual Storyteller (Oddview-20) is its first user; After Effects is
next; anything else that needs a chart can call it the same way.

## Render a chart

```
npm install
node bin/vv.mjs render specs/examples/bar-ordered.json --out out --frame
node bin/vv.mjs gallery
```

`render` writes `<name>.png` (the chart alone, transparent), `<name>.svg`, and with `--frame` a
specimen slide `<name>-frame.png`. A file holding `{"charts": [...]}` renders them all in one
launch. `gallery` renders every example in `specs/examples/` on plaster and on dark paper into
`out/gallery/`.
`--only <ids>` limits it to some charts and `--scale 2` renders at twice the pixels; the review
page takes the maps from `out/gallery-2x/` so they stay sharp when zoomed.

Needs Node 22 and Google Chrome. The four faces are read from `~/Library/Fonts` and never kept here.

## A spec

```json
{
  "chart": "bar-ordered",
  "data": [{"label": "experience-gardens", "value": 9}, {"label": "trump-balloon", "value": 7}],
  "insight": "max",
  "highlight": "hue",
  "mode": "plaster",
  "width": 918, "height": 834, "scale": 1080
}
```

| Key | Meaning |
|---|---|
| `chart` | an id from `catalog/charts.json` that is built |
| `data` | rows of `label`, `value`, `value2`, `note`, `to` — the Storyteller's table. Several series: name them in `"series": [...]` and give each row a column per series |
| `insight` | the one row the eye goes to first: a label, or `max`, `min`, `first`, `last`, `none`. Left out, the chart picks the obvious one |
| `highlight` | how the insight is marked: `hue` (olive against cream), `intensity`, `enclosure` (a dotted ring), `size` |
| `mode` | `plaster` (textured social, the Storyteller), `longform` (reports), `marquee` (dark: decks, video) |
| `width`, `height` | the chart's box in pixels |
| `scale` | the short side of the frame the chart sits in (1080 for Instagram and for 1920x1080 video). Type is sized from it |
| `unit`, `prefix`, `axes`, `options` | per chart; see the chart's own file in `src/charts/` |
| `kicker`, `title`, `line`, `source` | used only by the specimen slide (`--frame`) |

A table with no numbers yet renders as a dotted "DATA TO COME" box naming the columns the chart
reads, so a drafted slide can be looked at before anyone writes numbers.

## How the Storyteller uses it

Since 18 September 2026 the Storyteller draws every chart slide through the library. It keeps its
slide — lead-in, headline, Arvo line, wayfinder, plaster, texture — and `chart_lab.build` asks the
library for what goes in the chart box: it writes a spec with the box's size, runs `vv render`, and
lays the PNG at the box's corner less the bleed the output reports. Nothing is copied between the
two projects; the Storyteller finds the library at `~/Claude-Projects-2026/Visual-Vocabulary`
(`VV_LIBRARY` if it moves).

The workshop pack's Ten Methods stay the Storyteller's chart modes; library charts are their
sub-modes. The Storyteller's `place` mode (19 Sep 2026) is the maps: `pins`, `shaded`, `circles`,
`flows`, `dots`, `tiles`, `sized`, `contours`, `squares`, with the slide's `focus` and `layer`. The map is `LIBRARY` in the Storyteller's `chart_lab.py`, and `storyteller` in
`catalog/charts.json` records the same thing from this side. Since 19 Sep 2026 the Storyteller
offers 73 of the 81 charts; the other eight carry a `storyteller_note` saying why not.

`python3 tools/storyteller-check.py` renders the Storyteller's worked chart slides and compares each
with its snapshot in `reference/storyteller-slides/`, so a change here shows up as a changed slide
there; `--accept` takes the new picture when the change is wanted. Until 20 Sep 2026 it compared
against the drawings `chart_lab.py` made before the library: those drawings are gone, and the
eleven slides they drew are kept, with what they proved, in `reference/storyteller-before-library/`.
A deck asks for all its charts in one run (`chart_lab.batch`), so one launch of Chrome draws a
whole deck.

## Maps

Every map chart draws on the same base: open boundary data in `geo/`, built by
`tools/build-geo.sh` from Natural Earth (public domain: countries, cities) and the Australian
Bureau of Statistics' ASGS boundaries (CC BY 4.0: states, greater capital city areas, councils).
Maps using the ABS layers credit it in their source line ("ABS boundaries"). The terrain under
locator, flow and symbol maps (desert, dry grass, scrub, forest, jungle, taiga, tundra, ice) is
RESOLVE Ecoregions 2017 (CC BY 4.0) grouped into eight kinds of ground, with Natural Earth's ice;
those maps credit "RESOLVE Ecoregions". `options.terrain` turns it on or off on any map.

`options.focus` sets the view: `"world"`, `"australia"`, a state (`"Victoria"`), a capital area
(`"Greater Melbourne"` or just `"melbourne"`), a country, or a box `[west, south, east, north]`.
The world is a flat Miller map without the globe's outline, cropped to 56°S–84°N (no Antarctica)
and cut through the Bering Strait, so small countries draw larger than an equal-area map allows;
Australia is an equal-area conic, and close-ups Mercator. A view is fitted to a region's main
landmasses, not its far islands (New South Wales includes Lord Howe Island). Every map is drawn as
big as its box allows: its key and headline number go beside it when there is room, else on open
sea in a corner, and only failing both does the map shrink (`mapRoom` in `src/geo.js`). Places are named cities (with `"country"` when names repeat) or `lat` and
`lon`.

The library draws maps from data: coastlines, borders, councils and cities, in the house style,
as layered SVG. Photographic, street-level or moving maps belong to GEOlayers in After Effects:
`node tools/to-geolayers.mjs <locator-map spec>` writes a job for the Oddview-31 points-of-interest
template with the same places and the map's view as the camera's end, to run with
`Claude-After-Effects-Scenes/tools/map-job.sh`.

## Pictures

A chart that shows pictures (the two windows) takes `"images": [a, b]`, paths relative to the spec
file. The render tool reads them in, so the chart and its SVG carry them.

## After Effects

Every chart's SVG is grouped for motion: `#grid`, `#axis-x`, `#marks`, `#labels`, `#insight`, and
inside `#marks` one `<g class="row">` per row carrying `data-row` (its place in the table),
`data-order` (the order it is drawn) and `data-insight`. A motion pass can reveal a chart row by
row and land on the insight last.

## Where things are

| Path | What |
|---|---|
| `catalog/charts.json` | every chart, built or to come: FT group, the pack's methods, wave, status |
| `src/charts/` | one file per chart |
| `src/core.js` | the table, the insight, type placed by its ink, bars, dots, rules, the circle-number, the stat |
| `src/theme.js` | colour roles and the three grounds, read from `brand/tokens.json` |
| `brand/sync-tokens.mjs` | copies the design system's `tokens.json` in; run it when the design system changes |
| `specs/examples/` | one worked example per built chart, every number counted from disk |
| `tools/storyteller-check.py` | the Storyteller's chart slides against their snapshots |
| `reference/storyteller-slides/` | those snapshots; `--accept` takes new ones |
| `reference/storyteller-before-library/` | how the Storyteller drew its charts before the library |
| `tools/examples.py` | writes every example spec, counting its numbers from disk |
| `tools/gallery_page.py` | builds the review page from the gallery renders; any chart opens large to zoom |
| `geo/`, `tools/build-geo.sh` | the map data and how it is rebuilt from its sources |
| `src/geo.js` | the map views, places, projections and the base map |
| `tools/to-geolayers.mjs` | a locator map as a GEOlayers job for After Effects |
| `reference/ft-2021/` | the FT originals, their sample data and their chart notes |
