import React, { useEffect, useState } from "react";
import { frameAngles } from "@/lib/biomechanics";
import { detectFootPlant, detectLoad, detectFirstMove } from "@/lib/obpDetect";

const LEVELS = ["고교", "대학", "독립리그"];

const PITCH = {
  foot: { 고교: { avg: 29.8, sd: 5.9 }, 대학: { avg: 29.7, sd: 6.7 }, 독립리그: { avg: 26.9, sd: 6.9 } },
  max: { 고교: { avg: 33.2, sd: 7.7 }, 대학: { avg: 32.1, sd: 6.4 }, 독립리그: { avg: 29.4, sd: 5.5 } },
};

const SWING = {
  load: { 고교: { avg: 6.1, sd: 4.6 }, 대학: { avg: 5.0, sd: 4.0 }, 독립리그: { avg: 4.4, sd: 2.5 } },
  firstmove: { 고교: { avg: 11.0, sd: 7.6 }, 대학: { avg: 7.2, sd: 5.5 }, 독립리그: { avg: 4.2, sd: 2.3 } },
  footplant: { 고교: { avg: 22.0, sd: 7.4 }, 대학: { avg: 17.5, sd: 7.4 }, 독립리그: { avg: 19.4, sd: 3.7 } },
};

const SWING_TABS = [
  { key: "load", label: "로드", recLabel: "로드 자세" },
  { key: "firstmove", label: "첫 움직임", recLabel: "첫 움직임" },
  { key: "footplant", label: "발 착지", recLabel: "발 착지" },
  { key: "contact", label: "컨택" },
];

const LATERAL_HINT = "이 추천은 옆에서 촬영한 영상에서 더 정확합니다. 정면 촬영 영상은 직접 확인해서 조정해주세요.";

const LIGHT = {
  green: { dot: "bg-emerald-500", border: "border-emerald-200", text: "text-emerald-700", label: "평균 범위 내" },
  yellow: { dot: "bg-amber-500", border: "border-amber-200", text: "text-amber-700", label: "평균 범위 벗어남" },
  red: { dot: "bg-rose-500", border: "border-rose-200", text: "text-rose-700", label: "유의하게 벗어남" },
};

const SOURCE = "출처: Driveline Baseball OpenBiomechanics Project (교육 목적 사용)";

function ratingFor(value, ref) {
  if (value == null || !ref) return null;
  const d = Math.abs(value - ref.avg);
  if (d <= ref.sd) return "green";
  if (d <= ref.sd * 2) return "yellow";
  return "red";
}

