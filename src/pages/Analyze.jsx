import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, RotateCcw, X, Scan, Image, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useLang, T } from "@/lib/LanguageContext";

const VIEWS = (lang) => [
  { key: "front", label: T.frontView[lang], desc: T.frontDesc[lang] },
  { key: "side",  label: T.sideView[lang],  desc: T.sideDesc[lang] },
];

export default function Analyze() {
  const navigate = useNavigate();
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
    setPreview(URL.createObjectURL(file));
    try {
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUploading(false);
      setAnalyzing(true);
      const response = await base44.functions.invoke("analyzePosture", { imageUrl: file_url, view });
      setAnalyzing(false);
      if (response.data?.success) {
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

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link to="/" className="text-gray-400 hover:text-[#1A1A2E] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-base font-bold text-[#1A1A2E]">{T.analyzeTitle[lang]}</h1>
            <p className="text-xs text-gray-400">{T.analyzeSubtitle[lang]}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* View Selector */}
        {!preview && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{T.viewSelect[lang]}</p>
            <div className="grid grid-cols-2 gap-3">
              {views.map((v) => (
                <button
                  key={v.key}
                  onClick={() => setView(v.key)}
                  className={`rounded-2xl p-5 text-left border-2 transition-all ${
                    view === v.key
                      ? "border-[#FF6B4A] bg-orange-50"
                      : "border-gray-100 bg-white hover:border-gray-200"
                  }`}
                >
                  <p className={`text-base font-bold mb-1 ${view === v.key ? "text-[#FF6B4A]" : "text-[#1A1A2E]"}`}>
                    {v.label}
                  </p>
                  <p className="text-xs text-gray-400 leading-relaxed">{v.desc}</p>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Camera / Upload area */}
        {!preview ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{T.photoInput[lang]}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="group flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-gray-200 bg-white p-10 hover:border-[#FF6B4A] hover:bg-orange-50 transition-all"
              >
                <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center group-hover:bg-[#FF6B4A] transition-colors">
                  <Camera className="w-8 h-8 text-[#FF6B4A] group-hover:text-white transition-colors" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-[#1A1A2E]">{T.cameraBtn[lang]}</p>
                  <p className="text-xs text-gray-400 mt-1">{T.cameraDesc[lang]}</p>
                </div>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="group flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-gray-200 bg-white p-10 hover:border-blue-400 hover:bg-blue-50 transition-all"
              >
                <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                  <Image className="w-8 h-8 text-blue-500 group-hover:text-white transition-colors" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-[#1A1A2E]">{T.galleryBtn[lang]}</p>
                  <p className="text-xs text-gray-400 mt-1">{T.galleryDesc[lang]}</p>
                </div>
              </button>
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="relative rounded-2xl overflow-hidden bg-black shadow-lg">
              <img src={preview} alt="촬영된 사진" className="w-full max-h-[60vh] object-contain" />
              {isLoading && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-white/20 border-t-[#FF6B4A] rounded-full animate-spin" />
                    <Scan className="w-6 h-6 text-white absolute inset-0 m-auto" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-bold text-base">{uploading ? T.uploading[lang] : T.analyzing[lang]}</p>
                    <p className="text-white/50 text-xs mt-1">{analyzing ? T.analyzingDesc[lang] : T.waitDesc[lang]}</p>
                  </div>
                </div>
              )}
              {!isLoading && (
                <button
                  onClick={reset}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  <RotateCcw className="w-4 h-4 text-white" />
                </button>
              )}
            </div>
            {!isLoading && !error && (
              <p className="text-center text-xs text-gray-400 mt-3">{T.retakeHint[lang]}</p>
            )}
          </motion.div>
        )}

        {/* Error */}
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

        {/* Tips */}
        {!preview && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-5 border border-gray-100">
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
          </motion.div>
        )}
      </div>
    </div>
  );
}