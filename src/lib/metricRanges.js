// Centralized metric metadata, default normal ranges, and rating helpers
// for the FrameAnalysis traffic-light system.

export const ANGLE_METRICS = [
  { key: "leftElbow", label: "왼쪽 팔꿈치" },
  { key: "rightElbow", label: "오른쪽 팔꿈치" },
  { key: "leftShoulder", label: "왼쪽 견관절" },
  { key: "rightShoulder", label: "오른쪽 견관절" },
  { key: "leftHip", label: "왼쪽 고관절" },
  { key: "rightHip", label: "오른쪽 고관절" },
  { key: "leftKnee", label: "왼쪽 무릎" },
  { key: "rightKnee", label: "오른쪽 무릎" },
  { key: "leftAnkle", label: "왼쪽 발목" },
  { key: "rightAnkle", label: "오른쪽 발목" },
];

export const ALIGN_METRICS = [
  { key: "shoulderTilt", label: "어깨 기울기", hint: "0°=수평" },
  { key: "pelvicTilt", label: "골반 기울기", hint: "0°=수평" },
  { key: "trunkLean", label: "상체 기울기", hint: "0°=수직" },
  { key: "headTilt", label: "머리 전방/측방", hint: "0°=정렬" },
  { key: "leftFootTurnout", label: "왼쪽 발 외전", hint: "0°=정면" },
  { key: "rightFootTurnout", label: "오른쪽 발 외전", hint: "0°=정면" },
];

export const SEPARATION_METRIC = { key: "separationAngle", label: "견갑-골반 분리각", hint: "0°=동시 회전" };

export const ASYMM_PAIRS = [
  { label: "팔꿈치", l: "leftElbow", r: "rightElbow" },
  { label: "견관절", l: "leftShoulder", r: "rightShoulder" },
  { label: "고관절", l: "leftHip", r: "rightHip" },
  { label: "무릎", l: "leftKnee", r: "rightKnee" },
  { label: "발목", l: "leftAnkle", r: "rightAnkle" },
];

export const METRIC_LABELS = Object.fromEntries(
  [...ANGLE_METRICS, ...ALIGN_METRICS, SEPARATION_METRIC].map((m) => [m.key, m.label])
);

// 참고 기본값 — 실측/문헌 기반의 중간 추정치. 코치가 조정 가능.
export const DEFAULT_RANGES = {
  leftElbow: { min: 30, max: 150 },
  rightElbow: { min: 30, max: 150 },
  leftShoulder: { min: 30, max: 160 },
  rightShoulder: { min: 30, max: 160 },
  leftHip: { min: 140, max: 180 },
  rightHip: { min: 140, max: 180 },
  leftKnee: { min: 160, max: 180 },
  rightKnee: { min: 160, max: 180 },
  leftAnkle: { min: 80, max: 100 },
  rightAnkle: { min: 80, max: 100 },
  shoulderTilt: { min: 0, max: 5 },
  pelvicTilt: { min: 0, max: 5 },
  trunkLean: { min: 0, max: 8 },
  headTilt: { min: 0, max: 10 },
  leftFootTurnout: { min: 0, max: 15 },
  rightFootTurnout: { min: 0, max: 15 },
  separationAngle: { min: 5, max: 35 },
};

// rating for a value against a {min,max} range, with a tolerance zone for "주의"
export function getRating(value, range) {
  if (value == null || !range) return "none";
  if (value >= range.min && value <= range.max) return "green";
  const tol = Math.max(5, (range.max - range.min) * 0.3);
  if (value >= range.min - tol && value <= range.max + tol) return "yellow";
  return "red";
}

// 좌우 비대칭(|L − R|) — 고정 임계치 (피드백 15° 기준과 정렬)
export function asymRating(diff) {
  if (diff == null) return "none";
  if (diff <= 8) return "green";
  if (diff <= 15) return "yellow";
  return "red";
}

export const RATING_STYLES = {
  green: { border: "border-emerald-300", badge: "bg-emerald-100 text-emerald-700", label: "정상" },
  yellow: { border: "border-amber-300", badge: "bg-amber-100 text-amber-700", label: "주의" },
  red: { border: "border-red-300", badge: "bg-red-100 text-red-700", label: "경고" },
  none: { border: "border-gray-200", badge: "bg-gray-100 text-gray-400", label: "" },
};

export const ALL_RANGE_METRICS = [...ANGLE_METRICS, ...ALIGN_METRICS, SEPARATION_METRIC];