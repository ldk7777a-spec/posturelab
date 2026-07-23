import { frameAngles } from "@/lib/biomechanics";

// Independent traffic-light judgment module.
// PURE logic only — no UI, no i18n. Shared by every movement-report step
// (traffic-light display, sentence generation, etc.) so all derive from one source.
//
// A "level" is: normal | caution | risk | unknown.
// A spec defines a normal band [lo, hi] and a caution spread `band`; values beyond
// normal but within ±band are caution, anything farther is risk.

export const LEVELS = {
  NORMAL: "normal",
  CAUTION: "caution",
  RISK: "risk",
  UNKNOWN: "unknown",
};

// judge(value, { normal:[lo,hi], band }) -> LEVELS.*
// `band` = how far beyond normal is still "caution" (symmetric, each side).
export function judge(value, { normal, band = 0 } = {}) {
  if (value == null || Number.isNaN(value)) return LEVELS.UNKNOWN;
  if (!normal) return LEVELS.UNKNOWN;
  const [lo, hi] = normal;
  if (value >= lo && value <= hi) return LEVELS.NORMAL;
  if (value >= lo - band && value <= hi + band) return LEVELS.CAUTION;
  return LEVELS.RISK;
}

// Dynamic movement metric specs.
// `agg` reduces the per-frame series to a single report value:
//   "peak"  -> max absolute value reached
//   "max"   -> raw max (for signed-positive leans)
//   "range" -> max - min (amount of variation across the movement)
//   "mean"  -> average
export const MOVEMENT_SPECS = [
  { key: "separationAngle", agg: "peak",  normal: [30, 70], band: 12 },
  { key: "trunkLean",       agg: "max",   normal: [0, 18],  band: 9 },
  { key: "shoulderTilt",    agg: "range", normal: [0, 10],  band: 6 },
  { key: "pelvicTilt",      agg: "range", normal: [0, 10],  band: 6 },
];

// Reduce a per-frame series to one number per spec.
export function judgeMovement(frames) {
  if (!frames || !frames.length) return [];
  return MOVEMENT_SPECS.map((spec) => {
    const vals = frames
      .map((f) => frameAngles(f?.landmarks)?.[spec.key])
      .filter((v) => v != null && !Number.isNaN(v));
    let value = null;
    if (vals.length) {
      if (spec.agg === "range") value = Math.round(Math.max(...vals) - Math.min(...vals));
      else if (spec.agg === "mean") value = Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
      else value = Math.round(Math.max(...vals)); // peak / max
    }
    return {
      key: spec.key,
      agg: spec.agg,
      value,
      level: judge(value, { normal: spec.normal, band: spec.band }),
    };
  });
}