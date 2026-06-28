import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, RotateCcw, X, Scan, Image, Lightbulb, Video, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useLang, T } from "@/lib/LanguageContext";

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

// Extract a frame from a video file at a given time (seconds)
function extractVideoFrame(file, timeSeconds = 1) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.crossOrigin = "anonymous";
    const url = URL.createObjectURL(file);
    video.src = url;
    video.addEventListener("loadeddata", () => {
      video.currentTime = Math.min(timeSeconds, video.duration * 0.3);
    });
    video.addEventListener("seeked", () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        resolve(blob);
      }, "image/jpeg", 0.92);
    });
    video.addEventListener("error", (e) => { URL.revokeObjectURL(url); reject(e); });
  });
}

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
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const handleImageFile = async (file) => {
    if (!file) return;
    setError(null);
    setPreview(URL.createObjectURL(file));
    setPreviewType("image");
    await runAnalysis(file);
  };

  const handleVideoFile = async (file) => {
    if (!file) return;
    setError(null);
    setPreview(URL.createObjectURL(file));
    setPreviewType("video");
    try {
      setUploading(true);
      const frame = await extractVideoFrame(file, 1);
      await runAnalysis(frame);
    } catch (e) {
      setUploading(false);
      setAnalyzing(false);
      setError("영상에서 프레임 추출에 실패했습니다: " + e.message);
    }
  };

  const runAnalysis = async (fileOrBlob) => {
    try {
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file: fileOrBlob });
      setUploading(false);
      setAnalyzing(true);
      const response = await base44.functions.invoke("analyzePosture", {
        imageUrl: file_url,
        view,
        category,
      });
      setAnalyzing(false);
      if (response.data?.success) {
        // Save record
        try {
          const me = await base44.auth.me();
          await base44.entities.AnalysisRecord.create({
            user_id: me.id,
            category,
            view,
            image_url: file_url,
            overall_score: response.data.result?.overallScore,
            result: response.data.result,
          });
        } catch { /* not logged in, skip save */ }
        navigate("/report", { state: { result: response.data.result, imageUrl: file_url } });
      } else {
        setError(response.data?.error || "분석 중 오류가 발생했습니다.");
      }
    } catch (e) {
      setUploading(false);
      setAnalyzing(false);
      setError(e.message || "오류가 발생했습니다.");
    }
  };

  const reset = () => {
    setPreview(null);
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
            if (step === "view") setStep("category");
            else if (step === "capture") { setStep("view"); reset(); }
            else navigate("/");
          }} className="text-gray-400 hover:text-[#1A1A2E] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-[#1A1A2E]">{T.analyzeTitle[lang]}</h1>
            <p className="text-xs text-gray-400">
              {step === "category" ? "종목 선택" : step === "view" ? T.viewSelect[lang] : T.photoInput[lang]}
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
          {["category", "view", "capture"].map((s, i) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all ${
              s === step ? "bg-[#FF6B4A]" : i < ["category","view","capture"].indexOf(step) ? "bg-orange-200" : "bg-gray-100"
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
                  <button key={cat.key} onClick={() => { setCategory(cat.key); setStep("view"); }}
                    className="bg-white rounded-2xl p-4 text-left border-2 border-gray-100 hover:border-[#FF6B4A] hover:bg-orange-50 transition-all group">
                    <span className="text-3xl mb-2 block">{cat.emoji}</span>
                    <p className="text-sm font-bold text-[#1A1A2E] group-hover:text-[#FF6B4A]">{cat.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{cat.desc}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: View */}
          {step === "view" && (
            <motion.div key="view" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{T.viewSelect[lang]}</p>
              <div className="grid grid-cols-2 gap-3">
                {views.map((v) => (
                  <button key={v.key} onClick={() => setView(v.key)}
                    className={`rounded-2xl p-5 text-left border-2 transition-all ${
                      view === v.key ? "border-[#FF6B4A] bg-orange-50" : "border-gray-100 bg-white hover:border-gray-200"
                    }`}>
                    <p className={`text-base font-bold mb-1 ${view === v.key ? "text-[#FF6B4A]" : "text-[#1A1A2E]"}`}>{v.label}</p>
                    <p className="text-xs text-gray-400 leading-relaxed">{v.desc}</p>
                  </button>
                ))}
              </div>
              <button onClick={() => setStep("capture")}
                className="w-full mt-4 bg-[#FF6B4A] hover:bg-[#e55a3a] text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-orange-200/40">
                다음 — 사진/영상 입력
                <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* Step 3: Capture */}
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
                          <p className="text-xs text-gray-400 mt-0.5">프레임 자동 추출</p>
                        </div>
                      </button>
                    </div>

                    <div className="mt-3 bg-purple-50 border border-purple-100 rounded-xl px-4 py-3">
                      <p className="text-xs text-purple-700 font-medium">💡 동영상 분석 방법</p>
                      <p className="text-xs text-purple-500 mt-1">동영상을 업로드하면 최적의 프레임을 자동으로 추출해 AI가 분석합니다. 영상 전체를 저장하지 않아 빠르고 가볍습니다.</p>
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
                            {uploading
                              ? (previewType === "video" ? "프레임 추출 중..." : T.uploading[lang])
                              : T.analyzing[lang]}
                          </p>
                          <p className="text-white/50 text-xs mt-1">{analyzing ? T.analyzingDesc[lang] : T.waitDesc[lang]}</p>
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