import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, ShieldCheck, Users, ArrowRight, Play, CheckCircle2, ScanLine } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "@/components/landing/Logo";

const ANALYSIS_STEPS = ["Detecting joints...", "Tracking motion...", "Calculating angles...", "Generating insights..."];

function AnalysisVideo({ heroImage }) {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [scanY, setScanY] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsPlaying(true);
      setStep((s) => (s + 1) % ANALYSIS_STEPS.length);
      setScanY((y) => (y + 30) % 100);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-3 rounded-xl overflow-hidden relative cursor-pointer" onClick={() => setIsPlaying(!isPlaying)}>
      <div
        className="w-full h-40 bg-gray-800"
        style={{ backgroundImage: `url(${heroImage})`, backgroundSize: "cover", backgroundPosition: "center" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

      {/* Scan line animation */}
      <motion.div
        className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#FF6B4A] to-transparent opacity-80"
        animate={{ top: [`${scanY}%`, `${(scanY + 40) % 100}%`] }}
        transition={{ duration: 1.8, ease: "linear", repeat: Infinity }}
      />

      {/* Corner tracking dots */}
      {[
        { top: "25%", left: "30%" },
        { top: "55%", left: "48%" },
        { top: "40%", left: "65%" },
        { top: "70%", left: "38%" },
      ].map((pos, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full border-2 border-[#FF6B4A]"
          style={{ top: pos.top, left: pos.left }}
          animate={{ scale: [1, 1.6, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.2, delay: i * 0.3, repeat: Infinity }}
        />
      ))}

      {/* Top badges */}
      <div className="absolute top-2 left-2 flex gap-1">
        <span className="bg-white/90 text-[10px] font-semibold text-[#1A1A2E] px-2 py-0.5 rounded-full">Capture</span>
        <motion.span
          className="bg-[#FF6B4A] text-[10px] font-semibold text-white px-2 py-0.5 rounded-full flex items-center gap-1"
          animate={{ opacity: [1, 0.6, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
          Analyzing...
        </motion.span>
      </div>

      {/* Analysis step text */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
        <AnimatePresence mode="wait">
          <motion.span
            key={step}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="text-[10px] text-white/90 font-medium bg-black/40 backdrop-blur-sm px-2 py-1 rounded-lg"
          >
            {ANALYSIS_STEPS[step]}
          </motion.span>
        </AnimatePresence>
        <div className="bg-white/90 rounded-full p-1.5">
          <Play className="w-4 h-4 text-[#1A1A2E] fill-current" />
        </div>
      </div>
    </div>
  );
}

const trustBadges = [
  { icon: CreditCard, text: "No credit card required" },
  { icon: ShieldCheck, text: "Secure & private" },
  { icon: Users, text: "Used by 2,000+ coaches" },
];

export default function HeroSection({ heroImage }) {
  return (
    <section className="relative pt-24 lg:pt-32 pb-16 lg:pb-24 overflow-hidden">
      {/* Radar backdrop */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] lg:w-[800px] lg:h-[800px]">
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-orange-200/40 animate-spin-slow" />
        <div className="absolute inset-8 rounded-full border border-dashed border-orange-200/25 animate-spin-slow" style={{ animationDirection: "reverse", animationDuration: "80s" }} />
        <div className="absolute inset-16 rounded-full border border-dashed border-orange-100/20 animate-spin-slow" style={{ animationDuration: "100s" }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-[#FF6B4A] animate-pulse" />
              <span className="text-xs font-bold tracking-wider text-[#FF6B4A] uppercase">
                AI-Powered Motion Analysis
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[5rem] font-extrabold text-[#1A1A2E] leading-[1.08] tracking-tight mb-6">
              See every rep.{" "}
              <br className="hidden sm:block" />
              Improve every{" "}
              <span className="relative">
                move.
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
                  <path d="M2 6C50 2 150 2 198 6" stroke="#FF6B4A" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
                </svg>
              </span>
            </h1>

            <p className="text-lg text-gray-500 leading-relaxed max-w-lg mb-8">
              PostureLab helps coaches and athletes capture, analyze, and improve movement with AI-powered insights you can trust.
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              <Link to="/analyze">
                <Button className="bg-[#FF6B4A] hover:bg-[#e55a3a] text-white font-semibold px-7 h-12 rounded-xl text-base shadow-lg shadow-orange-200/40 hover:shadow-orange-300/50 transition-all">
                  지금 분석하기
                </Button>
              </Link>
              <Button variant="ghost" className="text-[#1A1A2E] font-semibold px-6 h-12 rounded-xl text-base hover:bg-gray-50 group">
                Book a Demo
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {trustBadges.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-sm text-gray-400">
                  <Icon className="w-4 h-4 text-gray-300" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: Phone mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex justify-center lg:justify-end"
          >
            {/* Phone frame */}
            <div className="relative w-[300px] sm:w-[340px]">
              <div className="bg-[#1A1A2E] rounded-[2.5rem] p-3 shadow-2xl shadow-gray-300/40">
                <div className="bg-white rounded-[2rem] overflow-hidden">
                  {/* Phone status bar */}
                  <div className="flex items-center justify-between px-5 pt-4 pb-2">
                    <Logo className="h-7" />
                    <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="px-4 pb-5">
                    <h3 className="text-lg font-bold text-[#1A1A2E]">Back Squat</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Today, 9:41 AM • Athlete: Jordan T.</p>

                    {/* Video comparison area */}
                    <AnalysisVideo heroImage={heroImage} />

                    {/* Score */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-[#1A1A2E]">Overall Score</span>
                        <span className="text-sm font-bold text-[#FF6B4A]">82/100</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#FF6B4A] to-[#ff8a70] rounded-full" style={{ width: "82%" }} />
                      </div>
                    </div>

                    {/* Key Insights */}
                    <div className="mt-4">
                      <h4 className="text-xs font-semibold text-[#1A1A2E] mb-2">Key Insights</h4>
                      <div className="space-y-1.5">
                        {[
                          { label: "Knee Alignment", status: "Good" },
                          { label: "Hip Depth", status: "Excellent" },
                          { label: "Back Angle", status: "Monitor" },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center gap-2 text-xs">
                            <CheckCircle2 className={`w-3.5 h-3.5 ${item.status === "Monitor" ? "text-amber-400" : "text-emerald-400"}`} />
                            <span className="text-gray-600">{item.label}</span>
                            <span className={`ml-auto font-medium ${item.status === "Monitor" ? "text-amber-500" : "text-emerald-500"}`}>
                              {item.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating card: Score */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="absolute -right-4 sm:-right-12 top-16 bg-white rounded-xl shadow-xl shadow-gray-200/60 border border-gray-100 px-4 py-3 z-10"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#1A1A2E]">Form Score</p>
                    <p className="text-lg font-bold text-emerald-500 leading-none">A+</p>
                  </div>
                </div>
              </motion.div>

              {/* Floating card: AI Detection */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="absolute -left-4 sm:-left-10 bottom-28 bg-white rounded-xl shadow-xl shadow-gray-200/60 border border-gray-100 px-4 py-3 z-10"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                    <span className="text-[#FF6B4A] text-xs font-bold">AI</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#1A1A2E]">17 joints tracked</p>
                    <p className="text-[10px] text-gray-400">Real-time detection</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}