import React, { createContext, useContext, useState } from "react";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("posturelab_lang") || "ko");

  const toggleLang = () => {
    const next = lang === "ko" ? "en" : "ko";
    setLang(next);
    localStorage.setItem("posturelab_lang", next);
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}

export const T = {
  // Header
  signIn:       { ko: "로그인",      en: "Sign in" },
  startTrial:   { ko: "무료 체험",   en: "Start Free Trial" },
  // Analyze page
  analyzeTitle: { ko: "AI 자세 분석",              en: "AI Posture Analysis" },
  analyzeSubtitle: { ko: "사진을 촬영하거나 업로드하세요", en: "Take or upload a photo" },
  viewSelect:   { ko: "촬영 방향 선택",             en: "Select View" },
  frontView:    { ko: "정면",                      en: "Front" },
  frontDesc:    { ko: "카메라를 정면으로 바라보고 전신이 보이도록 서주세요.", en: "Stand facing the camera so your full body is visible." },
  sideView:     { ko: "측면",                      en: "Side" },
  sideDesc:     { ko: "몸 옆면이 카메라를 향하도록 서주세요.", en: "Stand sideways so your body profile is visible." },
  photoInput:   { ko: "사진 입력",                 en: "Photo Input" },
  cameraBtn:    { ko: "카메라 촬영",               en: "Take Photo" },
  cameraDesc:   { ko: "지금 바로 촬영하기",         en: "Capture right now" },
  galleryBtn:   { ko: "사진 불러오기",             en: "Load Photo" },
  galleryDesc:  { ko: "갤러리에서 선택",            en: "Choose from gallery" },
  uploading:    { ko: "업로드 중...",              en: "Uploading..." },
  analyzing:    { ko: "AI 분석 중...",             en: "Analyzing..." },
  analyzingDesc:{ ko: "자세 데이터를 처리하고 있습니다", en: "Processing posture data" },
  waitDesc:     { ko: "잠시만 기다려주세요",        en: "Please wait" },
  retakeHint:   { ko: "다시 찍으려면 우측 상단 버튼을 누르세요", en: "Tap the top-right button to retake" },
  analysisFail: { ko: "분석 실패",                 en: "Analysis Failed" },
  retry:        { ko: "다시 시도",                 en: "Retry" },
  tipsTitle:    { ko: "정확한 분석을 위한 팁",      en: "Tips for Accurate Analysis" },
  tips: {
    ko: [
      "벽이나 단색 배경 앞에 서주세요",
      "전신(머리~발)이 모두 나오도록 촬영하세요",
      "편안하고 자연스러운 자세를 유지하세요",
      "밝은 환경에서 촬영하면 정확도가 높아집니다",
    ],
    en: [
      "Stand in front of a wall or plain background",
      "Make sure your full body (head to feet) is in frame",
      "Keep a natural, relaxed posture",
      "Good lighting improves accuracy",
    ],
  },
  // Report page
  reportTitle:  { ko: "자세 분석 리포트",          en: "Posture Analysis Report" },
  aiLabel:      { ko: "AI 분석",                  en: "AI Analysis" },
  sampleLabel:  { ko: "샘플 데이터",               en: "Sample Data" },
  overallScore: { ko: "종합 자세 점수",            en: "Overall Posture Score" },
  scoreExcellent:{ ko: "우수 — 잘 유지하세요!",   en: "Excellent — Keep it up!" },
  scoreGood:    { ko: "양호 — 개선 여지 있음",     en: "Good — Room to improve" },
  scoreWarn:    { ko: "주의 필요 — 교정 권장",     en: "Attention needed — Correction advised" },
  analyzedImage:{ ko: "분석된 이미지",             en: "Analyzed Image" },
  summaryLabel:  { ko: "분석 요약",                 en: "Summary" },
  catSpine:      { ko: "척추",                      en: "Spine" },
  catShoulders:  { ko: "어깨",                      en: "Shoulders" },
  catPelvis:     { ko: "골반",                      en: "Pelvis" },
  catKnees:      { ko: "무릎",                      en: "Knees" },
  catFeet:       { ko: "발·족부",                   en: "Feet" },
  categoryBalance:{ ko: "카테고리별 균형",         en: "Category Balance" },
  categoryAnalysis:{ ko: "카테고리별 분석",        en: "Category Analysis" },
  priorities:   { ko: "우선 교정 항목",            en: "Top Priorities" },
  coachingGuide:{ ko: "AI 코칭 가이드",            en: "AI Coaching Guide" },
  bookCTA:      { ko: "전문가와 함께 교정하세요",   en: "Correct with a Professional" },
  bookDesc:     { ko: "인증된 PostureLab 트레이너와 1:1 상담을 예약하세요.", en: "Book a 1:1 session with a certified PostureLab trainer." },
  bookBtn:      { ko: "상담 예약하기",             en: "Book a Session" },
  severityHigh: { ko: "높음",  en: "High" },
  severityMid:  { ko: "보통",  en: "Medium" },
  severityLow:  { ko: "낮음",  en: "Low" },
  backHome:     { ko: "홈으로", en: "Home" },
  equipmentFlag:{ ko: "장비/영상 필요 항목 포함", en: "Requires equipment/video" },
  // Landing page
  heroTagline:  { ko: "AI 기반 동작 분석", en: "AI-Powered Motion Analysis" },
  heroTitle1:   { ko: "모든 동작을 보고,", en: "See every rep." },
  heroTitle2:   { ko: "모든 움직임을 개선하세요.", en: "Improve every move." },
  heroDesc:     { ko: "PostureLab은 코치와 선수가 AI 기반 인사이트로 동작을 캡처·분석·개선하도록 돕습니다.", en: "PostureLab helps coaches and athletes capture, analyze, and improve movement with AI-powered insights you can trust." },
  heroAnalyzeBtn:{ ko: "지금 분석하기", en: "Analyze Now" },
  heroDemo:     { ko: "데모 예약", en: "Book a Demo" },
  badge1:       { ko: "신용카드 불필요", en: "No credit card required" },
  badge2:       { ko: "안전 & 프라이빗", en: "Secure & private" },
  badge3:       { ko: "2,000+ 코치 사용 중", en: "Used by 2,000+ coaches" },
  // MeasurementDetail page
  measuredParams: { ko: "측정 파라미터",          en: "Measured Parameters" },
  howMeasured:    { ko: "측정 방법",              en: "How It's Measured" },
  clinicBenefits: { ko: "임상 및 성능 이점",       en: "Clinical & Performance Benefits" },
  backBtn:        { ko: "뒤로",                   en: "Back" },
  notFound:       { ko: "측정 항목을 찾을 수 없습니다.", en: "Measurement not found." },
};