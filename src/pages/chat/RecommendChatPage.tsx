// src/pages/chat/RecommendChatPage.tsx
import { CharacterFigure } from "@/widgets/home2/CharacterFigure";
import { HeroBubble } from "@/widgets/home2/HeroBubble";
import { LoginSheet } from "@/widgets/home2/LoginSheet";
import { useAuth } from "@entities/auth";
import { Loader2, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const apiUrl = (path: string) => `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

const createUUID = () =>
  (globalThis.crypto as any)?.randomUUID?.() ??
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;

type Role = "mentee" | "mentor";

// 서버 응답 타입(필요 부분만)
type ChatIntroRes = { message?: string };
type ChatPostRes = {
  response?: string;
  recommendation_ready?: boolean;
  conversation_history?: string[];
};

export default function RecommendChatPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const isLoggedIn = !!user;
  const memberName = user?.memberName ?? "회원";

  const [openLogin, setOpenLogin] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [bubbleText, setBubbleText] = useState("답변을 준비중이에요…");
  const [displayedText, setDisplayedText] = useState(""); // ✅ 타자 효과용
  const [typing, setTyping] = useState(false);

  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);

  // ✅ 추천 버튼 노출 여부 & 질의 히스토리
  const [recReady, setRecReady] = useState(false);
  const [queries, setQueries] = useState<string[]>([]);

  const memberUUID = useMemo(() => createUUID(), []);

  // ✅ 타자 애니메이션
  useEffect(() => {
    const full = bubbleText ?? "";
    setDisplayedText("");
    if (!full) return;

    setTyping(true);
    let i = 0;
    const STEP_MS = 25; // 속도 조정 가능
    const timer = setInterval(() => {
      i++;
      setDisplayedText(full.slice(0, i));
      if (i >= full.length) {
        clearInterval(timer);
        setTyping(false);
      }
    }, STEP_MS);

    return () => clearInterval(timer);
  }, [bubbleText]);

  // 페이지 진입시 첫 GET 호출
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const url = apiUrl(`/ai/chatbot/${encodeURIComponent(memberUUID)}`);
        const res = await fetch(url, {
          headers: { Accept: "application/json" },
          signal: ac.signal,
        });
        if (!res.ok) throw new Error(`intro GET ${res.status}`);
        const data = (await res.json()) as ChatIntroRes;
        const msg = data?.message?.trim();
        setBubbleText(msg || "서버연결이 원활하지 않습니다.\n잠시 후 다시 시도해 주세요.");
      } catch {
        setBubbleText("서버연결이 원활하지 않습니다.\n잠시 후 다시 시도해 주세요.");
      }
    })();
    return () => ac.abort();
  }, [memberUUID]);

  const handleLoginSubmit = async ({ id, pw, role }: { id: string; pw: string; role: Role }) => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const userType = role === "mentor" ? "MENTO" : "MENTI";
      await login({ userType, memberId: id, memberPwd: pw });
      setOpenLogin(false);
    } catch (err: any) {
      setLoginError(err?.response?.data?.message || err?.message || "로그인에 실패했습니다.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const send = async () => {
    const text = input.trim();
    if (!text || pending) return;

    if (!isLoggedIn) {
      setOpenLogin(true);
      return;
    }

    setPending(true);
    setRecReady(false); // ✅ 새 요청마다 초기화
    setQueries((prev) => [...prev, text]); // ✅ 질의 누적
    setBubbleText("답변을 준비중이에요…");

    try {
      setInput("");
      const res = await fetch(apiUrl("/ai/chatbot"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          member_seq: memberUUID,
          content: text,
        }),
      });

      if (!res.ok) throw new Error(`chatbot POST ${res.status}`);
      const data = (await res.json()) as ChatPostRes;

      // 답변 표시
      setBubbleText(
        data?.response ?? `좋습니다, ${memberName}님!\n"${text}" 조건으로 계속 진행할게요.`,
      );

      // ✅ 서버가 대화 히스토리를 내려주면 로컬 queries 반영
      if (Array.isArray(data?.conversation_history) && data!.conversation_history!.length) {
        setQueries(data!.conversation_history!);
      }

      // ✅ 추천 준비 완료면 버튼 활성화
      if (data?.recommendation_ready) {
        setRecReady(true);
      }

      setInput("");
    } catch {
      setBubbleText("서버연결이 원활하지 않습니다.\n잠시 후 다시 시도해 주세요.");
    } finally {
      setPending(false);
    }
  };

  // ✅ 추천 페이지로 이동 (질문 히스토리/사용자 세션 전달)
  const goRecommend = () => {
    navigate("/ai/recommend", {
      state: {
        from: "chatbot",
        member_seq: memberUUID, // 서버가 이 세션키로 추천을 이어서 처리한다면
        queries, // 다음 페이지에서 POST 바디로 그대로 전달
      },
    });
  };

  return (
    <main className="relative h-[calc(100vh-50px)] w-full bg-[#F7FAFF] px-4 pt-5 sm:h-[calc(100vh-140px)]">
      <section className="mx-auto flex h-[70vh] w-full max-w-md flex-col items-center justify-around gap-4">
        {/* ✅ HeroBubble에는 애니메이션된 텍스트를 표시 */}
        <HeroBubble text={displayedText} highlight={isLoggedIn ? memberName : undefined} />
        <CharacterFigure glowed={isLoggedIn} />

        <section className="absolute bottom-0 w-full max-w-md">
          {recReady ? (
            <div className="w-full bg-[#F7FAFF] p-4">
              <section className="mx-auto mt-4 mb-2 w-full max-w-md bg-[#F7FAFF]">
                <button
                  type="button"
                  onClick={goRecommend}
                  className="text-md w-full rounded-xl bg-[#2563EB] px-4 py-3 text-center font-bold text-white shadow hover:bg-[#1E4FD9]">
                  추천 받기
                </button>
              </section>
            </div>
          ) : (
            <div className="w-full bg-white/80 p-4 shadow ring-1 ring-black/5 backdrop-blur">
              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="질문을 입력해주세요"
                  className="flex-1 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-800 shadow-sm outline-none placeholder:text-slate-400 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/30"
                />
                <button
                  type="button"
                  onClick={send}
                  disabled={pending || !input.trim()}
                  className="inline-flex items-center gap-1 rounded-xl bg-[#2563EB] px-3 py-2 text-sm font-semibold text-white shadow hover:bg-[#1E4FD9] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400">
                  {pending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {pending ? " 전송중…" : " 보내기"}
                </button>
              </div>
            </div>
          )}
        </section>
      </section>

      <LoginSheet
        open={openLogin && !isLoggedIn}
        onClose={() => setOpenLogin(false)}
        onSubmit={handleLoginSubmit}
        error={loginError}
        loading={isLoggingIn}
      />
    </main>
  );
}
