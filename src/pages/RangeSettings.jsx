import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Save, Info, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import {
  ANGLE_METRICS, ALIGN_METRICS, SEPARATION_METRIC, DEFAULT_RANGES, ALL_RANGE_METRICS,
} from "@/lib/metricRanges";

function NumberField({ value, onChange, placeholder }) {
  return (
    <input
      type="number"
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
      className="w-20 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF6B4A] text-center"
    />
  );
}

export default function RangeSettings() {
  const [form, setForm] = useState(() =>
    Object.fromEntries(Object.keys(DEFAULT_RANGES).map((k) => [k, { ...DEFAULT_RANGES[k] }]))
  );
  const [recordId, setRecordId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    base44.entities.RangeSetting.list()
      .then((recs) => {
        if (recs && recs.length) {
          setRecordId(recs[0].id);
          setForm((prev) => {
            const next = { ...prev };
            const r = recs[0].ranges || {};
            for (const k of Object.keys(DEFAULT_RANGES)) {
              if (r[k]) next[k] = { min: Number(r[k].min), max: Number(r[k].max) };
            }
            return next;
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const setVal = (key, field, val) => {
    setForm((prev) => ({ ...prev, [key]: { ...prev[key], [field]: val } }));
  };

  const save = async () => {
    setSaving(true);
    setSavedMsg(false);
    try {
      const ranges = Object.fromEntries(
        Object.entries(form).filter(([k]) => k in DEFAULT_RANGES)
      );
      if (recordId) {
        await base44.entities.RangeSetting.update(recordId, { ranges });
      } else {
        const rec = await base44.entities.RangeSetting.create({ ranges });
        if (rec?.id) setRecordId(rec.id);
      }
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2500);
    } catch {
      // not authorized / not logged in — silent
    }
    setSaving(false);
  };

  const renderRow = (m) => {
    const r = form[m.key] || { min: 0, max: 0 };
    return (
      <div key={m.key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 py-2.5 border-b border-gray-50 last:border-0">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-800">{m.label}</p>
          {m.hint && <p className="text-[10px] text-gray-400 -mt-0.5">{m.hint}</p>}
        </div>
        <div className="flex items-center gap-2">
          <NumberField value={r.min} onChange={(v) => setVal(m.key, "min", v)} />
          <span className="text-gray-400 text-xs">~</span>
          <NumberField value={r.max} onChange={(v) => setVal(m.key, "max", v)} />
          <span className="text-gray-400 text-xs w-3">°</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/frame-analysis" className="text-gray-400 hover:text-[#1A1A2E] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-base font-bold text-[#1A1A2E]">정상범위 설정</h1>
            <p className="text-xs text-gray-400">코치용 · 신호등 기준값 관리</p>
          </div>
          <button
            onClick={save}
            disabled={saving || loading}
            className="ml-auto inline-flex items-center gap-1.5 bg-[#FF6B4A] hover:bg-[#e55a3a] text-white text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {savedMsg && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <p className="text-sm text-emerald-700">정상범위가 저장되었습니다.</p>
          </div>
        )}

        <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
          <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-700 leading-relaxed">
            참고용 기본값이며 코치가 임의로 조정 가능합니다. 설정된 범위 안이면 <span className="font-semibold text-emerald-600">정상(녹색)</span>,
            살짝 벗어나면 <span className="font-semibold text-amber-600">주의(노랑)</span>, 크게 벗어나면 <span className="font-semibold text-red-600">경고(빨강)</span>으로 표시됩니다.
            설정하지 않은 항목은 기본값이 적용됩니다.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-sm font-bold text-[#1A1A2E] mb-1">관절 가동각</p>
          <p className="text-xs text-gray-400 mb-3">각 관절의 권장 굴곡 범위</p>
          {ANGLE_METRICS.map(renderRow)}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-sm font-bold text-[#1A1A2E] mb-1">정렬 지표</p>
          <p className="text-xs text-gray-400 mb-3">편차각 · 0°에 가까울수록 정렬 양호</p>
          {ALIGN_METRICS.map(renderRow)}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-sm font-bold text-[#1A1A2E] mb-3">회전·분리</p>
          {renderRow(SEPARATION_METRIC)}
        </div>

        <p className="text-[11px] text-gray-400 text-center">
          ALL_RANGE_METRICS: {ALL_RANGE_METRICS.length}개 항목 · 기본값은 실측 기반 추정치
        </p>
      </div>
    </div>
  );
}