function LevelSelect({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-600 font-semibold focus:outline-none focus:border-[#FF6B4A]"
    >
      {LEVELS.map((lv) => (
        <option key={lv} value={lv}>{lv}</option>
      ))}
    </select>
  );
}

function LightBadge({ rating }) {
  if (!rating) return null;
  const r = LIGHT[rating];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-white border ${r.border} ${r.text}`}>
      <span className={`w-2 h-2 rounded-full ${r.dot}`} />
      {r.label}
    </span>
  );
}

function DesignateCard({ title, subtitle, refMap, level, setLevel, designated, onDesignate, currentIdx, recommend, onSeek, hint }) {
  const ref = refMap[level];
  const hasVal = designated && designated.value != null;
  const rating = hasVal ? ratingFor(designated.value, ref) : null;
  const r = rating ? LIGHT[rating] : null;
  return (
    <div className={`bg-white rounded-lg border-2 p-4 ${r ? r.border : "border-gray-200"}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-sm font-bold text-[#1A1A2E] leading-tight">
          {title}
          {subtitle && <span className="block text-[10px] font-medium text-gray-400 mt-0.5">{subtitle}</span>}
        </p>
        <LevelSelect value={level} onChange={setLevel} />
      </div>

      {recommend && recommend.idx != null && (
        <div className="mb-3 rounded-lg bg-orange-50 border border-orange-100 p-2.5">
          <p className="text-xs text-[#FF6B4A] font-semibold mb-2">이 프레임이 {recommend.label}인 것 같아요 (#{recommend.idx + 1}번)</p>
          <div className="flex gap-2">
            <button
              onClick={() => onSeek(recommend.idx)}
              className="text-xs font-semibold text-[#FF6B4A] border border-orange-200 rounded-lg px-3 py-1.5 bg-white hover:bg-orange-50 transition-colors"
            >
              프레임 이동
            </button>
            <button
              onClick={() => onDesignate(currentIdx)}
              className="text-xs font-semibold text-white bg-[#FF6B4A] rounded-lg px-3 py-1.5 hover:bg-[#e55a3a] transition-colors"
            >
              이 프레임으로 지정
            </button>
          </div>
        </div>
      )}
      {hint && <p className="text-[10px] text-gray-400 mb-3 leading-relaxed">{hint}</p>}

      {hasVal ? (
        <div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold text-[#1A1A2E]">{Math.round(designated.value * 10) / 10}°</p>
              <p className="text-[11px] text-gray-400 mt-1">지정 프레임 #{designated.idx + 1} · {level} 평균 {ref.avg}° ±{ref.sd}</p>
            </div>
            <LightBadge rating={rating} />
          </div>
          <button
            onClick={() => onDesignate(currentIdx)}
            className="mt-3 text-xs font-semibold text-[#FF6B4A] border border-orange-200 rounded-lg px-3 py-1.5 hover:bg-orange-50 transition-colors"
          >
            현재 프레임(#{currentIdx + 1})으로 다시 지정
          </button>
        </div>
      ) : (
        <div className="py-2">
          <p className="text-sm text-gray-400 mb-3">
            {designated ? "이 프레임에서 자세를 인식하지 못했습니다." : "프레임을 지정해주세요"}
          </p>
          <button
            onClick={() => onDesignate(currentIdx)}
            className={`text-xs font-semibold rounded-lg px-3 py-2 transition-colors ${designated ? "text-[#FF6B4A] border border-orange-200 hover:bg-orange-50" : "text-white bg-[#FF6B4A] hover:bg-[#e55a3a]"}`}
          >
            현재 프레임(#{currentIdx + 1}){designated ? "으로 다시 지정" : "로 지정"}
          </button>
        </div>
      )}
    </div>
  );
}

function MaxCard({ title, value, refMap, level, setLevel }) {
  const ref = refMap[level];
  const rating = ratingFor(value, ref);
  const r = rating ? LIGHT[rating] : null;
  return (
    <div className={`bg-white rounded-lg border-2 p-4 ${r ? r.border : "border-gray-200"}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-sm font-bold text-[#1A1A2E] leading-tight">{title}</p>
        <LevelSelect value={level} onChange={setLevel} />
      </div>
      {value == null ? (
        <p className="text-sm text-gray-400">데이터가 없습니다.</p>
      ) : (
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold text-[#1A1A2E]">{Math.round(value * 10) / 10}°</p>
            <p className="text-[11px] text-gray-400 mt-1">전체 프레임 최대값(자동) · {level} 평균 {ref.avg}° ±{ref.sd}</p>
          </div>
          <LightBadge rating={rating} />
        </div>
      )}
    </div>
  );
}

function ContactCard({ contactFrame, currentIdx, onSetContact, onSeek, frames }) {
  const set = contactFrame != null && contactFrame >= 0 && contactFrame < frames.length;
  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-sm font-bold text-[#1A1A2E] leading-tight">
          컨택
          <span className="block text-[10px] font-medium text-gray-400 mt-0.5">배트-공 접촉 시점</span>
        </p>
      </div>
      <p className="text-[10px] text-gray-400 mb-3 leading-relaxed">배트-공 접촉은 자동 감지가 불가해 현재 프레임을 직접 지정합니다.</p>
      {set ? (
        <div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold text-[#1A1A2E]">#{contactFrame + 1}</p>
              <p className="text-[11px] text-gray-400 mt-1">지정 프레임 #{contactFrame + 1} / {frames.length}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={() => onSeek(contactFrame)}
              className="text-xs font-semibold text-[#FF6B4A] border border-orange-200 rounded-lg px-3 py-1.5 bg-white hover:bg-orange-50 transition-colors"
            >
              프레임 이동
            </button>
            <button
              onClick={() => onSetContact(currentIdx)}
              className="text-xs font-semibold text-white bg-[#FF6B4A] rounded-lg px-3 py-1.5 hover:bg-[#e55a3a] transition-colors"
            >
              현재 프레임(#{currentIdx + 1})으로 다시 지정
            </button>
          </div>
        </div>
      ) : (
        <div className="py-2">
          <p className="text-sm text-gray-400 mb-3">프레임을 지정해주세요</p>
          <button
            onClick={() => onSetContact(currentIdx)}
            className="text-xs font-semibold text-white bg-[#FF6B4A] rounded-lg px-3 py-2 hover:bg-[#e55a3a] transition-colors"
          >
            현재 프레임(#{currentIdx + 1})로 지정
          </button>
        </div>
      )}
    </div>
  );
}

export default function ObpComparison({ mode, frames, currentIdx, sepMax, onSeek, contactFrame, onSetContact }) {
  const [levels, setLevels] = useState({ foot: "고교", max: "고교", load: "고교", firstmove: "고교", footplant: "고교" });
  const [designated, setDesignated] = useState({ foot: null, load: null, firstmove: null, footplant: null });
  const [tab, setTab] = useState("load");
  const [recommended, setRecommended] = useState({ foot: null, load: null, firstmove: null, footplant: null });

  const getSepAt = (i) => {
    const lm = frames[i]?.landmarks;
    if (!lm) return null;
    return Math.abs(frameAngles(lm).separationAngle);
  };
  const designate = (key, idx) =>
    setDesignated((p) => ({ ...p, [key]: { idx, value: getSepAt(idx) } }));
  const setLevel = (key) => (lv) => setLevels((p) => ({ ...p, [key]: lv }));

  // compute auto-recommendations + pre-designate on first mount
  useEffect(() => {
    const footRec = detectFootPlant(frames);
    const loadRec = detectLoad(frames);
    const firstmoveRec = detectFirstMove(frames);
    setRecommended({ foot: footRec, load: loadRec, firstmove: firstmoveRec, footplant: footRec });
    setDesignated({
      foot: footRec != null ? { idx: footRec, value: getSepAt(footRec) } : null,
      load: loadRec != null ? { idx: loadRec, value: getSepAt(loadRec) } : null,
      firstmove: firstmoveRec != null ? { idx: firstmoveRec, value: getSepAt(firstmoveRec) } : null,
      footplant: footRec != null ? { idx: footRec, value: getSepAt(footRec) } : null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recommendFor = (key, label) => {
    const idx = recommended[key];
    return idx != null ? { idx, label } : null;
  };

  const activeTab = SWING_TABS.find((t) => t.key === tab);
  const showLateralHint = tab === "load" || tab === "firstmove";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-bold text-[#1A1A2E]">OBP 참고 비교</p>
        <span className="text-[10px] font-semibold text-gray-400">{mode === "pitch" ? "투구" : "스윙"}</span>
      </div>
      <p className="text-[11px] text-gray-400 mb-4">레벨별 평균±표준편차 범위 기준 신호등. 자동 추천 프레임이 지정되어 있으며, 슬라이더로 직접 바꿀 수 있습니다.</p>

      {mode === "pitch" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DesignateCard
            title="견갑-골반 분리각"
            subtitle="발 착지 시점"
            refMap={PITCH.foot}
            level={levels.foot}
            setLevel={setLevel("foot")}
            designated={designated.foot}
            onDesignate={(idx) => designate("foot", idx)}
            currentIdx={currentIdx}
            recommend={recommendFor("foot", "발 착지")}
            onSeek={onSeek}
          />
          <MaxCard
            title="견갑-골반 분리각 (최대값)"
            value={sepMax}
            refMap={PITCH.max}
            level={levels.max}
            setLevel={setLevel("max")}
          />
        </div>
      ) : (
        <div>
          <div className="inline-flex bg-gray-100 rounded-lg p-1 mb-3">
            {SWING_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${tab === t.key ? "bg-white text-[#1A1A2E] shadow-sm" : "text-gray-500 hover:text-[#1A1A2E]"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {tab === "contact" ? (
            <ContactCard
              contactFrame={contactFrame}
              currentIdx={currentIdx}
              onSetContact={onSetContact}
              onSeek={onSeek}
              frames={frames}
            />
          ) : (
            <DesignateCard
              title="몸통-골반 분리각"
              subtitle={activeTab.label}
              refMap={SWING[tab]}
              level={levels[tab]}
              setLevel={setLevel(tab)}
              designated={designated[tab]}
              onDesignate={(idx) => designate(tab, idx)}
              currentIdx={currentIdx}
              recommend={recommendFor(tab, activeTab.recLabel)}
              onSeek={onSeek}
              hint={showLateralHint ? LATERAL_HINT : ""}
            />
          )}
        </div>
      )}

      <p className="text-[10px] text-gray-400 mt-4">{SOURCE}</p>
    </div>
  );
}