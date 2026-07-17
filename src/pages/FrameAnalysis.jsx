import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { ArrowLeft, FileText, Settings2 } from "lucide-react";
import { drawSkeleton } from "@/lib/poseDraw";
import { frameAngles } from "@/lib/biomechanics";
import {
  ANGLE_METRICS, ALIGN_METRICS, ASYMM_PAIRS,
  DEFAULT_RANGES, getRating, asymRating, RATING_STYLES,
} from "@/lib/metricRanges";
import { generateFeedback } from "@/lib/feedbackRules";
import FeedbackSection from "@/components/analysis/FeedbackSection";
import AngleGraph from "@/components/analysis/AngleGraph";
import { base44 } from "@/api/base44Client";

const SEP_DESC =
  "골반과 어깨가 회전하는 타이밍 차이를 나타내며, 값이 클수록 몸통 회전을 통해 힘을 효율적으로 전달하고 있다는 뜻입니다. 카메라 각도에 따라 오차가 있을 수 있는 추정치입니다.";

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
      <div className="flex items-center justify-between gap-1">
        <p className="text-xs text-gray-500 truncate">{label}</p>
        {r.label && (
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 ${r.badge}`}>{r.label}</span>
        )}
      </div>
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
      <div className="flex items-center justify-between gap-1">
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-800 truncate">{label}</p>
          {hint && <p className="text-[10px] text-gray-400 -mt-0.5">{hint}</p>}
        </div>
        {r.label && (
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 ${r.badge}`}>{r.label}</span>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-1">{text}</p>
    </div>
  );
}

function SeparationCard({ value, rating }) {
  const r = RATING_STYLES[rating] || RATING_STYLES.none;
  return (
    <div className={`bg-white rounded-lg border-2 p-3 ${r.border}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">견갑-골반 분리각</p>
        {r.label && <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${r.badge}`}>{r.label}</span>}
      </div>
      <p className="text-3xl font-bold text-[#FF6B4A] mt-1">{value == null ? "—" : `${value}°`}</p>
    </div>
  );
}

