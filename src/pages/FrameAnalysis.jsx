import React, { useEffect, useRef, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { ArrowLeft, Settings2, ChevronLeft, ChevronRight, Loader2, Plus, Minus } from "lucide-react";
import { drawSkeleton } from "@/lib/poseDraw";
import { frameAngles } from "@/lib/biomechanics";
import {
  ANGLE_METRICS, ALIGN_METRICS, ASYMM_PAIRS,
  DEFAULT_RANGES, getRating, asymRating, RATING_STYLES,
} from "@/lib/metricRanges";
import AngleGraph from "@/components/analysis/AngleGraph";
import ObpComparison from "@/components/analysis/ObpComparison";
import GolfComparison from "@/components/analysis/GolfComparison";
import { base44 } from "@/api/base44Client";

function summarize(values) {
  if (!values.length) return { min: null, max: null, avg: null };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = Math.round(values.reduce((s, v) => s + v, 0) / values.length);
  return { min, max, avg };
}

function MetricCard({ label, value, rating }) {
  const r = RATING_STYLES[rating] || RATING_STYLES.none;
  return (
    <div className={`bg-white rounded-lg border-2 p-3 ${r.border}`}>
      <p className="text-xs text-gray-500 truncate">{label}</p>
      <p className="text-2xl font-bold text-gray-800 mt-1">{value == null ? "—" : `${value}°`}</p>
    </div>
  );
}

function SummaryCard({ label, s, hint, range, ratingOverride }) {
  const rating = ratingOverride ?? (s.avg != null && range ? getRating(s.avg, range) : "none");
  const r = RATING_STYLES[rating] || RATING_STYLES.none;
  const text =
    s.min == null ? "데이터 없음" : `최소 ${s.min}° · 최대 ${s.max}° · 평균 ${s.avg}°`;
  return (
    <div className={`bg-white rounded-lg border-2 p-3 ${r.border}`}>
      <p className="text-sm font-bold text-gray-800 truncate">{label}</p>
      {hint && <p className="text-[10px] text-gray-400 -mt-0.5">{hint}</p>}
      <p className="text-xs text-gray-500 mt-1">{text}</p>
    </div>
  );
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

  // Mode A: draw current frame + skeleton from preloaded image
  useEffect(() => {
    if (videoMode) return;
    const im = imgCache.current[idx];
    const canvas = canvasRef.current;
    if (!im || !canvas) return;
    canvas.width = im.naturalWidth;
    canvas.height = im.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(im, 0, 0, canvas.width, canvas.height);
    drawSkeleton(ctx, frames[idx]?.landmarks, canvas.width, canvas.height, {
      nodeColor: "#FF1F1F",
      lineColor: "#1E40AF",
    });
  }, [idx, loaded, frames, videoMode]);

  // Mode B: draw by seeking the stored original video and overlaying saved landmarks
  useEffect(() => {
    if (!videoMode) return;
    const canvas = canvasRef.current;
    const video = videoElRef.current;
    if (!canvas || !video || !videoReady || !frames.length) return;

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
    } catch {
      render();
    }
    const fallback = setTimeout(render, 120);
    return () => {
      cancelled = true;
      clearTimeout(fallback);
      video.removeEventListener("seeked", onSeeked);
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

  const angleSummary = ANGLE_METRICS.map((j) => {
    const vals = frames.map((f) => frameAngles(f.landmarks)[j.key]).filter((v) => v != null);
    return { ...j, ...summarize(vals) };
  });
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

  const rebuilding = videoMode && !videoReady;

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-md lg:max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to={videoMode ? "/mypage" : "/analyze"} className="text-gray-400 hover:text-[#1A1A2E] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-base font-bold text-[#1A1A2E]">프레임별 분석</h1>
            <p className="text-xs text-gray-400">관절 각도 추적 · {frames.length}프레임</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
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

      {/* 종목 선택 + 종목별 추가 분석 */}
      <div className="max-w-md lg:max-w-5xl mx-auto px-4 pt-4 space-y-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-3">
          <p className="text-xs font-bold text-[#1A1A2E] mb-2">종목 선택</p>
          <div className="flex flex-wrap gap-2">
            {[{ k: null, label: "일반/미지정" }, { k: "baseball", label: "⚾ 야구" }, { k: "golf", label: "⛳ 골프" }].map((s) => (
              <button
                key={String(s.k)}
                onClick={() => changeSport(s.k)}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors ${sport === s.k ? "bg-[#FF6B4A] text-white border-[#FF6B4A]" : "bg-white text-gray-500 border-gray-200 hover:border-[#FF6B4A]"}`}
              >
                {s.label}
              </button>
            ))}
          </div>
          {sport === "golf" && (
            <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
              어드레스·피니시를 지정하면 8단계를 자동 추천합니다. 추천은 시작점이며 썸네일로 직접 조정하세요.
            </p>
          )}
        </div>
        {sport === "baseball" && (
          <div className="inline-flex items-center bg-white rounded-full border border-gray-200 p-1">
            <button
              onClick={() => setObpMode((m) => (m === "pitch" ? "none" : "pitch"))}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${obpMode === "pitch" ? "bg-[#FF6B4A] text-white" : "text-gray-500 hover:text-[#1A1A2E]"}`}
            >
              투구
            </button>
            <button
              onClick={() => setObpMode((m) => (m === "swing" ? "none" : "swing"))}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${obpMode === "swing" ? "bg-[#FF6B4A] text-white" : "text-gray-500 hover:text-[#1A1A2E]"}`}
            >
              스윙
            </button>
          </div>
        )}
      </div>

      {/* Desktop: frame left, metrics right (horizontal grid); Mobile: stacked */}
      <div className="max-w-md lg:max-w-5xl mx-auto px-4 py-6">
        <div className="lg:grid lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-6 lg:items-start">
          {/* Frame + slider */}
          <div className="lg:sticky lg:top-[88px]">
            <div className="bg-white rounded-2xl border border-gray-100 p-3">
              <div className="relative mx-auto" style={{ maxWidth: 360 * zoom }}>
                <canvas
                  ref={canvasRef}
                  className="w-full block rounded-xl bg-black"
                  style={{
                    aspectRatio: frames[safeIdx]
                      ? `${frames[safeIdx].width || 9} / ${frames[safeIdx].height || 16}`
                      : "9 / 16",
                  }}
                />
                {rebuilding && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl bg-black/40">
                    <Loader2 className="w-7 h-7 text-white animate-spin" />
                    <p className="text-xs text-white/80">원본 영상 로드 중...</p>
                  </div>
                )}
              </div>
              <div className="mt-4">
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
                        className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                        aria-label="화면 축소"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs text-gray-500 px-1.5 tabular-nums">{Math.round(zoom * 100)}%</span>
                      <button
                        onClick={() => setZoom((z) => Math.min(2, +(z + 0.25).toFixed(2)))}
                        className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                        aria-label="화면 확대"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setIdx((i) => Math.max(0, i - 1))}
                        disabled={safeIdx === 0}
                        className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        aria-label="이전 프레임"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setIdx((i) => Math.min(frames.length - 1, i + 1))}
                        disabled={safeIdx === frames.length - 1}
                        className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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

          {/* Metrics — 7 blocks: horizontal 2-col grid on desktop, stacked on mobile */}
          <div className="mt-6 lg:mt-0 space-y-6 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
            {/* 1. 현재 프레임 · 관절 가동각 */}
            <div>
              <p className="text-sm font-bold text-[#1A1A2E] mb-2">현재 프레임 · 관절 가동각</p>
              <div className="grid grid-cols-2 gap-2">
                {ANGLE_METRICS.map((j) => (
                  <MetricCard key={j.key} label={j.label} value={ang[j.key]} rating={getRating(ang[j.key], ranges[j.key])} />
                ))}
              </div>
            </div>

            {/* 2. 현재 프레임 · 정렬 지표 */}
            <div>
              <p className="text-sm font-bold text-[#1A1A2E] mb-2">현재 프레임 · 정렬 지표</p>
              <div className="grid grid-cols-2 gap-2">
                {ALIGN_METRICS.map((j) => (
                  <MetricCard key={j.key} label={j.label} value={ang[j.key]} rating={getRating(ang[j.key], ranges[j.key])} />
                ))}
              </div>
            </div>

            {obpMode === "none" && sport !== "golf" && (
              <>
                {/* 3. 영상 전체 요약 · 관절 가동각 */}
                <div>
                  <p className="text-sm font-bold text-[#1A1A2E] mb-2">영상 전체 요약 · 관절 가동각</p>
                  <div className="grid grid-cols-2 gap-2">
                    {angleSummary.map((s) => (
                      <SummaryCard key={s.key} label={s.label} s={s} range={ranges[s.key]} />
                    ))}
                  </div>
                </div>

                {/* 4. 영상 전체 요약 · 정렬 지표 */}
                <div>
                  <p className="text-sm font-bold text-[#1A1A2E] mb-2">영상 전체 요약 · 정렬 지표</p>
                  <div className="grid grid-cols-2 gap-2">
                    {alignSummary.map((s) => (
                      <SummaryCard key={s.key} label={s.label} s={s} hint={s.hint} range={ranges[s.key]} />
                    ))}
                  </div>
                </div>

                {/* 6. 좌우 비대칭 지표 */}
                <div>
                  <p className="text-sm font-bold text-[#1A1A2E] mb-2">좌우 비대칭 지표 · |좌 − 우|</p>
                  {asymSummary.every((s) => s.avg == null) ? (
                    <div className="bg-white rounded-lg border-2 border-gray-200 p-3">
                      <p className="text-xs text-gray-400">양측 관절을 모두 인식한 프레임이 필요합니다.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {asymSummary.map((s) => (
                        <SummaryCard key={s.label} label={s.label} s={s} ratingOverride={asymRating(s.avg)} />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* 7. 각도 변화 그래프 — 전폭 */}
            <div className="lg:col-span-2">
              <AngleGraph frames={frames} selectedIdx={safeIdx} onSelectFrame={setIdx} />
            </div>

            {/* 8g. 골프 스윙 8단계 (골프 선택 시) */}
            {sport === "golf" && obpMode === "none" && (
              <div className="lg:col-span-2">
                <GolfComparison frames={frames} currentIdx={safeIdx} onSeek={setIdx} />
              </div>
            )}

            {/* 8. OBP 참고 비교 (투구/스윙 선택 시) */}
            {obpMode !== "none" && (
              <div className="lg:col-span-2">
                <ObpComparison
                  mode={obpMode}
                  frames={frames}
                  currentIdx={safeIdx}
                  sepMax={sepSummary.max}
                  onSeek={setIdx}
                  contactFrame={contactFrame}
                  onSetContact={(idx) => setContactFrame(idx)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}