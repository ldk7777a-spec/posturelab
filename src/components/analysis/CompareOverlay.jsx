import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, AlignCenter, Link2, Unlink } from "lucide-react";
import { frameAngles } from "@/lib/biomechanics";
import { ANGLE_METRICS } from "@/lib/metricRanges";
import { renderOverlaySkeleton } from "@/lib/skeletonOverlay";
import { detectFootPlant, detectLoad, detectFirstMove } from "@/lib/obpDetect";

const CANVAS_SIZE = 600;
const COLOR_A = "#2C7BE5"; // 영상1 - 파랑
const COLOR_B = "#FF6B4A"; // 영상2 - 주황

const ALIGN_OPTIONS = [
  { key: "footplant", label: "발 착지" },
  { key: "load", label: "로드" },
  { key: "firstmove", label: "첫 움직임" },
];

function detectEvent(frames, event) {
  if (event === "footplant") return detectFootPlant(frames);
  if (event === "load") return detectLoad(frames);
  if (event === "firstmove") return detectFirstMove(frames);
  return null;
}

const clampIdx = (v, total) => (total <= 0 ? 0 : Math.max(0, Math.min(total - 1, v)));

function Scrubber({ label, sub, idx, setIdx, total }) {
  const safe = clampIdx(idx, total);
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3">
      <div className="flex items-center justify-between mb-1.5">
        <div className="min-w-0">
          <p className="text-xs font-bold text-[#1A1A2E] truncate">{label}</p>
          {sub && <p className="text-[10px] text-gray-400 truncate">{sub}</p>}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-400 tabular-nums">#{safe + 1}/{total}</span>
          <button
            onClick={() => setIdx(Math.max(0, safe - 1))}
            disabled={safe === 0}
            className="w-6 h-6 rounded-md border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-colors"
            aria-label="이전"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
          <button
            onClick={() => setIdx(Math.min(total - 1, safe + 1))}
            disabled={safe >= total - 1}
            className="w-6 h-6 rounded-md border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-colors"
            aria-label="다음"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={Math.max(0, total - 1)}
        value={safe}
        onChange={(e) => setIdx(Number(e.target.value))}
        className="w-full accent-[#FF6B4A] cursor-pointer"
      />
    </div>
  );
}

