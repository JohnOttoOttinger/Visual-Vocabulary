#!/bin/bash
# Builds geo/*.json, the map data the map charts draw, from the open sources below. The downloads
# land in out/geo-raw (not kept in git); the outputs are small TopoJSON files that are.
#
#   Natural Earth (public domain): countries and cities of the world
#   Australian Bureau of Statistics, ASGS Edition 3 (CC BY 4.0): states and territories, greater
#   capital city areas, and local government areas (councils). Credit: "ABS boundaries".
#
#   tools/build-geo.sh
set -euo pipefail
cd "$(dirname "$0")/.."
RAW=out/geo-raw; mkdir -p "$RAW" geo
MS=node_modules/.bin/mapshaper
NE=https://naciscdn.org/naturalearth
ABS=https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs/edition-3-july-2021-june-2026/access-and-downloads/digital-boundary-files

get() { [ -s "$RAW/$2" ] || { echo "fetch $2"; curl -sfL --max-time 300 "$1" -o "$RAW/$2"; }; }
get "$NE/50m/cultural/ne_50m_admin_0_countries.zip" ne_50m_admin_0_countries.zip
get "$NE/10m/cultural/ne_10m_populated_places_simple.zip" ne_10m_populated_places_simple.zip
get "$ABS/STE_2021_AUST_SHP_GDA2020.zip" STE_2021_AUST_SHP_GDA2020.zip
get "$ABS/GCCSA_2021_AUST_SHP_GDA2020.zip" GCCSA_2021_AUST_SHP_GDA2020.zip
get "$ABS/LGA_2025_AUST_GDA2020.zip" LGA_2025_AUST_GDA2020.zip
for z in "$RAW"/*.zip; do d="${z%.zip}"; [ -d "$d" ] || unzip -oq "$z" -d "$d"; done
find_one() { find "$RAW/$1" \( -name '*.shp' -o -name '*.gpkg' \) | head -1; }

# the world: countries with their ISO code, name, continent and the Natural Earth population estimate
$MS "$(find_one ne_50m_admin_0_countries)" -each 'AREA_KM2=Math.round(this.area / 1e6)' -filter-fields ISO_A3,ADM0_A3,NAME,NAME_LONG,CONTINENT,POP_EST,POP_YEAR,AREA_KM2 \
  -rename-layers countries -simplify 20% keep-shapes -o geo/world.json format=topojson quantization=1e5 force

# cities: every capital, and every place of 100,000 people or more; Australia's of 20,000 or more
$MS "$(find_one ne_10m_populated_places_simple)" \
  -filter 'featurecla.indexOf("capital") >= 0 || pop_max >= 100000 || (adm0name == "Australia" && pop_max >= 20000)' \
  -each 'lat=latitude, lon=longitude, country=adm0name, state=adm1name, pop=pop_max, capital=(featurecla.indexOf("capital") >= 0)' \
  -filter-fields name,country,state,lat,lon,pop,capital -o geo/cities.json format=json force

# Australia: states and territories, the greater capital city areas, and councils
$MS "$(find_one STE_2021_AUST_SHP_GDA2020)" -filter 'STE_NAME21 != "Other Territories" && STE_NAME21 != "Outside Australia"' \
  -each 'name=STE_NAME21, code=STE_CODE21, area=AREASQKM21' -filter-fields name,code,area -rename-layers states \
  -simplify 2% keep-shapes -o geo/australia-states.json format=topojson quantization=1e5 force
$MS "$(find_one GCCSA_2021_AUST_SHP_GDA2020)" -filter 'GCC_NAME21.indexOf("Greater") === 0 || GCC_NAME21 === "Australian Capital Territory"' \
  -each 'name=GCC_NAME21, state=STE_NAME21, area=AREASQKM21' -filter-fields name,state,area -rename-layers capitals \
  -simplify 4% keep-shapes -o geo/australia-capitals.json format=topojson quantization=1e5 force
LGA="$(find_one LGA_2025_AUST_GDA2020)"
$MS "$LGA" -filter 'AREASQKM > 0' -each 'name=LGA_NAME25, code=LGA_CODE25, state=STE_NAME21, area=AREASQKM' \
  -filter-fields name,code,state,area -rename-layers councils -simplify 1.5% keep-shapes \
  -o geo/australia-councils.json format=topojson quantization=1e5 force
ls -la geo
