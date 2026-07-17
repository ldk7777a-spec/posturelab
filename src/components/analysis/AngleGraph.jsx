import React, { useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer,
} from "recharts";
import { frameAngles } from "@/lib/biomechanics";

// left/right pair coloring so coach can distinguish sides at a glance
const SERIES = [
  { key: "leftElbow", label: "L 팔꿈치", color: "#FF6B4A" },
  { key: "rightElbow", label: "R 팔꿈치", color: "#FB923C" },
  { key: "leftShoulder", label: "L 견관절", color: "#3B82F6" },
  { key: "rightShoulder", label: "R 견관절", color: "#93C5FD" },
  { key: "leftHip", label: "L 고관절", color: "#8B5CF6" },
  { key: "rightHip", label: "R 고관절", color: "#C4B5FD" },
  { key: "leftKnee", label: "L 무릎", color: "#10B981" },
  { key: "rightKnee", label: "R 무릎", color: "#6EE7B7" },
  { key: "leftAnkle", label: "L 발목", color: "#F59E0B" },
  { key: "rightAnkle", label: "R 발목", color: "#FCD34D" },
];

export default function AngleGraph({ frames, selectedIdx, onSelectFrame }) {
  const [visible, setVisible] = useState(
    () => new Set(["leftKnee", "rightKnee", "leftHip", "rightHip"])
  );

  const data = useMemo(
    () => frames.map((f, i) => ({ frame: i + 1, ...frameAngles(f.landmarks) })),
    [frames]
  );

  const toggle = (key) => {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleClick = (e) => {
    if (e && e.activeLabel != null) {
      const i = Number(e.activeLabel) - 1;
      if (!Number.isNaN(i)) onSelectFrame(i);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <p className="text-sm font-bold text-[#1A1A2E] mb-1">프레임별 각도 변화</p>
      <p className="text-xs text-gray-400 mb-3">
        x축: 프레임(1~{frames.length}) · 선을 클릭하면 해당 프레임으로 이동
      </p>

      {/* series toggles */}
      <div className="flex flex-wrap gap-2 mb-3">
        {SERIES.map((s) => {
          const on = visible.has(s.key);
          return (
            <button
              key={s.key}
              onClick={() => toggle(s.key)}
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border transition-all ${
                on ? "bg-gray-50 border-gray-300 text-gray-800" : "bg-white border-gray-100 text-gray-300"
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: on ? s.color : "#e5e7eb" }}
              />
              {s.label}
            </button>
          );
        })}
      </div>

      {visible.size === 0 ? (
        <p className="text-xs text-gray-400 text-center py-8">선택된 관절이 없습니다. 위 토글에서 선택해 주세요.</p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: -18, bottom: 0 }} onClick={handleClick}>
            <CartesianGrid stroke="#f1f5f9" />
            <XAxis dataKey="frame" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} />
            <YAxis domain={[0, 180]} tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #eee" }}
              labelFormatter={(l) => `프레임 ${l}`}
            />
            <ReferenceLine x={selectedIdx + 1} stroke="#FF6B4A" strokeWidth={1.5} strokeDasharray="4 4" />
            {SERIES.filter((s) => visible.has(s.key)).map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                dot={false}
                strokeWidth={2}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}