import React, { useRef, useState } from "react";
import { Camera, Upload, X, RotateCcw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useLang } from "@/lib/LanguageContext";
import { getPoseLandmarker } from "@/lib/poseLandmarker";
import { analyzeImage, loadImage } from "@/lib/poseAnalysis";
import { analyzePostureLocal } from "@/lib/biomechanics";
import { drawSkeleton } from "@/lib/poseDraw";

const VIEWS = [
  { key: "front", label: "정면" },
  { key: "side", label: "측면" },
];

export default function ImageUploader({ onAnalysisComplete, accentColor = "#FF6B4A" }) {
  const { lang } = useLang();
  const [view, setView] = useState("front");
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setError(null);
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    try {
      setAnalyzing(true);
      setUploading(false);
      const landmarker = await getPoseLandmarker();
      if (!landmarker) throw new Error("AI 자세 인식 모델을 불러오지 못했습니다.");

      const img = await loadImage(file);
      const res = analyzeImage(img, landmarker);
      const landmarks = res.landmarks;
      if (!landmarks) throw new Error("이미지에서 자세를 감지하지 못했습니다. 전신이 명확히 보이도록 다시 촬영해 주세요.");

      // overlay skeleton onto the captured frame
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || 640;
      canvas.height = img.naturalHeight || 480;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      drawSkeleton(ctx, landmarks, canvas.width, canvas.height);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
      const uploadFile = new File([blob], "analysis.jpg", { type: "image/jpeg" });

      setAnalyzing(false);
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file: uploadFile });
      setUploading(false);

      const result = analyzePostureLocal(landmarks, view, lang);
      onAnalysisComplete(result, file_url);
    } catch (e) {
      setAnalyzing(false);
      setUploading(false);
      setError(e?.message || "분석 중 오류가 발생했습니다.");
    }
  };

  const reset = () => {
    setPreview(null);
    setError(null);
    setUploading(false);
    setAnalyzing(false);
  };

  const isLoading = uploading || analyzing;

  return (
    <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-[#1A1A2E]">AI 자세 분석</h3>
        {preview && !isLoading && (
          <button onClick={reset} className="text-gray-400 hover:text-gray-600 transition-colors">
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* View selector */}
      {!preview && (
        <div className="flex gap-2">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all border ${
                view === v.key
                  ? "text-white border-transparent"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
              }`}
              style={view === v.key ? { background: accentColor, borderColor: accentColor } : {}}
            >
              {v.label}
            </button>
          ))}
        </div>
      )}

      {/* Upload area / Preview */}
      {!preview ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center gap-4 bg-white">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${accentColor}15` }}>
            <Camera className="w-7 h-7" style={{ color: accentColor }} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-[#1A1A2E]">{view === "front" ? "정면" : "측면"} 사진을 업로드하세요</p>
            <p className="text-xs text-gray-400 mt-1">전신이 보이도록 촬영해주세요</p>
          </div>
          <div className="flex gap-3 w-full">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
              style={{ background: accentColor }}
            >
              <Camera className="w-4 h-4" />
              카메라 촬영
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-[#1A1A2E] bg-gray-100 hover:bg-gray-200 transition-all"
            >
              <Upload className="w-4 h-4" />
              사진 선택
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden bg-black">
          <img src={preview} alt="촬영된 사진" className="w-full max-h-72 object-contain" />
          {isLoading && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
              <p className="text-white text-sm font-medium">
                {uploading ? "업로드 중..." : "AI 분석 중..."}
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 bg-red-50 rounded-lg px-4 py-3">
          <X className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}