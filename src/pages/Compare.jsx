import React, { useEffect, useRef, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { ArrowLeft, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { drawSkeleton } from "@/lib/poseDraw";
import { frameAngles } from "@/lib/biomechanics";
import {
  ANGLE_METRICS, DEFAULT_RANGES, getRating, RATING_STYLES,
} from "@/lib/metricRanges";
import { base44 } from "@/api/base44Client";
import CompareOverlay from "@/components/analysis/CompareOverlay";

function MetricCard({ label, value, rating }) {
  const r = RATING_STYLES[rating] || RATING_STYLES.none;
  return (
    <div className={`bg-white rounded-lg border-2 p-2 ${r.border}`}>
      <p className="text-[11px] text-gray-500 truncate">{label}</p>
      <p className="text-lg font-bold text-gray-800 mt-0.5">{value == null ? "—" : `${value}°`}</p>
    </div>
  );
}

function CompareSide({ rec, ranges }) {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [idx, setIdx] = useState(0);
  const frames = rec?.frames || [];
  const safeIdx = Math.min(idx, Math.max(0, frames.length - 1));

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !ready || !frames.length) return;
    let cancelled = false;
    const fd = frames[safeIdx];
    const render = () => {
      if (cancelled) return;
      const w = video.videoWidth || fd.width || 480;
      const h = video.videoHeight || fd.height || 640;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, w, h);
      try { ctx.drawImage(video, 0, 0, w, h); } catch {}
      drawSkeleton(ctx, fd.landmarks, w, h, { nodeColor: "#FF1F1F", lineColor: "#1E40AF" });
    };
    const onSeeked = () => render();
    video.addEventListener("seeked", onSeeked, { once: true });
    try {
      const dur = isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
      const t = fd.time != null ? fd.time : (frames.length > 1 ? (dur * safeIdx) / (frames.length - 1) : 0);
      video.currentTime = Math.max(0, Math.min(t, (dur || t) - 0.001));
    } catch { render(); }
    const fallback = setTimeout(render, 120);
    return () => {
      cancelled = true;
      clearTimeout(fallback);
      video.removeEventListener("seeked", onSeeked);
    };
  }, [safeIdx, frames, ready]);

  if (!rec || !frames.length) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-sm text-gray-400 flex-1 min-w-0">
        영상 데이터가 없습니다.
      </div>
    );
  }

  const aspect = frames[safeIdx] ? `${frames[safeIdx].width || 9} / ${frames[safeIdx].height || 16}` : "9 / 16";
  const ang = frameAngles(frames[safeIdx].landmarks);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-3 flex-1 min-w-0 relative space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#1A1A2E] truncate">{rec.category || "분석"}</p>
          {rec.userName && <p className="text-xs text-gray-400 truncate">{rec.userName}</p>}
        </div>

      </div>

      {/* frame */}
      <div className="relative">
        <canvas ref={canvasRef} className="w-full block rounded-xl bg-black" style={{ aspectRatio: aspect }} />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* independent scrubber */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs text-gray-500">프레임 {safeIdx + 1} / {frames.length}</p>
          <div className="flex gap-1.5">
            <button
              onClick={() => setIdx((i) => Math.max(0, i - 1))}
              disabled={safeIdx === 0}
              className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-colors"
              aria-label="이전 프레임"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIdx((i) => Math.min(frames.length - 1, i + 1))}
              disabled={safeIdx === frames.length - 1}
              className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-colors"
              aria-label="다음 프레임"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={frames.length - 1}
          value={safeIdx}
          onChange={(e) => setIdx(Number(e.target.value))}
          className="w-full accent-[#FF6B4A] cursor-pointer"
        />
      </div>

      {/* joint angles for this frame */}
      <div>
        <p className="text-xs font-bold text-[#1A1A2E] mb-2">현재 프레임 · 관절 가동각</p>
        <div className="grid grid-cols-2 gap-2">
          {ANGLE_METRICS.map((j) => (
            <MetricCard key={j.key} label={j.label} value={ang[j.key]} rating={getRating(ang[j.key], ranges[j.key])} />
          ))}
        </div>
      </div>

      <video
        ref={videoRef}
        src={rec.videoUrl}
        muted
        playsInline
        preload="auto"
        onLoadedData={() => setReady(true)}
        onError={() => setReady(true)}
        className="absolute w-px h-px opacity-0 pointer-events-none -z-10"
      />
    </div>
  );
}

export default function Compare() {
  const { state } = useLocation();
  const a = state?.a;
  const b = state?.b;
  const [ranges, setRanges] = useState(DEFAULT_RANGES);
  const [mode, setMode] = useState("side");

  useEffect(() => {
    base44.entities.RangeSetting
      .list()
      .then((recs) => {
        if (recs && recs.length && recs[0].ranges) {
          setRanges((prev) => {
            const next = { ...prev };
            for (const k of Object.keys(DEFAULT_RANGES)) {
              if (recs[0].ranges[k] != null) {
                next[k] = { min: Number(recs[0].ranges[k].min), max: Number(recs[0].ranges[k].max) };
              }
            }
            return next;
          });
        }
      })
      .catch(() => {});
  }, []);

  if (!a || !b) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#F9FAFB] px-6 text-center">
        <p className="text-gray-600 font-medium">비교할 두 영상 데이터가 없습니다.</p>
        <Link to="/admin" className="text-[#FF6B4A] font-semibold text-sm underline">관리자로 돌아가기</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/admin" className="text-gray-400 hover:text-[#1A1A2E] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-base font-bold text-[#1A1A2E]">영상 비교</h1>
            <p className="text-xs text-gray-400">같은 자세, 다른 영상. 프레임별로 비교해보세요.</p>
          </div>
          <div className="ml-auto inline-flex bg-gray-100 rounded-full p-1">
            <button
              onClick={() => setMode("side")}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${mode === "side" ? "bg-white text-[#1A1A2E] shadow-sm" : "text-gray-500 hover:text-[#1A1A2E]"}`}
            >
              나란히 보기
            </button>
            <button
              onClick={() => setMode("overlay")}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${mode === "overlay" ? "bg-white text-[#1A1A2E] shadow-sm" : "text-gray-500 hover:text-[#1A1A2E]"}`}
            >
              겹쳐 보기
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {mode === "side" ? (
          <div className="flex flex-col md:flex-row gap-4 items-start">
            <CompareSide rec={a} ranges={ranges} />
            <CompareSide rec={b} ranges={ranges} />
          </div>
        ) : (
          <CompareOverlay a={a} b={b} />
        )}
      </div>
    </div>
  );
}