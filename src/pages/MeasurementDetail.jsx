import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Ruler, Zap, BarChart2 } from "lucide-react";
import { motion } from "framer-motion";
import ImageUploader from "@/components/analysis/ImageUploader";

const MEASUREMENT_IMAGES = {
  spine: "https://media.base44.com/images/public/6a3b77c47222088c76d9d104/ac0856d24_generated_869a708b.png",
  shoulders: "https://media.base44.com/images/public/6a3b77c47222088c76d9d104/86888d215_generated_b0004176.png",
  pelvis: "https://media.base44.com/images/public/6a3b77c47222088c76d9d104/37108d317_generated_698312f1.png",
  knees: "https://media.base44.com/images/public/6a3b77c47222088c76d9d104/4b35bb0bd_generated_4d2bfc6b.png",
  feet: "https://media.base44.com/images/public/6a3b77c47222088c76d9d104/050afc8ae_generated_a589db8a.png",
  dynamic: "https://media.base44.com/images/public/6a3b77c47222088c76d9d104/1a81d1eaf_generated_93288630.png",
  breathing: "https://media.base44.com/images/public/6a3b77c47222088c76d9d104/ec56514ef_generated_896cd33c.png",
};

const DATA = {
  spine: {
    label: "Spine",
    sublabel: "Alignment & Curvature",
    color: "#FF6B4A",
    description:
      "PostureLab analyzes the full length of the spinal column in each frame, detecting abnormal curvature, lateral deviation (scoliosis risk), and segmental alignment from cervical to lumbar.",
    metrics: ["Cervical lordosis angle", "Thoracic kyphosis angle", "Lumbar lordosis angle", "Lateral deviation (Cobb angle)"],
    method: "Using pose landmark detection, AI maps 12 vertebral reference points per frame. Angles between segments are computed using vector math and compared to normative ranges.",
    benefits: [
      "Identify asymmetric loading patterns",
      "Track postural improvements over sessions",
      "Early detection of compensation patterns",
    ],
  },
  shoulders: {
    label: "Shoulders",
    sublabel: "Mobility & Symmetry",
    color: "#3B82F6",
    description:
      "Shoulder mobility, elevation asymmetry, and scapular winging are assessed across every movement phase. Both static posture and dynamic range of motion are tracked.",
    metrics: ["Shoulder elevation angle", "Left/right symmetry index", "Scapular upward rotation", "Glenohumeral rhythm ratio"],
    method: "Bilateral landmark tracking computes elevation angles and symmetry scores frame-by-frame. Scapular movement is inferred from thoracic and clavicle vectors.",
    benefits: [
      "Detect bilateral imbalances early",
      "Optimize overhead movement mechanics",
      "Reduce rotator cuff injury risk",
    ],
  },
  pelvis: {
    label: "Pelvis",
    sublabel: "Tilt & Rotation",
    color: "#8B5CF6",
    description:
      "Anterior/posterior pelvic tilt and lateral rotation are measured across all planes. Pelvic position is a critical driver of lower back health and athletic power output.",
    metrics: ["Anterior pelvic tilt angle", "Posterior pelvic tilt angle", "Lateral pelvic drop", "Pelvic rotation (transverse)"],
    method: "Hip and ASIS landmark vectors define the pelvic plane. Tilt and rotation are computed in 3D using projected angles against global reference axes.",
    benefits: [
      "Correct hip flexor/glute imbalances",
      "Improve squat and deadlift mechanics",
      "Reduce lower back pain risk",
    ],
  },
  knees: {
    label: "Knees",
    sublabel: "Tracking & Valgus",
    color: "#10B981",
    description:
      "Knee valgus (caving inward), varus (bowing outward), and flexion angles during dynamic movements are tracked. Critical for ACL injury prevention and jump-landing mechanics.",
    metrics: ["Knee valgus/varus angle", "Knee flexion angle at ground contact", "Tibial rotation", "Q-angle estimation"],
    method: "Thigh and tibia landmark vectors compute the knee angle in the frontal and sagittal planes. Valgus is flagged when the knee medial deviation exceeds 5° from neutral.",
    benefits: [
      "Screen for ACL injury risk",
      "Improve landing mechanics",
      "Optimize squat depth and alignment",
    ],
  },
  feet: {
    label: "Feet",
    sublabel: "Strike & Pronation",
    color: "#F59E0B",
    description:
      "Foot strike pattern, pronation/supination, and toe-out angle during gait and athletic tasks are quantified. Foot mechanics influence forces up the entire kinetic chain.",
    metrics: ["Foot strike index (heel/mid/fore)", "Pronation angle", "Toe-out angle", "Stance width"],
    method: "Ankle and toe landmarks define foot orientation relative to the ground plane. Strike pattern is classified from ankle velocity profiles at initial contact.",
    benefits: [
      "Optimize running economy",
      "Reduce overuse injury from faulty mechanics",
      "Inform footwear and orthotic decisions",
    ],
  },
  dynamic: {
    label: "Dynamic Analysis",
    sublabel: "Full Kinetic Chain",
    color: "#EF4444",
    description:
      "Full-body kinematic analysis during multi-joint movements — squats, jumps, throws, and sport-specific patterns. Evaluates timing, sequencing, and coordination across the entire kinetic chain.",
    metrics: ["Joint angle sequencing", "Ground contact time", "Peak power phase detection", "Kinetic chain efficiency score"],
    method: "Multi-joint tracking computes angular velocities and acceleration profiles simultaneously. A proprietary kinetic chain score weights joint sequencing against sport-specific biomechanical norms.",
    benefits: [
      "Identify energy leaks in movement patterns",
      "Enhance athletic power transfer",
      "Individualize training based on movement signature",
    ],
  },
  breathing: {
    label: "Breathing",
    sublabel: "Respiratory Mechanics",
    color: "#06B6D4",
    description:
      "Respiratory mechanics — thoracic expansion, rib cage movement, and breathing strategy (chest vs. diaphragmatic) — are analyzed from video. Poor breathing mechanics affect core stability and performance.",
    metrics: ["Thoracic expansion ratio", "Breathing strategy classification", "Respiratory rate", "Accessory muscle activation index"],
    method: "Rib cage and shoulder landmark displacement is tracked across the breathing cycle. Expansion ratio and movement pattern classify the dominant breathing strategy via a trained classifier.",
    benefits: [
      "Improve core stability under load",
      "Enhance endurance and recovery",
      "Reduce cervical tension from accessory breathing",
    ],
  },
};

