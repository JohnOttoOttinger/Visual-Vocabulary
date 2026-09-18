// The look, read from the Oddtoe design system's tokens (brand/tokens.json, copied by
// brand/sync-tokens.mjs). Oddtoe and Datalabs share every value here: the Storyteller's rule is
// that only the mark and the address differ between brands, and a chart carries neither.
//
// Three grounds, the design system's three orientation modes:
//   plaster   the textured social posts (the Storyteller's chart slides). Light.
//   longform  reports and print. Light, the plain paper-light ground.
//   marquee   decks, video, After Effects. Dark paper. The design system's default.
//
// `strong` is the heavy rule: a timeline's spine, a scale's baseline, a line of best fit.
//
// Colour roles are the Storyteller's (the workshop pack's "Assign specific colors"), so a chart
// drawn here and a chart drawn there mean the same thing by the same colour.

import tokens from "../brand/tokens.json" with { type: "json" };

const C = tokens.color;
const tok = (group, name) => C[group][name].value;

export const TOKENS = {
  primary: tok("brand", "primary"),         // #8A8F6A olive: the insight
  secondary: tok("brand", "secondary"),     // #4E5041 dark olive: the insight's words
  paper: tok("brand", "paper"),             // #262B2A dark ground
  ink: tok("brand", "ink"),                 // #FFFFFF type on dark
  paperLight: tok("brand", "paper-light"),  // #F9F4EB light ground, the numeral in the circle
  cream: tok("accent", "cream"),
  moss: tok("accent", "moss"),
  blue: tok("accent", "blue-muted"),
  slate: tok("accent", "blue-slate"),
  mint: tok("accent", "sage-mint"),
  mauve: tok("accent", "mauve"),
  taupe: tok("accent", "taupe"),
  mocha: tok("accent", "mocha"),
};

// Measured in the Storyteller off the After Effects chapter divider (infographic_lab.py), not yet
// design-system tokens. Kept exact so a chart drawn here drops onto a Storyteller slide unchanged.
const STORYTELLER = {
  plaster: "#ECE9E3",   // PLASTER (236, 233, 227)
  ink: "#1A1816",       // INK (26, 24, 22)
  body: "#46423C",      // BODY (70, 66, 60)
  brown: "#3E362D",     // BROWN (62, 54, 45), the Qwigley lead-in
};

// Series order for charts with more than one series, chosen by the palette validator (adjacent
// pairs clear the colour-blind and normal-vision floors in both modes). Olive and blue-muted, the
// A-against-B pair, are too close to sit side by side, so blue comes third, not second.
const SERIES_LIGHT = [TOKENS.primary, TOKENS.secondary, TOKENS.blue, TOKENS.cream];
const SERIES_DARK = [TOKENS.primary, TOKENS.cream, TOKENS.blue, TOKENS.taupe];

// "The rest" of a whole (a donut's other slices), biggest to smallest: on light the Storyteller's
// creams stepping from taupe-ish to pale; on dark, slate stepping from light to dark.
const LIGHT_RAMP = [mix(TOKENS.cream, TOKENS.taupe, 0.55), mix(TOKENS.cream, TOKENS.taupe, 0.05)];

const LIGHT_ROLES = {
  main: TOKENS.primary,
  mainText: TOKENS.secondary,
  muted: TOKENS.cream,
  positive: TOKENS.moss,
  negative: TOKENS.mauve,
  neutral: TOKENS.taupe,
  versus: TOKENS.blue,
  onMain: TOKENS.paperLight,
};

export const MODES = {
  plaster: {
    ground: STORYTELLER.plaster, ink: STORYTELLER.ink, body: STORYTELLER.body,
    kicker: STORYTELLER.brown, strong: STORYTELLER.brown, dark: false,
    roles: LIGHT_ROLES, series: SERIES_LIGHT, ramp: LIGHT_RAMP,
  },
  longform: {
    ground: TOKENS.paperLight, ink: TOKENS.paper, body: STORYTELLER.body,
    kicker: STORYTELLER.brown, strong: STORYTELLER.brown, dark: false,
    roles: LIGHT_ROLES, series: SERIES_LIGHT, ramp: LIGHT_RAMP,
  },
  marquee: {
    ground: TOKENS.paper, ink: TOKENS.ink, body: TOKENS.cream,
    kicker: TOKENS.cream, strong: TOKENS.cream, dark: true,
    roles: {
      main: TOKENS.primary,
      mainText: TOKENS.ink,
      muted: TOKENS.slate,     // the rest recede cool, so the warm olive carries the insight
      positive: TOKENS.mint,
      negative: TOKENS.mauve,
      neutral: mix(TOKENS.cream, TOKENS.paper, 0.35),   // warm grey: mocha read pink on dark
      versus: TOKENS.blue,
      onMain: TOKENS.paperLight,
    },
    series: SERIES_DARK,
    ramp: [mix(TOKENS.slate, TOKENS.ink, 0.30), mix(TOKENS.slate, TOKENS.paper, 0.35)],
  },
};

// The four faces, by role. Bebas carries headlines, labels on bars and axis numbers; Arvo the
// words; Qwigley the lead-in; H&Co Numbers Depot the large stats (digits and % $ . , - only).
export const FONTS = {
  bebas: '"Bebas Neue"',
  arvo: '"Arvo"',
  qwigley: '"Qwigley"',
  depot: '"Numbers Depot"',
};
export const TRACK = -0.025;          // Bebas tracking, the Storyteller's s2.TRACK, in em

export function theme(mode = "plaster") {
  const m = MODES[mode];
  if (!m) throw new Error(`unknown mode ${JSON.stringify(mode)}. One of: ${Object.keys(MODES).join(", ")}`);
  return { mode, ...m };
}

// Blend two hex colours; t = 0 gives a, 1 gives b. The Storyteller's mix().
export function mix(a, b, t) {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("");
}

// Type set on a filled mark: paper-light on a dark fill, paper on a light one, whichever reads.
export function onFill(hex) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  const L = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  return L > 0.30 ? TOKENS.paper : TOKENS.paperLight;
}

// Sequential: one hue, light to dark, for how much (heatmaps, calendars). On dark paper the anchor
// flips, so more is lighter. t runs 0 (least) to 1 (most).
export function seq(th, t) {
  t = Math.max(0, Math.min(1, t));
  return th.dark
    ? mix(mix(TOKENS.primary, TOKENS.paper, 0.72), TOKENS.mint, t)
    : mix(mix(TOKENS.primary, TOKENS.paperLight, 0.85), TOKENS.secondary, t);
}

// Diverging: two hues and a neutral middle, for which side of a line (disagree to agree, loss to
// gain). t runs -1 to 1: mauve below, olive above, a warm grey at 0.
export function div(th, t) {
  t = Math.max(-1, Math.min(1, t));
  const mid = th.dark ? mix(TOKENS.cream, TOKENS.paper, 0.55) : mix(TOKENS.cream, TOKENS.taupe, 0.25);
  const neg = th.dark ? TOKENS.mauve : mix(TOKENS.mauve, TOKENS.paper, 0.15);
  const pos = th.dark ? TOKENS.mint : TOKENS.primary;
  return t < 0 ? mix(mid, neg, -t) : mix(mid, pos, t);
}
