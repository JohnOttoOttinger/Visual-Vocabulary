# Visual Vocabulary — rules for Claude

Oddview-60 (proposed 18 Sep 2026): Otto's chart library for Oddtoe and Datalabs. A standalone
project; the Visual Storyteller (Oddview-20, `~/Claude-Projects-2026/Oddtoe-Instagram-Boost-Ads`)
is its first user and After Effects its second. Start from `README.md`, `docs/STATUS.md` and
`catalog/charts.json`.

## The seam with the Storyteller (Otto, 18 Sep 2026)

The library draws everything inside the chart box. The Storyteller keeps its slide: lead-in,
headline, Arvo line, wayfinder, plaster, grunge. The library also redraws the Storyteller's
existing chart modes, so every chart comes from one place. The pack's Ten Methods stay the
Storyteller's modes; library charts are their sub-modes. Nothing is copied between the projects.

The Storyteller calls the library from `chart_lab.build` (its `LIBRARY` table maps each mode and
sub-mode to a chart here). A change to a chart the Storyteller uses is checked with
`python3 tools/storyteller-check.py` before it is called done (it snapshots the Storyteller's own
slides; `--accept` when a change is wanted). Offering a chart in the Storyteller is `storyteller`,
`storyteller_line` and (for a mode's fallback) `storyteller_default` in `catalog/charts.json`, then
`node bin/vv.mjs storyteller`; nothing is typed into the Storyteller by hand. A chart that takes over another
Storyteller drawing goes into `PORTED` there. Offering a new sub-mode in the Storyteller is a line in
its `LIBRARY` and `SUB_LINE`, and a `storyteller` entry in `catalog/charts.json`.

## Brand

- Colours come from `src/theme.js`, which reads `brand/tokens.json` (the design system's file,
  copied by `node brand/sync-tokens.mjs`). Chart files use roles (`th.roles.main`, `th.ink`,
  `th.series[k]`), never a hex.
- Oddtoe and Datalabs share every value: only the mark and the address differ, and a chart
  carries neither.
- The Storyteller's plaster, ink, body and brown were measured off the After Effects divider and
  are not design-system tokens yet. They live in `theme.js` only.
- Several series: the fixed order in `theme.js`, chosen by the dataviz palette validator. Olive and
  blue-muted are too close to be adjacent series (the butterfly is fine: position separates them).
  Do not fade series colours to mark an insight; ring the insight instead.

## Otto's chart rules (from his Storyteller reviews, 18 Sep 2026)

- One insight per chart, the row the eye goes to first; `highlight` says how it is marked.
- Bars are chunky, only the far end slightly rounded, seven at most. Wide columns keep the bar's
  corner (`rmax`), never a pill.
- Called-out values in Bebas; Numbers Depot only for numbering: the circle-number (every rank on a
  ranking bar) and a process's steps (Otto, 19 Sep 2026, replacing large stats in Depot).
- Axis names in small Arvo Bold, as written, each centred on its axis, the up one turned to read
  sideways (`core.axisNames`; Otto, 19 Sep 2026: Bebas in taupe was hard to read).
- Every chart slide has a one-line Arvo `line` with the house bold on its key phrase, and a source.
- The slope chart was parked in the Storyteller as too small and technical; if it is drawn here,
  draw it big.
- No dual-axis charts: FT's `line-dual-axis` becomes two panels on one time axis.

- Run `node bin/vv.mjs check` after touching `src/`: ten seconds, every example on both grounds,
  and it fails on a break. `vv gallery` and the review page are for looking, not for catching.

## Maps

- Map data is `geo/*.json`, rebuilt by `tools/build-geo.sh`; the raw downloads stay in `out/`.
  A map using the ABS layers (states, capitals, councils) credits "ABS boundaries" in its source;
  one drawn on terrain (locator, flow and symbol maps by default) credits "RESOLVE Ecoregions".
- Land is sand, never washed out; terrain colours are `landColours` in `src/theme.js`, the greens
  kept to sage so they never read as the olive insight.
- Maps from data are drawn here; photographic, street-level or moving maps are GEOlayers in After
  Effects (`tools/to-geolayers.mjs` writes the job). Otto chose this split over Leaflet (18 Sep 2026).
- Places come from `geo/cities.json` by name; names repeat across countries, so give `"country"`.

## Working rules

- Fonts are read from `~/Library/Fonts`; textures from the Storyteller's `creative/textures`. Never
  copy either into this repo: it is public, and the fonts and textures are licensed.
- Every number in an example is counted from disk, and its `source` says where. Examples are written
  by `tools/examples.py`; add to it, never hand-edit `specs/examples/`.
- `src/charts/panel-line.js` and `small-multiples.js` are shared drawing, not charts; every other file
  there is one chart.
- A new chart: a file in `src/charts/`, a line in `src/charts/index.js`, an example in
  `specs/examples/`, its status in `catalog/charts.json`, then `node bin/vv.mjs gallery` and look at
  it on plaster and on dark before calling it done.
- Otto reviews on the live gallery page; print PDFs only when he calls a v1.
- Work on a branch. Do not commit or push unless Otto asks.
