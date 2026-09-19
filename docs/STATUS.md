# Status

## 19 September 2026 — Otto's map and number review; 73 charts in the Storyteller

- **Maps:** darker sand land; terrain under locator, flow and symbol maps (RESOLVE Ecoregions,
  credited); the world flat (Miller, no globe outline, no Antarctica); every map as big as its box
  allows, key and headline number beside it or on open sea (`mapRoom`); Australia fitted to its
  main landmasses (Lord Howe Island had pulled it off centre); the pin edged so it holds on green;
  the world's bubbles fill two-fifths of the box and fall back to country codes.
- **Numbers:** called-out values in Bebas, Depot for numbering; every rank on the ordered bar in a
  circle-number; the two-panel chart's end number above its point; axis names in small Arvo Bold,
  each centred on its axis, the up one turned to read sideways (`core.axisNames`).
- **Radar:** every shape see-through, the outlines over all the fills.
- **The Storyteller** offers 35 more charts as sub-modes (73 of 81); `chart-library-deck-example.json`
  draws them. The other eight say why in `storyteller_note`.
- **Review page:** any chart opens in a zoom viewer; maps at twice the size.
- `storyteller-check.py` still passes: the eleven worked charts within 1.3 to 3.2 of the old
  drawings (the font changes cover small areas).

## 19 September 2026 — maps in the Storyteller

The Storyteller has a `place` mode (Otto asked): every library map is one of its sub-modes, `pins`
by default. `flow-map` now also reads the Storyteller's table (`label` to `to`). Its worked deck is
`chart-place-deck-example.json`, one slide for every map in the gallery (fifteen); the parity check is unchanged.

## 19 September 2026 — wave 4, the maps: the catalogue is built

**81 of 81.** The eight FT map types and a locator map (Otto asked for close-ups with a city or two
marked): `choropleth`, `proportional-symbol-map`, `flow-map`, `contour-map`, `cartogram-equal`,
`cartogram-scaled`, `dot-density-map`, `heatmap-map`, `locator-map`.

- **The split Otto chose (18 Sep 2026):** maps from data are drawn here with D3 on open boundary
  data; photographic, street-level and moving maps are GEOlayers in After Effects. No Leaflet.
- **Data:** `geo/` holds Natural Earth countries and cities and the ABS states, capital areas and
  councils (2025), simplified to 1.6 MB together. `tools/build-geo.sh` rebuilds it.
- **Views:** the world, Australia, any state, any capital area, any country or a box. A close-up
  gets an overview inset; a state close-up draws only its own councils.
- **GEOlayers:** `tools/to-geolayers.mjs` turns locator maps into an Oddview-31 job. The four
  example locator maps convert and pass the After Effects pipeline's own check; they have not been
  rendered (After Effects must be open with the GEOlayers panel showing).

## 18 September 2026 (night) — wave 3 done

**72 of 80 built.** Wave 3, the charts the FT listed and never built: `line-surplus-deficit`,
`candlestick`, `fan`, `seismogram`, `proportional-symbol` and its ordered version, `dot-strip`,
`violin`, `barcode`, `cumulative-curve`, `waffle`, `sunburst`, `voronoi`, `arc` (parliament),
`venn`, `pictogram`, `radar`, `parallel-coordinates`, `chord`.

- Colours stay the system's: parts keep their series colours and the insight is ringed, never
  faded; heatmap-like shading is one hue.
- Labels that could collide are placed so they do not: axis names skip where there is no room,
  right-hand names are pushed apart, a chord's names keep a letter's height apart.
- The fan's projection is worked from the stories themselves: the next four stories at the fewest,
  the average and the most slides any story has had.

**New in the Storyteller:** ranking `circles`, proportions `waffle`, outlier `violin`
(`chart-submodes-deck-example.json` has sixteen slides).

## 18 September 2026 (late) — wave 2 done

**53 of 80 built.** Wave 2, the rest of the FT's built set: `bar`, `column`, `bar-diverging`,
`bar-diverging-stacked`, `column-diverging-stacked`, `spine`, `pyramid`, `bullet`,
`proportional-squares`, `bar-stacked`, `column-stacked`, `waterfall`, `sankey`, `line-two-panel`,
`line-interday`, `line-moving-average`, `column-line`, `scatterplot-connected`, `heatmap-category`,
`heatmap-quantity`, `calendar-heatmap`, `priestley-timeline`, `circles-timeline` and the four small
multiples (line, area, column, bar).

