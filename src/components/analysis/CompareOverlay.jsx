import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { frameAngles } from "@/lib/biomechanics";
import { ANGLE_METRICS } from "@/lib/metricRanges";
import { renderOverlaySkeleton } from "@/lib/skeletonOverlay";

const CANVAS_SIZE = 600;
const COLOR_A = "#2C7BE5"; // 영상1
const COLOR_B = "#FF6B4A"; // 영상2

const clamp = (v, total) => (total <= 0 ? 0 : Math.max(0, Math.min(total - 1, v)));

function Scrubber({ label, idx, setIdx, total }) {
  const safe = clamp(idx, total);
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs font-bold text-[#1A1A2E] truncate">{label}</p>
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

export default function CompareOverlay({ a, b }) {
  const canvasRef = useRef(null);
  const framesA = a?.frames || [];
  const framesB = b?.frames || [];
  const totalA = framesA.length;
  const totalB = framesB.length;
  const [idxA, setIdxA] = useState(0);
  const [idxB, setIdxB] = useState(0);

  const safeA = clamp(idxA, totalA);
  const safeB = clamp(idxB, totalB);

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
        카메라 위치와 각도가 같을 때 비교가 정확합니다. 각 영상의 슬라이더를 직접 움직여 같은 시점을 맞춰 비교하세요.
      </p>

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Scrubber label={`영상1${a?.category ? ` · ${a.category}` : ""}`} idx={idxA} setIdx={setIdxA} total={totalA} />
        <Scrubber label={`영상2${b?.category ? ` · ${b.category}` : ""}`} idx={idxB} setIdx={setIdxB} total={totalB} />
      </div>

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