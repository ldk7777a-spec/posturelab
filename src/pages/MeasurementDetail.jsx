import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Ruler, Zap } from "lucide-react";
import { motion } from "framer-motion";
import ImageUploader from "@/components/analysis/ImageUploader";
import { useLang, T } from "@/lib/LanguageContext";

// 측정 항목별 상세 — 앱에 실제로 표시되는 파라미터만 사용 (의료/효능 표현 제거)
const DATA = {
  elbow: {
    label: { ko: "팔꿈치", en: "Elbow" },
    sublabel: { ko: "좌우 팔꿈치 각도 추적", en: "Left/right elbow angle tracking" },
    color: "#FF6B4A",
    description: {
      ko: "프레임마다 왼쪽·오른쪽 팔꿈치 각도를 추적해 굴곡·신장 범위와 좌우 차이를 확인합니다.",
      en: "Left and right elbow angles are tracked frame-by-frame to inspect flexion/extension range and left-right differences.",
    },
    metrics: {
      ko: ["왼쪽 팔꿈치", "오른쪽 팔꿈치"],
      en: ["Left elbow", "Right elbow"],
    },
    method: {
      ko: "MediaPipe Pose 랜드마크로 어깨·팔꿈치·손목 벡터를 정의해 매 프레임 각도를 산출합니다.",
      en: "MediaPipe Pose landmarks define shoulder–elbow–wrist vectors to compute the angle each frame.",
    },
  },
  shoulder: {
    label: { ko: "견관절", en: "Shoulder" },
    sublabel: { ko: "좌우 어깨 관절 각도 추적", en: "Left/right shoulder angle tracking" },
    color: "#3B82F6",
    description: {
      ko: "왼쪽·오른쪽 견관절 각도를 추적해 가동 범위와 좌우 비대칭을 확인합니다.",
      en: "Left and right shoulder joint angles are tracked to inspect range of motion and bilateral asymmetry.",
    },
    metrics: {
      ko: ["왼쪽 견관절", "오른쪽 견관절"],
      en: ["Left shoulder", "Right shoulder"],
    },
    method: {
      ko: "상완(어깨–팔꿈치)과 몸통(어깨–골반) 벡터로 매 프레임 견관절 각도를 계산합니다.",
      en: "Shoulder angle is computed each frame from the upper-arm (shoulder–elbow) and trunk (shoulder–hip) vectors.",
    },
  },
  hip: {
    label: { ko: "고관절", en: "Hip" },
    sublabel: { ko: "좌우 고관절 각도 추적", en: "Left/right hip angle tracking" },
    color: "#8B5CF6",
    description: {
      ko: "왼쪽·오른쪽 고관절 각도로 굴곡·신장과 좌우 차이를 추적합니다.",
      en: "Left and right hip angles track flexion/extension and bilateral differences.",
    },
    metrics: {
      ko: ["왼쪽 고관절", "오른쪽 고관절"],
      en: ["Left hip", "Right hip"],
    },
    method: {
      ko: "대퇴(골반–무릎)와 몸통(골반–어깨) 벡터로 매 프레임 고관절 각도를 산출합니다.",
      en: "Hip angle is computed each frame from the thigh (hip–knee) and trunk (hip–shoulder) vectors.",
    },
  },
  knee: {
    label: { ko: "무릎", en: "Knee" },
    sublabel: { ko: "좌우 무릎 각도 추적", en: "Left/right knee angle tracking" },
    color: "#10B981",
    description: {
      ko: "왼쪽·오른쪽 무릎 각도로 굴곡 각도와 좌우 차이를 추적합니다.",
      en: "Left and right knee angles track flexion angle and bilateral differences.",
    },
    metrics: {
      ko: ["왼쪽 무릎", "오른쪽 무릎"],
      en: ["Left knee", "Right knee"],
    },
    method: {
      ko: "대퇴(고관절–무릎)과 하퇴(무릎–발목) 벡터로 매 프레임 무릎 각도를 산출합니다.",
      en: "Knee angle is computed each frame from the thigh (hip–knee) and shin (knee–ankle) vectors.",
    },
  },
  ankle: {
    label: { ko: "발목", en: "Ankle" },
    sublabel: { ko: "좌우 발목 각도 추적", en: "Left/right ankle angle tracking" },
    color: "#F59E0B",
    description: {
      ko: "왼쪽·오른쪽 발목 각도로 발목 가동 범위와 좌우 차이를 추적합니다.",
      en: "Left and right ankle angles track range of motion and bilateral differences.",
    },
    metrics: {
      ko: ["왼쪽 발목", "오른쪽 발목"],
      en: ["Left ankle", "Right ankle"],
    },
    method: {
      ko: "하퇴(무릎–발목)와 발(발목–발가락) 벡터로 매 프레임 발목 각도를 산출합니다.",
      en: "Ankle angle is computed each frame from the shin (knee–ankle) and foot (ankle–toe) vectors.",
    },
  },
  alignment: {
    label: { ko: "정렬 지표", en: "Alignment Metrics" },
    sublabel: { ko: "어깨·골반·상체 기울기, 머리 위치", en: "Shoulder/pelvis/trunk tilt, head position" },
    color: "#06B6D4",
    description: {
      ko: "프레임마다 어깨 기울기, 골반 기울기, 상체 기울기, 머리의 전방/측방 위치를 추적합니다. 좌우 비대칭이나 특정 구간에서의 변화를 그래프로 확인할 수 있습니다.",
      en: "Each frame tracks shoulder tilt, pelvic tilt, trunk lean, and forward/lateral head position. Left-right asymmetry and changes over specific phases can be reviewed in the graph.",
    },
    metrics: {
      ko: ["어깨 기울기", "골반 기울기", "상체 기울기", "머리 전방/측방 위치"],
      en: ["Shoulder tilt", "Pelvic tilt", "Trunk lean", "Head forward/lateral position"],
    },
    method: {
      ko: "MediaPipe Pose 랜드마크를 기반으로 프레임마다 좌표를 계산해 기울기와 위치를 산출합니다.",
      en: "Using MediaPipe Pose landmarks, coordinates are computed each frame to derive tilt and head position.",
    },
  },
  swing: {
    label: { ko: "스윙 구간 분석", en: "Swing Phase Analysis" },
    sublabel: { ko: "골프 8단계 구간 자동 추천 (어드레스~피니시)", en: "Golf 8-phase auto-suggested ranges (address → finish)" },
    color: "#EC4899",
    description: {
      ko: "골프 스윙에서 어드레스와 피니시를 지정하면 8단계 구간을 자동으로 추천합니다. 추천값을 기준으로 슬라이더로 직접 조정해 최종 확정할 수 있습니다.",
      en: "In a golf swing, set address and finish and the 8 phases are auto-suggested. Adjust the slider from the suggested values to finalise.",
    },
    metrics: {
      ko: ["어드레스", "테이크어웨이", "백스윙", "탑", "트랜지션/다운스윙", "임팩트", "팔로스루", "피니시"],
      en: ["Address", "Takeaway", "Backswing", "Top", "Transition/Downswing", "Impact", "Follow-through", "Finish"],
    },
    method: {
      ko: "사용자가 지정한 어드레스·피니시 범위 안에서 랜드마크 이동·회전 데이터로 구간별 시점을 추천합니다.",
      en: "Within the user-set address–finish window, landmark movement and rotation data suggest the frame for each phase.",
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
      {/* Hero banner — no stock photo; gradient with accent */}
      <div className="relative bg-[#1A1A2E] overflow-hidden">
        <div
          className="absolute inset-0 opacity-40"
          style={{ background: `radial-gradient(circle at 22% 28%, ${data.color}, transparent 62%)` }}
        />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 sm:pt-10 sm:pb-16">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            {T.backBtn[lang]}
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-6"
          >
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

        {/* AI Analysis Uploader */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <ImageUploader onAnalysisComplete={handleAnalysisComplete} accentColor={data.color} />
        </motion.div>
      </div>
    </div>
  );
}