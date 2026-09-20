# The Storyteller's chart slides, before the library

These eleven slides are how `chart_lab.py` drew its charts on 18 September 2026, with its own PIL
drawings, before the chart library took over. They are the evidence behind the parity check: every
one of them renders within 1.3 to 3.2 out of 255 of the library's drawing of the same slide, which
is text anti-aliasing and the library's deliberate fixes.

Kept because the drawings themselves were deleted from `chart_lab.py` on 20 September 2026: they
had become a second, older design (they still set called-out values in Depot, and ranked without
the circle-numbers), and the library is the one source now.

Shrunk to 720 wide; the slides were 1080 × 1350. `tools/storyteller-check.py` no longer compares
against these: it compares the Storyteller's slides with the snapshots in `reference/storyteller-slides/`.
