// Overlay drawing of a pose skeleton onto a shared canvas, normalized to a
// common pelvis-center origin and shoulder↔pelvis reference scale so two
// skeletons from different clips can be compared by posture alone.

const CONN = [
  [11, 12], [11, 23], [12, 24], [23, 24],
  [11, 13], [13, 15], [12, 14], [14, 16],
  [23, 25], [25, 27], [24, 26], [26, 28],
  [27, 29], [29, 31], [27, 31], [28, 30], [30, 32], [28, 32],
  [15, 17], [15, 19], [15, 21], [16, 18], [16, 20], [16, 22],
  [0, 11], [0, 12],
];

const KEY_NODES = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];

const mid = (p, q) => ({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 });
const dist = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);

export function renderOverlaySkeleton(ctx, landmarks, canvasSize, color) {
  if (!landmarks?.length) return;
  const hipL = landmarks[23], hipR = landmarks[24], shL = landmarks[11], shR = landmarks[12];
  if (!hipL || !hipR || !shL || !shR) return;
  const hipC = mid(hipL, hipR);
  const shC = mid(shL, shR);
  const ref = dist(shC, hipC) || 0.2; // normalized shoulder↔pelvis distance
  const scale = (canvasSize * 0.34) / ref;
  const ox = canvasSize / 2 - hipC.x * scale;
  const oy = canvasSize / 2 - hipC.y * scale;
  const P = (lm) => (lm ? { x: lm.x * scale + ox, y: lm.y * scale + oy } : null);

  ctx.save();
  ctx.lineWidth = Math.max(2, canvasSize * 0.006);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 6;
  for (const [a, b] of CONN) {
    const la = landmarks[a], lb = landmarks[b];
    if (!la || !lb || (la.visibility ?? 1) < 0.3 || (lb.visibility ?? 1) < 0.3) continue;
    const p = P(la), q = P(lb);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(q.x, q.y);
    ctx.stroke();
  }
  ctx.shadowBlur = 4;
  for (const i of KEY_NODES) {
    const lm = landmarks[i];
    if (!lm || (lm.visibility ?? 1) < 0.3) continue;
    const p = P(lm);
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(3, canvasSize * 0.008), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}