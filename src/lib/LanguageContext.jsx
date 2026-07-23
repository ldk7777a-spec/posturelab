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

  // ── Landing feature cards ───────────────────────────────────────────────
  featCapture:    { ko: "자신감 있게 캡처", en: "Capture with Confidence" },
  featCaptureDesc:{ ko: "어떤 기기로든 2D/3D로 기록하세요. 고속 캡처로 디테일을 놓치지 않습니다.", en: "Record in 2D or 3D with any device. High-frame-rate capture ensures no detail is missed." },
  featAI:         { ko: "AI 기반 분석", en: "AI-Powered Analysis" },
  featAIDesc:     { ko: "AI가 핵심 생체역학을 감지·추적해 즉시 실행 가능한 인사이트를 보여줍니다.", en: "Our AI detects and tracks key biomechanics to surface actionable insights instantly." },
  featTrack:      { ko: "시간에 따른 진척 추적", en: "Track Progress Over Time" },
  featTrackDesc:  { ko: "개선을 모니터링하고 세션을 비교하며 의미 있는 데이터로 더 나은 프로그램을 만드세요.", en: "Monitor improvements, compare sessions, and build better programs with data that matters." },

  // ── Measurement grid ─────────────────────────────────────────────────────
  measureEyebrow: { ko: "종합 분석", en: "Comprehensive Analysis" },
  measureTitle:   { ko: "모든 관절, 모든 각도.", en: "Every joint. Every angle." },
  measureDesc:    { ko: "머리부터 발끝까지 전신 동작사슬을 아우르는 7가지 측정 카테고리.", en: "Seven measurement categories covering the full kinetic chain, from head to toe." },
  measureCats: {
    ko: [
      { key: "spine", label: "척추", sub: "정렬 및 만곡" },
      { key: "shoulders", label: "어깨", sub: "가동성과 대칭" },
      { key: "pelvis", label: "골반", sub: "기울기와 회전" },
      { key: "knees", label: "무릎", sub: "추적과 외반" },
      { key: "feet", label: "발", sub: "착지와 회내" },
      { key: "dynamic", label: "동적 분석", sub: "전 동작사슬" },
      { key: "breathing", label: "호흡", sub: "호흡 역학" },
    ],
    en: [
      { key: "spine", label: "Spine", sub: "Alignment & Curvature" },
      { key: "shoulders", label: "Shoulders", sub: "Mobility & Symmetry" },
      { key: "pelvis", label: "Pelvis", sub: "Tilt & Rotation" },
      { key: "knees", label: "Knees", sub: "Tracking & Valgus" },
      { key: "feet", label: "Feet", sub: "Strike & Pronation" },
      { key: "dynamic", label: "Dynamic Analysis", sub: "Full Kinetic Chain" },
      { key: "breathing", label: "Breathing", sub: "Respiratory Mechanics" },
    ],
  },

  // ── Pricing ─────────────────────────────────────────────────────────────
  pricing: {
    ko: {
      eyebrow: "요금제", title: "모든 수준을 위한 플랜", desc: "무료로 시작하고 준비되면 업그레이드하세요. 숨은 비용 없음.",
      monthly: "월간", yearly: "연간", save: "17% 할인", perMonth: "/ 월", popular: "가장 인기",
      plans: [
        { name: "Free", desc: "시작하는 개인용", cta: "시작하기", features: ["월 5회 분석", "2D 캡처만", "기본 관절 추적", "선수 프로필 1개", "커뮤니티 지원"] },
        { name: "Pro", desc: "코치와 전문가용", cta: "무료 체험 시작", features: ["무제한 분석", "2D + 3D 캡처", "전체 생체역학 도구", "선수 프로필 25개", "진행 추적 및 리포트", "우선 지원", "PDF / CSV 내보내기"] },
        { name: "Team", desc: "클리닉과 조직용", cta: "영업팀 문의", features: ["Pro의 모든 기능", "무제한 선수 프로필", "다중 코치 협업", "엔터프라이즈 보안", "맞춤 브랜딩", "API 액세스", "전담 계정 매니저"] },
      ],
    },
    en: {
      eyebrow: "Pricing", title: "Plans for every level", desc: "Start free, upgrade when you're ready. No surprise fees.",
      monthly: "Monthly", yearly: "Yearly", save: "Save 17%", perMonth: "/ month", popular: "Most Popular",
      plans: [
        { name: "Free", desc: "For individuals getting started", cta: "Get Started", features: ["5 analyses per month", "2D capture only", "Basic joint tracking", "1 athlete profile", "Community support"] },
        { name: "Pro", desc: "For coaches and practitioners", cta: "Start Free Trial", features: ["Unlimited analyses", "2D + 3D capture", "Full biomechanics suite", "25 athlete profiles", "Progress tracking & reports", "Priority support", "Export to PDF / CSV"] },
        { name: "Team", desc: "For clinics and organizations", cta: "Contact Sales", features: ["Everything in Pro", "Unlimited athlete profiles", "Multi-coach collaboration", "Enterprise-grade security", "Custom branding", "API access", "Dedicated account manager"] },
      ],
    },
  },

  // ── Footer ───────────────────────────────────────────────────────────────
  footer: {
    ko: {
      tagline: "코치와 선수를 위한 AI 기반 동작 분석.",
      columns: [
        { title: "제품", links: ["기능", "요금제", "연동", "변경 이력", "로드맵"] },
        { title: "리소스", links: ["문서", "블로그", "사례", "웨비나", "헬프 센터"] },
        { title: "회사", links: ["소개", "채용", "문의", "파트너", "보도자료"] },
        { title: "법적", links: ["개인정보처리방침", "이용약관", "보안", "GDPR"] },
      ],
      copyright: "© 2026 PostureLab. All rights reserved.",
      privacy: "개인정보", terms: "약관", cookies: "쿠키",
    },
    en: {
      tagline: "AI-powered motion analysis for coaches and athletes.",
      columns: [
        { title: "Product", links: ["Features", "Pricing", "Integrations", "Changelog", "Roadmap"] },
        { title: "Resources", links: ["Documentation", "Blog", "Case Studies", "Webinars", "Help Center"] },
        { title: "Company", links: ["About Us", "Careers", "Contact", "Partners", "Press"] },
        { title: "Legal", links: ["Privacy Policy", "Terms of Service", "Security", "GDPR"] },
      ],
      copyright: "© 2026 PostureLab. All rights reserved.",
      privacy: "Privacy", terms: "Terms", cookies: "Cookies",
    },
  },

  // ── Final CTA ───────────────────────────────────────────────────────────
  finalCTA: {
    ko: { title: "분석을 시작하세요", desc: "2,000+ 코치·선수가 AI 인사이트로 동작을 개선하고 있습니다.", start: "무료 체험 시작", demo: "데모 예약" },
    en: { title: "Start your analysis", desc: "Join 2,000+ coaches and athletes already improving movement with AI-powered insights.", start: "Start Free Trial", demo: "Book a Demo" },
  },

  // ── Posture compare ──────────────────────────────────────────────────────
  beforeAfter:       { ko: "비교", en: "Before & After" },
  compareTitle:      { ko: "PostureLab이 만드는 차이", en: "See the difference PostureLab makes" },
  compareDesc:       { ko: "슬라이더를 드래그해 교정 전·후 자세를 비교하세요.", en: "Drag the slider to compare posture before and after guided correction." },
  compareBeforeLabel:{ ko: "굽은 어깨 · 전방 머리 자세", en: "Rounded shoulders · forward head" },
  compareAfterLabel: { ko: "중립 척추 · 균형 잡힌 골반", en: "Neutral spine · balanced pelvis" },
  compareSpineImp:   { ko: "척추 개선", en: "Spine Improvement" },
  compareShoulBal:   { ko: "어깨 균형", en: "Shoulder Balance" },
  compareSessions:   { ko: "달성 기간", en: "Sessions to Achieve" },
  weeks:             { ko: "6주", en: "6 weeks" },

  // ── Analyze page categories + misc ──────────────────────────────────────
  catSelect:    { ko: "분석 종목 선택", en: "Select a sport" },
  stepSelect:   { ko: "종목 선택",  en: "Category" },
  videoUpload:  { ko: "동영상 업로드", en: "Upload Video" },
  videoUploadDesc: { ko: "동작 흐름 분석", en: "Analyze movement flow" },
  localAiTitle: { ko: "기기 내 자세 AI 분석", en: "On-device pose AI" },
  localAiDesc:  { ko: "MediaPipe Pose가 브라우저에서 33개 관절을 직접 추적해 점수를 산출합니다. 동영상 분석 시 원본 영상과 프레임(관절 좌표) 데이터가 저장되어 히스토리에서 다시 볼 수 있습니다.", en: "MediaPipe Pose tracks 33 joints directly in your browser to compute scores. For video analysis, the original clip and frame (joint coordinate) data are saved so you can revisit them from history." },
  savingResult: { ko: "결과 저장 중...", en: "Saving..." },
  extractingJoints: { ko: "관절 추출 중...", en: "Extracting joints..." },
  pleaseWait:  { ko: "잠시만 기다려 주세요", en: "Please wait" },
  mediapipeWorking: { ko: "MediaPipe가 기기에서 자세를 분석하고 있어요", en: "MediaPipe is analyzing your pose on-device" },
  analyzeCats: {
    ko: [
      { key: "general", label: "일반 자세", desc: "기본 정적 자세 분석" },
      { key: "soccer", label: "축구", desc: "킥 자세, 달리기 폼" },
      { key: "baseball", label: "야구", desc: "타격, 투구, 수비 자세" },
      { key: "running", label: "달리기", desc: "보행 주기, 발 착지" },
      { key: "walking", label: "걷기", desc: "보행 자세, 무게 중심" },
      { key: "pilates", label: "필라테스", desc: "코어 정렬, 호흡 패턴" },
      { key: "yoga", label: "요가", desc: "관절 유연성, 균형" },
      { key: "golf", label: "골프", desc: "스윙 자세, 허리 회전" },
      { key: "swimming", label: "수영", desc: "스트로크 자세, 체간" },
      { key: "cycling", label: "사이클", desc: "안장 자세, 무릎 추적" },
      { key: "basketball", label: "농구", desc: "점프 착지, 수비 자세" },
      { key: "tennis", label: "테니스", desc: "서브, 스윙 메카닉" },
    ],
    en: [
      { key: "general", label: "General", desc: "Basic static posture analysis" },
      { key: "soccer", label: "Soccer", desc: "Kick form & running mechanics" },
      { key: "baseball", label: "Baseball", desc: "Hitting, pitching & fielding" },
      { key: "running", label: "Running", desc: "Gait cycle & foot strike" },
      { key: "walking", label: "Walking", desc: "Gait posture & center of mass" },
      { key: "pilates", label: "Pilates", desc: "Core alignment & breathing" },
      { key: "yoga", label: "Yoga", desc: "Joint mobility & balance" },
      { key: "golf", label: "Golf", desc: "Swing & trunk rotation" },
      { key: "swimming", label: "Swimming", desc: "Stroke & trunk control" },
      { key: "cycling", label: "Cycling", desc: "Saddle posture & knee tracking" },
      { key: "basketball", label: "Basketball", desc: "Jump landing & defense" },
      { key: "tennis", label: "Tennis", desc: "Serve & swing mechanics" },
    ],
  },

  // ── Movement report (step 1) ─────────────────────────────────────────────
  eventSectionTitle:  { ko: "이벤트 프레임", en: "Event Frames" },
  eventLoad:          { ko: "로드", en: "Load" },
  eventFirstMove:     { ko: "첫 움직임", en: "First Move" },
  eventFootPlant:     { ko: "발 착지", en: "Foot Plant" },
  eventContact:       { ko: "컨택", en: "Contact" },
  eventContactHint:   { ko: "배트-공 접촉은 자동 감지가 불가해 현재 프레임을 직접 지정합니다.", en: "Bat-ball contact can't be auto-detected — mark the current frame manually." },
  setContact:         { ko: "현재 프레임을 컨택으로 지정", en: "Mark current frame as contact" },
  notSet:             { ko: "미지정", en: "Not set" },
  notDetected:        { ko: "감지 불가", en: "Not detected" },
  trafficTitle:       { ko: "신호등 지표", en: "Traffic-Light Metrics" },
  levelNormal:        { ko: "정상", en: "Normal" },
  levelCaution:       { ko: "주의", en: "Caution" },
  levelRisk:          { ko: "위험", en: "Risk" },
  levelUnknown:       { ko: "데이터 없음", en: "No data" },
  metricSeparation:   { ko: "견갑-골반 분리각 (최대)", en: "Hip-Shoulder Separation (peak)" },
  metricTrunkLean:    { ko: "트렁크 기울기 (최대)", en: "Trunk Lean (max)" },
  metricShoulderTilt: { ko: "어깨 기울기 (편차)", en: "Shoulder Tilt (range)" },
  metricPelvicTilt:   { ko: "골반 기울기 (편차)", en: "Pelvic Tilt (range)" },
};

// Pure traffic-light judgment module — independent of UI/i18n. Shared by all steps.
export { judge, judgeMovement, MOVEMENT_SPECS, LEVELS } from "@/lib/judgment";