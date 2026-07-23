import React from "react";
import { useLang, T } from "@/lib/LanguageContext";
import { judgeMovement, LEVELS } from "@/lib/judgment";
import { detectFootPlant, detectLoad, detectFirstMove } from "@/lib/obpDetect";

const LEVEL_STYLE = {
  [LEVELS.NORMAL]:  { dot: "bg-emerald-500", ring: "border-emerald-200 bg-emerald-50", labelKey: "levelNormal" },
  [LEVELS.CAUTION]: { dot: "bg-amber-500",   ring: "border-amber-200 bg-amber-50",     labelKey: "levelCaution" },
  [LEVELS.RISK]:    { dot: "bg-rose-500",    ring: "border-rose-200 bg-rose-50",        labelKey: "levelRisk" },
  [LEVELS.UNKNOWN]: { dot: "bg-slate-300",   ring: "border-slate-200 bg-slate-50",     labelKey: "levelUnknown" },
};

// Step-1 movement summary: event frame gallery (load / first move / foot plant auto
// + contact manual) and traffic-light metrics driven by the independent judgment module.
// Reuses existing detection (obpDetect) and metrics (biomechanics frameAngles).
export default function MovementSummary({ frames, setIdx, contactFrame, onSetContact }) {
  const { lang } = useLang();
  if (!frames || !frames.length) return null;

  const events = [
    { key: "load",      label: T.eventLoad[lang],      frame: detectLoad(frames) },
    { key: "firstmove", label: T.eventFirstMove[lang],  frame: detectFirstMove(frames) },
    { key: "footplant", label: T.eventFootPlant[lang],  frame: detectFootPlant(frames) },
    { key: "contact",   label: T.eventContact[lang],    frame: contactFrame != null ? contactFrame : null, manual: true },
  ];

  const results = judgeMovement(frames);

  const metricLabels = {
    separationAngle: T.metricSeparation[lang],
    trunkLean: T.metricTrunkLean[lang],
    shoulderTilt: T.metricShoulderTilt[lang],
    pelvicTilt: T.metricPelvicTilt[lang],
  };

  return (
    <div className="space-y-5">
      {/* Event frame gallery */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <p className="text-sm font-bold text-[#1A1A2E] mb-3">{T.eventSectionTitle[lang]}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {events.map((ev) => {
            const has = ev.frame != null && ev.frame >= 0 && ev.frame < frames.length;
            return (
              <button
                key={ev.key}
                onClick={() => has && setIdx(ev.frame)}
                disabled={!has}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  has
                    ? "border-gray-200 hover:border-[#FF6B4A] hover:bg-orange-50 cursor-pointer"
                    : "border-dashed border-gray-200 opacity-60 cursor-default"
                }`}
              >
                <p className="text-xs font-bold text-[#1A1A2E]">{ev.label}</p>
                <p className="text-[11px] text-gray-400 mt-0.5 tabular-nums">
                  {has ? `#${ev.frame + 1} / ${frames.length}` : (ev.manual ? T.notSet[lang] : T.notDetected[lang])}
                </p>
              </button>
            );
          })}
        </div>
        <button
          onClick={onSetContact}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#FF6B4A] border border-[#FF6B4A]/30 bg-orange-50 rounded-lg px-3 py-1.5 hover:bg-orange-100 transition-colors"
        >
          ⬤ {T.setContact[lang]}
        </button>
        <p className="text-[10px] text-gray-400 mt-1.5 leading-relaxed">{T.eventContactHint[lang]}</p>
      </div>

      {/* Traffic-light metrics */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <p className="text-sm font-bold text-[#1A1A2E] mb-3">{T.trafficTitle[lang]}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {results.map((r) => {
            const s = LEVEL_STYLE[r.level] || LEVEL_STYLE[LEVELS.UNKNOWN];
            return (
              <div key={r.key} className={`rounded-xl border p-3 flex items-center gap-3 ${s.ring}`}>
                <span className={`w-2.5 h-2.5 rounded-full ${s.dot} flex-shrink-0`} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-gray-700 truncate">{metricLabels[r.key]}</p>
                  <p className="text-[11px] text-gray-500">{T[s.labelKey][lang]}</p>
                </div>
                <span className="text-sm font-bold text-[#1A1A2E] tabular-nums">
                  {r.value != null ? `${r.value}°` : "—"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}