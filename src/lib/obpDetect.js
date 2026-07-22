// Auto event-detection helpers for OBP comparison.
// Landmark indices (MediaPipe Pose): 23 left hip, 24 right hip, 27 left ankle, 28 right ankle.
const LHIP = 23, RHIP = 24, LANKLE = 27, RANKLE = 28;

const coord = (lm, i, axis) => (lm && lm[i] ? lm[i][axis] : null);

function totalAbsDelta(arr) {
  let s = 0;
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] != null && arr[i - 1] != null) s += Math.abs(arr[i] - arr[i - 1]);
  }
  return s;
}

function pelvisXSeries(frames) {
  return frames.map((f) => {
    const lx = coord(f.landmarks, LHIP, "x");
    const rx = coord(f.landmarks, RHIP, "x");
    if (lx == null || rx == null) return null;
    return (lx + rx) / 2;
  });
}

// Foot plant: find the lead ankle, then the first frame its vertical velocity
// drops to ~0 after it was clearly moving (foot stops / lands).
export function detectFootPlant(frames) {
  if (!frames || !frames.length) return null;
  const yL = frames.map((f) => coord(f.landmarks, LANKLE, "y"));
  const yR = frames.map((f) => coord(f.landmarks, RANKLE, "y"));
  const lead = totalAbsDelta(yL) >= totalAbsDelta(yR) ? yL : yR;
  if (!lead.some((v) => v != null)) return null;

  const vel = [];
  for (let i = 1; i < lead.length; i++) {
    vel.push(lead[i] != null && lead[i - 1] != null ? Math.abs(lead[i] - lead[i - 1]) : null);
  }
  const validV = vel.filter((v) => v != null);
  if (!validV.length) return null;
  const peak = Math.max(...validV);
  const thresh = Math.max(0.004, peak * 0.15);

  let moved = false;
  for (let i = 0; i < vel.length; i++) {
    if (vel[i] == null) continue;
    if (peak > 0 && vel[i] >= peak * 0.5) moved = true;
    if (moved && vel[i] <= thresh) return i + 1; // vel[i] is change into frame i+1
  }
  // fallback: frame of lowest lead-foot position (max y)
  let maxIdx = 0, maxV = -Infinity;
  lead.forEach((v, i) => { if (v != null && v > maxV) { maxV = v; maxIdx = i; } });
  return maxIdx;
}

// Load: pelvis-center x farthest from its mean (direction-reversal / turning point).
export function detectLoad(frames) {
  if (!frames || !frames.length) return null;
  const xs = pelvisXSeries(frames);
  const valid = xs.filter((v) => v != null);
  if (valid.length < 2) return null;
  const mean = valid.reduce((s, v) => s + v, 0) / valid.length;
  let best = null, bestD = -1;
  xs.forEach((v, i) => {
    if (v == null) return;
    const d = Math.abs(v - mean);
    if (d > bestD) { bestD = d; best = i; }
  });
  return best;
}

// First move: after load, first frame pelvis moves >=10% of total x-range away from load position.
export function detectFirstMove(frames) {
  if (!frames || !frames.length) return null;
  const load = detectLoad(frames);
  if (load == null) return null;
  const xs = pelvisXSeries(frames);
  const valid = xs.filter((v) => v != null);
  if (valid.length < 2) return null;
  const range = Math.max(...valid) - Math.min(...valid);
  const thr = Math.max(0.1 * range, 0.01);
  const xL = xs[load];
  if (xL == null) return null;
  for (let i = load + 1; i < xs.length; i++) {
    if (xs[i] == null) continue;
    if (Math.abs(xs[i] - xL) >= thr) return i;
  }
  return load + 1 < frames.length ? load + 1 : load;
}