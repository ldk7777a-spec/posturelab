import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, RotateCcw, X, Scan, Image, Lightbulb, Video, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useLang, T } from "@/lib/LanguageContext";
import { getPoseLandmarker } from "@/lib/poseLandmarker";
import { analyzeVideo, analyzeImage, pickBestFrame, loadImage, loadImageEl } from "@/lib/poseAnalysis";
import { analyzePostureLocal } from "@/lib/biomechanics";
import { drawSkeleton } from "@/lib/poseDraw";

const CATEGORIES = [
  { key: "general",  label: "일반 자세",  emoji: "🧍", desc: "기본 정적 자세 분석" },
  { key: "soccer",   label: "축구",       emoji: "⚽", desc: "킥 자세, 달리기 폼" },
  { key: "baseball", label: "야구",       emoji: "⚾", desc: "타격, 투구, 수비 자세" },
  { key: "running",  label: "달리기",     emoji: "🏃", desc: "보행 주기, 발 착지" },
  { key: "walking",  label: "걷기",       emoji: "🚶", desc: "보행 자세, 무게 중심" },
  { key: "pilates",  label: "필라테스",   emoji: "🧘", desc: "코어 정렬, 호흡 패턴" },
  { key: "yoga",     label: "요가",       emoji: "🙏", desc: "관절 유연성, 균형" },
  { key: "golf",     label: "골프",       emoji: "⛳", desc: "스윙 자세, 허리 회전" },
  { key: "swimming", label: "수영",       emoji: "🏊", desc: "스트로크 자세, 체간" },
  { key: "cycling",  label: "사이클",     emoji: "🚴", desc: "안장 자세, 무릎 추적" },
  { key: "basketball", label: "농구",     emoji: "🏀", desc: "점프 착지, 수비 자세" },
  { key: "tennis",   label: "테니스",     emoji: "🎾", desc: "서브, 스윙 메카닉" },
];

const VIEWS = (lang) => [
  { key: "front", label: T.frontView[lang], desc: T.frontDesc[lang] },
  { key: "side",  label: T.sideView[lang],  desc: T.sideDesc[lang] },
];

