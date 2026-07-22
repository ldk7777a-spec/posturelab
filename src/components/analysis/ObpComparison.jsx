import React, { useState } from "react";
import { frameAngles } from "@/lib/biomechanics";

const LEVELS = ["고교", "대학", "독립리그", "마이너"];

const PITCH = {
  foot: { 고교: { avg: 29.8, sd: 5.9 }, 대학: { avg: 29.7, sd: 6.7 }, 독립리그: { avg: 26.9, sd: 6.9 }, 마이너: { avg: 36.7, sd: 4.6 } },
  max: { 고교: { avg: 33.2, sd: 7.7 }, 대학: { avg: 32.1, sd: 6.4 }, 독립리그: { avg: 29.4, sd: 5.5 }, 마이너: { avg: 38.9, sd: 4.5 } },
};

const SWING = {
  load: { 고교: { avg: 7.3, sd: 5.7 }, 대학: { avg: 5.4, sd: 4.8 }, 독립리그: { avg: 2.9, sd: 4.6 }, 마이너: { avg: 4.3, sd: 3.1 } },
  stride: { 고교: { avg: 11.4, sd: 5.9 }, 대학: { avg: 7.4, sd: 6.9 }, 독립리그: { avg: 7.9, sd: 7.2 }, 마이너: { avg: 4.5, sd: 5.6 } },
  footplant: { 고교: { avg: 10.8, sd: 7.9 }, 대학: { avg: 5.6, sd: 7.1 }, 독립리그: { avg: 1.9, sd: 4.4 }, 마이너: { avg: 6.5, sd: 6.1 } },
};

const SWING_TABS = [
  { key: "load", label: "로드" },
  { key: "stride", label: "스트라이드" },
  { key: "footplant", label: "풋무브먼트" },
];

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

function DesignateCard({ title, subtitle, refMap, level, setLevel, designated, onDesignate, currentIdx }) {
  const ref = refMap[level];
  const hasVal = designated && designated.value != null;
  const rating = hasVal ? ratingFor(designated.value, ref) : null;
  const r = rating ? LIGHT[rating] : null;
  return (
    <div className={`bg-white rounded-lg border-2 p-4 ${r ? r.border : "border-gray-200"}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-sm font-bold text-[#1A1A2E] leading-tight">
          {title}
          {subtitle && <span className="block text-[10px] font-medium text-gray-400">{subtitle}</span>}
        </p>
        <LevelSelect value={level} onChange={setLevel} />
      </div>
      {hasVal ? (
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold text-[#1A1A2E]">{Math.round(designated.value * 10) / 10}°</p>
            <p className="text-[11px] text-gray-400 mt-1">지정 프레임 #{designated.idx + 1} · {level} 평균 {ref.avg}° ±{ref.sd}</p>
          </div>
          <LightBadge rating={rating} />
        </div>
      ) : (
        <div className="py-2">
          <p className="text-sm text-gray-400 mb-3">
            {designated ? "이 프레임에서 자세를 인식하지 못했습니다." : "프레임을 지정해주세요"}
          </p>
          <button
            onClick={onDesignate}
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

export default function ObpComparison({ mode, frames, currentIdx, sepMax }) {
  const [levels, setLevels] = useState({ foot: "고교", max: "고교", load: "고교", stride: "고교", footplant: "고교" });
  const [designated, setDesignated] = useState({ foot: null, load: null, stride: null, footplant: null });
  const [tab, setTab] = useState("load");

  const getSepAt = (i) => {
    const lm = frames[i]?.landmarks;
    if (!lm) return null;
    return Math.abs(frameAngles(lm).separationAngle);
  };
  const designate = (key) =>
    setDesignated((p) => ({ ...p, [key]: { idx: currentIdx, value: getSepAt(currentIdx) } }));
  const setLevel = (key) => (lv) => setLevels((p) => ({ ...p, [key]: lv }));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-bold text-[#1A1A2E]">OBP 참고 비교</p>
        <span className="text-[10px] font-semibold text-gray-400">{mode === "pitch" ? "투구" : "스윙"}</span>
      </div>
      <p className="text-[11px] text-gray-400 mb-4">레벨별 평균±표준편차 범위 기준 신호등. 슬라이더로 해당 시점 프레임을 찾고 지정하세요.</p>

      {mode === "pitch" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DesignateCard
            title="견갑-골반 분리각"
            subtitle="발 착지 시점"
            refMap={PITCH.foot}
            level={levels.foot}
            setLevel={setLevel("foot")}
            designated={designated.foot}
            onDesignate={() => designate("foot")}
            currentIdx={currentIdx}
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
          <DesignateCard
            title="몸통-골반 분리각"
            subtitle={SWING_TABS.find((t) => t.key === tab)?.label}
            refMap={SWING[tab]}
            level={levels[tab]}
            setLevel={setLevel(tab)}
            designated={designated[tab]}
            onDesignate={() => designate(tab)}
            currentIdx={currentIdx}
          />
        </div>
      )}

      <p className="text-[10px] text-gray-400 mt-4">{SOURCE}</p>
    </div>
  );
}