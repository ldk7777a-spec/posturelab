// Pure-math posture scoring from MediaPipe 33-pose landmarks.
// Produces the exact result shape consumed by AnalysisReport.jsx
// (overallScore, summary, categories, topPriorities, coachingGuide, imageView).

const IDX = {
  NOSE: 0,
  LS: 11, RS: 12, LE: 13, RE: 14, LW: 15, RW: 16,
  LH: 23, RH: 24, LK: 25, RK: 26, LA: 27, RA: 28,
  LHEEL: 29, RHEEL: 30, LFI: 31, RBI: 32,
};

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function P(lm, i) {
  return lm[i] && (lm[i].visibility ?? 1) >= 0.25 ? lm[i] : null;
}
function mid(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 };
}
function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
function angleAt(a, b, c) {
  const v1 = { x: a.x - b.x, y: a.y - b.y };
  const v2 = { x: c.x - b.x, y: c.y - b.y };
  const dot = v1.x * v2.x + v1.y * v2.y;
  const m = Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y) || 1e-6;
  return (Math.acos(clamp(dot / m, -1, 1)) * 180) / Math.PI;
}
// dev in [0..]: good => 100, bad => 0
function scoreFromDev(dev, good, bad) {
  if (dev <= good) return 100;
  if (dev >= bad) return 0;
  return Math.round(100 * (1 - (dev - good) / (bad - good)));
}

const COACHING = {
  spine: {
    issue: { ko: "척추 정렬 편차", en: "Spinal alignment deviation" },
    correction: {
      ko: "거울을 보며 어깨·골반을 수평으로 정렬하고, 척추 신장 운동과 고양이-소 자세를 매일 10회 수행하세요.",
      en: "Align shoulders and hips level using a mirror; do cat-cow and spinal elongation 10 reps daily.",
    },
    drill: {
      title: { ko: "고양이-소 스트레치", en: "Cat-Cow Stretch" },
      target: { ko: "척추 분절 가동성", en: "Spinal segmental mobility" },
      instruction: {
        ko: "네 발 자세에서 숨 들이마시며 허리를 내려 엉덩이를 올리고, 내쉬며 등을 둥글게 말아 올리세요.",
        en: "On all fours, inhale and drop belly, exhale and round the spine upward.",
      },
    },
  },
  shoulders: {
    issue: { ko: "어깨 비대칭·거상", en: "Shoulder asymmetry" },
    correction: {
      ko: "낮은 쪽 어깨의 승모근·상부 능형근 스트레칭과 양측 균등한 당기기 동작을 점검하세요.",
      en: "Stretch the upper trapezius of the lower shoulder and balance bilateral pulling movements.",
    },
    drill: {
      title: { ko: "스카풀러 롤", en: "Scapular Rolls" },
      target: { ko: "견갑골 안정화", en: "Scapular stabilization" },
      instruction: {
        ko: "팔을 옆으로 벌리고 어깨를 천천히 위·뒤·아래로 10회 회전하세요.",
        en: "Arms out to sides, slowly roll shoulders up-back-down 10 reps.",
      },
    },
  },
  pelvis: {
    issue: { ko: "골반 틸트·편차", en: "Pelvic tilt" },
    correction: {
      ko: "골반 후방 기울기 교정을 위해 힙 플렉서 스트레칭과 글루트 브릿지를 수행하세요.",
      en: "Correct pelvic tilt with hip flexor stretches and glute bridges.",
    },
    drill: {
      title: { ko: "글루트 브릿지", en: "Glute Bridge" },
      target: { ko: "골반 중립·둔근 활성화", en: "Neutral pelvis & glute activation" },
      instruction: {
        ko: "누워 무릎 굽히고 엉덩이를 들어 올려 무릎-골반-어깨가 일직선이 되게 3초 유지하세요.",
        en: "Supine, knees bent, lift hips until knees-pelvis-shoulders align; hold 3s.",
      },
    },
  },
  knees: {
    issue: { ko: "무릎 외반(valgus)", en: "Knee valgus" },
    correction: {
      ko: "스쿼트·점프 시 무릎이 발끝 방향을 향하도록 발끝 밖으로 밀며, 둔근 중간 활성화를 강조하세요.",
      en: "Keep knees tracking over toes during squats/jumps; emphasize glute medius activation.",
    },
    drill: {
      title: { ko: "클램 쉘", en: "Clamshell" },
      target: { ko: "둔근 중간·무릎 정렬", en: "Glute medius & knee alignment" },
      instruction: {
        ko: "측와 자세에서 무릎을 굽히고, 발을 붙인 채 윗쪽 무릎을 천천히 벌리세요. 15회 × 양측.",
        en: "Side-lying, knees bent, raise top knee with feet together; 15 reps both sides.",
      },
    },
  },
  feet: {
    issue: { ko: "발 회내/외전", en: "Foot pronation / toe-out" },
    correction: {
      ko: "족궁 강화와 발목 안정성 훈련을 추가하고 발 착지 패턴을 점검하세요.",
      en: "Add foot-arch and ankle stability drills; check strike pattern.",
    },
    drill: {
      title: { ko: "타올 집기", en: "Towel Scrunch" },
      target: { ko: "족저근·족궁 강화", en: "Plantar intrinsic strength" },
      instruction: {
        ko: "앉아서 발가락으로 타올을 집어 당기는 동작을 발끝까지 반복하세요. 20회 × 양발.",
        en: "Seated, use toes to pull a towel toward you; 20 reps per foot.",
      },
    },
  },
};

