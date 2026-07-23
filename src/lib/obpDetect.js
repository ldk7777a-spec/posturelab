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

// Load: the pelvis-x extreme on the side OPPOSITE the pitcher. In a normal
// delivery/swing the pelvis shifts away from the pitcher (load) BEFORE
// driving toward the pitcher, so the earliest of the global min/max within
// the window is the opposite-to-pitcher extreme = load.
export function detectLoad(frames, startIdx, endIdx) {
  if (!frames || !frames.length) return null;
  const n = frames.length;
  const [s, e] = startIdx == null || endIdx == null ? [0, n - 1] : clamp(startIdx, endIdx, n);
  if (e - s < 4) {
    if (DEBUG) console.log("[obpDetect] load window too small", s, e);
    return null;
  }
  const xs = smooth3(medianFilter3(interp(pelvisXSeries(frames))));
  let minV = Infinity, maxV = -Infinity, minI = null, maxI = null;
  for (let i = s; i <= e; i++) {
    const v = xs[i];
    if (v == null) continue;
    if (v < minV) { minV = v; minI = i; }
    if (v > maxV) { maxV = v; maxI = i; }
  }
  if (minI == null || maxI == null) return null;
  const load = minI <= maxI ? minI : maxI; // earlier extreme = opposite-to-pitcher side
  if (DEBUG) console.log("[obpDetect] load minI=", minI, "minV=", minV, "maxI=", maxI, "maxV=", maxV, "load=", load, "xs(win)=", xs.slice(s, e + 1));
  return load;
}

// First move: first frame after the load where pelvis moves toward the
// pitcher (the opposite extreme) by >=10% of the window's x-range.
export function detectFirstMove(frames, startIdx, endIdx, loadIdx) {
  if (!frames || !frames.length || loadIdx == null) return null;
  const n = frames.length;
  const [s, e] = startIdx == null || endIdx == null ? [0, n - 1] : clamp(startIdx, endIdx, n);
  const xs = smooth3(medianFilter3(interp(pelvisXSeries(frames))));
  let minV = Infinity, maxV = -Infinity, minI = null, maxI = null;
  for (let i = s; i <= e; i++) {
    const v = xs[i];
    if (v == null) continue;
    if (v < minV) { minV = v; minI = i; }
    if (v > maxV) { maxV = v; maxI = i; }
  }
  if (minI == null || maxI == null) return null;
  const range = maxV - minV;
  if (range <= 0) return null;
  const loadX = xs[loadIdx];
  if (loadX == null) return null;
  // pitcher side = the opposite extreme from load
  const loadIsMin = (loadX - minV) <= (maxV - loadX);
  const targetX = loadIsMin ? maxV : minV;
  const dir = Math.sign(targetX - loadX);
  const thr = Math.max(range * 0.1, 0.01);
  const candidates = [];
  for (let i = loadIdx + 1; i <= e; i++) {
    if (xs[i] == null) continue;
    const d = xs[i] - loadX;
    if (Math.sign(d) === dir && Math.abs(d) >= thr) {
      candidates.push({ i, d: Math.round(d * 1000) / 1000 });
      if (DEBUG) console.log("[obpDetect] firstmove load=", loadIdx, "dir=", dir, "thr=", thr, "candidates=", candidates, "best=", i);
      return i;
    }
  }
  if (DEBUG) console.log("[obpDetect] firstmove no candidate load=", loadIdx, "dir=", dir, "thr=", thr);
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