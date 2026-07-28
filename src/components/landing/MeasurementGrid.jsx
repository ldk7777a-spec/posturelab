import React from "react";
import { motion } from "framer-motion";
import { Camera, Video, Lock } from "lucide-react";
import { useLang, T } from "@/lib/LanguageContext";
import { useToast } from "@/components/ui/use-toast";

// Unified, premium editorial visuals for every measurement card.
const IMG = {
  spine:     "https://media.base44.com/images/public/6a3b77c47222088c76d9d104/4af95f2a9_generated_image.png",
  shoulders: "https://media.base44.com/images/public/6a3b77c47222088c76d9d104/7245cb5f4_generated_image.png",
  pelvis:    "https://media.base44.com/images/public/6a3b77c47222088c76d9d104/b208d82c9_generated_image.png",
  knees:     "https://media.base44.com/images/public/6a3b77c47222088c76d9d104/33780df84_generated_image.png",
  feet:      "https://media.base44.com/images/public/6a3b77c47222088c76d9d104/be4a27a7e_generated_image.png",
  baseball:  "https://media.base44.com/images/public/6a3b77c47222088c76d9d104/03aecaedc_generated_image.png",
  golf:      "https://media.base44.com/images/public/6a3b77c47222088c76d9d104/df973d4dd_generated_image.png",
  weight:    "https://media.base44.com/images/public/6a3b77c47222088c76d9d104/4b2376659_generated_image.png",
  running:   "https://media.base44.com/images/public/6a3b77c47222088c76d9d104/1580d3787_generated_image.png",
  tennis:    "https://media.base44.com/images/public/6a3b77c47222088c76d9d104/c62431d8c_generated_image.png",
  badminton: "https://media.base44.com/images/public/6a3b77c47222088c76d9d104/78d23223b_generated_image.png",
  soccer:    "https://media.base44.com/images/public/6a3b77c47222088c76d9d104/225371040_generated_image.png",
};

const pad = (n) => String(n).padStart(2, "0");

function Card({ c, num, delay, lang, onSoon }) {
  const soon = !!c.comingSoon;
  const img = IMG[c.key];

  const inner = (
    <>
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={img}
          alt={c.label}
          loading="lazy"
          className={`w-full h-full object-cover transition-all duration-500 ${
            soon ? "opacity-50 grayscale blur-[1px]" : "group-hover:scale-[1.04]"
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
        <span className="absolute top-3 left-3 w-8 h-8 rounded-lg bg-[#1A1A2E]/90 text-white text-xs font-bold flex items-center justify-center backdrop-blur-sm">
          {num}
        </span>
        {soon && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] font-bold text-white bg-white/15 border border-white/30 backdrop-blur-sm px-2 py-1 rounded-full">
            <Lock className="w-2.5 h-2.5" />
            {T.comingSoonBadge[lang]}
          </span>
        )}
      </div>
      <div className="p-5">
        <h3 className="text-lg font-bold text-[#1A1A2E]">{c.label}</h3>
        <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{c.desc}</p>
      </div>
    </>
  );

  const baseCls = `relative group rounded-2xl overflow-hidden border bg-white transition-all ${
    soon
      ? "border-gray-200 cursor-pointer opacity-80 hover:opacity-100 hover:border-[#FF6B4A]/40"
      : "border-gray-100 hover:border-[#FF6B4A]/40 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
  }`;

  if (soon) {
    return (
      <motion.button
        type="button"
        onClick={onSoon}
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 0.8, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.4, delay }}
        className={`text-left w-full ${baseCls}`}
      >
        {inner}
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay }}
      className={baseCls}
    >
      {inner}
    </motion.div>
  );
}

function Group({ icon, iconBg, title, sub, cards, startNum, lang, onSoon }) {
  return (
    <div>
      <div className="flex items-center gap-2.5 mb-4">
        <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-bold text-[#1A1A2E]">{title}</h3>
          <p className="text-xs text-gray-400">{sub}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
        {cards.map((c, i) => (
          <Card
            key={c.key}
            c={c}
            num={pad(startNum + i)}
            delay={(i % 3) * 0.06}
            lang={lang}
            onSoon={onSoon}
          />
        ))}
      </div>
    </div>
  );
}

export default function MeasurementGrid() {
  const { lang } = useLang();
  const { toast } = useToast();
  const basic = T.measureCardsBasic[lang];
  const sport = T.measureCardsSport[lang];

  const onSoon = () => toast({ title: T.comingSoonMsg[lang] });

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
          <Group
            icon={<Camera className="w-4 h-4 text-[#FF6B4A]" />}
            iconBg="bg-orange-50"
            title={T.measureGroupBasic[lang]}
            sub={T.measureGroupBasicSub[lang]}
            cards={basic}
            startNum={1}
            lang={lang}
            onSoon={onSoon}
          />

          {/* Group 2 — 종목별 동작 분석 (동영상 업로드) */}
          <Group
            icon={<Video className="w-4 h-4 text-purple-500" />}
            iconBg="bg-purple-50"
            title={T.measureGroupSport[lang]}
            sub={T.measureGroupSportSub[lang]}
            cards={sport}
            startNum={basic.length + 1}
            lang={lang}
            onSoon={onSoon}
          />
        </div>
      </div>
    </section>
  );
}