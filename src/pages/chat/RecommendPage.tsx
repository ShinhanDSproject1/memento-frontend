// src/pages/recommend/RecommendPage.tsx
import { motion } from "framer-motion";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type RecommendationItem = {
  mentos_seq: number;
  mentos_image: string;
  mentos_title: string;
  region: string;
  price: number;
  mento_profile_image: string;
};

type NavState = { member_seq?: string; queries?: string[] };

const RECO_ENDPOINT = "/api/ai/recommend"; // Vite proxy 경로

const getMemberSeq = () => {
  const v = localStorage.getItem("member_seq");
  return v;
};

// ✨ 중앙 로딩 컴포넌트 (모노톤 AI 아이콘 + 글자)
function LoadingAI() {
  return (
    <div className="flex h-[50vh] flex-col items-center justify-center gap-4 bg-[#F7FAFF]">
      {/* 빛망울 */}
      <motion.div
        className="relative flex items-center justify-center"
        initial={{ scale: 0.95, opacity: 0.9 }}
        animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.9, 1, 0.9] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}>
        <div className="absolute h-28 w-28 rounded-full bg-white/70 blur-lg" />
        {/* 로봇-두상 모노 아이콘 */}
        <motion.svg
          width="80"
          height="80"
          viewBox="0 0 64 64"
          fill="none"
          stroke="currentColor"
          className="relative z-10 text-slate-800 drop-shadow-sm"
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}>
          {/* 외곽 */}
          <rect x="10" y="14" width="44" height="36" rx="10" strokeWidth="2.5" />
          {/* 눈 */}
          <circle cx="24" cy="32" r="3" strokeWidth="2.5" />
          <circle cx="40" cy="32" r="3" strokeWidth="2.5" />
          {/* 안테나 */}
          <path d="M32 14V8" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="32" cy="6" r="2" strokeWidth="2.5" />
          {/* 입 */}
          <path d="M24 40h16" strokeWidth="2.5" strokeLinecap="round" />
        </motion.svg>
      </motion.div>

      <div className="flex items-baseline gap-2">
        <span className="text-base font-semibold text-slate-800">AI 추천중</span>
        <span className="inline-flex w-6 justify-between text-slate-700">
          <span className="animate-bounce">.</span>
          <span className="animate-bounce [animation-delay:120ms]">.</span>
          <span className="animate-bounce [animation-delay:240ms]">.</span>
        </span>
      </div>
    </div>
  );
}

export default function RecommendPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { member_seq, queries } = (state as NavState) || {};

  const effectiveMember = member_seq ?? getMemberSeq();
  const effectiveQueries = Array.isArray(queries) ? queries : [];

  const [items, setItems] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // StrictMode(개발) 2회 실행 가드
  const didFetchRef = useRef(false);

  const fadeIn = useMemo(
    () => ({
      initial: { opacity: 0, y: 30 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.45 },
    }),
    [],
  );

  const fetchRecommend = useCallback(async () => {
    if (!effectiveQueries.length) {
      setErr("추천 질문지가 없습니다. 먼저 챗봇에서 대화를 진행해 주세요.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setErr(null);

    // 자동 재시도: 최대 2회(총 3번) 시도
    const MAX_RETRY = 2;
    let lastError: any = null;

    for (let attempt = 0; attempt <= MAX_RETRY; attempt++) {
      try {
        const res = await fetch(RECO_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            member_seq: effectiveMember,
            queries: effectiveQueries,
          }),
        });

        if (!res.ok) throw new Error(`POST /ai/recommend ${res.status}`);
        const data = (await res.json()) as { result?: RecommendationItem[] };
        setItems((data?.result ?? []).slice(0, 3));
        setLoading(false);
        setErr(null);
        return; // 성공하면 탈출
      } catch (e) {
        lastError = e;
        // 지수 백오프(200ms, 400ms)
        if (attempt < MAX_RETRY) {
          await new Promise((r) => setTimeout(r, 200 * Math.pow(2, attempt)));
        }
      }
    }

    console.error(lastError);
    setErr("추천 정보를 불러올 수 없습니다. 다시 시도해 주세요.");
    setLoading(false);
  }, [effectiveMember, effectiveQueries]);

  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;
    fetchRecommend();
  }, [fetchRecommend]);

  return (
    <div className="relative w-full overflow-hidden">
      {/* 배경 */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-[#E8F1FF] to-[#C9E0FF]"
      />

      {/* 컨테이너 */}
      <div
        className="mx-auto flex max-w-[720px] flex-col px-4"
        style={{ height: "calc(100dvh - var(--app-header-h,56px))" } as React.CSSProperties}>
        {/* 헤더 */}
        <div className="flex shrink-0 items-center justify-between py-3">
          <h1 className="text-lg font-semibold text-black">맞춤 추천</h1>
        </div>

        {/* 본문 */}
        <div className="min-h-0 flex-1 overflow-y-auto pb-[max(env(safe-area-inset-bottom),0px)]">
          {/* 로딩: 중앙 모노 로더 */}
          {loading && <LoadingAI />}

          {/* 에러 + 수동 재시도 */}
          {!loading && err && (
            <div className="mx-auto mt-6 w-full max-w-[680px] rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-red-700">
              <p className="mb-3">{err}</p>
              <button
                onClick={fetchRecommend}
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                다시 시도
              </button>
            </div>
          )}

          {/* 결과 없음 */}
          {!loading && !err && items.length === 0 && (
            <p className="mt-10 text-center text-black/60">추천 결과가 없습니다.</p>
          )}

          {/* 카드 리스트: 세로 1열 */}
          {!loading &&
            !err &&
            items.length > 0 &&
            items.map((item, idx) => (
              <motion.a
                key={item.mentos_seq}
                href={`/menti/mentos-detail/${item.mentos_seq}`}
                {...fadeIn}
                transition={{ delay: idx * 0.12 }}
                className="group mx-auto mb-4 block w-full max-w-[680px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                {/* 이미지 */}
                <div className="h-[155px] w-full overflow-hidden">
                  <img
                    src={item.mentos_image}
                    alt={item.mentos_title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>

                {/* 텍스트 */}
                <div className="flex flex-col gap-1 px-3 py-2">
                  <h3 className="line-clamp-2 text-sm font-medium text-black">
                    {item.mentos_title}
                  </h3>

                  {/* 하단: 위치 + (가격 + 멘토 아바타) */}
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span className="truncate">{item.region}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-blue-700">
                        ₩{item.price.toLocaleString()}
                      </span>
                      <img
                        src={item.mento_profile_image}
                        alt="멘토 프로필"
                        loading="lazy"
                        className="h-6 w-6 rounded-full object-cover ring-1 ring-black/10"
                      />
                    </div>
                  </div>
                </div>
              </motion.a>
            ))}
        </div>
      </div>
    </div>
  );
}
