// Auto event-detection helpers for OBP comparison (swing phases).
// All detection is constrained to a user-defined window [startIdx, endIdx]
// (swing-start to contact). No percentage-based range guessing.
// Returns a 0-based frame index (the detected "center"), or null when not
// confident — the UI then prompts manual designation.
// Preprocessing: null interpolation -> 3-point median filter -> 3-point moving avg.

const DEBUG = true;

const LHIP = 23, RHIP = 24, LANKLE = 27, RANKLE = 28;

const coord = (lm, i, axis) => (lm && lm[i] ? lm[i][axis] : null);

// interpolate nulls: forward then backward fill
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

function medianFilter3(arr) {
  return arr.map((_, i) => {
    const win = [arr[i - 1], arr[i], arr[i + 1]].filter((v) => v != null);
    if (!win.length) return null;
    win.sort((a, b) => a - b);
    return win[Math.floor(win.length / 2)];
  });
}

function smooth3(arr) {
  return arr.map((_, i) => {
    const win = [arr[i - 1], arr[i], arr[i + 1]].filter((v) => v != null);
    return win.length ? win.reduce((s, v) => s + v, 0) / win.length : null;
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

function pelvisXSeries(frames) {
  return frames.map((f) => {
    const lx = coord(f.landmarks, LHIP, "x");
    const rx = coord(f.landmarks, RHIP, "x");
    if (lx == null || rx == null) return null;
    return (lx + rx) / 2;
  });
}

function ankleYSeries(frames, idx) {
  return frames.map((f) => coord(f.landmarks, idx, "y"));
}

function velocity(arr) {
  const v = new Array(arr.length).fill(null);
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] != null && arr[i - 1] != null) v[i] = arr[i] - arr[i - 1];
  }
  return v;
}

function clamp(s, e, n) {
  return [Math.max(0, s), Math.min(n - 1, e)];
}

// Load: pelvis-x turning point (direction reversal) within [s,e], the one
// with the largest displacement from the window-start baseline, confirmed
// by sustained reversal in the following frame.
export function detectLoad(frames, startIdx, endIdx) {
  if (!frames || !frames.length) return null;
  if (startIdx == null || endIdx == null) return null;
  const n = frames.length;
  const [s, e] = clamp(startIdx, endIdx, n);
  if (e - s < 4) {
    if (DEBUG) console.log("[obpDetect] load window too small", s, e);
    return null;
  }
  const xs = smooth3(medianFilter3(interp(pelvisXSeries(frames))));

  // stance baseline = average of the first ~15% of the window
  const segCount = Math.max(2, Math.floor((e - s) * 0.15));
  let base = 0, bk = 0;
  for (let i = s; i <= Math.min(s + segCount, e); i++) {
    if (xs[i] != null) { base += xs[i]; bk++; }
  }
  base = bk ? base / bk : xs[s];

  const tr = rangeOf(xs.slice(s, e + 1));
  const minDisp = Math.max(tr * 0.15, 0.01);

  const candidates = [];
  let best = null, bestDisp = 0;
  for (let i = s + 2; i <= e - 2; i++) {
    const before = xs[i] - xs[i - 1];
    const after = xs[i + 1] - xs[i];
    if (before == null || after == null || before * after >= 0) continue;
    const disp = Math.abs(xs[i] - base);
    const confirm = Math.sign(after) === Math.sign(xs[i + 2] - xs[i + 1]);
    candidates.push({ i, disp, confirm });
    if (disp > bestDisp && confirm) { bestDisp = disp; best = i; }
  }
  if (DEBUG) console.log("[obpDetect] load window", s, e, "pelvisX(win)=", xs.slice(s, e + 1), "candidates=", candidates, "best=", best, "minDisp=", minDisp, "bestDisp=", bestDisp);
  if (best == null || bestDisp < minDisp) return null;
  return best;
}

// First move: first frame after the load turning point where pelvis moves
// >=10% of the window's x-range away from the load position, in a
// sustained direction.
export function detectFirstMove(frames, startIdx, endIdx, loadIdx) {
  if (!frames || !frames.length) return null;
  if (startIdx == null || endIdx == null || loadIdx == null) return null;
  const n = frames.length;
  const [s, e] = clamp(startIdx, endIdx, n);
  if (loadIdx < s || loadIdx >= e) {
    if (DEBUG) console.log("[obpDetect] firstmove load out of window", loadIdx, s, e);
    return null;
  }
  const xs = smooth3(medianFilter3(interp(pelvisXSeries(frames))));
  const tr = rangeOf(xs.slice(s, e + 1));
  if (tr <= 0) return null;
  const thr = Math.max(tr * 0.1, 0.01);
  const xLoad = xs[loadIdx];
  let dir = 0;
  const candidates = [];
  for (let i = loadIdx + 1; i <= e; i++) {
    const d = xs[i] - xLoad;
    if (Math.abs(d) < thr) continue;
    const sign = Math.sign(d);
    const next = xs[i + 1] != null ? xs[i + 1] - xs[i] : d;
    const confirm = Math.sign(next) === sign;
    candidates.push({ i, d: Math.round(d * 1000) / 1000, confirm });
    if (dir === 0) dir = sign;
    if (sign === dir && confirm) {
      if (DEBUG) console.log("[obpDetect] firstmove load=", loadIdx, "candidates=", candidates, "best=", i);
      return i;
    }
  }
  if (DEBUG) console.log("[obpDetect] firstmove candidates=", candidates, "best=null");
  return null;
}

// Foot plant: lead ankle (larger vertical range within the window) — the
// first frame its vertical velocity stabilizes (~0) after a clear move.
export function detectFootPlant(frames, startIdx, endIdx) {
  if (!frames || !frames.length) return null;
  if (startIdx == null || endIdx == null) return null;
  const n = frames.length;
  const [s, e] = clamp(startIdx, endIdx, n);
  if (e - s < 3) {
    if (DEBUG) console.log("[obpDetect] footplant window too small", s, e);
    return null;
  }
  const yL = ankleYSeries(frames, LANKLE);
  const yR = ankleYSeries(frames, RANKLE);
  const rL = rangeOf(yL.slice(s, e + 1));
  const rR = rangeOf(yR.slice(s, e + 1));
  if (rL <= 0 && rR <= 0) return null;
  const lead = rL >= rR ? yL : yR;
  const ys = smooth3(medianFilter3(interp(lead)));
  const vel = velocity(ys);

  let peak = 0;
  for (let i = s + 1; i <= e; i++) {
    if (vel[i] != null && Math.abs(vel[i]) > peak) peak = Math.abs(vel[i]);
  }
  if (peak <= 0) return null;
  const thresh = Math.max(0.004, peak * 0.2);

  const candidates = [];
  let moved = false;
  for (let i = s + 1; i <= e; i++) {
    if (vel[i] == null) continue;
    if (Math.abs(vel[i]) >= peak * 0.4) moved = true;
    if (moved && Math.abs(vel[i]) <= thresh) {
      candidates.push(i);
      if (DEBUG) console.log("[obpDetect] footplant window", s, e, "ankleY(win)=", ys.slice(s, e + 1), "vel(win)=", vel.slice(s, e + 1), "peak=", peak, "best=", i);
      return i;
    }
  }
  if (DEBUG) console.log("[obpDetect] footplant best=null candidates=", candidates);
  return null;
}