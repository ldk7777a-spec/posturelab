import React, { useEffect, useMemo, useState } from "react";
import { Lock, Check, TriangleAlert } from "lucide-react";
import { detectGolfEvents } from "@/lib/golfDetect";

// GolfDB 8-phase gallery. Address/Finish are user-designated (수정 시 경고 모달);
// the 6 inner phases are auto-detected within [address, finish] then finalized
// via a 7-thumbnail (±3) selector — freely re-settable, no lock. No traffic
// lights — no normal-range dataset exists for golf (context-notes 결정 2).
const PHASES = [
  { key: "address", label: "어드레스" },
  { key: "toeUp", label: "토업" },
  { key: "midBack", label: "백스윙 중간" },
  { key: "top", label: "탑" },
  { key: "midDown", label: "다운스윙 중간" },
  { key: "impact", label: "임팩트" },
  { key: "midFollow", label: "팔로스루 중간" },
  { key: "finish", label: "피니시" },
];

const ENDPOINTS = new Set(["address", "finish"]);

function ThumbRow({ frames, center, selected, onSelect, radius = 3 }) {
  if (center == null) {
    return (
      <p className="text-xs text-gray-400 py-2 leading-relaxed">
        이 단계는 자동 감지하지 못했습니다. 아래 “현재 프레임으로 지정” 버튼으로 직접 지정하세요.
      </p>
    );
  }
  const idxs = [];
  for (let k = center - radius; k <= center + radius; k++) {
    if (k < 0 || k >= frames.length) continue;
    idxs.push(k);
  }
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {idxs.map((i) => {
        const isSel = selected === i;
        const isCenter = i === center;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            className={`relative shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
              isSel ? "border-[#FF6B4A] ring-2 ring-orange-200" : isCenter ? "border-gray-400" : "border-gray-200"
            }`}
            style={{ width: 60, height: 60 }}
            aria-label={`프레임 ${i + 1}`}
          >
            {frames[i] && frames[i].image ? (
              <img src={frames[i].image} alt={`#${i + 1}`} className="w-full h-full object-cover" />
            ) : (
              <span className="w-full h-full flex items-center justify-center text-[11px] font-semibold text-gray-500 bg-gray-50">
                #{i + 1}
              </span>
            )}
            <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] font-semibold py-0.5 text-center">
              {i + 1}
            </span>
            {isCenter && (
              <span className="absolute top-0.5 right-0.5 bg-gray-800/80 text-white text-[8px] px-1 rounded">추천</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function WindowMarker({ title, frame, currentIdx, onSeek, onSet, isEditing, onEdit, onCancelEdit }) {
  return (
    <div className={`bg-gray-50 rounded-lg p-3 ${isEditing ? "ring-2 ring-[#FF6B4A]" : ""}`}>
      <p className="text-xs font-bold text-[#1A1A2E] mb-1">{title}</p>
      <p className="text-[11px] text-gray-400 mb-2">
        {frame == null
          ? "미지정 — 영상을 이동한 뒤 지정하세요."
          : isEditing
            ? `현재 #${frame + 1} · 새 프레임 지정 대기`
            : `#${frame + 1} 프레임`}
      </p>
      <div className="flex gap-1.5">
        <button
          onClick={() => onSeek(frame != null ? frame : currentIdx)}
          disabled={frame == null}
          className="text-[11px] font-semibold text-[#FF6B4A] border border-orange-200 rounded-md px-2 py-1 bg-white hover:bg-orange-50 disabled:opacity-40 transition-colors"
        >
          이동
        </button>
        {frame == null ? (
          <button
            onClick={onSet}
            className="text-[11px] font-semibold text-white bg-[#FF6B4A] rounded-md px-2 py-1 hover:bg-[#e55a3a] transition-colors"
          >
            현재 프레임(#{currentIdx + 1}) 지정
          </button>
        ) : isEditing ? (
          <button
            onClick={onCancelEdit}
            className="text-[11px] font-semibold text-gray-600 border border-gray-300 rounded-md px-2 py-1 bg-white hover:bg-gray-100 transition-colors"
          >
            지정 취소
          </button>
        ) : (
          <button
            onClick={onEdit}
            className="text-[11px] font-semibold text-gray-600 border border-gray-300 rounded-md px-2 py-1 bg-white hover:bg-gray-100 transition-colors"
          >
            수정
          </button>
        )}
      </div>
    </div>
  );
}

export default function GolfComparison({ frames, currentIdx, onSeek }) {
  const [address, setAddress] = useState(null);
  const [finish, setFinish] = useState(null);
  const [active, setActive] = useState("address");
  const [selected, setSelected] = useState({});
  const [editing, setEditing] = useState(null); // "address" | "finish" | null
  const [modalKey, setModalKey] = useState(null); // endpoint awaiting edit confirmation

  const detected = useMemo(() => detectGolfEvents(frames, address, finish), [frames, address, finish]);

  // Re-sync selections whenever detection changes (endpoint re-set resets
  // the inner-6 custom picks — this is the "초기화" the edit modal warns about).
  useEffect(() => {
    setSelected({
      address,
      finish,
      toeUp: detected.toeUp,
      midBack: detected.midBack,
      top: detected.top,
      midDown: detected.midDown,
      impact: detected.impact,
      midFollow: detected.midFollow,
    });
  }, [detected, address, finish]);

  const ready = address != null && finish != null;
  const activeMeta = PHASES.find((p) => p.key === active);
  const isEndpoint = ENDPOINTS.has(active);
  const center = active === "address" ? address : active === "finish" ? finish : detected[active];

  const confirmedCount = PHASES.filter((p) => selected[p.key] != null).length;

  const setEndpoint = (key, idx) => {
    if (key === "address") setAddress(idx);
    else setFinish(idx);
    setEditing(null);
  };

  const confirmEdit = () => {
    if (modalKey) setEditing(modalKey);
    setModalKey(null);
  };

  const handleBottomSet = () => {
    if (isEndpoint) setEndpoint(active, currentIdx); // triggers detection re-sync (inner-6 reset)
    else setSelected((s) => ({ ...s, [active]: currentIdx }));
  };

  // bottom "현재 프레임으로 지정" shown for inner-6 always; for endpoints only in edit mode
  const showSetBtn = !isEndpoint || editing === active;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-bold text-[#1A1A2E]">골프 스윙 8단계</p>
        <span className="text-[10px] font-semibold text-gray-400">
          8단계 중 {confirmedCount}개 확정
        </span>
      </div>
      <p className="text-[11px] text-gray-400 mb-4 leading-relaxed">
        정상범위 기준 데이터가 없어 수치/그래프로만 제공합니다. 어드레스·피니시 두 프레임을 지정하면
        나머지 6단계를 자동 추천합니다. 추천은 시작점이며, 각 단계의 썸네일(±3)에서 최종 확정하세요.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <WindowMarker
          title="어드레스 (시작)"
          frame={address}
          currentIdx={currentIdx}
          onSeek={onSeek}
          onSet={() => setEndpoint("address", currentIdx)}
          isEditing={editing === "address"}
          onEdit={() => setModalKey("address")}
          onCancelEdit={() => setEditing(null)}
        />
        <WindowMarker
          title="피니시 (끝)"
          frame={finish}
          currentIdx={currentIdx}
          onSeek={onSeek}
          onSet={() => setEndpoint("finish", currentIdx)}
          isEditing={editing === "finish"}
          onEdit={() => setModalKey("finish")}
          onCancelEdit={() => setEditing(null)}
        />
      </div>

      {!ready ? (
        <p className="text-xs text-gray-400 text-center py-4">
          어드레스·피니시 두 프레임을 지정하면 8단계 추천이 시작됩니다.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {PHASES.map((p, idx) => {
              const confirmed = selected[p.key] != null;
              const Icon = isEndpointKey(p.key) ? Lock : Check;
              return (
                <button
                  key={p.key}
                  onClick={() => setActive(p.key)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    active === p.key
                      ? "bg-[#FF6B4A] text-white border-[#FF6B4A]"
                      : "bg-white text-gray-500 border-gray-200 hover:border-[#FF6B4A]"
                  }`}
                >
                  {idx + 1}. {p.label}
                  {confirmed && <Icon className="w-3 h-3" />}
                </button>
              );
            })}
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-[#1A1A2E]">
                {activeMeta.label}
                {isEndpoint && editing === active && (
                  <span className="ml-2 text-[10px] font-semibold text-[#FF6B4A]">지정 모드</span>
                )}
              </p>
              <p className="text-[11px] text-gray-400">
                {selected[active] != null ? `선택 #${selected[active] + 1} / ${frames.length}` : "선택 전"}
              </p>
            </div>
            <ThumbRow
              frames={frames}
              center={center}
              selected={selected[active]}
              onSelect={(i) => {
                if (isEndpoint) {
                  // endpoint picks via thumbnail only while editing; replacing
                  // re-runs detection and resets inner-6 picks.
                  if (editing === active) setEndpoint(active, i);
                } else {
                  setSelected((s) => ({ ...s, [active]: i }));
                }
              }}
            />
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                onClick={() => onSeek(selected[active] != null ? selected[active] : center != null ? center : currentIdx)}
                disabled={selected[active] == null && center == null}
                className="text-xs font-semibold text-[#FF6B4A] border border-orange-200 rounded-lg px-3 py-1.5 bg-white hover:bg-orange-50 disabled:opacity-40 transition-colors"
              >
                프레임 이동
              </button>
              {showSetBtn && (
                <button
                  onClick={handleBottomSet}
                  className="text-xs font-semibold text-white bg-[#FF6B4A] rounded-lg px-3 py-1.5 hover:bg-[#e55a3a] transition-colors"
                >
                  현재 프레임(#{currentIdx + 1})으로 지정
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Edit confirmation modal */}
      {modalKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <TriangleAlert className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-[#1A1A2E]">
                  {modalKey === "address" ? "어드레스" : "피니시"} 다시 설정
                </p>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                  다시 설정하면 나머지 6단계 확정 내용이 초기화됩니다. 계속하시겠어요?
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setModalKey(null)}
                className="flex-1 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg py-2 hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={confirmEdit}
                className="flex-1 text-sm font-semibold text-white bg-[#FF6B4A] rounded-lg py-2 hover:bg-[#e55a3a] transition-colors"
              >
                다시 설정
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function isEndpointKey(key) {
  return ENDPOINTS.has(key);
}