export default function Analyze() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const [step, setStep] = useState("category"); // category | view | capture
  const [category, setCategory] = useState(null);
  const [view, setView] = useState("front");
  const [preview, setPreview] = useState(null);
  const [previewType, setPreviewType] = useState("image"); // image | video
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [analyzingFile, setAnalyzingFile] = useState(null); // retains the File so we can revoke safely later
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const previewUrlRef = useRef(null);

  const handleImageFile = async (file) => {
    if (!file) return;
    setError(null);
    setupPreview(file, "image");
    await runLocalAnalysis(file, "image");
  };

  const handleVideoFile = async (file) => {
    if (!file) return;
    setError(null);
    setupPreview(file, "video");
    await runLocalAnalysis(file, "video");
  };

  const setupPreview = (file, type) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const url = URL.createObjectURL(file);
    previewUrlRef.current = url;
    setAnalyzingFile(file);
    setPreview(url);
    setPreviewType(type);
  };

  const runLocalAnalysis = async (file, type) => {
    try {
      setAnalyzing(true);
      setUploading(false);
      const landmarker = await getPoseLandmarker();
      if (!landmarker) throw new Error("AI 자세 인식 모델을 불러오지 못했습니다.");
      if (!category) throw new Error("종목을 먼저 선택해 주세요.");
      if (!view) throw new Error("관점을 먼저 선택해 주세요.");

      let landmarks = null;
      let frameCanvas = null;
      let videoFrames = null;

      if (type === "video") {
        const v = document.createElement("video");
        v.src = URL.createObjectURL(file);
        v.muted = true;
        v.playsInline = true;
        await new Promise((res, rej) => {
          v.addEventListener("loadeddata", res, { once: true });
          v.addEventListener("error", rej, { once: true });
          setTimeout(() => res(), 4000);
        });
        const { frames } = await analyzeVideo(v, landmarker);
        if (!frames.length) throw new Error("영상에서 자세를 감지하지 못했습니다. 전신이 명확히 보이도록 다시 시도해 주세요.");
        videoFrames = frames;
        const best = pickBestFrame(frames);
        landmarks = best.landmarks;
        const bi = await loadImageEl(best.image);
        frameCanvas = document.createElement("canvas");
        frameCanvas.width = best.width || bi.naturalWidth || 640;
        frameCanvas.height = best.height || bi.naturalHeight || 480;
        frameCanvas.getContext("2d").drawImage(bi, 0, 0, frameCanvas.width, frameCanvas.height);
        URL.revokeObjectURL(v.src);
      } else {
        const img = await loadImage(file);
        const res = analyzeImage(img, landmarker);
        landmarks = res.landmarks;
        if (!landmarks) throw new Error("이미지에서 자세를 감지하지 못했습니다. 전신이 명확히 보이도록 다시 촬영해 주세요.");
        frameCanvas = document.createElement("canvas");
        frameCanvas.width = img.naturalWidth || 640;
        frameCanvas.height = img.naturalHeight || 480;
        frameCanvas.getContext("2d").drawImage(img, 0, 0, frameCanvas.width, frameCanvas.height);
      }

      // overlay skeleton onto the captured frame
      drawSkeleton(frameCanvas.getContext("2d"), landmarks, frameCanvas.width, frameCanvas.height);
      const blob = await new Promise((res) => frameCanvas.toBlob(res, "image/jpeg", 0.92));
      const uploadFile = new File([blob], "analysis.jpg", { type: "image/jpeg" });

      setAnalyzing(false);
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file: uploadFile });
      let video_url = null;
      let framesData = null;
      if (type === "video" && videoFrames) {
        const vres = await base44.integrations.Core.UploadFile({ file });
        video_url = vres.file_url;
        framesData = videoFrames.map((f) => ({
          time: f.time,
          width: f.width,
          height: f.height,
          landmarks: f.landmarks.map((l) => ({
            x: +Number(l.x).toFixed(3),
            y: +Number(l.y).toFixed(3),
            z: +Number(l.z || 0).toFixed(3),
            visibility: +Number(l.visibility ?? 1).toFixed(2),
          })),
        }));
      }
      setUploading(false);

      const result = analyzePostureLocal(landmarks, view, lang);

      // persist record (skips silently if not logged in)
      try {
        const me = await base44.auth.me();
        if (me?.id) {
          await base44.entities.AnalysisRecord.create({
            user_id: me.id,
            category,
            view,
            image_url: file_url,
            video_url,
            frames: framesData,
            overall_score: result.overallScore,
            result,
          });
        }
      } catch { /* not logged in — result still shown */ }

      if (videoFrames) {
        navigate("/frame-analysis", { state: { frames: videoFrames, category, view, result, imageUrl: file_url } });
      } else {
        navigate("/report", { state: { result, imageUrl: file_url } });
      }
    } catch (e) {
      setAnalyzing(false);
      setUploading(false);
      setError(e?.message || "분석 중 오류가 발생했습니다.");
    }
  };

  const reset = () => {
    if (previewUrlRef.current) { URL.revokeObjectURL(previewUrlRef.current); previewUrlRef.current = null; }
    setPreview(null);
    setAnalyzingFile(null);
    setError(null);
    setUploading(false);
    setAnalyzing(false);
  };

  const isLoading = uploading || analyzing;
  const views = VIEWS(lang);
  const selectedCat = CATEGORIES.find((c) => c.key === category);

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button onClick={() => {
            if (step === "capture") { setStep("category"); reset(); }
            else navigate("/");
          }} className="text-gray-400 hover:text-[#1A1A2E] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-[#1A1A2E]">{T.analyzeTitle[lang]}</h1>
            <p className="text-xs text-gray-400">
              {step === "category" ? "종목 선택" : T.photoInput[lang]}
            </p>
          </div>
          {step !== "category" && selectedCat && (
            <span className="ml-auto text-sm font-semibold text-[#FF6B4A] bg-orange-50 px-3 py-1 rounded-full">
              {selectedCat.emoji} {selectedCat.label}
            </span>
          )}
        </div>
        {/* Step indicator */}
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-3 flex gap-2">
          {["category", "capture"].map((s, i) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all ${
              s === step ? "bg-[#FF6B4A]" : i < ["category","capture"].indexOf(step) ? "bg-orange-200" : "bg-gray-100"
            }`} />
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Step 1: Category */}
        <AnimatePresence mode="wait">
          {step === "category" && (
            <motion.div key="cat" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">분석 종목 선택</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CATEGORIES.map((cat) => (
                  <button key={cat.key} onClick={() => { setCategory(cat.key); setStep("capture"); }}
                    className="bg-white rounded-2xl p-4 text-left border-2 border-gray-100 hover:border-[#FF6B4A] hover:bg-orange-50 transition-all group">
                    <span className="text-3xl mb-2 block">{cat.emoji}</span>
                    <p className="text-sm font-bold text-[#1A1A2E] group-hover:text-[#FF6B4A]">{cat.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{cat.desc}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Capture */}
          {step === "capture" && (
            <motion.div key="capture" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-5">

              {!preview ? (
                <>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{T.photoInput[lang]}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button onClick={() => cameraInputRef.current?.click()}
                        className="group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-white p-8 hover:border-[#FF6B4A] hover:bg-orange-50 transition-all">
                        <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center group-hover:bg-[#FF6B4A] transition-colors">
                          <Camera className="w-6 h-6 text-[#FF6B4A] group-hover:text-white" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-[#1A1A2E]">{T.cameraBtn[lang]}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{T.cameraDesc[lang]}</p>
                        </div>
                      </button>

                      <button onClick={() => fileInputRef.current?.click()}
                        className="group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-white p-8 hover:border-blue-400 hover:bg-blue-50 transition-all">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                          <Image className="w-6 h-6 text-blue-500 group-hover:text-white" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-[#1A1A2E]">{T.galleryBtn[lang]}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{T.galleryDesc[lang]}</p>
                        </div>
                      </button>

                      <button onClick={() => videoInputRef.current?.click()}
                        className="group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-white p-8 hover:border-purple-400 hover:bg-purple-50 transition-all">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center group-hover:bg-purple-500 transition-colors">
                          <Video className="w-6 h-6 text-purple-500 group-hover:text-white" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-[#1A1A2E]">동영상 업로드</p>
                          <p className="text-xs text-gray-400 mt-0.5">동작 흐름 분석</p>
                        </div>
                      </button>
                    </div>

                    <div className="mt-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                      <p className="text-xs text-emerald-700 font-medium">⚡ 기기 내 자세 AI 분석</p>
                      <p className="text-xs text-emerald-500 mt-1">MediaPipe Pose가 브라우저에서 33개 관절을 직접 추적해 점수를 산출합니다. 동영상 분석 시 원본 영상과 프레임(관절 좌표) 데이터가 저장되어 히스토리에서 다시 볼 수 있습니다.</p>
                    </div>
                  </div>

                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageFile(e.target.files[0])} />
                  <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleImageFile(e.target.files[0])} />
                  <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => handleVideoFile(e.target.files[0])} />

                  {/* Tips */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      <p className="text-sm font-bold text-[#1A1A2E]">{T.tipsTitle[lang]}</p>
                    </div>
                    <ul className="space-y-2.5">
                      {T.tips[lang].map((tip, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs text-gray-500">
                          <span className="w-5 h-5 rounded-full bg-orange-50 text-[#FF6B4A] flex items-center justify-center font-bold flex-shrink-0 text-[10px]">{i + 1}</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
                  <div className="relative rounded-2xl overflow-hidden bg-black shadow-lg">
                    {previewType === "video" ? (
                      <video src={preview} className="w-full max-h-[60vh] object-contain" controls />
                    ) : (
                      <img src={preview} alt="촬영된 사진" className="w-full max-h-[60vh] object-contain" />
                    )}
                    {isLoading && (
                      <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4">
                        <div className="relative">
                          <div className="w-16 h-16 border-4 border-white/20 border-t-[#FF6B4A] rounded-full animate-spin" />
                          <Scan className="w-6 h-6 text-white absolute inset-0 m-auto" />
                        </div>
                        <div className="text-center">
                          <p className="text-white font-bold text-base">
                            {uploading ? "결과 저장 중..." : previewType === "video" ? "관절 추출 중..." : T.analyzing[lang]}
                          </p>
                          <p className="text-white/50 text-xs mt-1">
                            {uploading ? "잠시만 기다려 주세요" : "MediaPipe가 기기에서 자세를 분석하고 있어요"}
                          </p>
                        </div>
                      </div>
                    )}
                    {!isLoading && (
                      <button onClick={reset}
                        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors">
                        <RotateCcw className="w-4 h-4 text-white" />
                      </button>
                    )}
                  </div>
                  {!isLoading && !error && (
                    <p className="text-center text-xs text-gray-400 mt-3">{T.retakeHint[lang]}</p>
                  )}
                </motion.div>
              )}

              {error && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  <X className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-700">{T.analysisFail[lang]}</p>
                    <p className="text-xs text-red-500 mt-0.5">{error}</p>
                  </div>
                  <button onClick={reset} className="ml-auto text-xs text-red-400 hover:text-red-600 font-medium">{T.retry[lang]}</button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}