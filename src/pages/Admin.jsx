import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Users, BarChart2, Activity, Search, TrendingUp, GitCompare, Check } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const SPORT_LABELS = {
  general: "일반", soccer: "축구", baseball: "야구", running: "달리기",
  walking: "걷기", pilates: "필라테스", yoga: "요가", golf: "골프",
  swimming: "수영", cycling: "사이클",
};

export default function Admin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [users, setUsers] = useState([]);
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("users");
  const [compareMode, setCompareMode] = useState(false);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const me = await base44.auth.me();
        if (me.role !== "admin") { setUnauthorized(true); setLoading(false); return; }
        const [u, r] = await Promise.all([
          base44.entities.User.list(),
          base44.entities.AnalysisRecord.list("-created_date", 200),
        ]);
        setUsers(u);
        setRecords(r);
      } catch {
        setUnauthorized(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-[#FF6B4A] rounded-full animate-spin" />
    </div>
  );

  if (unauthorized) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-gray-500">
      <p className="text-lg font-bold">접근 권한이 없습니다</p>
      <Link to="/" className="text-[#FF6B4A] text-sm hover:underline">홈으로 돌아가기</Link>
    </div>
  );

  const avgScore = records.length
    ? Math.round(records.reduce((s, r) => s + (r.overall_score || 0), 0) / records.length)
    : 0;

  const catDist = {};
  records.forEach((r) => { catDist[r.category] = (catDist[r.category] || 0) + 1; });
  const catChartData = Object.entries(catDist).map(([k, v]) => ({
    name: SPORT_LABELS[k] || k, count: v,
  })).sort((a, b) => b.count - a.count);

  const filteredUsers = users.filter((u) =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const userRecordMap = {};
  records.forEach((r) => {
    if (!userRecordMap[r.user_id]) userRecordMap[r.user_id] = [];
    userRecordMap[r.user_id].push(r);
  });

  const startCompare = () => {
    if (selected.length !== 2) return;
    const [aId, bId] = selected;
    const a = records.find((r) => r.id === aId);
    const b = records.find((r) => r.id === bId);
    if (!a || !b) return;
    const pack = (r) => ({
      videoUrl: r.video_url,
      frames: r.frames?.list || [],
      category: r.category,
      view: r.view,
      result: r.result,
      imageUrl: r.image_url,
      userName: (users.find((u) => u.id === r.user_id) || {}).full_name || "",
    });
    navigate("/compare", { state: { a: pack(a), b: pack(b) } });
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="bg-[#1A1A2E] text-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-white/60 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="text-sm font-bold">관리자 대시보드</span>
          </div>
          <span className="text-xs text-white/40">PostureLab Admin</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Stats overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "총 회원수", value: users.length, icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
            { label: "총 분석 횟수", value: records.length, icon: Activity, color: "text-[#FF6B4A]", bg: "bg-orange-50" },
            { label: "평균 자세 점수", value: `${avgScore}점`, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50" },
            { label: "종목 수", value: Object.keys(catDist).length, icon: BarChart2, color: "text-purple-500", bg: "bg-purple-50" },
          ].map((s) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-5 shadow-sm">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <s.icon className={`w-4.5 h-4.5 ${s.color}`} />
              </div>
              <p className="text-2xl font-extrabold text-[#1A1A2E]">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Category chart */}
        {catChartData.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[#1A1A2E] mb-4">종목별 분석 현황</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={catChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#FF6B4A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Tabs */}
        <div className="flex bg-white rounded-xl border border-gray-100 p-1 gap-1">
          {[
            { key: "users", label: "회원 관리" },
            { key: "records", label: "분석 기록" },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                activeTab === key ? "bg-[#FF6B4A] text-white" : "text-gray-500 hover:text-[#1A1A2E]"
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={activeTab === "users" ? "이름 또는 이메일 검색..." : "검색..."}
            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#FF6B4A]"
          />
        </div>

        {/* Users Table */}
        {activeTab === "users" && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">회원</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:table-cell">가입일</th>
                  <th className="text-center px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">분석수</th>
                  <th className="text-center px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:table-cell">평균점수</th>
                  <th className="text-center px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">권한</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const urecs = userRecordMap[u.id] || [];
                  const uavg = urecs.length ? Math.round(urecs.reduce((s, r) => s + (r.overall_score || 0), 0) / urecs.length) : null;
                  return (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6B4A] to-orange-300 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {(u.full_name || "U")[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#1A1A2E]">{u.full_name}</p>
                            <p className="text-xs text-gray-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden sm:table-cell">
                        <p className="text-xs text-gray-400">
                          {new Date(u.created_date).toLocaleDateString("ko-KR")}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="text-sm font-bold text-[#1A1A2E]">{urecs.length}</span>
                      </td>
                      <td className="px-5 py-4 text-center hidden sm:table-cell">
                        {uavg !== null ? (
                          <span className={`text-sm font-bold ${uavg >= 80 ? "text-emerald-500" : uavg >= 60 ? "text-amber-500" : "text-red-500"}`}>
                            {uavg}
                          </span>
                        ) : <span className="text-xs text-gray-300">-</span>}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          u.role === "admin" ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-500"
                        }`}>
                          {u.role === "admin" ? "관리자" : "일반"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <p className="text-center py-8 text-sm text-gray-400">검색 결과가 없습니다</p>
            )}
          </div>
        )}

        {/* Records Table */}
        {activeTab === "records" && (
          <div className="space-y-3">
            {/* Compare toolbar */}
            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={() => { setCompareMode((m) => !m); setSelected([]); }}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-full border transition-colors ${
                  compareMode ? "bg-[#FF6B4A] text-white border-[#FF6B4A]" : "bg-white text-gray-600 border-gray-200 hover:border-[#FF6B4A] hover:text-[#FF6B4A]"
                }`}>
                <GitCompare className="w-3.5 h-3.5" />
                {compareMode ? "비교 취소" : "영상 비교"}
              </button>
              {compareMode && (
                <>
                  <span className="text-xs text-gray-500">비교할 영상 2개 선택 ({selected.length}/2)</span>
                  <button onClick={startCompare} disabled={selected.length !== 2}
                    className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full bg-[#1A1A2E] text-white disabled:opacity-40 transition-opacity">
                    <Check className="w-3.5 h-3.5" />
                    비교하기
                  </button>
                </>
              )}
            </div>

            {records.filter((r) =>
              !search || (SPORT_LABELS[r.category] || r.category || "").includes(search)
            ).map((r) => {
              const u = users.find((u) => u.id === r.user_id);
              const hasVideo = !!(r.video_url && r.frames?.list?.length);
              const isSel = selected.includes(r.id);
              return (
                <div key={r.id}
                  className={`bg-white rounded-xl border p-4 flex items-center gap-4 transition-shadow cursor-pointer ${
                    isSel ? "border-[#FF6B4A] ring-1 ring-[#FF6B4A] shadow-sm" : "border-gray-100 hover:shadow-sm"
                  } ${compareMode && !hasVideo ? "opacity-50" : ""}`}
                  onClick={() => {
                    if (compareMode) {
                      if (!hasVideo) return;
                      setSelected((prev) =>
                        prev.includes(r.id)
                          ? prev.filter((id) => id !== r.id)
                          : prev.length >= 2 ? [prev[1], r.id] : [...prev, r.id]
                      );
                    } else if (hasVideo) {
                      navigate("/frame-analysis", { state: { videoUrl: r.video_url, framesData: r.frames.list, category: r.category, view: r.view, result: r.result, imageUrl: r.image_url } });
                    } else {
                      navigate("/report", { state: { result: r.result, imageUrl: r.image_url } });
                    }
                  }}>
                  {r.image_url && (
                    <img src={r.image_url} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-gray-100" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-[#1A1A2E]">{SPORT_LABELS[r.category] || r.category}</p>
                      {hasVideo && (
                        <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full">동영상</span>
                      )}
                      {compareMode && !hasVideo && (
                        <span className="text-[10px] text-gray-400">영상 없음</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {u ? u.full_name : "알 수 없음"} · {new Date(r.created_date).toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                  <div className={`text-lg font-extrabold ${
                    (r.overall_score || 0) >= 80 ? "text-emerald-500" : (r.overall_score || 0) >= 60 ? "text-amber-500" : "text-red-500"
                  }`}>{r.overall_score || 0}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}