export default function MeasurementDetail() {
  const { key } = useParams();
  const navigate = useNavigate();
  const data = DATA[key];

  const handleAnalysisComplete = (result, imageUrl) => {
    navigate("/report", { state: { result, imageUrl } });
  };

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Measurement not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero image banner */}
      <div className="relative h-64 sm:h-80 lg:h-96 overflow-hidden">
        <img
          src={MEASUREMENT_IMAGES[key]}
          alt={data.label}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />

        {/* Back button */}
        <div className="absolute top-6 left-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-6 left-6 right-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span
              className="inline-block text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-3"
              style={{ background: `${data.color}30`, color: data.color, border: `1px solid ${data.color}50` }}
            >
              PostureLab Analysis
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{data.label}</h1>
            <p className="text-white/70 mt-1 text-base">{data.sublabel}</p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-lg text-gray-600 leading-relaxed"
        >
          {data.description}
        </motion.p>

        <div className="grid sm:grid-cols-2 gap-6">
          {/* Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="bg-gray-50 rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${data.color}15` }}>
                <Ruler className="w-4 h-4" style={{ color: data.color }} />
              </div>
              <h2 className="text-base font-bold text-[#1A1A2E]">Measured Parameters</h2>
            </div>
            <ul className="space-y-2.5">
              {data.metrics.map((m) => (
                <li key={m} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: data.color }} />
                  {m}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Measurement method */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="bg-[#1A1A2E] rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-base font-bold text-white">How It's Measured</h2>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">{data.method}</p>
          </motion.div>
        </div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${data.color}15` }}>
              <BarChart2 className="w-4 h-4" style={{ color: data.color }} />
            </div>
            <h2 className="text-base font-bold text-[#1A1A2E]">Clinical & Performance Benefits</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {data.benefits.map((b) => (
              <div key={b} className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: data.color }} />
                <p className="text-sm text-gray-600 leading-snug">{b}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* AI Analysis Uploader */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <ImageUploader onAnalysisComplete={handleAnalysisComplete} accentColor={data.color} />
        </motion.div>
      </div>
    </div>
  );
}