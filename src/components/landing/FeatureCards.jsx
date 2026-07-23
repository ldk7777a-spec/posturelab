import React from "react";
import { Camera, Cpu, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useLang, T } from "@/lib/LanguageContext";

export default function FeatureCards() {
  const { lang } = useLang();
  const features = [
    { icon: Camera, title: T.featCapture[lang], description: T.featCaptureDesc[lang] },
    { icon: Cpu, title: T.featAI[lang], description: T.featAIDesc[lang] },
    { icon: TrendingUp, title: T.featTrack[lang], description: T.featTrackDesc[lang] },
  ];

  return (
    <section className="py-20 lg:py-28 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-6 lg:gap-10">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group"
            >
              <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mb-5 group-hover:bg-[#FF6B4A] transition-colors duration-300">
                <feature.icon className="w-6 h-6 text-[#FF6B4A] group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-bold text-[#1A1A2E] mb-2">{feature.title}</h3>
              <p className="text-base text-gray-500 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}