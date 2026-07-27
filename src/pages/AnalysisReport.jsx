import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLang, T } from "@/lib/LanguageContext";
import { ArrowLeft, AlertTriangle, ChevronDown, ChevronUp, Camera, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Category accordion ────────────────────────────────────────────────────────
const CAT_COLORS = {
  spine: "#FF6B4A", shoulders: "#3B82F6", pelvis: "#8B5CF6",
  knees: "#10B981", feet: "#F59E0B",
};
const CAT_LABELS = (lang) => ({
  spine: T.catSpine[lang], shoulders: T.catShoulders[lang],
  pelvis: T.catPelvis[lang], knees: T.catKnees[lang], feet: T.catFeet[lang],
});

function CategoryCard({ catKey, data, lang }) {
  const [open, setOpen] = useState(false);
  const color = CAT_COLORS[catKey] || "#FF6B4A";
  const label = CAT_LABELS(lang)[catKey] || catKey;
  const hasEquipmentFlag = data?.flags?.length > 0;

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <button
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
          <span className="w-2 h-2 rounded-full" style={{ background: color }} />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-bold text-[#1A1A2E]">{label}</p>
          {hasEquipmentFlag && (
            <p className="text-xs text-amber-500 mt-0.5">⚠ {T.equipmentFlag[lang]}</p>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
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
  const { lang } = useLang();
  const aiResult = location.state?.result;
  const imageUrl = location.state?.imageUrl;
  const fromAdmin = location.state?.from === "admin";

  const isAI = !!aiResult;
  const summary = isAI ? aiResult.summary : "전반적으로 양호한 자세입니다. 흉추 후만과 좌측 어깨 비대칭에 주의가 필요합니다.";

  const priorities = isAI ? aiResult.topPriorities : [];
  const coachingGuide = isAI ? aiResult.coachingGuide : [];

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to={fromAdmin ? "/admin" : "/"} className="inline-flex items-center gap-2 text-gray-500 hover:text-[#1A1A2E] text-sm font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {fromAdmin ? "대시보드로 돌아가기" : T.backHome[lang]}
          </Link>
          <span className="text-sm font-bold text-[#1A1A2E]">{T.reportTitle[lang]}</span>
          <span className="text-xs text-gray-400">{isAI ? T.aiLabel[lang] : T.sampleLabel[lang]}</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Summary hero (coaching-focused) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-[#1A1A2E] rounded-2xl p-7"
        >
          <p className="text-white/50 text-sm mb-2">{T.summaryLabel[lang]}</p>
          <p className="text-white text-base font-bold leading-relaxed">{summary}</p>
        </motion.div>

        {/* Uploaded image */}
        {imageUrl && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#FF6B4A]" />
              <h2 className="text-sm font-bold text-[#1A1A2E]">{T.analyzedImage[lang]}</h2>
            </div>
            <img src={imageUrl} alt="분석 이미지" className="w-full rounded-xl object-contain max-h-64 bg-gray-50" />
          </motion.div>
        )}

        {/* Category accordion */}
        {isAI && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <h2 className="text-base font-bold text-[#1A1A2E] mb-3">{T.categoryAnalysis[lang]}</h2>
            <div className="space-y-2">
              {Object.entries(aiResult.categories || {}).map(([k, v]) => (
                <CategoryCard key={k} catKey={k} data={v} lang={lang} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Top priorities */}
        {priorities.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="text-base font-bold text-[#1A1A2E] mb-3">{T.priorities[lang]}</h2>
            <div className="space-y-3">
              {priorities.map((p, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 flex items-start gap-4">
                  <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <Info className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#1A1A2E] mb-1">{p.issue}</p>
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
            <h2 className="text-base font-bold text-[#1A1A2E] mb-3">{T.coachingGuide[lang]}</h2>
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
            <div className="mt-4 flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
              <Info className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700 leading-relaxed">{T.coachingDisclaimer[lang]}</p>
            </div>
          </motion.div>
        )}

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-[#1A1A2E] rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold text-white mb-2">{T.bookCTA[lang]}</h3>
          <p className="text-white/50 text-sm mb-6">{T.bookDesc[lang]}</p>
          <Link to="/booking"
            className="inline-flex items-center gap-2 bg-[#FF6B4A] hover:bg-[#e55a3a] text-white font-semibold px-7 py-3 rounded-xl text-sm transition-all shadow-lg shadow-orange-900/30">
            {T.bookBtn[lang]}
          </Link>
        </motion.div>
      </div>
    </div>
  );
}