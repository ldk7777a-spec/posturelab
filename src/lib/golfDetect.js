// Golf swing phase detection — independent module (kept separate from the
// baseball obpDetect; no shared code, no `if sport === 'golf'` branching).
//
// All detection is constrained to the user-specified window
// [addressIdx, finishIdx]. Nothing is searched outside it.
//
// Signal: wrist vertical (Y) trajectory — GolfPosePro / GolfDB style.
// The wrist with the larger vertical range within the window is treated as
// the "active" wrist for that swing.
//
// 8 phases (GolfDB standard):
//   Address → Toe-up → Mid-backswing → Top → Mid-downswing → Impact →
//   Mid-follow-through → Finish
// Address and Finish are user-designated. The 6 inner phases are detected
// and returned (null when the signal isn't confident — the UI then offers
// a 7-thumbnail ±3 selector so the user finalizes manually).

const DEBUG = true;

const LWRIST = 15;
const RWRIST = 16;

const coord = (lm, i, axis) => (lm && lm[i] ? lm[i][axis] : null);

function interp(arr) {
  const out = arr.slice();
  let last = null;
  for (let i = 0; i < out.length; i++) {
    if (out[i] != null) last = out[i];
    else if (last != null) out[i] = last;
  }
  last = null;
  for (let i = out.length - 1; i >= 0; i--) {
    if (out[i] != null) last = out[i];
    else if (last != null) out[i] = last;
  }
  return out;
}

function median3(arr) {
  return arr.map((_, i) => {
    const w = [arr[i - 1], arr[i], arr[i + 1]].filter((v) => v != null);
    if (!w.length) return null;
    w.sort((a, b) => a - b);
    return w[Math.floor(w.length / 2)];
  });
}

function smooth3(arr) {
  return arr.map((_, i) => {
    const w = [arr[i - 1], arr[i], arr[i + 1]].filter((v) => v != null);
    return w.length ? w.reduce((s, v) => s + v, 0) / w.length : null;
  });
}

function rangeOf(arr) {
  let mn = Infinity, mx = -Infinity, any = false;
  for (const v of arr) {
    if (v == null) continue;
    any = true;
    if (v < mn) mn = v;
    if (v > mx) mx = v;
  }
  return any ? mx - mn : 0;
}

// pick the wrist with the larger vertical range in the window (active wrist)
function wristYSeries(frames, a, f) {
  const yL = frames.map((fr) => coord(fr.landmarks, LWRIST, "y"));
  const yR = frames.map((fr) => coord(fr.landmarks, RWRIST, "y"));
  const rL = rangeOf(yL.slice(a, f + 1));
  const rR = rangeOf(yR.slice(a, f + 1));
  return rL >= rR ? yL : yR;
}

// returns { address, finish, toeUp, midBack, top, midDown, impact, midFollow }
// each value is a 0-based frame index or null.
export function detectGolfEvents(frames, addressIdx, finishIdx) {
  const res = {
    address: addressIdx, finish: finishIdx,
    toeUp: null, midBack: null, top: null, midDown: null, impact: null, midFollow: null,
  };
  if (!frames || !frames.length || addressIdx == null || finishIdx == null) return res;
  if (finishIdx - addressIdx < 6) {
    if (DEBUG) console.log("[golfDetect] window too small", addressIdx, finishIdx);
    return res;
  }
  const a = addressIdx, f = finishIdx;
  const y = smooth3(median3(interp(wristYSeries(frames, a, f)))); // lower y = wrist higher
  const ya = y[a];

  // ── Top: highest wrist (min y) within the backswing side of the window.
  // Bound the search to the first ~60% of [a,f] so the follow-through peak
  // (which is after impact, ~mid-late) is never mistaken for the top.
  const back = a + Math.floor((f - a) * 0.6);
  let topV = Infinity, topI = null;
  for (let i = a + 1; i <= back; i++) {
    if (y[i] == null) continue;
    if (y[i] < topV) { topV = y[i]; topI = i; }
  }
  if (topI == null) {
    if (DEBUG) console.log("[golfDetect] top not found in", a, back);
    return res;
  }

  // ── Impact: first point after the top where the wrist comes back down
  // closest to the address height (hands return to the ball).
  let best = Infinity, impI = null;
  for (let i = topI + 1; i <= f; i++) {
    if (y[i] == null) continue;
    const d = Math.abs(y[i] - ya);
    if (d < best) { best = d; impI = i; }
  }
  if (impI == null) impI = Math.floor((topI + f) / 2);

  const spanUp = ya - topV; // address.y − top.y (positive => top is higher)

  // toe-up: first rise >= 15% of the backswing span, in (a, top)
  if (spanUp > 0) {
    for (let i = a + 1; i < topI; i++) {
      if (y[i] == null) continue;
      if (ya - y[i] >= 0.15 * spanUp) { res.toeUp = i; break; }
    }
    // mid-back: first rise >= 50% of the span, in (toe-up or a, top)
    const startM = res.toeUp != null ? res.toeUp : a;
    for (let i = startM + 1; i < topI; i++) {
      if (y[i] == null) continue;
      if (ya - y[i] >= 0.5 * spanUp) { res.midBack = i; break; }
    }
  }

  // mid-down: descend 50% from the top toward impact, in (top, impact)
  if (y[impI] != null && y[topI] != null) {
    for (let i = topI + 1; i < impI; i++) {
      if (y[i] == null) continue;
      if (y[i] - y[topI] >= 0.5 * (y[impI] - y[topI])) { res.midDown = i; break; }
    }
  }

  // mid-follow: highest wrist (min y) after impact in (impact, finish);
  // fall back to the midpoint of (impact, finish).
  let mfv = Infinity;
  for (let i = impI + 1; i < f; i++) {
    if (y[i] == null) continue;
    if (y[i] < mfv) { mfv = y[i]; res.midFollow = i; }
  }
  if (res.midFollow == null) res.midFollow = Math.floor((impI + f) / 2);

  res.top = topI;
  res.impact = impI;

  if (DEBUG) {
    console.log("[golfDetect] win", a, f,
      "top@" + topI, "imp@" + impI,
      "toe@" + res.toeUp, "midBack@" + res.midBack,
      "midDown@" + res.midDown, "midFollow@" + res.midFollow,
      "y(win)=", y.slice(a, f + 1));
  }
  return res;
}