import React, { useEffect, useMemo, useState } from "react";
import { frameAngles } from "@/lib/biomechanics";
import { detectLoad, detectFirstMove, detectFootPlant } from "@/lib/obpDetect";

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
  { key: "load", label: "로드", eventLabel: "로드 자세" },
  { key: "firstmove", label: "첫 움직임", eventLabel: "첫 움직임" },
  { key: "footplant", label: "발 착지", eventLabel: "발 착지" },
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

// Pitch mode card: 7 thumbnails (center ±3) for final selection
function ThumbRow({ frames, center, selected, onSelect, radius = 3 }) {
  if (center == null) {
    return (
      <p className="text-xs text-gray-400 py-2 leading-relaxed">
        자동 감지하지 못했습니다. 슬라이더로 직접 이동한 뒤 아래 “현재 프레임으로 지정” 버튼을 눌러주세요.
      </p>
    );
  }
  const idxs = [];
  for (let k = center - radius; k <= center + radius; k++) {
    if (k < 0 || k >= frames.length) continue;
    idxs.push(k);
  }
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {idxs.map((i) => {
        const isSel = selected === i;
        const isCenter = i === center;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            className={`relative shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
              isSel ? "border-[#FF6B4A] ring-2 ring-orange-200" : isCenter ? "border-gray-400" : "border-gray-200"
            }`}
            style={{ width: 60, height: 60 }}
            aria-label={`프레임 ${i + 1}`}
          >
            {frames[i] && frames[i].image ? (
              <img src={frames[i].image} alt={`#${i + 1}`} className="w-full h-full object-cover" />
            ) : (
              <span className="w-full h-full flex items-center justify-center text-[11px] font-semibold text-gray-500 bg-gray-50">
                #{i + 1}
              </span>
            )}
            <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] font-semibold py-0.5 text-center">
              {i + 1}
            </span>
            {isCenter && (
              <span className="absolute top-0.5 right-0.5 bg-gray-800/80 text-white text-[8px] px-1 rounded">기준</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function PitchEventCard({ title, subtitle, refMap, level, setLevel, frames, center, selected, onSelectThumb, onSeek, currentIdx }) {
  const ref = refMap[level];
  const val =
    selected != null && frames[selected] && frames[selected].landmarks
      ? Math.abs(frameAngles(frames[selected].landmarks).separationAngle)
      : null;
  const rating = val != null ? ratingFor(val, ref) : null;
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

      <ThumbRow frames={frames} center={center} selected={selected} onSelect={onSelectThumb} />

      {val != null ? (
        <div className="mt-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold text-[#1A1A2E]">{Math.round(val * 10) / 10}°</p>
              <p className="text-[11px] text-gray-400 mt-1">
                선택 프레임 #{selected + 1} · {level} 평균 {ref.avg}° ±{ref.sd}
              </p>
            </div>
            <LightBadge rating={rating} />
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={() => onSeek(selected)}
              className="text-xs font-semibold text-[#FF6B4A] border border-orange-200 rounded-lg px-3 py-1.5 bg-white hover:bg-orange-50 transition-colors"
            >
              선택 프레임으로 이동
            </button>
            <button
              onClick={() => onSelectThumb(currentIdx)}
              className="text-xs font-semibold text-white bg-[#FF6B4A] rounded-lg px-3 py-1.5 hover:bg-[#e55a3a] transition-colors"
            >
              현재 프레임(#{currentIdx + 1})으로 지정
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-400 mt-2">
          위 썸네일에서 프레임을 클릭하거나, 현재 프레임으로 직접 지정하세요.
        </p>
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
        <p className="text-sm text-gray-400">영상 내 데이터가 없습니다.</p>
      ) : (
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold text-[#1A1A2E]">{Math.round(value * 10) / 10}°</p>
            <p className="text-[11px] text-gray-400 mt-1">영상 전체 최대값(자동) · {level} 평균 {ref.avg}° ±{ref.sd}</p>
          </div>
          <LightBadge rating={rating} />
        </div>
      )}
    </div>
  );
}

// Swing mode card: auto recommendation + slider override + value
function RecommendCard({ title, eventLabel, refMap, level, setLevel, frames, detected, selected, onSelect, onSeek, currentIdx, hint }) {
  const n = frames.length;
  const ref = refMap[level];
  const cur = selected != null ? selected : detected;
  const valid = cur != null && cur >= 0 && cur < n;
  const val = valid && frames[cur] && frames[cur].landmarks
    ? Math.abs(frameAngles(frames[cur].landmarks).separationAngle)
    : null;
  const rating = val != null ? ratingFor(val, ref) : null;
  const r = rating ? LIGHT[rating] : null;
  return (
    <div className={`bg-white rounded-lg border-2 p-4 ${r ? r.border : "border-gray-200"}`}>
      {hint && <p className="text-[11px] text-gray-400 mb-3 leading-relaxed">{hint}</p>}
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-sm font-bold text-[#1A1A2E] leading-tight">{title}</p>
        <LevelSelect value={level} onChange={setLevel} />
      </div>

      {detected != null ? (
        <div className="flex items-center gap-2 mb-3 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
          <span className="text-xs text-[#1A1A2E] font-medium">이 프레임이 {eventLabel}인 것 같아요</span>
          <span className="text-xs font-bold text-[#FF6B4A]">#{detected + 1}번</span>
        </div>
      ) : (
        <p className="text-xs text-gray-400 mb-3 leading-relaxed">
          자동 감지하지 못했습니다. 아래 슬라이더로 직접 지정하세요.
        </p>
      )}

      <div className="mb-3">
        <input
          type="range"
          min={0}
          max={Math.max(0, n - 1)}
          value={valid ? cur : 0}
          onChange={(e) => onSelect(Number(e.target.value))}
          className="w-full accent-[#FF6B4A] cursor-pointer"
        />
        <p className="text-xs text-gray-500 mt-1">선택 프레임: #{valid ? cur + 1 : "—"} / {n}</p>
      </div>

      {val != null ? (
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold text-[#1A1A2E]">{Math.round(val * 10) / 10}°</p>
            <p className="text-[11px] text-gray-400 mt-1">
              {level} 평균 {ref.avg}° ±{ref.sd}
            </p>
          </div>
          <LightBadge rating={rating} />
        </div>
      ) : (
        <p className="text-xs text-gray-400">선택한 프레임에 분리각 데이터가 없습니다.</p>
      )}

      <div className="flex flex-wrap gap-2 mt-3">
        <button
          onClick={() => valid && onSeek(cur)}
          disabled={!valid}
          className="text-xs font-semibold text-[#FF6B4A] border border-orange-200 rounded-lg px-3 py-1.5 bg-white hover:bg-orange-50 disabled:opacity-40 transition-colors"
        >
          프레임 이동
        </button>
        {detected != null && (
          <button
            onClick={() => onSelect(detected)}
            className="text-xs font-semibold text-white bg-[#FF6B4A] rounded-lg px-3 py-1.5 hover:bg-[#e55a3a] transition-colors"
          >
            이 프레임으로 지정
          </button>
        )}
        <button
          onClick={() => onSelect(currentIdx)}
          className="text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 bg-white hover:bg-gray-50 transition-colors"
        >
          현재 프레임(#{currentIdx + 1})으로 지정
        </button>
      </div>
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
          <p className="text-sm text-gray-400 mb-3">현재 프레임을 컨택으로 지정해주세요.</p>
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

export default function ObpComparison({ mode, frames, currentIdx, onSeek, contactFrame, onSetContact }) {
  const [levels, setLevels] = useState({ foot: "고교", max: "고교", load: "고교", firstmove: "고교", footplant: "고교" });
  const [selected, setSelected] = useState({ foot: null, load: null, firstmove: null, footplant: null });
  const [tab, setTab] = useState("load");

  // Full-frame auto-detection (no window). Reset selections whenever
  // detection re-runs so the user starts from the recommended frame.
  const detected = useMemo(() => {
    const n = frames.length;
    if (!n || n < 5) return { load: null, firstmove: null, footplant: null };
    const load = detectLoad(frames, 0, n - 1);
    const firstmove = detectFirstMove(frames, 0, n - 1, load);
    const footplant = detectFootPlant(frames, 0, n - 1);
    return { load, firstmove, footplant };
  }, [frames]);

  useEffect(() => {
    setSelected({
      foot: detected.footplant,
      load: detected.load,
      firstmove: detected.firstmove,
      footplant: detected.footplant,
    });
  }, [detected]);

  // Pitch: max separation across all frames
  const sepMax = useMemo(() => {
    let mx = -Infinity, has = false;
    for (const f of frames) {
      if (!f || !f.landmarks) continue;
      const v = Math.abs(frameAngles(f.landmarks).separationAngle);
      if (v != null) { has = true; if (v > mx) mx = v; }
    }
    return has ? mx : null;
  }, [frames]);

  const setLevel = (key) => (lv) => setLevels((p) => ({ ...p, [key]: lv }));
  const onSelect = (key) => (idx) => setSelected((p) => ({ ...p, [key]: idx }));

  const activeTab = SWING_TABS.find((t) => t.key === tab);
  const showLateralHint = tab === "load" || tab === "firstmove";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-bold text-[#1A1A2E]">OBP 참고 비교</p>
        <span className="text-[10px] font-semibold text-gray-400">{mode === "pitch" ? "투구" : "스윙"}</span>
      </div>
      <p className="text-[11px] text-gray-400 mb-4">
        {mode === "pitch"
          ? "발착지 시점의 견갑-골반 분리각과 영상 내 최대 분리각을 추천합니다. 썸네일에서 최종 프레임을 선택하세요."
          : "스윙 영상에서 로드·첫움직임·발착지를 자동으로 감지해 추천합니다. 추천은 시작점일 뿐, 슬라이더로 직접 조정해 최종 확정하세요."}
      </p>

      {mode === "pitch" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <PitchEventCard
            title="견갑-골반 분리각"
            subtitle="발 착지 시점"
            refMap={PITCH.foot}
            level={levels.foot}
            setLevel={setLevel("foot")}
            frames={frames}
            center={detected.footplant}
            selected={selected.foot}
            onSelectThumb={onSelect("foot")}
            onSeek={onSeek}
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
          {tab === "contact" ? (
            <ContactCard
              contactFrame={contactFrame}
              currentIdx={currentIdx}
              onSetContact={onSetContact}
              onSeek={onSeek}
              frames={frames}
            />
          ) : (
            <RecommendCard
              title={activeTab.label}
              eventLabel={activeTab.eventLabel}
              refMap={SWING[tab]}
              level={levels[tab]}
              setLevel={setLevel(tab)}
              frames={frames}
              detected={detected[tab]}
              selected={selected[tab]}
              onSelect={onSelect(tab)}
              onSeek={onSeek}
              currentIdx={currentIdx}
              hint={showLateralHint ? LATERAL_HINT : ""}
            />
          )}
        </div>
      )}

      <p className="text-[10px] text-gray-400 mt-4">{SOURCE}</p>
    </div>
  );
}