import React, { useEffect, useRef, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import { drawSkeleton } from "@/lib/poseDraw";
import { frameAngles } from "@/lib/biomechanics";

const JOINTS = [
  { key: "leftElbow", label: "왼쪽 팔꿈치" },
  { key: "rightElbow", label: "오른쪽 팔꿈치" },
  { key: "leftKnee", label: "왼쪽 무릎" },
  { key: "rightKnee", label: "오른쪽 무릎" },
];

function summarize(values) {
  if (!values.length) return { min: null, max: null, avg: null };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = Math.round(values.reduce((s, v) => s + v, 0) / values.length);
  return { min, max, avg };
}

function MetricCard({ label, value }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-800 mt-1">{value == null ? "—" : `${value}°`}</p>
    </div>
  );
}

function SummaryCard({ label, s }) {
  const text = [s.min, s.max, s.avg].some((v) => v == null)
    ? "데이터 없음"
    : `최소 ${s.min}° · 최대 ${s.max}° · 평균 ${s.avg}°`;
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <p className="text-sm font-bold text-gray-800">{label}</p>
      <p className="text-xs text-gray-500 mt-1">{text}</p>
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
  const summaries = JOINTS.map((j) => {
    const vals = frames
      .map((f) => frameAngles(f.landmarks)[j.key])
      .filter((v) => v != null);
    return { ...j, ...summarize(vals) };
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
          {result && (
            <Link
              to="/report"
              state={{ result, imageUrl }}
              className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-[#FF6B4A] bg-orange-50 px-3 py-1.5 rounded-full hover:bg-orange-100 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              전체 리포트
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
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

        {/* Current frame metrics */}
        <div>
          <p className="text-sm font-bold text-[#1A1A2E] mb-3">현재 프레임</p>
          <div className="grid grid-cols-2 gap-3">
            {JOINTS.map((j) => (
              <MetricCard key={j.key} label={j.label} value={ang[j.key]} />
            ))}
          </div>
        </div>

        {/* Summary */}
        <div>
          <p className="text-sm font-bold text-[#1A1A2E] mb-3">영상 전체 요약</p>
          <div className="grid grid-cols-2 gap-3">
            {summaries.map((s) => (
              <SummaryCard key={s.key} label={s.label} s={s} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}