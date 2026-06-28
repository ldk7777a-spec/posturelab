import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Ruler, Zap, BarChart2 } from "lucide-react";
import { motion } from "framer-motion";
import ImageUploader from "@/components/analysis/ImageUploader";
import { useLang, T } from "@/lib/LanguageContext";

const MEASUREMENT_IMAGES = {
  spine: "https://media.base44.com/images/public/6a3b77c47222088c76d9d104/ac0856d24_generated_869a708b.png",
  shoulders: "https://media.base44.com/images/public/6a3b77c47222088c76d9d104/86888d215_generated_b0004176.png",
  pelvis: "https://media.base44.com/images/public/6a3b77c47222088c76d9d104/37108d317_generated_698312f1.png",
  knees: "https://media.base44.com/images/public/6a3b77c47222088c76d9d104/4b35bb0bd_generated_4d2bfc6b.png",
  feet: "https://media.base44.com/images/public/6a3b77c47222088c76d9d104/050afc8ae_generated_a589db8a.png",
  dynamic: "https://media.base44.com/images/public/6a3b77c47222088c76d9d104/1a81d1eaf_generated_93288630.png",
  breathing: "https://media.base44.com/images/public/6a3b77c47222088c76d9d104/ec56514ef_generated_896cd33c.png",
};