- FT's dual-axis line is drawn as **two panels on one time axis**, and its column-line timeline as
  columns above a line; no chart in the library has two value scales.
- Heatmaps and the calendar shade in **one hue** (light olive to dark olive; on dark paper, dark to
  pale mint). Diverging charts run **mauve through a warm grey to olive**.
- The calendar folds a year into the blocks that give the biggest squares: two half-years in a 4:5
  frame, one strip in a wide one.
- Examples count from the FT's git history (1,372 changes, 2015–2017), the Storyteller's drafted
  decks and the catalogue, all in `tools/examples.py`.

**New in the Storyteller:** trend `average`, ranking `squares`, comparison `spine`, correlation
`path`. The parity check and the 360 deck are unchanged.

## 18 September 2026 (evening) — wave 1 done, the Storyteller connected

**Wave 1 is built: 26 charts.** Added since the morning: `lollipop-v`, `slope`, `bump`, `area`,
`column-timeline`, `bar-stacked-proportional`, `treemap`, `bubble`, `windows`, `column-grouped`,
`boxplot`, `process-spine`, `network`.

**The Storyteller draws every chart slide through the library.** `chart_lab.py` keeps its old
drawings only as the check's reference (`USE_LIBRARY = False`). Its new sub-modes: trend `column`;
ranking `column`, `lollipop`; proportions `pie`, `treemap`, `bar`; comparison `grouped`, `columns`;
outlier `histogram`, `box`; correlation `bubble`. Its worked deck `chart-submodes-deck-example.json`
draws them. Not offered there: `slope` (the Storyteller parked it), `bump` and `area` (they need a
series table), `lollipop-v` (labels too small at nine rows).

**Against the Storyteller** (`python3 tools/storyteller-check.py`, 4:5, mean difference out of 255,
old drawing against the slide as drawn now):

| Storyteller | Library chart | Difference |
|---|---|---|
| ranking | bar-ordered | 0.94 |
| outlier | beeswarm | 1.03 |
| proportions | donut | 1.17 |
| trend | line | 1.26 |
| comparison | butterfly | 1.36 |
| timeline | event-timeline | 1.73 |
| correlation | scatterplot | 1.84 |
| comparison / windows | windows | 2.22 |
| network | network | 2.30 (same layout: Python's random numbers reproduced) |
| process | process-spine | 3.11 |
| comparison / dumbbell | dumbbell | 3.20 (the number column was respaced on purpose) |

`data-360-deck-example.json` re-renders through the Storyteller with its picture slides
byte-identical and its chart slides within 2.0.

## 18 September 2026 (morning) — the first 13

**Built:** `bar-ordered`, `column-ordered`, `lollipop-h`, `line`, `event-timeline`, `donut`, `pie`,
`scatterplot`, `butterfly`, `dumbbell`, `bar-grouped`, `beeswarm`, `histogram`. 13 of 80.

**Against the Storyteller**, before the fixes of the evening:

| Storyteller mode | Library chart | Difference |
|---|---|---|
| ranking | bar-ordered | 0.93 |
| proportions | donut | 1.18 |
| trend | line | 1.31 |
| comparison | butterfly | 1.33 |
| outlier | beeswarm | 1.51 |
| correlation | scatterplot | 1.95 |
| comparison / dumbbell | dumbbell | 3.14 (the number column was respaced on purpose) |
| timeline | event-timeline | 3.58 |

## Waves

| Wave | Charts | What |
|---|---|---|
| 1 | 26 | what the Storyteller's methods draw, and their closest siblings |
| 2 | 27 | the rest of the FT's built set |
| 3 | 19 | charts the FT listed and never built |
| 4 | 8 | maps |

## Next

The catalogue is done, and every chart the Storyteller can use is offered there. Open: the slope
stays parked in the Storyteller until Otto looks at it.

## Open

- The Oddview code 60 is a proposal.
- Plaster, ink, body and brown are Storyteller measurements, not design-system tokens.
