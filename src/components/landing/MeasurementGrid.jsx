import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronRight, Camera, Video } from "lucide-react";
import { useLang, T } from "@/lib/LanguageContext";

function CardRow({ cards, groupIdx }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
      {cards.map((c, i) => (
        <motion.div
          key={c.key}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.4, delay: (i % 3) * 0.06 }}
          className="relative group rounded-2xl border border-gray-100 bg-white p-6 hover:border-[#FF6B4A]/40 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all"
        >
          <Link to={`/measurement/${c.key}`} className="absolute inset-0 z-10" />
          <div className="flex items-center justify-between mb-4">
            <span className="w-8 h-8 rounded-lg bg-[#1A1A2E] text-white text-xs font-bold flex items-center justify-center">
              {groupIdx}
            </span>
            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#FF6B4A] group-hover:translate-x-0.5 transition-all" />
          </div>
          <h3 className="text-lg font-bold text-[#1A1A2E]">{c.label}</h3>
          <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{c.desc}</p>
        </motion.div>
      ))}
    </div>
  );
}

export default function MeasurementGrid() {
  const { lang } = useLang();
  const basic = T.measureCardsBasic[lang];
  const sport = T.measureCardsSport[lang];

  return (
    <section className="py-20 lg:py-28 bg-[#F9FAFB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="inline-block text-xs font-bold tracking-wider text-[#FF6B4A] uppercase mb-3">
            {T.measureEyebrow[lang]}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1A1A2E] tracking-tight">
            {T.measureTitle[lang]}
          </h2>
          <p className="mt-4 text-gray-500 max-w-2xl mx-auto text-base">{T.measureDesc[lang]}</p>
        </motion.div>

        <div className="space-y-10">
          {/* Group 1 — 기본 자세 분석 (사진 입력) */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                <Camera className="w-4 h-4 text-[#FF6B4A]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1A1A2E]">{T.measureGroupBasic[lang]}</h3>
                <p className="text-xs text-gray-400">{T.measureGroupBasicSub[lang]}</p>
              </div>
            </div>
            <CardRow cards={basic} groupIdx="1" />
          </div>

          {/* Group 2 — 종목별 동작 분석 (동영상 업로드) */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                <Video className="w-4 h-4 text-purple-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1A1A2E]">{T.measureGroupSport[lang]}</h3>
                <p className="text-xs text-gray-400">{T.measureGroupSportSub[lang]}</p>
              </div>
            </div>
            <CardRow cards={sport} groupIdx="2" />
          </div>
        </div>
      </div>
    </section>
  );
}