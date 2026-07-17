import React, { useEffect, useState } from "react";
import { Sparkles, Loader2, RefreshCw, MessageSquareQuote } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Shows rule-based feedback sentences at the top of the analysis view,
// with an optional AI refine action (InvokeLLM) for natural coaching tone.
export default function FeedbackSection({ sentences }) {
  const [display, setDisplay] = useState(sentences);
  const [refined, setRefined] = useState(false);
  const [refining, setRefining] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setDisplay(sentences);
    setRefined(false);
    setError(null);
  }, [sentences]);

  const refine = async () => {
    if (!sentences.length) return;
    setRefining(true);
    setError(null);
    try {
      const prompt =
        "아래는 자세 영상 분석에서 자동 생성된 규칙 기반 코칭 문장들입니다. " +
        "이를 한국어 친절하고 자연스러운 트레이너 코칭 톤으로 3~5문장으로 다듬어 주세요. " +
        "각도·수치 같은 사실은 그대로 유지하고, 새로운 의학 정보를 덧붙이지 말고, 격려하는 어조로 마무리해 주세요.\n\n" +
        sentences.map((s) => `- ${s}`).join("\n");
      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            sentences: { type: "array", items: { type: "string" } },
          },
        },
      });
      const arr = Array.isArray(res?.sentences) ? res.sentences.slice(0, 5) : [];
      if (arr.length) {
        setDisplay(arr);
        setRefined(true);
      }
    } catch {
      setError("AI 다듬기 실패 — 규칙 기반 문장을 표시합니다.");
    }
    setRefining(false);
  };

  return (
    <div className="bg-gradient-to-br from-[#1A1A2E] to-[#272747] rounded-2xl p-5 text-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MessageSquareQuote className="w-4 h-4 text-[#FF6B4A]" />
          <h2 className="text-sm font-bold">코칭 피드백</h2>
          {refined && (
            <span className="text-[10px] bg-[#FF6B4A]/20 text-[#FF8A6A] px-2 py-0.5 rounded-full">
              AI 다듬기 적용
            </span>
          )}
        </div>
        <button
          onClick={refine}
          disabled={refining || !sentences.length}
          className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 disabled:opacity-50 px-3 py-1.5 rounded-full transition-colors"
        >
          {refining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : refined ? <RefreshCw className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
          {refining ? "다듬는 중..." : refined ? "원본으로" : "AI로 다듬기"}
        </button>
      </div>

      {display.length === 0 ? (
        <p className="text-white/60 text-sm">분석할 데이터가 부족합니다. 전신이 명확히 보이도록 다시 촬영해 주세요.</p>
      ) : (
        <ul className="space-y-2">
          {display.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-white/90 leading-relaxed">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#FF6B4A] flex-shrink-0" />
              {s}
            </li>
          ))}
        </ul>
      )}
      {error && <p className="mt-3 text-xs text-amber-300/80">{error}</p>}
    </div>
  );
}