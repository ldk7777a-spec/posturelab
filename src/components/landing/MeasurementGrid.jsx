import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const categories = [
  { key: "spine", label: "Spine", sublabel: "Alignment & Curvature" },
  { key: "shoulders", label: "Shoulders", sublabel: "Mobility & Symmetry" },
  { key: "pelvis", label: "Pelvis", sublabel: "Tilt & Rotation" },
  { key: "knees", label: "Knees", sublabel: "Tracking & Valgus" },
  { key: "feet", label: "Feet", sublabel: "Strike & Pronation" },
  { key: "dynamic", label: "Dynamic Analysis", sublabel: "Full Kinetic Chain" },
  { key: "breathing", label: "Breathing", sublabel: "Respiratory Mechanics" },
];

export default function MeasurementGrid({ images }) {
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
            Comprehensive Analysis
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1A1A2E] tracking-tight">
            Every joint. Every angle.
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            Seven measurement categories covering the full kinetic chain, from head to toe.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4 auto-rows-[180px] md:auto-rows-[220px]">
          {categories.map((cat, i) => {
            const isLarge = i === 0 || i === 5;
            return (
              <motion.div
                key={cat.key}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className={`relative group rounded-2xl overflow-hidden cursor-pointer ${
                  isLarge ? "col-span-2" : ""
                }`}
              >
                <Link to={`/measurement/${cat.key}`} className="absolute inset-0 z-10" />
                {images?.[cat.key] ? (
                  <img
                    src={images[cat.key]}
                    alt={cat.label}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute inset-0 bg-[#FF6B4A]/0 group-hover:bg-[#FF6B4A]/20 transition-colors duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-5">
                  <h3 className="text-white font-bold text-base lg:text-lg">{cat.label}</h3>
                  <p className="text-white/70 text-xs lg:text-sm mt-0.5">{cat.sublabel}</p>
                </div>
                <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 17L17 7M17 7H7M17 7V17" />
                  </svg>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}