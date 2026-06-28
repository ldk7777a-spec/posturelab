import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, User, BarChart2, Calendar, TrendingUp, Edit2, Save, X, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { useLang } from "@/lib/LanguageContext";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const SPORT_LABELS = {
  general: "일반 자세", soccer: "축구", baseball: "야구", running: "달리기",
  walking: "걷기", pilates: "필라테스", yoga: "요가", golf: "골프",
  swimming: "수영", cycling: "사이클", basketball: "농구", tennis: "테니스",
};

export default function MyPage() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [records, setRecords] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("history");

  useEffect(() => {
    const load = async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        const profiles = await base44.entities.UserProfile.filter({ user_id: me.id });
        if (profiles.length > 0) {
          setProfile(profiles[0]);
          setEditData(profiles[0]);
        } else {
          setEditData({ full_name: me.full_name, user_id: me.id });
        }
        const recs = await base44.entities.AnalysisRecord.filter({ user_id: me.id }, "-created_date", 50);
        setRecords(recs);
      } catch {
        navigate("/");
      }
    };
    load();
  }, [navigate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (profile) {
        const updated = await base44.entities.UserProfile.update(profile.id, editData);
        setProfile(updated);
      } else {
        const created = await base44.entities.UserProfile.create({ ...editData, user_id: user.id });
        setProfile(created);
      }
      setEditMode(false);
    } catch (e) {
      alert("저장 실패: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    base44.auth.logout("/");
  };

  const avgScore = records.length > 0
    ? Math.round(records.reduce((s, r) => s + (r.overall_score || 0), 0) / records.length)
    : 0;

  const scoreHistory = records.slice(0, 10).reverse().map((r, i) => ({
    idx: i + 1,
    score: r.overall_score || 0,
    date: new Date(r.created_date).toLocaleDateString("ko-KR", { month: "short", day: "numeric" }),
  }));

  const catScores = {};
  records.forEach((r) => {
    if (r.result?.categories) {
      Object.entries(r.result.categories).forEach(([k, v]) => {
        if (!catScores[k]) catScores[k] = [];
        catScores[k].push(v.score || 0);
      });
    }
  });
  const radarData = Object.entries(catScores).map(([k, arr]) => ({
    subject: { spine: "척추", shoulders: "어깨", pelvis: "골반", knees: "무릎", feet: "발" }[k] || k,
    score: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length),
  }));

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-[#FF6B4A] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-gray-500 hover:text-[#1A1A2E] text-sm font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" />
            홈
          </Link>
          <span className="text-sm font-bold text-[#1A1A2E]">마이페이지</span>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors">
            <LogOut className="w-3.5 h-3.5" />
            로그아웃
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Profile card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF6B4A] to-[#ff8a70] flex items-center justify-center text-white text-2xl font-bold">
                {(user.full_name || "U")[0].toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#1A1A2E]">{user.full_name}</h2>
                <p className="text-sm text-gray-400">{user.email}</p>
                {profile?.sport && (
                  <span className="inline-block mt-1 text-xs bg-orange-50 text-[#FF6B4A] font-semibold px-2.5 py-0.5 rounded-full">
                    {SPORT_LABELS[profile.sport] || profile.sport}
                  </span>
                )}
              </div>
            </div>
            <button onClick={() => setEditMode(!editMode)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#FF6B4A] border border-gray-200 px-3 py-2 rounded-lg transition-colors">
              <Edit2 className="w-3.5 h-3.5" />
              수정
            </button>
          </div>

          {editMode ? (
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "age", label: "나이", type: "number", placeholder: "30" },
                  { key: "height_cm", label: "키(cm)", type: "number", placeholder: "170" },
                  { key: "weight_kg", label: "몸무게(kg)", type: "number", placeholder: "70" },
                ].map(({ key, label, type, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-400 mb-1">{label}</label>
                    <input type={type} placeholder={placeholder}
                      value={editData[key] || ""}
                      onChange={(e) => setEditData({ ...editData, [key]: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#FF6B4A]"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">주 운동 종목</label>
                  <select value={editData.sport || ""}
                    onChange={(e) => setEditData({ ...editData, sport: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#FF6B4A]">
                    <option value="">선택</option>
                    {Object.entries(SPORT_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">목표</label>
                <input type="text" placeholder="자세 교정, 부상 예방 등"
                  value={editData.goal || ""}
                  onChange={(e) => setEditData({ ...editData, goal: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#FF6B4A]"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-1.5 bg-[#FF6B4A] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#e55a3a] transition-colors">
                  <Save className="w-3.5 h-3.5" />
                  {saving ? "저장 중..." : "저장"}
                </button>
                <button onClick={() => setEditMode(false)}
                  className="flex items-center gap-1.5 border border-gray-200 text-sm text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <X className="w-3.5 h-3.5" />
                  취소
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
              {[
                { label: "총 분석 횟수", value: `${records.length}회` },
                { label: "평균 점수", value: records.length ? `${avgScore}점` : "-" },
                { label: "목표", value: profile?.goal || "-" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-lg font-bold text-[#1A1A2E]">{s.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Tabs */}
        <div className="flex bg-white rounded-xl border border-gray-100 p-1 gap-1">
          {[
            { key: "history", label: "분석 히스토리" },
            { key: "stats", label: "통계" },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                activeTab === key ? "bg-[#FF6B4A] text-white" : "text-gray-500 hover:text-[#1A1A2E]"
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* History Tab */}
        {activeTab === "history" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {records.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center text-gray-400">
                <BarChart2 className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                <p className="text-sm">아직 분석 기록이 없습니다</p>
                <Link to="/analyze" className="mt-4 inline-block text-sm text-[#FF6B4A] font-semibold hover:underline">
                  첫 분석 시작하기 →
                </Link>
              </div>
            ) : (
              records.map((r) => (
                <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 hover:shadow-sm transition-shadow cursor-pointer"
                  onClick={() => navigate("/report", { state: { result: r.result, imageUrl: r.image_url } })}>
                  {r.image_url && (
                    <img src={r.image_url} alt="분석 이미지" className="w-14 h-14 rounded-xl object-cover flex-shrink-0 bg-gray-100" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#1A1A2E]">{SPORT_LABELS[r.category] || r.category}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(r.created_date).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
                      {r.view && ` · ${r.view === "front" ? "정면" : "측면"}`}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-xl font-extrabold ${
                      r.overall_score >= 80 ? "text-emerald-500" : r.overall_score >= 60 ? "text-amber-500" : "text-red-500"
                    }`}>{r.overall_score || 0}</p>
                    <p className="text-xs text-gray-400">/ 100</p>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {/* Stats Tab */}
        {activeTab === "stats" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {scoreHistory.length > 1 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-[#1A1A2E] mb-4">점수 변화 추이</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={scoreHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#FF6B4A" strokeWidth={2} dot={{ r: 4, fill: "#FF6B4A" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            {radarData.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-[#1A1A2E] mb-4">카테고리별 평균 점수</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#f0f0f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#6B7280" }} />
                    <Radar dataKey="score" stroke="#FF6B4A" fill="#FF6B4A" fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
            {records.length === 0 && (
              <div className="bg-white rounded-2xl p-12 text-center text-gray-400">
                <TrendingUp className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                <p className="text-sm">분석 기록이 쌓이면 통계가 표시됩니다</p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}