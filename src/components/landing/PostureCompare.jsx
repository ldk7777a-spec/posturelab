import React, { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useLang } from "@/lib/LanguageContext";

const BEFORE_IMAGE = "https://images.unsplash.com/photo-1520975696133-31b7e23aa0f3?w=800&q=80";
const AFTER_IMAGE = "https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=800&q=80";

export default function PostureCompare() {
  const { lang } = useLang();
  const [sliderX, setSliderX] = useState(50);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef(null);

  const getPercent = useCallback((clientX) => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    return (x / rect.width) * 100;
  }, []);

  const onMouseMove = useCallback((e) => {
    if (!dragging) return;
    setSliderX(getPercent(e.clientX));
  }, [dragging, getPercent]);

  const onTouchMove = useCallback((e) => {
    setSliderX(getPercent(e.touches[0].clientX));
  }, [getPercent]);

  return (
    <section className="py-20 lg:py-28 bg-[#1A1A2E]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="inline-block text-xs font-bold tracking-wider text-[#FF6B4A] uppercase mb-3">
            Before & After
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {lang === "ko" ? "PostureLab이 만드는 차이" : "See the difference PostureLab makes"}
          </h2>
          <p className="mt-3 text-gray-400 max-w-xl mx-auto">
            {lang === "ko"
              ? "슬라이더를 드래그해 교정 전·후 자세를 비교하세요."
              : "Drag the slider to compare posture before and after guided correction."}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div
            ref={containerRef}
            className="relative w-full rounded-2xl overflow-hidden select-none cursor-col-resize"
            style={{ aspectRatio: "16/9" }}
            onMouseMove={onMouseMove}
            onMouseUp={() => setDragging(false)}
            onMouseLeave={() => setDragging(false)}
            onTouchMove={onTouchMove}
          >
            {/* After (base layer) */}
            <img
              src={AFTER_IMAGE}
              alt="After"
              className="absolute inset-0 w-full h-full object-cover"
              draggable={false}
            />
            <div className="absolute inset-0 bg-emerald-500/10" />
            <div className="absolute top-4 right-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full z-10">
              AFTER
            </div>

            {/* Before (clipped layer) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - sliderX}% 0 0)` }}
            >
              <img
                src={BEFORE_IMAGE}
                alt="Before"
                className="absolute inset-0 w-full h-full object-cover"
                draggable={false}
              />
              <div className="absolute inset-0 bg-orange-500/10" />
            </div>
            <div
              className="absolute top-4 left-4 bg-[#FF6B4A] text-white text-xs font-bold px-3 py-1 rounded-full z-10"
              style={{ opacity: sliderX > 12 ? 1 : 0 }}
            >
              BEFORE
            </div>

            {/* Divider line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white z-20"
              style={{ left: `${sliderX}%` }}
            />

            {/* Drag handle */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-30 cursor-col-resize"
              style={{ left: `${sliderX}%` }}
              onMouseDown={() => setDragging(true)}
              onTouchStart={() => {}}
            >
              <div className="w-10 h-10 rounded-full bg-white shadow-xl flex items-center justify-center border-2 border-gray-100">
                <svg className="w-5 h-5 text-[#1A1A2E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 18l-6-6 6-6M15 6l6 6-6 6" />
                </svg>
              </div>
            </div>

            {/* Gradient overlay bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/60 to-transparent z-10 pointer-events-none" />

            {/* Labels */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-between px-5 z-20 pointer-events-none">
              <p className="text-white/80 text-xs font-medium">굽은 어깨 · 전방 머리 자세</p>
              <p className="text-white/80 text-xs font-medium">중립 척추 · 균형 잡힌 골반</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            {[
              { label: lang === "ko" ? "척추 개선" : "Spine Improvement", value: "+34%", color: "text-emerald-400" },
              { label: lang === "ko" ? "어깨 균형" : "Shoulder Balance", value: "+28%", color: "text-emerald-400" },
              { label: lang === "ko" ? "달성 기간" : "Sessions to Achieve", value: lang === "ko" ? "6주" : "6 weeks", color: "text-[#FF6B4A]" },
            ].map((s) => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}