export default function FrameAnalysis() {
  const { state } = useLocation();
  const frames = state?.frames || [];
  const result = state?.result;
  const imageUrl = state?.imageUrl;
  const category = state?.category;

  const canvasRef = useRef(null);
  const imgCache = useRef([]);
  const [loaded, setLoaded] = useState(0);
  const [idx, setIdx] = useState(0);
  const [ranges, setRanges] = useState(DEFAULT_RANGES);

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

  // preload frame images
  useEffect(() => {
    if (!frames.length) return;
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
  }, [frames]);

  // draw current frame + skeleton
  useEffect(() => {
    const im = imgCache.current[idx];
    const canvas = canvasRef.current;
    if (!im || !canvas) return;
    canvas.width = im.naturalWidth;
    canvas.height = im.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(im, 0, 0, canvas.width, canvas.height);
    drawSkeleton(ctx, frames[idx].landmarks, canvas.width, canvas.height, {
      nodeColor: "#FF1F1F",
      lineColor: "#1E40AF",
    });
  }, [idx, loaded, frames]);

  const feedback = useMemo(() => generateFeedback(frames, ranges), [frames, ranges]);

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

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/analyze" className="text-gray-400 hover:text-[#1A1A2E] transition-colors">
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
            {result && (
              <Link
                to="/report"
                state={{ result, imageUrl }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#FF6B4A] bg-orange-50 px-3 py-1.5 rounded-full hover:bg-orange-100 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                전체 리포트
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* 4. 코칭 피드백 (최상단) */}
        <FeedbackSection sentences={feedback} />

        {/* Video frame + skeleton */}
        <div className="bg-white rounded-2xl border border-gray-100 p-3">
          <div className="relative mx-auto" style={{ maxWidth: 360 }}>
            <canvas
              ref={canvasRef}
              className="w-full block rounded-xl bg-black"
              style={{ aspectRatio: frames[safeIdx] ? `${frames[safeIdx].width} / ${frames[safeIdx].height}` : "9 / 16" }}
            />
          </div>

          {/* Slider */}
          <div className="mt-4">
            <input
              type="range"
              min={0}
              max={frames.length - 1}
              value={safeIdx}
              onChange={(e) => setIdx(Number(e.target.value))}
              className="w-full accent-[#007BFF] cursor-pointer"
            />
            <p className="mt-1.5 text-xs text-gray-500">
              {safeIdx + 1} / {frames.length} 프레임{category ? ` · ${category}` : ""}
            </p>
          </div>
        </div>

        {/* 1. 관절 가동각 + 견갑-골반 분리각 (옆 배치) */}
        <div className="grid md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <p className="text-sm font-bold text-[#1A1A2E] mb-2">현재 프레임 · 관절 가동각</p>
            <div className="grid grid-cols-2 gap-2">
              {ANGLE_METRICS.map((j) => (
                <MetricCard key={j.key} label={j.label} value={ang[j.key]} rating={getRating(ang[j.key], ranges[j.key])} />
              ))}
            </div>
          </div>
          <div className="md:col-span-1 flex flex-col gap-2">
            <SeparationCard value={ang.separationAngle} rating={getRating(ang.separationAngle, ranges.separationAngle)} />
            <p className="text-[10px] text-gray-400 leading-relaxed">{SEP_DESC}</p>
          </div>
        </div>

        {/* 현재 프레임 — 정렬 지표 */}
        <div>
          <p className="text-sm font-bold text-[#1A1A2E] mb-2">현재 프레임 · 정렬 지표</p>
          <div className="grid grid-cols-2 gap-2">
            {ALIGN_METRICS.map((j) => (
              <MetricCard key={j.key} label={j.label} value={ang[j.key]} rating={getRating(ang[j.key], ranges[j.key])} />
            ))}
          </div>
        </div>

        {/* 영상 전체 요약 — 관절 가동각 */}
        <div>
          <p className="text-sm font-bold text-[#1A1A2E] mb-2">영상 전체 요약 · 관절 가동각</p>
          <div className="grid grid-cols-2 gap-2">
            {angleSummary.map((s) => (
              <SummaryCard key={s.key} label={s.label} s={s} range={ranges[s.key]} />
            ))}
          </div>
        </div>

        {/* 영상 전체 요약 — 정렬 지표 */}
        <div>
          <p className="text-sm font-bold text-[#1A1A2E] mb-2">영상 전체 요약 · 정렬 지표</p>
          <div className="grid grid-cols-2 gap-2">
            {alignSummary.map((s) => (
              <SummaryCard key={s.key} label={s.label} s={s} hint={s.hint} range={ranges[s.key]} />
            ))}
          </div>
        </div>

        {/* 영상 전체 요약 — 분리각 (최대값 프레임 표시) */}
        <div>
          <p className="text-sm font-bold text-[#1A1A2E] mb-2">영상 전체 요약 · 견갑-골반 분리각</p>
          <div className="bg-white rounded-lg border-2 p-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-[11px] text-gray-400">최소</p>
                <p className="text-xl font-bold text-gray-800">{sepSummary.min == null ? "—" : `${sepSummary.min}°`}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400">평균</p>
                <p className="text-xl font-bold text-[#1A1A2E]">{sepSummary.avg == null ? "—" : `${sepSummary.avg}°`}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400">최대</p>
                <p className="text-xl font-bold text-[#FF6B4A]">
                  {sepSummary.max == null ? "—" : `${sepSummary.max}°`}
                </p>
                {sepSummary.maxFrame != null && (
                  <p className="text-[10px] text-gray-400">프레임 {sepSummary.maxFrame}</p>
                )}
              </div>
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed mt-3">{SEP_DESC}</p>
          </div>
        </div>

        {/* 영상 전체 요약 — 좌우 비대칭 */}
        <div>
          <p className="text-sm font-bold text-[#1A1A2E] mb-2">좌우 비대칭 지표 · |좌 − 우|</p>
          {asymSummary.every((s) => s.avg == null) ? (
            <div className="bg-white rounded-lg border-2 border-gray-200 p-3">
              <p className="text-xs text-gray-400">양측 관절을 모두 인식한 프레임이 필요합니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {asymSummary.map((s) => (
                <SummaryCard
                  key={s.label}
                  label={s.label}
                  s={s}
                  ratingOverride={asymRating(s.avg)}
                />
              ))}
            </div>
          )}
        </div>

        {/* 3. 각도 변화 그래프 */}
        <AngleGraph frames={frames} selectedIdx={safeIdx} onSelectFrame={setIdx} />
      </div>
    </div>
  );
}