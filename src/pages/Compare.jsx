import React, { useEffect, useRef, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { drawSkeleton } from "@/lib/poseDraw";

function CompareSide({ rec, position }) {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const [ready, setReady] = useState(false);
  const frames = rec?.frames || [];
  const idx = Math.min(frames.length - 1, Math.max(0, Math.round(position * (frames.length - 1))));

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !ready || !frames.length) return;
    let cancelled = false;
    const fd = frames[idx];
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
      const t = fd.time != null ? fd.time : (frames.length > 1 ? (dur * idx) / (frames.length - 1) : 0);
      video.currentTime = Math.max(0, Math.min(t, (dur || t) - 0.001));
    } catch { render(); }
    const fallback = setTimeout(render, 120);
    return () => {
      cancelled = true;
      clearTimeout(fallback);
      video.removeEventListener("seeked", onSeeked);
    };
  }, [idx, frames, ready]);

  if (!rec || !frames.length) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-sm text-gray-400 flex-1 min-w-0">
        영상 데이터가 없습니다.
      </div>
    );
  }

  const aspect = frames[idx] ? `${frames[idx].width || 9} / ${frames[idx].height || 16}` : "9 / 16";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-3 flex-1 min-w-0 relative">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#1A1A2E] truncate">{rec.category || "분석"}</p>
          {rec.userName && <p className="text-xs text-gray-400 truncate">{rec.userName}</p>}
        </div>
        {rec.result?.overallScore != null && (
          <span className="text-sm font-bold text-[#FF6B4A] flex-shrink-0">{rec.result.overallScore}</span>
        )}
      </div>
      <div className="relative">
        <canvas ref={canvasRef} className="w-full block rounded-xl bg-black" style={{ aspectRatio: aspect }} />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-2 px-1">프레임 {idx + 1} / {frames.length}</p>
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
  const [pos, setPos] = useState(0);

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
            <p className="text-xs text-gray-400">두 영상의 프레임을 나란히 비교</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <div className="flex flex-col md:flex-row gap-4">
          <CompareSide rec={a} position={pos} />
          <CompareSide rec={b} position={pos} />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500 mb-2">동기화 스크러버 — 양쪽 영상 같은 위치 재생</p>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(pos * 100)}
            onChange={(e) => setPos(Number(e.target.value) / 100)}
            className="w-full accent-[#FF6B4A]"
          />
        </div>
      </div>
    </div>
  );
}