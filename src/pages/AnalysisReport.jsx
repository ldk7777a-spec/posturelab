import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, TrendingUp, AlertTriangle, CheckCircle2, BarChart2, ChevronDown, ChevronUp, Camera } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from "recharts";

// ── Circular gauge ────────────────────────────────────────────────────────────
function ScoreGauge({ score, size = 120 }) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const color = score >= 80 ? "#10B981" : score >= 60 ? "#F59E0B" : "#EF4444";
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
        <circle
          cx="50" cy="50" r={r} fill="none"
          stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - score / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold text-white">{score}</span>
        <span className="text-xs text-white/50">/100</span>
      </div>
    </div>
  );
}

// ── Category accordion ────────────────────────────────────────────────────────
const CAT_COLORS = {
  spine: "#FF6B4A", shoulders: "#3B82F6", pelvis: "#8B5CF6",
  knees: "#10B981", feet: "#F59E0B",
};
const CAT_LABELS = {
  spine: "척추", shoulders: "어깨", pelvis: "골반", knees: "무릎", feet: "발·족부",
};

function CategoryCard({ catKey, data }) {
  const [open, setOpen] = useState(false);
  const color = CAT_COLORS[catKey] || "#FF6B4A";
  const label = CAT_LABELS[catKey] || catKey;
  const score = data?.score ?? 0;
  const hasEquipmentFlag = data?.flags?.length > 0;

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <button
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
          <span className="text-xs font-bold" style={{ color }}>{score}</span>
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-bold text-[#1A1A2E]">{label}</p>
          {hasEquipmentFlag && (
            <p className="text-xs text-amber-500 mt-0.5">⚠ 장비/영상 필요 항목 포함</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 space-y-2 border-t border-gray-50">
              {data?.findings?.map((f, i) => (
                <div key={i} className="flex items-start gap-2 pt-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                  <p className="text-sm text-gray-600">{f}</p>
                </div>
              ))}
              {data?.flags?.map((f, i) => (
                <div key={i} className="flex items-start gap-2 bg-amber-50 rounded-lg px-3 py-2 mt-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-700">{f}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AnalysisReport() {
  const location = useLocation();
  const aiResult = location.state?.result;
  const imageUrl = location.state?.imageUrl;

  // Fallback static data when no AI result
  const isAI = !!aiResult;
  const overallScore = isAI ? aiResult.overallScore : 73;
  const summary = isAI ? aiResult.summary : "전반적으로 양호한 자세입니다. 흉추 후만과 좌측 어깨 비대칭에 주의가 필요합니다.";

  const radarData = isAI
    ? Object.entries(aiResult.categories || {}).map(([k, v]) => ({
        subject: CAT_LABELS[k] || k,
        score: v.score,
      }))
    : [
        { subject: "척추", score: 72 }, { subject: "어깨", score: 58 },
        { subject: "골반", score: 80 }, { subject: "무릎", score: 88 },
        { subject: "발·족부", score: 65 },
      ];

  const priorities = isAI ? aiResult.topPriorities : [];
  const coachingGuide = isAI ? aiResult.coachingGuide : [];

  const severityColor = { high: "#EF4444", medium: "#F59E0B", low: "#10B981" };
  const severityBg = { high: "bg-red-50", medium: "bg-amber-50", low: "bg-emerald-50" };
  const severityLabel = { high: "높음", medium: "보통", low: "낮음" };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-[#1A1A2E] text-sm font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" />
            홈으로
          </Link>
          <span className="text-sm font-bold text-[#1A1A2E]">자세 분석 리포트</span>
          <span className="text-xs text-gray-400">{isAI ? "AI 분석" : "샘플 데이터"}</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Score hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-[#1A1A2E] rounded-2xl p-7 flex flex-col sm:flex-row items-center gap-7"
        >
          <ScoreGauge score={overallScore} />
          <div className="text-center sm:text-left">
            <p className="text-white/50 text-sm mb-1">종합 자세 점수</p>
            <h1 className="text-2xl font-extrabold text-white mb-2">
              {overallScore >= 80 ? "우수 — 잘 유지하세요!" : overallScore >= 60 ? "양호 — 개선 여지 있음" : "주의 필요 — 교정 권장"}
            </h1>
            <p className="text-white/60 text-sm leading-relaxed max-w-md">{summary}</p>
          </div>
        </motion.div>

        {/* Uploaded image + radar */}
        <div className="grid sm:grid-cols-2 gap-6">
          {imageUrl && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#FF6B4A]" />
                <h2 className="text-sm font-bold text-[#1A1A2E]">분석된 이미지</h2>
              </div>
              <img src={imageUrl} alt="분석 이미지" className="w-full rounded-xl object-contain max-h-64 bg-gray-50" />
            </motion.div>
          )}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className={`bg-white rounded-2xl p-6 shadow-sm ${!imageUrl ? "sm:col-span-2" : ""}`}>
            <div className="flex items-center gap-2 mb-2">
              <BarChart2 className="w-4 h-4 text-[#FF6B4A]" />
              <h2 className="text-sm font-bold text-[#1A1A2E]">카테고리별 균형</h2>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#f0f0f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#6B7280" }} />
                <Radar name="점수" dataKey="score" stroke="#FF6B4A" fill="#FF6B4A" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Category accordion */}
        {isAI && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <h2 className="text-base font-bold text-[#1A1A2E] mb-3">카테고리별 분석</h2>
            <div className="space-y-2">
              {Object.entries(aiResult.categories || {}).map(([k, v]) => (
                <CategoryCard key={k} catKey={k} data={v} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Top priorities */}
        {priorities.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="text-base font-bold text-[#1A1A2E] mb-3">우선 교정 항목</h2>
            <div className="space-y-3">
              {priorities.map((p, i) => (
                <div key={i} className={`${severityBg[p.severity] || "bg-gray-50"} rounded-xl p-5 flex items-start gap-4`}>
                  <div className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5" style={{ color: severityColor[p.severity] || "#6B7280" }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-bold text-[#1A1A2E]">{p.issue}</p>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full text-white" style={{ background: severityColor[p.severity] || "#6B7280" }}>
                        {severityLabel[p.severity] || p.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed">{p.correction}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Coaching guide */}
        {coachingGuide.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <h2 className="text-base font-bold text-[#1A1A2E] mb-3">AI 코칭 가이드</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {coachingGuide.map((g, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-bold text-[#1A1A2E]">{g.title}</p>
                    <span className="text-xs text-[#FF6B4A] font-medium bg-orange-50 px-2 py-0.5 rounded-full whitespace-nowrap">{g.frequency}</span>
                  </div>
                  <p className="text-xs text-blue-600 font-medium mb-2">{g.target}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{g.instruction}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-[#1A1A2E] rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold text-white mb-2">전문가와 함께 교정하세요</h3>
          <p className="text-white/50 text-sm mb-6">인증된 PostureLab 트레이너와 1:1 상담을 예약하세요.</p>
          <Link to="/booking"
            className="inline-flex items-center gap-2 bg-[#FF6B4A] hover:bg-[#e55a3a] text-white font-semibold px-7 py-3 rounded-xl text-sm transition-all shadow-lg shadow-orange-900/30">
            상담 예약하기
          </Link>
        </motion.div>
      </div>
    </div>
  );
}