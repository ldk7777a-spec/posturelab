import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, TrendingUp, AlertTriangle, CheckCircle2, BarChart2 } from "lucide-react";
import { motion } from "framer-motion";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from "recharts";

const radarData = [
  { subject: "Spine", score: 72 },
  { subject: "Shoulders", score: 58 },
  { subject: "Pelvis", score: 80 },
  { subject: "Knees", score: 88 },
  { subject: "Feet", score: 65 },
  { subject: "Breathing", score: 74 },
];

const barData = [
  { name: "Cervical", angle: 38, norm: 35 },
  { name: "Thoracic", angle: 52, norm: 45 },
  { name: "Lumbar", angle: 44, norm: 40 },
  { name: "Shoulder L", angle: 12, norm: 5 },
  { name: "Shoulder R", angle: 4, norm: 5 },
];

const suggestions = [
  {
    icon: AlertTriangle,
    color: "#F59E0B",
    bg: "bg-amber-50",
    title: "Thoracic Kyphosis — Elevated",
    description: "Your upper back angle is 7° above the normal range. Focus on thoracic mobility drills and chest-opening stretches 3× per week.",
  },
  {
    icon: AlertTriangle,
    color: "#EF4444",
    bg: "bg-red-50",
    title: "Left Shoulder Elevation — Significant",
    description: "12° asymmetry detected. Recommend unilateral scapular stabilization work and evaluation for pec minor tightness on the left side.",
  },
  {
    icon: CheckCircle2,
    color: "#10B981",
    bg: "bg-emerald-50",
    title: "Pelvic Tilt — Within Normal Range",
    description: "Neutral pelvic alignment maintained. Continue current hip flexor maintenance routine.",
  },
  {
    icon: TrendingUp,
    color: "#3B82F6",
    bg: "bg-blue-50",
    title: "Knee Tracking — Good",
    description: "Knee valgus is minimal. Maintain glute activation work before lower body training sessions.",
  },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 shadow-lg rounded-xl px-4 py-3 text-xs">
      <p className="font-semibold text-[#1A1A2E] mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value}°
        </p>
      ))}
    </div>
  );
};

export default function AnalysisReport() {
  const overallScore = Math.round(radarData.reduce((s, d) => s + d.score, 0) / radarData.length);

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-[#1A1A2E] text-sm font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <span className="text-sm font-bold text-[#1A1A2E]">Posture Analysis Report</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Jordan T. · Jun 24, 2026</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Overall score */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1A1A2E] rounded-2xl p-8 flex flex-col sm:flex-row items-center gap-8"
        >
          <div className="relative w-28 h-28 flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
              <circle
                cx="50" cy="50" r="42" fill="none"
                stroke="#FF6B4A" strokeWidth="10" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 42}`}
                strokeDashoffset={`${2 * Math.PI * 42 * (1 - overallScore / 100)}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-white">{overallScore}</span>
              <span className="text-xs text-white/50">/100</span>
            </div>
          </div>
          <div>
            <p className="text-white/50 text-sm mb-1">Overall Posture Score</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">Good — Room to Improve</h1>
            <p className="text-white/60 text-sm max-w-md">2 areas need attention. Consistent corrective work for 6 weeks can bring your score above 85.</p>
          </div>
        </motion.div>

        {/* Charts */}
        <div className="grid sm:grid-cols-2 gap-6">
          {/* Radar */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="w-4 h-4 text-[#FF6B4A]" />
              <h2 className="text-sm font-bold text-[#1A1A2E]">Movement Balance Overview</h2>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#f0f0f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#6B7280" }} />
                <Radar name="Score" dataKey="score" stroke="#FF6B4A" fill="#FF6B4A" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Bar chart */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl p-6 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="w-4 h-4 text-[#3B82F6]" />
              <h2 className="text-sm font-bold text-[#1A1A2E]">Joint Angles vs. Normal Range</h2>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} unit="°" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="angle" name="Your angle" radius={[4, 4, 0, 0]}>
                  {barData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={entry.angle > entry.norm + 5 ? "#FF6B4A" : entry.angle < entry.norm - 5 ? "#3B82F6" : "#10B981"}
                    />
                  ))}
                </Bar>
                <Bar dataKey="norm" name="Normal range" fill="#E5E7EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Improvement suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-bold text-[#1A1A2E] mb-4">Improvement Recommendations</h2>
          <div className="space-y-3">
            {suggestions.map((s, i) => (
              <div key={i} className={`${s.bg} rounded-xl p-5 flex items-start gap-4`}>
                <div className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                  <s.icon className="w-5 h-5" style={{ color: s.color }} />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1A1A2E]">{s.title}</p>
                  <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-[#1A1A2E] rounded-2xl p-8 text-center"
        >
          <h3 className="text-xl font-bold text-white mb-2">Want expert guidance on these findings?</h3>
          <p className="text-white/50 text-sm mb-6">Book a 1-on-1 session with a certified PostureLab trainer.</p>
          <Link
            to="/booking"
            className="inline-flex items-center gap-2 bg-[#FF6B4A] hover:bg-[#e55a3a] text-white font-semibold px-7 py-3 rounded-xl text-sm transition-all shadow-lg shadow-orange-900/30"
          >
            Book a Consultation
          </Link>
        </motion.div>
      </div>
    </div>
  );
}