export function analyzePostureLocal(lm, view, lang = "ko") {
  const tr = (ko, en) => (lang === "en" ? en : ko);
  const out = {
    overallScore: 0,
    imageView: view || "unknown",
    categories: {
      spine: { score: 0, findings: [], flags: [] },
      shoulders: { score: 0, findings: [], flags: [] },
      pelvis: { score: 0, findings: [], flags: [] },
      knees: { score: 0, findings: [], flags: [] },
      feet: { score: 0, findings: [], flags: [tr("정밀 발 분석은 현장 또는 전문 장비가 필요합니다.", "Detailed foot analysis requires in-person or specialized equipment.")] },
    },
    requiresEquipment: [],
    topPriorities: [],
    coachingGuide: [],
    summary: "",
  };

  if (!lm || lm.length < 33) {
    out.summary = tr("관절이 감지되지 않아 분석할 수 없습니다. 전신이 명확히 보이도록 다시 촬영해 주세요.", "No joints detected. Please retake with the full body clearly visible.");
    out.categories.feet.flags = [];
    return out;
  }

  const ls = P(lm, IDX.LS), rs = P(lm, IDX.RS);
  const lh = P(lm, IDX.LH), rh = P(lm, IDX.RH);
  const lk = P(lm, IDX.LK), rk = P(lm, IDX.RK);
  const la = P(lm, IDX.LA), ra = P(lm, IDX.RA);
  const lHeel = P(lm, IDX.LHEEL), rHeel = P(lm, IDX.RHEEL);
  const lFi = P(lm, IDX.LFI), rFi = P(lm, IDX.RBI);
  const nose = P(lm, IDX.NOSE);

  const has = (...ps) => ps.every(Boolean);
  const midSh = ls && rs ? mid(ls, rs) : null;
  const midHip = lh && rh ? mid(lh, rh) : null;
  const shoulderW = ls && rs ? dist(ls, rs) : 0.2;
  const hipW = lh && rh ? dist(lh, rh) : 0.18;
  const torsoLen = midSh && midHip ? dist(midSh, midHip) : 0.3;

  // ── Spine ────────────────────────────────────────────────
  if (midSh && midHip) {
    if (view === "side") {
      const lean = Math.abs(midSh.x - midHip.x) / (Math.abs(midHip.y - midSh.y) + 1e-3);
      out.categories.spine.score = scoreFromDev(lean, 0.05, 0.25);
      if (lean > 0.12) out.categories.spine.findings.push(tr("상체가 앞으로 기울어져 있습니다.", "Upper body leans forward."));
      const headFwd = nose ? Math.abs(nose.x - midSh.x) / (Math.abs(midHip.y - midSh.y) + 1e-3) : 0;
      if (headFwd > 0.15) out.categories.spine.findings.push(tr("전방두부 자세(forward head)가 관찰됩니다.", "Forward head posture observed."));
    } else {
      const lateral = Math.abs(midSh.x - midHip.x) / (torsoLen + 1e-3);
      out.categories.spine.score = scoreFromDev(lateral, 0.03, 0.12);
      if (lateral > 0.06) out.categories.spine.findings.push(tr("정면에서 척추가 옆으로 치우쳐 있습니다.", "Spine deviates laterally in frontal view."));
    }
    if (out.categories.spine.score >= 80) out.categories.spine.findings.push(tr("체간 정렬이 전반적으로 균형 잡혀 있습니다.", "Trunk alignment is generally balanced."));
  } else {
    out.categories.spine.score = 60;
  }

  // ── Shoulders ────────────────────────────────────────────
  if (ls && rs) {
    const tilt = Math.abs(ls.y - rs.y) / (shoulderW + 1e-3);
    let score = scoreFromDev(tilt, 0.03, 0.15);
    if (tilt > 0.08) out.categories.shoulders.findings.push(tr("좌우 어깨 높이 차이가 관찰됩니다.", "Left-right shoulder height difference observed."));
    if (view === "side" && lh && rh) {
      const shZ = (ls.z + rs.z) / 2;
      const hipZ = (lh.z + rh.z) / 2;
      const rounded = shZ - hipZ; // negative z = toward camera
      if (rounded < -0.05) {
        out.categories.shoulders.findings.push(tr("어깨가 앞으로 말린(rounded) 형태입니다.", "Shoulders appear rounded forward."));
        score = Math.min(score, 62);
      }
    }
    if (score >= 80) out.categories.shoulders.findings.push(tr("어깨 대칭이 양호합니다.", "Shoulder symmetry is good."));
    out.categories.shoulders.score = score;
  } else {
    out.categories.shoulders.score = 60;
  }

  // ── Pelvis ───────────────────────────────────────────────
  if (lh && rh) {
    const tilt = Math.abs(lh.y - rh.y) / (hipW + 1e-3);
    out.categories.pelvis.score = scoreFromDev(tilt, 0.03, 0.15);
    if (tilt > 0.08) out.categories.pelvis.findings.push(tr("골반 좌우 높낮이 차이가 있습니다.", "Pelvic lateral drop detected."));
    if (view === "side" && midSh && midHip) {
      const aot = Math.abs(midHip.x - midSh.x) / (Math.abs(midHip.y - midSh.y) + 1e-3);
      if (aot > 0.18) out.categories.pelvis.findings.push(tr("골반 전방 기울기(anterior tilt) 의심됩니다.", "Possible anterior pelvic tilt."));
    }
    if (out.categories.pelvis.score >= 80) out.categories.pelvis.findings.push(tr("골반이 수평을 유지합니다.", "Pelvis is level."));
  } else {
    out.categories.pelvis.score = 60;
  }

  // ── Knees ───────────────────────────────────────────────
  if (lh && rh && lk && rk && la && ra) {
    const midlineX = (lh.x + rh.x) / 2;
    const lValgus = Math.max(0, Math.abs(la.x - midlineX) - Math.abs(lk.x - midlineX)) / (hipW + 1e-3);
    const rValgus = Math.max(0, Math.abs(ra.x - midlineX) - Math.abs(rk.x - midlineX)) / (hipW + 1e-3);
    const valgusMag = Math.max(lValgus, rValgus);
    let score = scoreFromDev(valgusMag, 0.02, 0.12);
    if (valgusMag > 0.05) out.categories.knees.findings.push(tr("무릎이 안쪽으로 붕괴되는(valgus) 경향이 있습니다.", "Knees cave inward (valgus)."));
    if (view === "side" && lk && la && lh) {
      const angL = angleAt(lh, lk, la);
      if (angL > 185) {
        out.categories.knees.findings.push(tr("좌측 무릎 과신전 의심됩니다.", "Left knee hyperextension suspected."));
        score = Math.min(score, 70);
      }
    }
    if (score >= 80) out.categories.knees.findings.push(tr("무릎 추적이 발끝 방향과 일치합니다.", "Knee tracking aligns with toes."));
    out.categories.knees.score = score;
  } else {
    out.categories.knees.score = 60;
  }

  // ── Feet ─────────────────────────────────────────────────
  let footScore = 70;
  if (la && lHeel && lFi && ra && rHeel && rFi) {
    const ratioL = Math.abs(lFi.x - lHeel.x) / (dist(lHeel, lFi) + 1e-3);
    const ratioR = Math.abs(rFi.x - rHeel.x) / (dist(rHeel, rFi) + 1e-3);
    const turnout = (ratioL + ratioR) / 2;
    footScore = scoreFromDev(turnout, 0.3, 0.9);
    if (turnout > 0.6) out.categories.feet.findings.push(tr("발 외전(toe-out)이 큽니다.", "Excessive toe-out angle."));
  }
  out.categories.feet.score = footScore;
  if (footScore >= 75) out.categories.feet.findings.push(tr("발 정렬이 양호합니다.", "Foot alignment is acceptable."));

  // ── Overall ──────────────────────────────────────────────
  const weights = { spine: 0.25, shoulders: 0.2, pelvis: 0.2, knees: 0.2, feet: 0.15 };
  let total = 0;
  for (const k of Object.keys(weights)) total += (out.categories[k].score || 0) * weights[k];
  out.overallScore = Math.round(total);

  // ── Priorities & coaching ────────────────────────────────
  for (const k of ["spine", "shoulders", "pelvis", "knees", "feet"]) {
    const s = out.categories[k].score;
    if (s < 72) {
      const c = COACHING[k];
      out.topPriorities.push({
        category: k,
        issue: tr(c.issue.ko, c.issue.en),
        severity: s < 50 ? "high" : "medium",
        correction: tr(c.correction.ko, c.correction.en),
      });
      out.coachingGuide.push({
        title: tr(c.drill.title.ko, c.drill.title.en),
        target: tr(c.drill.target.ko, c.drill.target.en),
        frequency: tr("주 3회", "3x per week"),
        instruction: tr(c.drill.instruction.ko, c.drill.instruction.en),
      });
    }
  }
  out.topPriorities.sort((a, b) => (a.severity === "high" ? -1 : 1));

  // summary
  const weak = Object.entries(out.categories).filter(([, v]) => v.score < 72).map(([k]) => k);
  const weakKo = weak.map((k) => ({ spine: "척추", shoulders: "어깨", pelvis: "골반", knees: "무릎", feet: "발" }[k]));
  out.summary = weak.length
    ? tr(
        `전체 점수 ${out.overallScore}/100. ${weakKo.join(", ")} 항목에서 개선 여지가 있어 추천 드릴을 수행해 보세요.`,
        `Overall ${out.overallScore}/100. Improvement suggested in ${weak.join(", ")}. Try the recommended drills.`
      )
    : tr(
        `전체 점수 ${out.overallScore}/100. 주요 항목의 정렬이 양호합니다.`,
        `Overall ${out.overallScore}/100. Major alignments look good.`
      );

  return out;
}

// Per-frame joint angles (degrees) for the frame scrubber view.
export function frameAngles(lm) {
  const has = (...is) => is.every((i) => lm[i] && (lm[i].visibility ?? 1) >= 0.25);
  const a = (x, y, z) => (has(x, y, z) ? Math.round(angleAt(lm[x], lm[y], lm[z])) : null);
  return {
    leftElbow: a(11, 13, 15),
    rightElbow: a(12, 14, 16),
    leftKnee: a(23, 25, 27),
    rightKnee: a(24, 26, 28),
  };
}