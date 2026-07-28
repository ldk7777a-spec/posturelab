import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Users, BarChart2, Activity, Search, GitCompare, Check } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useLang, T } from "@/lib/LanguageContext";

const LOCALE = (lang) => (lang === "ko" ? "ko-KR" : "en-US");

export default function Admin() {
  const { lang } = useLang();
  const t = T.admin[lang];
  const sports = T.adminSports[lang];
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [users, setUsers] = useState([]);
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("users");
  const [compareMode, setCompareMode] = useState(false);
  const [selected, setSelected] = useState([]);

  const catLabel = (cat) =>
    cat == null || cat === "general" ? sports.general : sports[cat] || cat;

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
      <p className="text-lg font-bold">{t.denied}</p>
      <Link to="/" className="text-[#FF6B4A] text-sm hover:underline">{t.goHome}</Link>
    </div>
  );

  const catDist = {};
  records.forEach((r) => { catDist[r.category] = (catDist[r.category] || 0) + 1; });
  const catChartData = Object.entries(catDist)
    .map(([k, v]) => ({ name: catLabel(k), count: v }))
    .sort((a, b) => b.count - a.count);

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
            <span className="text-sm font-bold">{t.title}</span>
          </div>
          <span className="text-xs text-white/40">PostureLab Admin</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Stats overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: t.statUsers, value: users.length, icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
            { label: t.statAnalyses, value: records.length, icon: Activity, color: "text-[#FF6B4A]", bg: "bg-orange-50" },
            { label: t.statSports, value: Object.keys(catDist).length, icon: BarChart2, color: "text-purple-500", bg: "bg-purple-50" },
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
            <h3 className="text-sm font-bold text-[#1A1A2E] mb-4">{t.chartTitle}</h3>
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
            { key: "users", label: t.tabUsers },
            { key: "records", label: t.tabRecords },
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
            placeholder={activeTab === "users" ? t.searchUser : t.searchAll}
            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#FF6B4A]"
          />
        </div>

        {/* Users Table */}
        {activeTab === "users" && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">{t.colMember}</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:table-cell">{t.colJoined}</th>
                  <th className="text-center px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">{t.colCount}</th>
                  <th className="text-center px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">{t.colRole}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const urecs = userRecordMap[u.id] || [];
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
                          {new Date(u.created_date).toLocaleDateString(LOCALE(lang))}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="text-sm font-bold text-[#1A1A2E]">{urecs.length}</span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          u.role === "admin" ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-500"
                        }`}>
                          {u.role === "admin" ? t.roleAdmin : t.roleUser}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <p className="text-center py-8 text-sm text-gray-400">{t.noResults}</p>
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
                {compareMode ? t.compareCancel : t.compare}
              </button>
              {compareMode && (
                <>
                  <span className="text-xs text-gray-500">{t.compareSelect} ({selected.length}/2)</span>
                  <button onClick={startCompare} disabled={selected.length !== 2}
                    className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full bg-[#1A1A2E] text-white disabled:opacity-40 transition-opacity">
                    <Check className="w-3.5 h-3.5" />
                    {t.compareStart}
                  </button>
                </>
              )}
            </div>

            {records.filter((r) =>
              !search || catLabel(r.category).toLowerCase().includes(search.toLowerCase())
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
                      navigate("/frame-analysis", { state: { videoUrl: r.video_url, framesData: r.frames.list, category: r.category, view: r.view, result: r.result, imageUrl: r.image_url, from: "admin" } });
                    } else {
                      navigate("/report", { state: { result: r.result, imageUrl: r.image_url, from: "admin" } });
                    }
                  }}>
                  {r.image_url && (
                    <img src={r.image_url} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-gray-100" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-[#1A1A2E]">{catLabel(r.category)}</p>
                      {hasVideo && (
                        <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full">{t.videoTag}</span>
                      )}
                      {compareMode && !hasVideo && (
                        <span className="text-[10px] text-gray-400">{t.noVideo}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {u ? u.full_name : t.unknownUser} · {new Date(r.created_date).toLocaleString(LOCALE(lang), { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}