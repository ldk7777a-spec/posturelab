import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useLang, T } from "@/lib/LanguageContext";

const PRICES = [
  { monthly: 0, yearly: 0, popular: false },
  { monthly: 29, yearly: 24, popular: true },
  { monthly: 79, yearly: 66, popular: false },
];

export default function PricingSection() {
  const { lang } = useLang();
  const [yearly, setYearly] = useState(false);
  const p = T.pricing[lang];
  const plans = p.plans.map((pl, i) => ({ ...pl, ...PRICES[i], price: yearly ? PRICES[i].yearly : PRICES[i].monthly }));

  return (
    <section id="pricing" className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="inline-block text-xs font-bold tracking-wider text-[#FF6B4A] uppercase mb-3">
            {p.eyebrow}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1A1A2E] tracking-tight">
            {p.title}
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-xl mx-auto">{p.desc}</p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <span className={`text-sm font-medium ${!yearly ? "text-[#1A1A2E]" : "text-gray-400"}`}>{p.monthly}</span>
            <button
              onClick={() => setYearly(!yearly)}
              className={`relative w-12 h-7 rounded-full transition-colors duration-300 ${
                yearly ? "bg-[#FF6B4A]" : "bg-gray-200"
              }`}
            >
              <span
                className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                  yearly ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${yearly ? "text-[#1A1A2E]" : "text-gray-400"}`}>
              {p.yearly}
              <span className="ml-1.5 text-xs font-semibold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">
                {p.save}
              </span>
            </span>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto items-start">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative rounded-2xl border p-6 lg:p-8 ${
                plan.popular
                  ? "border-[#FF6B4A]/30 bg-white shadow-xl shadow-orange-100/30 scale-[1.02] lg:scale-105 z-10"
                  : "border-gray-200 bg-white"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 bg-[#FF6B4A] text-white text-xs font-bold px-3 py-1 rounded-full">
                    <Zap className="w-3 h-3" /> {p.popular}
                  </span>
                </div>
              )}

              <h3 className="text-lg font-bold text-[#1A1A2E]">{plan.name}</h3>
              <p className="text-sm text-gray-400 mt-1">{plan.desc}</p>

              <div className="mt-5 mb-6">
                <span className="text-4xl font-extrabold text-[#1A1A2E]">${plan.price}</span>
                <span className="text-gray-400 text-sm ml-1">{p.perMonth}</span>
              </div>

              <Button
                className={`w-full h-11 font-semibold rounded-xl ${
                  plan.popular
                    ? "bg-[#FF6B4A] hover:bg-[#e55a3a] text-white shadow-sm shadow-orange-200/40"
                    : "bg-gray-100 hover:bg-gray-200 text-[#1A1A2E]"
                }`}
              >
                {plan.cta}
              </Button>

              <ul className="mt-6 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-[#FF6B4A] mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}