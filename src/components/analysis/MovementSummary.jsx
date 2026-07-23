import React from "react";
import { useLang, T } from "@/lib/LanguageContext";
import { detectFootPlant, detectLoad, detectFirstMove } from "@/lib/obpDetect";

// Step-1 movement summary: event frame gallery (load / first move / foot plant auto
// + contact manual). Reuses existing detection (obpDetect).
export default function MovementSummary({ frames, setIdx, contactFrame, onSetContact }) {
  const { lang } = useLang();
  if (!frames || !frames.length) return null;

  const events = [
    { key: "load",      label: T.eventLoad[lang],      frame: detectLoad(frames) },
    { key: "firstmove", label: T.eventFirstMove[lang],  frame: detectFirstMove(frames) },
    { key: "footplant", label: T.eventFootPlant[lang],  frame: detectFootPlant(frames) },
    { key: "contact",   label: T.eventContact[lang],    frame: contactFrame != null ? contactFrame : null, manual: true },
  ];

  return (
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
  );
}