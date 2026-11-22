import React, { useEffect, useRef, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { ArrowLeft, Settings2, ChevronLeft, ChevronRight, Loader2, Plus, Minus } from "lucide-react";
import { drawSkeleton } from "@/lib/poseDraw";
import { frameAngles } from "@/lib/biomechanics";
import {
  ALIGN_METRICS, ASYMM_PAIRS,
  DEFAULT_RANGES, getRating, asymRating,
} from "@/lib/metricRanges";
import AngleGraph from "@/components/analysis/AngleGraph";
import ObpComparison from "@/components/analysis/ObpComparison";
import GolfComparison from "@/components/analysis/GolfComparison";
import MetricsTable from "@/components/analysis/MetricsTable";
import { base44 } from "@/api/base44Client";

function summarize(values) {
  if (!values.length) return { min: null, max: null, avg: null };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = Math.round(values.reduce((s, v) => s + v, 0) / values.length);
  return { min, max, avg };
}

export default function FrameAnalysis() {
  const { state } = useLocation();
  const navFrames = state?.frames || null;       // mode A: fresh analysis (image dataURL + landmarks)
  const videoUrl = state?.videoUrl || null;      // mode B: reopen from history
  const framesData = state?.framesData || null;  // mode B: saved landmarks + times
  const category = state?.category;

  const videoMode = !navFrames && !!videoUrl && !!framesData;
  const initFrames = navFrames || framesData || [];
  const [frames, setFrames] = useState(initFrames);
  const [idx, setIdx] = useState(0);
  const [loaded, setLoaded] = useState(0);
  const [videoReady, setVideoReady] = useState(false);
  const [ranges, setRanges] = useState(DEFAULT_RANGES);
  const [zoom, setZoom] = useState(1);
  const [obpMode, setObpMode] = useState("none");
  const [contactFrame, setContactFrame] = useState(null);
  const [sport, setSport] = useState(state?.category || null);
  const [recordId] = useState(state?.recordId || null);
  const from = state?.from; // "admin" 등 — 뒤로 가기 대상 결정

  const changeSport = async (next) => {
    setSport(next);
    if (next !== "baseball") setObpMode("none");
    if (recordId) {
      try { await base44.entities.AnalysisRecord.update(recordId, { category: next }); } catch {}
    }
  };

  const canvasRef = useRef(null);
  const imgCache = useRef([]);
  const videoElRef = useRef(null);
  const seekTokenRef = useRef(0);

  // load coach ranges (falls back to defaults if unavailable)
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

  // Mode A: preload frame images
  useEffect(() => {
    if (videoMode || !frames.length) return;
    let cancelled = false;
    imgCache.current = new Array(frames.length).fill(null);
    setLoaded(0);
    frames.forEach((f, i) => {
      const im = new Image();
      im.onload = () => {
        if (cancelled) return;
        imgCache.current[i] = im;
        setLoaded((n) => n + 1);
      };
      im.src = f.image;
    });
    return () => { cancelled = true; };
  }, [frames, videoMode]);

  // Mode A: draw current frame + skeleton from preloaded image.
  // If the selected frame isn't decoded yet, clear the canvas (so the
  // previous frame doesn't bleed through) and show a loading overlay;
  // this effect re-runs when `loaded` increments and draws once ready.
  useEffect(() => {
    if (videoMode) return;
    const im = imgCache.current[idx];
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!im) {
      if (canvas.width) ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    canvas.width = im.naturalWidth;
    canvas.height = im.naturalHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(im, 0, 0, canvas.width, canvas.height);
    drawSkeleton(ctx, frames[idx]?.landmarks, canvas.width, canvas.height, {
      nodeColor: "#FF1F1F",
      lineColor: "#1E40AF",
    });
  }, [idx, loaded, frames, videoMode]);

  // Mode B: draw by seeking the stored original video and overlaying saved landmarks.
  // A seek token guards against stale "seeked" events from earlier scrubs overwriting
  // the frame the user actually landed on.
  useEffect(() => {
    if (!videoMode) return;
    const canvas = canvasRef.current;
    const video = videoElRef.current;
    if (!canvas || !video || !videoReady || !frames.length) return;

    const token = ++seekTokenRef.current;
    const fd = frames[idx];
    const render = () => {
      if (token !== seekTokenRef.current) return;
      const w = video.videoWidth || fd.width || 480;
      const h = video.videoHeight || fd.height || 640;
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, w, h);
      try { ctx.drawImage(video, 0, 0, w, h); } catch {}
      drawSkeleton(ctx, fd.landmarks, w, h, { nodeColor: "#FF1F1F", lineColor: "#1E40AF" });
    };

    const dur = isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
    let t = fd.time != null ? fd.time : (frames.length > 1 ? (dur * idx) / (frames.length - 1) : 0);
    if (dur) t = Math.max(0, Math.min(t, dur - 0.001));
    else t = Math.max(0, t);

    const onSeeked = () => render();
    let attached = false;
    if (Math.abs(video.currentTime - t) < 0.016) {
      render();
    } else {
      attached = true;
      video.addEventListener("seeked", onSeeked, { once: true });
      try { video.currentTime = t; } catch { render(); }
    }
    const fallback = setTimeout(render, 250);
    return () => {
      clearTimeout(fallback);
      if (attached) video.removeEventListener("seeked", onSeeked);
    };
  }, [idx, frames, videoMode, videoReady]);

  if (!frames.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#F9FAFB] px-6 text-center">
        <p className="text-gray-600 font-medium">프레임 데이터가 없습니다.</p>
        <Link to="/analyze" className="text-[#FF6B4A] font-semibold text-sm underline">분석 다시하기</Link>
      </div>
    );
  }

  const safeIdx = Math.min(idx, frames.length - 1);
  const ang = frameAngles(frames[safeIdx].landmarks);

  // separation summary incl. which frame holds the max
  const sepVals = frames.map((f) => frameAngles(f.landmarks).separationAngle);
  let sepSummary = { min: null, max: null, avg: null, maxFrame: null };
  {
    const valid = sepVals.filter((v) => v != null);
    if (valid.length) {
      let maxVal = -Infinity, maxFrame = null;
      sepVals.forEach((v, i) => {
        if (v != null && v > maxVal) { maxVal = v; maxFrame = i; }
      });
      sepSummary = {
        min: Math.min(...valid),
        max: Math.max(...valid),
        avg: Math.round(valid.reduce((s, v) => s + v, 0) / valid.length),
        maxFrame: maxFrame == null ? null : maxFrame + 1,
      };
    }
  }

  const alignSummary = ALIGN_METRICS.map((j) => {
    const vals = frames.map((f) => frameAngles(f.landmarks)[j.key]).filter((v) => v != null);
    return { ...j, ...summarize(vals) };
  });
  const asymSummary = ASYMM_PAIRS.map((j) => {
    const diffs = frames
      .map((f) => {
        const m = frameAngles(f.landmarks);
        if (m[j.l] == null || m[j.r] == null) return null;
        return Math.abs(m[j.l] - m[j.r]);
      })
      .filter((v) => v != null);
    return { label: j.label, ...summarize(diffs) };
  });

  const showSummary = obpMode === "none" && sport !== "golf";

  const alignRows = alignSummary.map((s) => ({
    key: s.key,
    label: s.label,
    hint: s.hint,
    current: ang[s.key],
    currentRating: getRating(ang[s.key], ranges[s.key]),
    s,
    rating: getRating(s.avg, ranges[s.key]),
  }));

  const asymRows = ASYMM_PAIRS.map((j, i) => {
    const cur = ang[j.l] != null && ang[j.r] != null ? Math.abs(ang[j.l] - ang[j.r]) : null;
    const s = asymSummary[i];
    return {
      key: j.label,
      label: j.label,
      current: cur,
      currentRating: asymRating(cur),
      s,
      rating: asymRating(s.avg),
    };
  });

  const rebuilding = videoMode && !videoReady;

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-md lg:max-w-[1400px] mx-auto px-4 py-2.5 flex items-center gap-3">
          <Link to={from === "admin" ? "/admin" : (videoMode ? "/mypage" : "/analyze")} className="text-gray-400 hover:text-[#1A1A2E] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-[#1A1A2E] leading-tight">프레임별 분석</h1>
            <p className="text-[11px] text-gray-400 leading-tight">관절 각도 추적 · {frames.length}프레임</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {from === "admin" && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#FF6B4A] bg-orange-50 px-2.5 py-1.5 rounded-full hover:bg-orange-100 transition-colors"
              >
                대시보드로
              </Link>
            )}
            <Link
              to="/range-settings"
              className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5" />
              범위설정
            </Link>
          </div>
        </div>
      </div>

      {/* Toolbar — 종목 선택 + 종목별 추가 분석 */}
      <div className="max-w-md lg:max-w-[1400px] mx-auto px-4 pt-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-[#1A1A2E]">종목</span>
          {[{ k: null, label: "일반/미지정" }, { k: "baseball", label: "⚾ 야구" }, { k: "golf", label: "⛳ 골프" }].map((s) => (
            <button
              key={String(s.k)}
              onClick={() => changeSport(s.k)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${sport === s.k ? "bg-[#FF6B4A] text-white border-[#FF6B4A]" : "bg-white text-gray-500 border-gray-200 hover:border-[#FF6B4A]"}`}
            >
              {s.label}
            </button>
          ))}
          {sport === "baseball" && (
            <div className="inline-flex items-center bg-white rounded-full border border-gray-200 p-0.5 ml-1">
              <button
                onClick={() => setObpMode((m) => (m === "pitch" ? "none" : "pitch"))}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${obpMode === "pitch" ? "bg-[#FF6B4A] text-white" : "text-gray-500 hover:text-[#1A1A2E]"}`}
              >
                투구
              </button>
              <button
                onClick={() => setObpMode((m) => (m === "swing" ? "none" : "swing"))}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${obpMode === "swing" ? "bg-[#FF6B4A] text-white" : "text-gray-500 hover:text-[#1A1A2E]"}`}
              >
                스윙
              </button>
            </div>
          )}
          {sport === "golf" && (
            <span className="text-[11px] text-gray-400">어드레스·피니시를 지정하면 8단계를 자동 추천합니다.</span>
          )}
        </div>
      </div>

      {/* Desktop: video left (sticky), all analytics right — one screen, no scroll */}
      <div className="max-w-md lg:max-w-[1400px] mx-auto px-4 py-3">
        <div
          className="lg:grid lg:gap-4 lg:items-start"
          style={{ gridTemplateColumns: `minmax(0, ${(40 * zoom).toFixed(1)}%) minmax(0, 1fr)` }}
        >
          {/* Frame + slider */}
          <div className="lg:sticky lg:top-[64px]">
            <div className="bg-white rounded-2xl border border-gray-100 p-3">
              <div className="flex justify-center">
                <div className="relative w-full">
                  <canvas
                    ref={canvasRef}
                    className="block rounded-xl bg-black"
                    style={{
                      aspectRatio: frames[safeIdx]
                        ? `${frames[safeIdx].width || 9} / ${frames[safeIdx].height || 16}`
                        : "9 / 16",
                      maxHeight: "calc(100vh - 260px)",
                      maxWidth: "100%",
                      width: "auto",
                      height: "auto",
                    }}
                  />
                  {rebuilding && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl bg-black/40">
                      <Loader2 className="w-7 h-7 text-white animate-spin" />
                      <p className="text-xs text-white/80">원본 영상 로드 중...</p>
                    </div>
                  )}
                  {!videoMode && !imgCache.current[safeIdx] && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl bg-black/40">
                      <Loader2 className="w-7 h-7 text-white animate-spin" />
                      <p className="text-xs text-white/80">프레임 불러오는 중...</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-3">
                <input
                  type="range"
                  min={0}
                  max={frames.length - 1}
                  value={safeIdx}
                  onChange={(e) => setIdx(Number(e.target.value))}
                  className="w-full accent-[#007BFF] cursor-pointer"
                />
                <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-xs text-gray-500">
                    {safeIdx + 1} / {frames.length} 프레임{category ? ` · ${category}` : ""}
                  </p>
                  <div className="flex items-center gap-2 justify-end flex-wrap">
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
                        className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                        aria-label="화면 축소"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs text-gray-500 px-1 tabular-nums">{Math.round(zoom * 100)}%</span>
                      <button
                        onClick={() => setZoom((z) => Math.min(2, +(z + 0.25).toFixed(2)))}
                        className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                        aria-label="화면 확대"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setIdx((i) => Math.max(0, i - 1))}
                        disabled={safeIdx === 0}
                        className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        aria-label="이전 프레임"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setIdx((i) => Math.min(frames.length - 1, i + 1))}
                        disabled={safeIdx === frames.length - 1}
                        className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        aria-label="다음 프레임"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {videoMode && (
              <video
                ref={videoElRef}
                src={videoUrl}
                muted
                playsInline
                preload="auto"
                onLoadedData={() => setVideoReady(true)}
                onError={() => setVideoReady(true)}
                className="absolute w-px h-px opacity-0 pointer-events-none -z-10"
              />
            )}
          </div>

          {/* Metrics — compact tables so current + summary fit together */}
          <div className="mt-4 lg:mt-0 space-y-3">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              <MetricsTable title="정렬 지표" rows={alignRows} showSummary={showSummary} />
              {showSummary && (
                asymSummary.every((s) => s.avg == null) ? (
                  <div className="bg-white rounded-2xl border border-gray-100 p-3">
                    <p className="text-sm font-bold text-[#1A1A2E] mb-1">좌우 비대칭 · |좌 − 우|</p>
                    <p className="text-xs text-gray-400">양측 관절을 모두 인식한 프레임이 필요합니다.</p>
                  </div>
                ) : (
                  <MetricsTable title="좌우 비대칭 · |좌 − 우|" rows={asymRows} showSummary />
                )
              )}
            </div>

            {/* 각도 변화 그래프 */}
            <AngleGraph frames={frames} selectedIdx={safeIdx} onSelectFrame={setIdx} />

            {/* 골프 스윙 8단계 */}
            {sport === "golf" && obpMode === "none" && (
              <GolfComparison frames={frames} currentIdx={safeIdx} onSeek={setIdx} />
            )}

            {/* OBP 참고 비교 */}
            {obpMode !== "none" && (
              <ObpComparison
                mode={obpMode}
                frames={frames}
                currentIdx={safeIdx}
                sepMax={sepSummary.max}
                onSeek={setIdx}
                contactFrame={contactFrame}
                onSetContact={(idx) => setContactFrame(idx)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}