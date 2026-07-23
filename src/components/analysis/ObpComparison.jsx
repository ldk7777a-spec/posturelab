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

function ThumbRow({ frames, center, selected, onSelect, radius = 3 }) {
  if (center == null) {
    return (
      <p className="text-xs text-gray-400 py-2 leading-relaxed">
        지정한 구간 안에서 자동 감지하지 못했습니다. 슬라이더로 직접 이동한 뒤 아래 “현재 프레임으로 지정” 버튼을 눌러주세요.
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

function EventCard({ title, subtitle, refMap, level, setLevel, frames, center, selected, onSelectThumb, onSeek, currentIdx, onDesignateCurrent, hint, ready }) {
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

      {!ready ? (
        <p className="text-xs text-[#FF6B4A] font-medium py-2 leading-relaxed">
          먼저 위에서 스윙 시작 / 컨택 프레임을 지정해주세요.
        </p>
      ) : (
        <>
          <ThumbRow frames={frames} center={center} selected={selected} onSelect={onSelectThumb} />
          {hint && <p className="text-[10px] text-gray-400 mt-2 mb-2 leading-relaxed">{hint}</p>}
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
                  onClick={onDesignateCurrent}
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
        </>
      )}
    </div>
  );
}

function MaxCard({ title, value, refMap, level, setLevel, ready }) {
  const ref = refMap[level];
  const rating = ratingFor(value, ref);
  const r = rating ? LIGHT[rating] : null;
  return (
    <div className={`bg-white rounded-lg border-2 p-4 ${r ? r.border : "border-gray-200"}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-sm font-bold text-[#1A1A2E] leading-tight">{title}</p>
        <LevelSelect value={level} onChange={setLevel} />
      </div>
      {!ready ? (
        <p className="text-xs text-gray-400 py-2">스윙 시작 / 컨택 지정 후 자동 계산됩니다.</p>
      ) : value == null ? (
        <p className="text-sm text-gray-400">구간 내 데이터가 없습니다.</p>
      ) : (
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold text-[#1A1A2E]">{Math.round(value * 10) / 10}°</p>
            <p className="text-[11px] text-gray-400 mt-1">지정 구간 내 최대값(자동) · {level} 평균 {ref.avg}° ±{ref.sd}</p>
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

function WindowControl({ frames, swingStart, setSwingStart, contactFrame, onSetContact, currentIdx, onSeek }) {
  const ready = swingStart != null && contactFrame != null && contactFrame > swingStart;
  return (
    <div className={`rounded-lg p-3 mb-3 border ${ready ? "bg-gray-50 border-gray-200" : "bg-orange-50 border-orange-100"}`}>
      <p className="text-xs font-bold text-[#FF6B4A] mb-2">1단계 · 스윙 시작 / 컨택 프레임 지정</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-700">스윙 시작</span>
            <span className="text-xs font-bold text-[#1A1A2E]">{swingStart != null ? `#${swingStart + 1}` : "미지정"}</span>
          </div>
          <input
            type="range"
            min={0}
            max={Math.max(0, frames.length - 1)}
            value={swingStart != null ? swingStart : 0}
            onChange={(e) => setSwingStart(Number(e.target.value))}
            className="w-full accent-[#FF6B4A] cursor-pointer"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => swingStart != null && onSeek(swingStart)}
              disabled={swingStart == null}
              className="text-[11px] font-semibold text-[#FF6B4A] border border-orange-200 rounded-lg px-2.5 py-1 bg-white hover:bg-orange-50 disabled:opacity-40 transition-colors"
            >
              이동
            </button>
            <button
              onClick={() => setSwingStart(currentIdx)}
              className="text-[11px] font-semibold text-white bg-[#FF6B4A] rounded-lg px-2.5 py-1 hover:bg-[#e55a3a] transition-colors"
            >
              현재 프레임(#{currentIdx + 1}) 지정
            </button>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-700">컨택</span>
            <span className="text-xs font-bold text-[#1A1A2E]">{contactFrame != null ? `#${contactFrame + 1}` : "미지정"}</span>
          </div>
          <p className="text-[10px] text-gray-400 mb-2 leading-relaxed">배트-공 접촉 시점을 정하면 분석 구간이 확정됩니다.</p>
          <div className="flex gap-2">
            <button
              onClick={() => contactFrame != null && onSeek(contactFrame)}
              disabled={contactFrame == null}
              className="text-[11px] font-semibold text-[#FF6B4A] border border-orange-200 rounded-lg px-2.5 py-1 bg-white hover:bg-orange-50 disabled:opacity-40 transition-colors"
            >
              이동
            </button>
            <button
              onClick={() => onSetContact(currentIdx)}
              className="text-[11px] font-semibold text-white bg-[#FF6B4A] rounded-lg px-2.5 py-1 hover:bg-[#e55a3a] transition-colors"
            >
              현재 프레임(#{currentIdx + 1}) 지정
            </button>
          </div>
        </div>
      </div>
      {!ready && (
        <p className="text-[11px] text-gray-500 mt-2">두 프레임을 모두 지정하면 자동 감지가 시작됩니다 (시작이 컨택보다 앞이어야 합니다).</p>
      )}
    </div>
  );
}

export default function ObpComparison({ mode, frames, currentIdx, onSeek, contactFrame, onSetContact }) {
  const [swingStart, setSwingStart] = useState(null);
  const [levels, setLevels] = useState({ foot: "고교", max: "고교", load: "고교", firstmove: "고교", footplant: "고교" });
  const [selected, setSelected] = useState({ load: null, firstmove: null, footplant: null });
  const [tab, setTab] = useState("load");

  const ready = swingStart != null && contactFrame != null && contactFrame > swingStart;

  const detected = useMemo(() => {
    if (!ready) return { load: null, firstmove: null, footplant: null };
    const s = swingStart, e = contactFrame;
    const load = detectLoad(frames, s, e);
    const firstmove = detectFirstMove(frames, s, e, load);
    const footplant = detectFootPlant(frames, s, e);
    return { load, firstmove, footplant };
  }, [frames, swingStart, contactFrame, ready]);

  useEffect(() => {
    setSelected({ load: detected.load, firstmove: detected.firstmove, footplant: detected.footplant });
  }, [detected]);

  const setLevel = (key) => (lv) => setLevels((p) => ({ ...p, [key]: lv }));

  const sepMax = useMemo(() => {
    if (!ready) return null;
    let mx = -Infinity, has = false;
    for (let i = swingStart; i <= contactFrame; i++) {
      const lm = frames[i] && frames[i].landmarks;
      if (!lm) continue;
      const v = Math.abs(frameAngles(lm).separationAngle);
      if (v != null) { has = true; if (v > mx) mx = v; }
    }
    return has ? mx : null;
  }, [frames, swingStart, contactFrame, ready]);

  const activeTab = SWING_TABS.find((t) => t.key === tab);
  const showLateralHint = tab === "load" || tab === "firstmove";

  const onSelectThumb = (key) => (idx) =>
    setSelected((p) => ({ ...p, [key]: idx }));
  const onDesignateCurrent = (key) => () =>
    setSelected((p) => ({ ...p, [key]: currentIdx }));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-bold text-[#1A1A2E]">OBP 참고 비교</p>
        <span className="text-[10px] font-semibold text-gray-400">{mode === "pitch" ? "투구" : "스윙"}</span>
      </div>
      <p className="text-[11px] text-gray-400 mb-4">
        먼저 스윙 시작/컨택을 지정해 구간을 좁히면, 그 안에서 로드·첫움직임·발착지를 자동 감지합니다. 감지된 프레임 기준 ±3프레임 썸네일 중 정확한 것을 클릭해 최종 선택하세요.
      </p>

      <WindowControl
        frames={frames}
        swingStart={swingStart}
        setSwingStart={setSwingStart}
        contactFrame={contactFrame}
        onSetContact={onSetContact}
        currentIdx={currentIdx}
        onSeek={onSeek}
      />

      {mode === "pitch" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <EventCard
            title="견갑-골반 분리각"
            subtitle="발 착지 시점"
            refMap={PITCH.foot}
            level={levels.foot}
            setLevel={setLevel("foot")}
            frames={frames}
            center={detected.footplant}
            selected={selected.footplant}
            onSelectThumb={onSelectThumb("footplant")}
            onSeek={onSeek}
            currentIdx={currentIdx}
            onDesignateCurrent={onDesignateCurrent("footplant")}
            ready={ready}
          />
          <MaxCard
            title="견갑-골반 분리각 (최대값)"
            value={sepMax}
            refMap={PITCH.max}
            level={levels.max}
            setLevel={setLevel("max")}
            ready={ready}
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
            <EventCard
              title="몸통-골반 분리각"
              subtitle={activeTab.label}
              refMap={SWING[tab]}
              level={levels[tab]}
              setLevel={setLevel(tab)}
              frames={frames}
              center={detected[tab]}
              selected={selected[tab]}
              onSelectThumb={onSelectThumb(tab)}
              onSeek={onSeek}
              currentIdx={currentIdx}
              onDesignateCurrent={onDesignateCurrent(tab)}
              hint={showLateralHint ? LATERAL_HINT : ""}
              ready={ready}
            />
          )}
        </div>
      )}

      <p className="text-[10px] text-gray-400 mt-4">{SOURCE}</p>
    </div>
  );
}