// src/pages/chat/RecommendChatPage.tsx
import { CategoryButtonGroup } from "@/widgets/home2/CategoryButton";
import { CharacterFigure } from "@/widgets/home2/CharacterFigure";
import { HeroBubble } from "@/widgets/home2/HeroBubble";
import { LoginSheet } from "@/widgets/home2/LoginSheet";
import { useAuth } from "@entities/auth";
import { Loader2, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const apiUrl = (path: string) => `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

const createUUID = () =>
  (globalThis.crypto as any)?.randomUUID?.() ??
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;

type Role = "mentee" | "mentor";

export default function RecommendChatPage() {
  const { user, login } = useAuth();
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
        const url = apiUrl(`/ai/chatbot/?member_seq=${encodeURIComponent(memberUUID)}`);
        const res = await fetch(url, {
          headers: { Accept: "application/json" },
          signal: ac.signal,
        });
        if (!res.ok) throw new Error(`intro GET ${res.status}`);
        const data = (await res.json()) as { message?: string };
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
    setBubbleText("답변을 준비중이에요…");

    try {
      const res = await fetch(apiUrl("/ai/chatbot"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          member_seq: memberUUID,
          content: text,
        }),
      });

      if (!res.ok) throw new Error(`chatbot POST ${res.status}`);
      const data = (await res.json()) as { response?: string };
      setBubbleText(
        data?.response ?? `좋습니다, ${memberName}님!\n"${text}" 조건으로 계속 진행할게요.`,
      );
      setInput("");
    } catch {
      setBubbleText("서버연결이 원활하지 않습니다.\n잠시 후 다시 시도해 주세요.");
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="relative h-screen w-full bg-gradient-to-b from-[#F7FAFF] to-[#c2d2f1] px-4 pt-5 md:h-190">
      <section className="mx-auto w-full max-w-lg">
        <CategoryButtonGroup />
      </section>

      <section className="mx-auto mt-10 flex w-full max-w-md flex-col items-center gap-4">
        {/* ✅ HeroBubble에는 애니메이션된 텍스트를 표시 */}
        <HeroBubble text={displayedText} highlight={isLoggedIn ? memberName : undefined} />
        <CharacterFigure glowed={isLoggedIn} />
      </section>

      <section className="mx-auto mt-40 mb-3 w-full max-w-md md:mt-30">
        <div className="rounded-2xl bg-white/80 p-3 shadow ring-1 ring-black/5 backdrop-blur">
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