// Per-video key-event markers with manual override.
function EventMarkers({ side, events, setEvents, current, total }) {
  const cur = clampIdx(current, total);
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">핵심 시점 (수동 지정 가능)</p>
        <span className="text-[10px] text-gray-400 tabular-nums">현재 #{cur + 1}</span>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {ALIGN_OPTIONS.map((o) => {
          const val = events[side]?.[o.key];
          return (
            <div key={o.key} className="flex flex-col items-center gap-1">
              <button
                onClick={() => setEvents((prev) => ({
                  ...prev,
                  [side]: { ...prev[side], [o.key]: cur },
                }))}
                className="w-full text-[11px] font-semibold border border-gray-200 rounded-lg px-1 py-1.5 text-gray-600 hover:border-[#FF6B4A] hover:text-[#FF6B4A] transition-colors"
                title="현재 프레임을 이 시점으로 지정"
              >
                {o.label} 지정
              </button>
              <span className={`text-[10px] tabular-nums ${val != null ? "text-[#FF6B4A] font-bold" : "text-gray-300"}`}>
                {val != null ? `#${val + 1}` : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CompareOverlay({ a, b }) {
  const canvasRef = useRef(null);
  const framesA = a?.frames || [];
  const framesB = b?.frames || [];
  const [idxA, setIdxA] = useState(0);
  const [idxB, setIdxB] = useState(0);
  const [alignEvent, setAlignEvent] = useState("footplant");
  // user-overridable key-event frames per video
  const [events, setEvents] = useState({
    a: { footplant: null, load: null, firstmove: null },
    b: { footplant: null, load: null, firstmove: null },
  });
  const [offset, setOffset] = useState(0); // idxB - idxA fixed at align time, used when linked
  const [linked, setLinked] = useState(false);

  // seed with auto-detected events on mount / when frames change
  useEffect(() => {
    if (!framesA.length || !framesB.length) return;
    setEvents({
      a: { footplant: detectFootPlant(framesA), load: detectLoad(framesA), firstmove: detectFirstMove(framesA) },
      b: { footplant: detectFootPlant(framesB), load: detectLoad(framesB), firstmove: detectFirstMove(framesB) },
    });
  }, [framesA, framesB]);

  const safeA = clampIdx(idxA, framesA.length);
  const safeB = clampIdx(idxB, framesB.length);

  const getEventFrame = (side, key) => {
    const v = events[side]?.[key];
    return v != null ? v : detectEvent(side === "a" ? framesA : framesB, key);
  };

  // draw overlay
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#0a0a14";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    const la = framesA[safeA]?.landmarks;
    const lb = framesB[safeB]?.landmarks;
    if (la) renderOverlaySkeleton(ctx, la, CANVAS_SIZE, COLOR_A);
    if (lb) renderOverlaySkeleton(ctx, lb, CANVAS_SIZE, COLOR_B);
  }, [safeA, safeB, framesA, framesB]);

  const seekA = (i) => {
    setIdxA(clampIdx(i, framesA.length));
    if (linked) setIdxB(clampIdx(i + offset, framesB.length));
  };
  const seekB = (i) => {
    setIdxB(clampIdx(i, framesB.length));
    if (linked) setIdxA(clampIdx(i - offset, framesA.length));
  };

  const handleAlign = () => {
    const ia = getEventFrame("a", alignEvent);
    const ib = getEventFrame("b", alignEvent);
    if (ia != null) setIdxA(clampIdx(ia, framesA.length));
    if (ib != null) setIdxB(clampIdx(ib, framesB.length));
    if (ia != null && ib != null) setOffset(ib - ia);
  };

  const angA = frameAngles(framesA[safeA]?.landmarks);
  const angB = frameAngles(framesB[safeB]?.landmarks);
  const diffs = ANGLE_METRICS.map((j) => ({
    label: j.label,
    d: angA?.[j.key] != null && angB?.[j.key] != null
      ? Math.round(Math.abs(angA[j.key] - angB[j.key]))
      : null,
  })).filter((x) => x.d != null).sort((p, q) => q.d - p.d);

  if (!framesA.length || !framesB.length) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-400">
        두 영상 모두 프레임 데이터가 있어야 겹쳐 보기가 가능합니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-[11px] text-gray-400 leading-relaxed">
        카메라 위치와 각도가 같을 때 비교가 정확합니다. 자동 감지 시점이 어긋나면 아래 “지정” 버튼으로 각 시점을 직접 맞춘 뒤 정렬·연동해 보세요.
      </p>

      {/* overlay canvas with legend */}
      <div className="relative bg-white rounded-2xl border border-gray-100 p-3">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="w-full max-w-[560px] mx-auto block rounded-xl"
          style={{ aspectRatio: "1 / 1" }}
        />
        <div className="absolute top-5 left-5 flex flex-col gap-1.5">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-white/90 bg-black/40 px-2 py-1 rounded-full">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLOR_A }} />
            영상1 {a?.userName ? `· ${a.userName}` : ""}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-white/90 bg-black/40 px-2 py-1 rounded-full">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLOR_B }} />
            영상2 {b?.userName ? `· ${b.userName}` : ""}
          </span>
        </div>
      </div>

      {/* align control + link toggle */}
      <div className="flex items-center gap-2 flex-wrap">
        <label className="text-xs text-gray-500">시점 정렬:</label>
        <select
          value={alignEvent}
          onChange={(e) => setAlignEvent(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 font-semibold focus:outline-none focus:border-[#FF6B4A]"
        >
          {ALIGN_OPTIONS.map((o) => (
            <option key={o.key} value={o.key}>{o.label}</option>
          ))}
        </select>
        <button
          onClick={handleAlign}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#1A1A2E] rounded-lg px-3 py-1.5 hover:bg-[#2a2a45] transition-colors"
        >
          <AlignCenter className="w-3.5 h-3.5" />
          {ALIGN_OPTIONS.find((o) => o.key === alignEvent)?.label} 시점으로 정렬
        </button>
        <button
          onClick={() => setLinked((l) => !l)}
          className={`inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-1.5 border transition-colors ${
            linked
              ? "bg-[#FF6B4A] text-white border-[#FF6B4A]"
              : "text-gray-600 border-gray-200 hover:border-[#FF6B4A] hover:text-[#FF6B4A]"
          }`}
          title="정렬 후 두 슬라이더를 같은 위상으로 연동"
        >
          {linked ? <Unlink className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
          {linked ? "연동 끄기" : "프레임 연동"}
        </button>
      </div>

      {/* per-video scrubbers + event markers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Scrubber label="영상1" sub={a?.category} idx={idxA} setIdx={seekA} total={framesA.length} />
          <EventMarkers side="a" events={events} setEvents={setEvents} current={safeA} total={framesA.length} />
        </div>
        <div className="space-y-2">
          <Scrubber label="영상2" sub={b?.category} idx={idxB} setIdx={seekB} total={framesB.length} />
          <EventMarkers side="b" events={events} setEvents={setEvents} current={safeB} total={framesB.length} />
        </div>
      </div>

      {/* joint angle difference */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <p className="text-sm font-bold text-[#1A1A2E] mb-3">관절 각도 차이 · 영상1 vs 영상2</p>
        {diffs.length === 0 ? (
          <p className="text-sm text-gray-400">비교할 관절 각도 데이터가 없습니다.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {diffs.map((x) => (
              <div
                key={x.label}
                className={`rounded-lg border-2 px-3 py-2 ${
                  x.d >= 15 ? "border-rose-200 bg-rose-50"
                  : x.d >= 8 ? "border-amber-200 bg-amber-50"
                  : "border-emerald-200 bg-emerald-50"
                }`}
              >
                <p className="text-[11px] text-gray-500 truncate">{x.label}</p>
                <p className="text-sm font-bold text-[#1A1A2E]">{x.d}° 차이</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}