const DATA = {
  spine: {
    label: { ko: "척추", en: "Spine" },
    sublabel: { ko: "정렬 및 곡률", en: "Alignment & Curvature" },
    color: "#FF6B4A",
    description: {
      ko: "PostureLab은 매 프레임마다 척추 전체 길이를 분석하여 비정상적인 곡률, 측면 편차(측만증 위험), 경추부터 요추까지의 분절 정렬을 감지합니다.",
      en: "PostureLab analyzes the full length of the spinal column in each frame, detecting abnormal curvature, lateral deviation (scoliosis risk), and segmental alignment from cervical to lumbar.",
    },
    metrics: {
      ko: ["경추 전만각", "흉추 후만각", "요추 전만각", "측면 편차 (Cobb 각도)"],
      en: ["Cervical lordosis angle", "Thoracic kyphosis angle", "Lumbar lordosis angle", "Lateral deviation (Cobb angle)"],
    },
    method: {
      ko: "포즈 랜드마크 감지를 통해 AI가 프레임당 12개의 척추 기준점을 매핑합니다. 벡터 연산으로 분절 간 각도를 계산하고 정규 범위와 비교합니다.",
      en: "Using pose landmark detection, AI maps 12 vertebral reference points per frame. Angles between segments are computed using vector math and compared to normative ranges.",
    },
    benefits: {
      ko: ["비대칭 하중 패턴 식별", "세션별 자세 개선 추적", "보상 패턴 조기 감지"],
      en: ["Identify asymmetric loading patterns", "Track postural improvements over sessions", "Early detection of compensation patterns"],
    },
  },
  shoulders: {
    label: { ko: "어깨", en: "Shoulders" },
    sublabel: { ko: "가동성 및 대칭", en: "Mobility & Symmetry" },
    color: "#3B82F6",
    description: {
      ko: "모든 동작 단계에서 어깨 가동성, 거상 비대칭, 견갑골 익상을 평가합니다. 정적 자세와 동적 가동 범위 모두 추적됩니다.",
      en: "Shoulder mobility, elevation asymmetry, and scapular winging are assessed across every movement phase. Both static posture and dynamic range of motion are tracked.",
    },
    metrics: {
      ko: ["어깨 거상각", "좌우 대칭 지수", "견갑골 상방 회전", "상완골두 리듬 비율"],
      en: ["Shoulder elevation angle", "Left/right symmetry index", "Scapular upward rotation", "Glenohumeral rhythm ratio"],
    },
    method: {
      ko: "양측 랜드마크 추적으로 프레임별 거상각과 대칭 점수를 계산합니다. 견갑골 움직임은 흉추 및 쇄골 벡터에서 추론합니다.",
      en: "Bilateral landmark tracking computes elevation angles and symmetry scores frame-by-frame. Scapular movement is inferred from thoracic and clavicle vectors.",
    },
    benefits: {
      ko: ["좌우 불균형 조기 감지", "오버헤드 동작 역학 최적화", "회전근개 부상 위험 감소"],
      en: ["Detect bilateral imbalances early", "Optimize overhead movement mechanics", "Reduce rotator cuff injury risk"],
    },
  },
  pelvis: {
    label: { ko: "골반", en: "Pelvis" },
    sublabel: { ko: "기울기 및 회전", en: "Tilt & Rotation" },
    color: "#8B5CF6",
    description: {
      ko: "전방/후방 골반 기울기와 측면 회전을 모든 면에서 측정합니다. 골반 위치는 허리 건강과 운동 파워 출력의 핵심 요인입니다.",
      en: "Anterior/posterior pelvic tilt and lateral rotation are measured across all planes. Pelvic position is a critical driver of lower back health and athletic power output.",
    },
    metrics: {
      ko: ["전방 골반 기울기각", "후방 골반 기울기각", "측면 골반 하강", "골반 회전 (횡단면)"],
      en: ["Anterior pelvic tilt angle", "Posterior pelvic tilt angle", "Lateral pelvic drop", "Pelvic rotation (transverse)"],
    },
    method: {
      ko: "고관절 및 ASIS 랜드마크 벡터로 골반면을 정의합니다. 전역 기준축에 대한 투영 각도를 이용해 3D로 기울기와 회전을 계산합니다.",
      en: "Hip and ASIS landmark vectors define the pelvic plane. Tilt and rotation are computed in 3D using projected angles against global reference axes.",
    },
    benefits: {
      ko: ["고관절 굴곡근/둔근 불균형 교정", "스쿼트·데드리프트 역학 개선", "허리 통증 위험 감소"],
      en: ["Correct hip flexor/glute imbalances", "Improve squat and deadlift mechanics", "Reduce lower back pain risk"],
    },
  },
  knees: {
    label: { ko: "무릎", en: "Knees" },
    sublabel: { ko: "추적 및 외반", en: "Tracking & Valgus" },
    color: "#10B981",
    description: {
      ko: "동적 동작 중 무릎 외반(안쪽 붕괴), 내반(바깥쪽 휨), 굴곡각을 추적합니다. ACL 부상 예방과 점프 착지 역학에 매우 중요합니다.",
      en: "Knee valgus (caving inward), varus (bowing outward), and flexion angles during dynamic movements are tracked. Critical for ACL injury prevention and jump-landing mechanics.",
    },
    metrics: {
      ko: ["무릎 외반/내반각", "지면 접촉 시 무릎 굴곡각", "경골 회전", "Q각 추정"],
      en: ["Knee valgus/varus angle", "Knee flexion angle at ground contact", "Tibial rotation", "Q-angle estimation"],
    },
    method: {
      ko: "대퇴부 및 경골 랜드마크 벡터로 정면·시상면의 무릎 각도를 계산합니다. 무릎 내측 편차가 중립에서 5° 초과 시 외반으로 표시됩니다.",
      en: "Thigh and tibia landmark vectors compute the knee angle in the frontal and sagittal planes. Valgus is flagged when the knee medial deviation exceeds 5° from neutral.",
    },
    benefits: {
      ko: ["ACL 부상 위험 선별", "착지 역학 개선", "스쿼트 깊이 및 정렬 최적화"],
      en: ["Screen for ACL injury risk", "Improve landing mechanics", "Optimize squat depth and alignment"],
    },
  },
  feet: {
    label: { ko: "발", en: "Feet" },
    sublabel: { ko: "착지 & 회내", en: "Strike & Pronation" },
    color: "#F59E0B",
    description: {
      ko: "보행 및 운동 동작 중 발 착지 패턴, 회내/회외, 외전각을 정량화합니다. 발 역학은 전체 운동 사슬에 걸친 힘에 영향을 미칩니다.",
      en: "Foot strike pattern, pronation/supination, and toe-out angle during gait and athletic tasks are quantified. Foot mechanics influence forces up the entire kinetic chain.",
    },
    metrics: {
      ko: ["발 착지 지수 (뒤꿈치/중간/앞발)", "회내각", "외전각", "보폭 너비"],
      en: ["Foot strike index (heel/mid/fore)", "Pronation angle", "Toe-out angle", "Stance width"],
    },
    method: {
      ko: "발목 및 발가락 랜드마크로 지면에 대한 발 방향을 정의합니다. 착지 패턴은 초기 접촉 시 발목 속도 프로파일로 분류됩니다.",
      en: "Ankle and toe landmarks define foot orientation relative to the ground plane. Strike pattern is classified from ankle velocity profiles at initial contact.",
    },
    benefits: {
      ko: ["달리기 효율 최적화", "잘못된 역학으로 인한 과사용 부상 감소", "신발·인솔 결정 지원"],
      en: ["Optimize running economy", "Reduce overuse injury from faulty mechanics", "Inform footwear and orthotic decisions"],
    },
  },
  dynamic: {
    label: { ko: "동적 분석", en: "Dynamic Analysis" },
    sublabel: { ko: "전체 운동 사슬", en: "Full Kinetic Chain" },
    color: "#EF4444",
    description: {
      ko: "스쿼트, 점프, 투구, 종목별 동작 등 다관절 동작의 전신 운동학적 분석입니다. 전체 운동 사슬에 걸친 타이밍, 순서, 협응력을 평가합니다.",
      en: "Full-body kinematic analysis during multi-joint movements — squats, jumps, throws, and sport-specific patterns. Evaluates timing, sequencing, and coordination across the entire kinetic chain.",
    },
    metrics: {
      ko: ["관절각 순서", "지면 접촉 시간", "최대 파워 단계 감지", "운동 사슬 효율 점수"],
      en: ["Joint angle sequencing", "Ground contact time", "Peak power phase detection", "Kinetic chain efficiency score"],
    },
    method: {
      ko: "다관절 추적으로 각속도 및 가속도 프로파일을 동시에 계산합니다. 독자적인 운동 사슬 점수가 종목별 생체역학 기준에 따라 관절 순서에 가중치를 부여합니다.",
      en: "Multi-joint tracking computes angular velocities and acceleration profiles simultaneously. A proprietary kinetic chain score weights joint sequencing against sport-specific biomechanical norms.",
    },
    benefits: {
      ko: ["동작 패턴의 에너지 누수 식별", "운동 파워 전달 향상", "동작 특성에 따른 훈련 개인화"],
      en: ["Identify energy leaks in movement patterns", "Enhance athletic power transfer", "Individualize training based on movement signature"],
    },
  },
  breathing: {
    label: { ko: "호흡", en: "Breathing" },
    sublabel: { ko: "호흡 역학", en: "Respiratory Mechanics" },
    color: "#06B6D4",
    description: {
      ko: "흉곽 확장, 늑골 움직임, 호흡 전략(흉식 vs 횡격막)을 영상에서 분석합니다. 잘못된 호흡 역학은 코어 안정성과 퍼포먼스에 영향을 미칩니다.",
      en: "Respiratory mechanics — thoracic expansion, rib cage movement, and breathing strategy (chest vs. diaphragmatic) — are analyzed from video. Poor breathing mechanics affect core stability and performance.",
    },
    metrics: {
      ko: ["흉곽 확장 비율", "호흡 전략 분류", "호흡수", "보조 근육 활성화 지수"],
      en: ["Thoracic expansion ratio", "Breathing strategy classification", "Respiratory rate", "Accessory muscle activation index"],
    },
    method: {
      ko: "호흡 주기 전반에 걸쳐 늑골 및 어깨 랜드마크 변위를 추적합니다. 확장 비율과 동작 패턴으로 훈련된 분류기를 통해 주된 호흡 전략을 분류합니다.",
      en: "Rib cage and shoulder landmark displacement is tracked across the breathing cycle. Expansion ratio and movement pattern classify the dominant breathing strategy via a trained classifier.",
    },
    benefits: {
      ko: ["부하 시 코어 안정성 향상", "지구력 및 회복력 증대", "보조 호흡으로 인한 경추 긴장 감소"],
      en: ["Improve core stability under load", "Enhance endurance and recovery", "Reduce cervical tension from accessory breathing"],
    },
  },
};

