import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Ruler, Zap } from "lucide-react";
import { motion } from "framer-motion";
import ImageUploader from "@/components/analysis/ImageUploader";
import { useLang, T } from "@/lib/LanguageContext";

// 기본 자세 분석(사진) + 종목별 동작 분석(동영상).
// 의료 진단 표현(Cobb/측만증/부상 위험 등)은 일절 사용하지 않고
// 앱에 실제로 표시되는 파라미터만 사실대로 기술합니다.
const DATA = {
  spine: {
    label: { ko: "척추", en: "Spine" },
    sublabel: { ko: "체간 정렬 상태 확인", en: "Check trunk alignment" },
    color: "#FF6B4A",
    description: {
      ko: "정적 자세에서 척추가 기울어지거나 한쪽으로 치우쳐 있는지 확인합니다. 치료 진단이 아닌 참고용 정렬 지표입니다.",
      en: "Checks whether the spine tilts or shifts to one side in static posture. A reference alignment indicator, not a diagnosis.",
    },
    metrics: {
      ko: ["어깨 기울기", "골반 기울기", "상체 기울기", "머리 전방/측방 위치"],
      en: ["Shoulder tilt", "Pelvic tilt", "Trunk lean", "Head forward/lateral position"],
    },
    method: {
      ko: "MediaPipe Pose 랜드마크로 매 프레임 어깨·골반·상체 벡터의 기울기를 계산합니다.",
      en: "MediaPipe Pose landmarks compute shoulder, pelvic, and trunk tilt each frame.",
    },
  },
  shoulders: {
    label: { ko: "어깨", en: "Shoulders" },
    sublabel: { ko: "좌우 대칭 확인", en: "Check left/right symmetry" },
    color: "#3B82F6",
    description: {
      ko: "좌우 어깨 높이와 각도를 비교해 비대칭 정도를 확인합니다. 자세 참고용 지표입니다.",
      en: "Compares left and right shoulder height/angle to gauge asymmetry. A posture reference indicator.",
    },
    metrics: {
      ko: ["어깨 기울기", "좌/우 견관절 각도", "어깨 비대칭 편차"],
      en: ["Shoulder tilt", "Left/right shoulder angle", "Shoulder asymmetry range"],
    },
    method: {
      ko: "양측 어깨·팔꿈치 랜드마크 벡터로 좌우 견관절 각도와 어깨 기울기를 매 프레임 계산합니다.",
      en: "Bilateral shoulder and elbow landmark vectors compute left/right shoulder angles and shoulder tilt each frame.",
    },
  },
  pelvis: {
    label: { ko: "골반", en: "Pelvis" },
    sublabel: { ko: "수평 여부 확인", en: "Check level" },
    color: "#8B5CF6",
    description: {
      ko: "골반의 좌우 기울어짐을 확인합니다. 정적 자세의 참고용 정렬 지표입니다.",
      en: "Checks pelvic lateral tilt. A reference alignment indicator for static posture.",
    },
    metrics: {
      ko: ["골반 기울기", "좌/우 고관절 각도"],
      en: ["Pelvic tilt", "Left/right hip angle"],
    },
    method: {
      ko: "양측 골반·고관절 랜드마크 벡터로 골반 기울기와 고관절 각도를 매 프레임 계산합니다.",
      en: "Bilateral pelvic and hip landmark vectors compute pelvic tilt and hip angles each frame.",
    },
  },
  knees: {
    label: { ko: "무릎", en: "Knees" },
    sublabel: { ko: "정렬 경향 확인", en: "Check alignment tendency" },
    color: "#10B981",
    description: {
      ko: "좌우 무릎 각도로 정렬 경향을 확인합니다. 참고용 지표이며 의료 진단이 아닙니다.",
      en: "Left and right knee angles indicate alignment tendency. A reference indicator, not a diagnosis.",
    },
    metrics: {
      ko: ["좌/우 무릎 각도", "무릎 비대칭 편차"],
      en: ["Left/right knee angle", "Knee asymmetry range"],
    },
    method: {
      ko: "대퇴·하퇴 랜드마크 벡터로 매 프레임 무릎 각도를 계산합니다.",
      en: "Thigh and shin landmark vectors compute the knee angle each frame.",
    },
  },
  feet: {
    label: { ko: "발", en: "Feet" },
    sublabel: { ko: "기본 정렬 확인 (정밀 분석은 전용 장비 필요)", en: "Basic alignment (precise analysis needs dedicated hardware)" },
    color: "#F59E0B",
    description: {
      ko: "발의 기본 외전/정렬을 확인합니다. 회내·회외 등 정밀한 족부 역학 분석은 별도 전용 장비가 필요합니다.",
      en: "Checks basic toe-out/foot alignment. Precise foot-mechanics analysis (pronation/supination) requires dedicated hardware.",
    },
    metrics: {
      ko: ["왼쪽 발 외전", "오른쪽 발 외전"],
      en: ["Left foot turnout", "Right foot turnout"],
    },
    method: {
      ko: "발목·발가락 랜드마크 벡터로 발 외전 각도를 매 프레임 산출합니다. 정밀한 족부 역학은 전용 장비를 권장합니다.",
      en: "Ankle and toe landmark vectors compute foot turnout each frame. Precise foot mechanics call for dedicated equipment.",
    },
  },
  baseball: {
    label: { ko: "야구", en: "Baseball" },
    sublabel: { ko: "투구·스윙 구간별 관절 각도", en: "Joint angles by pitching/swing phase" },
    color: "#FF6B4A",
    description: {
      ko: "야구 투구와 스윙에서 구간별(로드·첫움직임·발착지·컨택) 관절 각도와 견갑-골반 분리각을 추적합니다. Driveline OBP 공개 참고값과 비교할 수 있습니다.",
      en: "Tracks joint angles and hip-shoulder separation across pitching/swing phases (load, first move, foot plant, contact). Comparisons use published Driveline OBP reference values.",
    },
    metrics: {
      ko: ["견갑-골반 분리각", "좌/우 어깨·고관절·무릎 각도", "OBP 구간 프레임"],
      en: ["Hip-shoulder separation", "Left/right shoulder, hip, knee angles", "OBP phase frames"],
    },
    method: {
      ko: "MediaPipe Pose로 추출한 랜드마크에서 매 프레임 각도와 분리각을 계산합니다. OBP 참고값은 Driveline Baseball의 공개 데이터입니다.",
      en: "MediaPipe Pose landmarks compute angles and separation per frame. OBP reference values are Driveline Baseball public data.",
    },
  },
  golf: {
    label: { ko: "골프", en: "Golf" },
    sublabel: { ko: "8단계 스윙 구간 자동 분류 및 구간별 각도", en: "8-phase swing auto-segmentation & per-phase angles" },
    color: "#EC4899",
    description: {
      ko: "골프 스윙에서 어드레스·피니시를 지정하면 8단계 구간(어드레스→테이크어웨이→백스윙→탑→다운스윙→임팩트→팔로스루→피니시)을 자동 추천하고, 구간별 관절 각도를 확인합니다.",
      en: "Set address and finish in a golf swing and the 8 phases (address → takeaway → backswing → top → downswing → impact → follow-through → finish) are auto-suggested, with per-phase joint angles.",
    },
    metrics: {
      ko: ["8단계 스윙 구간", "구간별 좌/우 관절 각도", "어드레스·피니시 지정"],
      en: ["8 swing phases", "Per-phase left/right joint angles", "Address & finish markers"],
    },
    method: {
      ko: "사용자가 지정한 어드레스·피니시 구간 안에서 랜드마크 이동·회전 데이터로 각 단계의 시점을 추천합니다.",
      en: "Within the user-set address–finish window, landmark movement and rotation suggest the frame for each phase.",
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