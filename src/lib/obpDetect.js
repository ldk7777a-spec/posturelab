// Auto event-detection helpers for OBP comparison (swing phases).
// Robust to pose jitter: smoothing + temporal-order constraints.
// Returns a 0-based frame index, or null when no confident phase is found
// (UI then falls back to manual frame designation).

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

// 3-point median filter: kills single-frame jitter spikes
function medianFilter3(arr) {
  return arr.map((_, i) => {
    const win = [arr[i - 1], arr[i], arr[i + 1]].filter((v) => v != null);
    if (!win.length) return null;
    win.sort((a, b) => a - b);
    return win[Math.floor(win.length / 2)];
  });
}

// 3-point moving average: further smooths residual noise
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

// average of the opening "stance" frames — the baseline pelvis position
function stanceSegment(arr, n) {
  const cnt = Math.max(3, Math.floor(n * 0.08));
  let s = 0, k = 0;
  for (let i = 0; i < cnt && i < n; i++) {
    if (arr[i] != null) { s += arr[i]; k++; }
  }
  return k ? s / k : arr[0];
}

// Load: pelvis-x turning point (direction reversal) in the front ~60%,
// largest displacement from the stance baseline. Requires a genuine
// reversal (sustained), not a single-frame blip.
export function detectLoad(frames) {
  if (!frames || !frames.length) return null;
  const n = frames.length;
  const maxLoad = Math.floor(n * 0.6);
  if (maxLoad < 4) return null;
  const xs = smooth3(medianFilter3(interp(pelvisXSeries(frames))));
  const stance = stanceSegment(xs, n);
  const totalRange = rangeOf(xs);
  if (totalRange <= 0) return null;
  const minDisp = Math.max(totalRange * 0.15, 0.01);

  let best = null, bestDisp = 0;
  for (let i = 2; i < maxLoad - 1; i++) {
    const before = xs[i] - xs[i - 1];
    const after = xs[i + 1] - xs[i];
    if (before != null && after != null && before * after < 0) {
      const disp = Math.abs(xs[i] - stance);
      // require confirmation: the reversal must persist over the window
      const confirm = Math.sign(after) === Math.sign(xs[i + 2] - xs[i + 1]);
      if (disp > bestDisp && confirm) { bestDisp = disp; best = i; }
    }
  }
  if (best == null || bestDisp < minDisp) return null;
  return best;
}

// First move: first frame after Load where pelvis moves >=10% of total
// x-range away from the load position, in a sustained direction.
export function detectFirstMove(frames) {
  if (!frames || !frames.length) return null;
  const load = detectLoad(frames);
  if (load == null) return null;
  const n = frames.length;
  const maxFM = Math.min(n - 1, Math.floor(n * 0.75));
  if (maxFM <= load) return null;
  const xs = smooth3(medianFilter3(interp(pelvisXSeries(frames))));
  const totalRange = rangeOf(xs);
  if (totalRange <= 0) return null;
  const thr = Math.max(totalRange * 0.1, 0.01);
  const xLoad = xs[load];
  let dir = 0;
  for (let i = load + 1; i <= maxFM; i++) {
    const d = xs[i] - xLoad;
    if (Math.abs(d) >= thr) {
      const sign = Math.sign(d);
      if (dir === 0) dir = sign;
      // require the next frame to keep the same direction (no blip)
      const next = xs[i + 1] != null ? xs[i + 1] - xs[i] : d;
      if (sign === dir && Math.sign(next) === dir) return i;
    }
  }
  return null;
}

// Foot plant: lead ankle's vertical velocity drops to ~0 after a clear
// stride motion. Window is after load (or 15% fallback) up to ~85%.
// The lead foot is the ankle with the larger vertical range during the
// stride window.
export function detectFootPlant(frames) {
  if (!frames || !frames.length) return null;
  const n = frames.length;
  if (n < 4) return null;
  const strideEnd = Math.max(2, Math.floor(n * 0.7));
  const yL = ankleYSeries(frames, LANKLE);
  const yR = ankleYSeries(frames, RANKLE);
  const rL = rangeOf(yL.slice(0, strideEnd + 1));
  const rR = rangeOf(yR.slice(0, strideEnd + 1));
  if (rL <= 0 && rR <= 0) return null;
  const leadRaw = rL >= rR ? yL : yR;
  const ys = smooth3(medianFilter3(interp(leadRaw)));
  const vel = velocity(ys);

  const load = detectLoad(frames);
  const start = load != null ? load : Math.floor(n * 0.15);
  const end = Math.min(n - 1, Math.floor(n * 0.85));
  if (end <= start) return null;

  let peak = 0;
  for (let i = start + 1; i <= end; i++) {
    if (vel[i] != null && Math.abs(vel[i]) > peak) peak = Math.abs(vel[i]);
  }
  if (peak <= 0) return null;
  const thresh = Math.max(0.004, peak * 0.2);

  let moved = false;
  for (let i = start + 1; i <= end; i++) {
    if (vel[i] == null) continue;
    if (Math.abs(vel[i]) >= peak * 0.4) moved = true;
    if (moved && Math.abs(vel[i]) <= thresh) return i;
  }
  return null;
}