export default function MeasurementDetail() {
  const { key } = useParams();
  const navigate = useNavigate();
  const { lang } = useLang();
  const data = DATA[key];

  const handleAnalysisComplete = (result, imageUrl) => {
    navigate("/report", { state: { result, imageUrl } });
  };

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">{T.notFound[lang]}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero image banner */}
      <div className="relative h-64 sm:h-80 lg:h-96 overflow-hidden">
        <img
          src={MEASUREMENT_IMAGES[key]}
          alt={data.label[lang]}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />

        {/* Back button */}
        <div className="absolute top-6 left-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            {T.backBtn[lang]}
          </Link>
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-6 left-6 right-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span
              className="inline-block text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-3"
              style={{ background: `${data.color}30`, color: data.color, border: `1px solid ${data.color}50` }}
            >
              PostureLab Analysis
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{data.label[lang]}</h1>
            <p className="text-white/70 mt-1 text-base">{data.sublabel[lang]}</p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-lg text-gray-600 leading-relaxed"
        >
          {data.description[lang]}
        </motion.p>

        <div className="grid sm:grid-cols-2 gap-6">
          {/* Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="bg-gray-50 rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${data.color}15` }}>
                <Ruler className="w-4 h-4" style={{ color: data.color }} />
              </div>
              <h2 className="text-base font-bold text-[#1A1A2E]">{T.measuredParams[lang]}</h2>
            </div>
            <ul className="space-y-2.5">
              {data.metrics[lang].map((m) => (
                <li key={m} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: data.color }} />
                  {m}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Measurement method */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="bg-[#1A1A2E] rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-base font-bold text-white">{T.howMeasured[lang]}</h2>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">{data.method[lang]}</p>
          </motion.div>
        </div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${data.color}15` }}>
              <BarChart2 className="w-4 h-4" style={{ color: data.color }} />
            </div>
            <h2 className="text-base font-bold text-[#1A1A2E]">{T.clinicBenefits[lang]}</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {data.benefits[lang].map((b) => (
              <div key={b} className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: data.color }} />
                <p className="text-sm text-gray-600 leading-snug">{b}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* AI Analysis Uploader */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <ImageUploader onAnalysisComplete={handleAnalysisComplete} accentColor={data.color} />
        </motion.div>
      </div>
    </div>
  );
}