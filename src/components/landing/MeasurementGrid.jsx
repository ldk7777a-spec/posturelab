import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useLang, T } from "@/lib/LanguageContext";

export default function MeasurementGrid() {
  const { lang } = useLang();
  const cards = T.metricCards[lang];

  return (
    <section className="py-20 lg:py-28 bg-[#F9FAFB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14">

          <span className="inline-block text-xs font-bold tracking-wider text-[#FF6B4A] uppercase mb-3">
            {T.measureEyebrow[lang]}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1A1A2E] tracking-tight">
            {T.measureTitle[lang]}
          </h2>
          <p className="mt-4 text-gray-500 max-w-2xl mx-auto text-base">{T.measureDesc[lang]}</p>
        </motion.div>

        {/* 7 tracking cards — no stock photos; factual tracking descriptions */}
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
                  {i + 1}
                </span>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#FF6B4A] group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="text-lg font-bold text-[#1A1A2E]">{c.label}</h3>
              <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{c.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}