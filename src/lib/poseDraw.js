// Skeleton rendering for the analyzed-frame snapshot shown in the report.

const CONNECTIONS = [
  [11, 12], // shoulders
  [11, 23], [12, 24], // torso sides
  [23, 24], // hips
  [11, 13], [13, 15], // left arm
  [12, 14], [14, 16], // right arm
  [23, 25], [25, 27], // left leg
  [24, 26], [26, 28], // right leg
  [27, 29], [29, 31], [27, 31], // left foot
  [28, 30], [30, 32], [28, 32], // right foot
  [15, 17], [15, 19], [15, 21], // left hand
  [16, 18], [16, 20], [16, 22], // right hand
  [0, 11], [0, 12], // neck to shoulders (head approx)
];

export function drawSkeleton(ctx, landmarks, w, h) {
  if (!landmarks?.length) return;
  ctx.save();
  ctx.lineWidth = Math.max(2, w * 0.004);
  ctx.strokeStyle = "rgba(255, 107, 74, 0.95)";
  ctx.fillStyle = "#FF6B4A";
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 6;

  for (const [a, b] of CONNECTIONS) {
    const p = landmarks[a];
    const q = landmarks[b];
    if (!p || !q || (p.visibility ?? 1) < 0.3 || (q.visibility ?? 1) < 0.3) continue;
    ctx.beginPath();
    ctx.moveTo(p.x * w, p.y * h);
    ctx.lineTo(q.x * w, q.y * h);
    ctx.stroke();
  }

  ctx.shadowBlur = 4;
  for (let i = 0; i < landmarks.length; i++) {
    const p = landmarks[i];
    if (!p || (p.visibility ?? 1) < 0.3) continue;
    if (![11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].includes(i)) continue;
    ctx.beginPath();
    ctx.arc(p.x * w, p.y * h, Math.max(3, w * 0.006), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}