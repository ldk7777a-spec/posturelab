import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useLang, T } from "@/lib/LanguageContext";

export default function FinalCTA() {
  const { lang } = useLang();
  const c = T.finalCTA[lang];

  return (
    <section className="py-20 lg:py-28 bg-[#1A1A2E] relative overflow-hidden">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-[3.5rem] font-extrabold text-white leading-tight tracking-tight">
            {c.title}
          </h2>
          <p className="mt-4 text-lg text-gray-400 max-w-xl mx-auto">{c.desc}</p>
          <div className="flex flex-wrap justify-center gap-4 mt-10">
            <Button className="bg-[#FF6B4A] hover:bg-[#e55a3a] text-white font-semibold px-8 h-13 rounded-xl text-base shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all">
              {c.start}
            </Button>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 font-semibold px-6 h-13 rounded-xl text-base group">
              {c.demo}
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}