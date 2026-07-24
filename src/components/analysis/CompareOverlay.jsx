import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Link2, Unlink, MapPin, TriangleAlert } from "lucide-react";
import { frameAngles } from "@/lib/biomechanics";
import { ANGLE_METRICS } from "@/lib/metricRanges";
import { renderOverlaySkeleton } from "@/lib/skeletonOverlay";

const CANVAS_SIZE = 600;
const COLOR_A = "#2C7BE5"; // 영상1 - 파랑
const COLOR_B = "#FF6B4A"; // 영상2 - 주황

const clamp = (v, total) => (total <= 0 ? 0 : Math.max(0, Math.min(total - 1, v)));

function Scrubber({ label, sub, idx, setIdx, total }) {
  const safe = clamp(idx, total);
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

// Per-video alignment-point button (manual only — no auto recommendation).
function AlignPointBtn({ frame, current, onSet }) {
  return (
    <button
      onClick={() => onSet(current)}
      className={`w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-2 border transition-colors ${
        frame != null
          ? "bg-[#FF6B4A]/10 text-[#FF6B4A] border-[#FF6B4A]/40"
          : "text-gray-600 border-gray-200 hover:border-[#FF6B4A] hover:text-[#FF6B4A]"
      }`}
    >
      <MapPin className="w-3.5 h-3.5" />
      {frame != null ? `정렬점 지정됨 · #${frame + 1}` : "이 프레임을 정렬점으로 지정"}
    </button>
  );
}

export default function CompareOverlay({ a, b }) {
  const canvasRef = useRef(null);
  const framesA = a?.frames || [];
  const framesB = b?.frames || [];
  const totalA = framesA.length;
  const totalB = framesB.length;
  const [idxA, setIdxA] = useState(0);
  const [idxB, setIdxB] = useState(0);
  const [alignA, setAlignA] = useState(null);
  const [alignB, setAlignB] = useState(null);
  const [synced, setSynced] = useState(false);

  const syncEnabled = alignA != null && alignB != null;
  const offset = syncEnabled ? alignB - alignA : 0;

  const safeA = clamp(idxA, totalA);
  const safeB = clamp(idxB, totalB);

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
    const v = clamp(i, totalA);
    setIdxA(v);
    if (synced) setIdxB(clamp(v + offset, totalB));
  };
  const seekB = (i) => {
    const v = clamp(i, totalB);
    setIdxB(v);
    if (synced) setIdxA(clamp(v - offset, totalA));
  };

  const toggleSync = () => {
    if (!syncEnabled) return;
    setSynced((prev) => {
      const next = !prev;
      if (next) {
        setIdxA(clamp(alignA, totalA));
        setIdxB(clamp(alignA + offset, totalB));
      }
      return next;
    });
  };

  const handleMaster = (v) => {
    setIdxA(v);
    setIdxB(clamp(v + offset, totalB));
  };
  const masterIdx = clamp(idxA, totalA);

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
      {!syncEnabled && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
          <TriangleAlert className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-[11px] text-amber-700 leading-relaxed">
            정렬점이 지정되지 않았습니다. 정렬 없이 겹치면 서로 다른 동작 구간이 겹쳐져 비교가 무의미합니다. 아래에서 각 영상의 정렬점을 지정한 뒤 동기화하세요.
          </p>
        </div>
      )}

      <p className="text-[11px] text-gray-400 leading-relaxed">
        카메라 위치와 각도가 같을 때 비교가 정확합니다. 각 영상에서 같은 시점의 프레임을 정렬점으로 지정하고 동기화를 켜면 두 슬라이더가 하나로 합쳐집니다.
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

      {/* sync control bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-3 flex items-center gap-3 flex-wrap">
        <p className="text-xs text-gray-500">
          정렬점: {alignA != null ? `영상1 #${alignA + 1}` : "영상1 미지정"} · {alignB != null ? `영상2 #${alignB + 1}` : "영상2 미지정"}
        </p>
        {syncEnabled && (
          <span className="text-[11px] font-semibold text-gray-400">오프셋 {offset > 0 ? `+${offset}` : offset} 프레임</span>
        )}
        <button
          onClick={toggleSync}
          disabled={!syncEnabled}
          className={`ml-auto inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-1.5 border transition-colors ${
            synced
              ? "bg-[#FF6B4A] text-white border-[#FF6B4A]"
              : syncEnabled
                ? "text-gray-600 border-gray-200 hover:border-[#FF6B4A] hover:text-[#FF6B4A]"
                : "text-gray-300 border-gray-100 cursor-not-allowed"
          }`}
          title={syncEnabled ? "정렬점 기준으로 슬라이더를 하나로 합쳐 동기화" : "두 영상 모두 정렬점을 지정해야 동기화할 수 있어요"}
        >
          {synced ? <Unlink className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
          {synced ? "동기화 끄기" : "동기화"}
        </button>
      </div>

      {synced ? (
        /* merged single slider */
        <div className="bg-white rounded-2xl border border-orange-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-[#1A1A2E]">동기화 슬라이더</p>
            <p className="text-[11px] text-gray-400">
              영상1 #{masterIdx + 1}/{totalA} · 영상2 #{clamp(idxB, totalB) + 1}/{totalB}
            </p>
          </div>
          <input
            type="range"
            min={0}
            max={Math.max(0, totalA - 1)}
            value={masterIdx}
            onChange={(e) => handleMaster(Number(e.target.value))}
            className="w-full accent-[#FF6B4A] cursor-pointer"
          />
          <p className="text-[10px] text-gray-400 mt-1.5 leading-relaxed">
            슬라이더를 움직이면 영상1은 그대로, 영상2는 오프셋만큼 함께 이동합니다. 한쪽이 범위를 벗어나면 해당 영상은 끝/첫 프레임에 고정됩니다.
          </p>
        </div>
      ) : (
        /* two independent scrubbers + per-video alignment buttons */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Scrubber label="영상1" sub={a?.category} idx={idxA} setIdx={seekA} total={totalA} />
            <AlignPointBtn frame={alignA} current={safeA} onSet={setAlignA} />
          </div>
          <div className="space-y-2">
            <Scrubber label="영상2" sub={b?.category} idx={idxB} setIdx={seekB} total={totalB} />
            <AlignPointBtn frame={alignB} current={safeB} onSet={setAlignB} />
          </div>
        </div>
      )}

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