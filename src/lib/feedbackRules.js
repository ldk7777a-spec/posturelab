// Rule-based natural-language coaching feedback generation.
// Consumes frame landmark arrays and produces 3–5 concise Korean sentences.

import { frameAngles } from "@/lib/biomechanics";
import { DEFAULT_RANGES, METRIC_LABELS, ASYMM_PAIRS } from "@/lib/metricRanges";

const avg = (arr) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : null);

export function generateFeedback(frames, ranges = DEFAULT_RANGES, opts = {}) {
  const asymThreshold = opts.asymThreshold ?? 15;
  const max = opts.max ?? 5;
  const sentences = [];
  if (!frames || !frames.length) return sentences;

  const metrics = frames.map((f) => frameAngles(f.landmarks));

  // ── 좌우 비대칭 (우선순위) ──────────────────────────────
  for (const pair of ASYMM_PAIRS) {
    const lVals = metrics.map((m) => m[pair.l]).filter((v) => v != null);
    const rVals = metrics.map((m) => m[pair.r]).filter((v) => v != null);
    const lAvg = avg(lVals);
    const rAvg = avg(rVals);
    if (lAvg == null || rAvg == null) continue;
    const diff = Math.abs(lAvg - rAvg);
    if (diff >= asymThreshold) {
      const side = lAvg < rAvg ? "왼쪽" : "오른쪽";
      // 작은 각도일수록 더 굽혀진 상태로 간주
      const state = lAvg < rAvg ? "더 굽혀져" : "더 펴져";
      sentences.push(`${side} ${pair.label}이(가) 반대쪽보다 약 ${Math.round(diff)}° ${state} 있어요.`);
      if (sentences.length >= max) return sentences;
    }
  }

  // ── 정상 범위 이탈 ────────────────────────────────────────
  const violations = [];
  for (const key of Object.keys(DEFAULT_RANGES)) {
    const range = ranges[key] || DEFAULT_RANGES[key];
    const vals = metrics.map((m) => m[key]).filter((v) => v != null);
    const a = avg(vals);
    if (a == null) continue;
    if (a < range.min) {
      violations.push({
        label: METRIC_LABELS[key] || key,
        dir: "권장 범위보다 적습니다",
        avg: Math.round(a),
        severity: range.min - a,
      });
    } else if (a > range.max) {
      violations.push({
        label: METRIC_LABELS[key] || key,
        dir: "권장 범위보다 큽니다",
        avg: Math.round(a),
        severity: a - range.max,
      });
    }
  }
  violations.sort((a, b) => b.severity - a.severity);

  for (const v of violations) {
    sentences.push(`${v.label}이(가) ${v.dir} (평균 ${v.avg}°).`);
    if (sentences.length >= max) return sentences;
  }

  // ── 정상일 때 긍정 문장 ──────────────────────────────────
  if (!sentences.length) {
    sentences.push("주요 관절의 좌우 대칭과 정렬이 전반적으로 권장 범위 안에 있습니다. 훌륭해요!");
  }
  return sentences.slice(0, max);
}