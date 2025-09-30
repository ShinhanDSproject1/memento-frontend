// src/pages/mentos/MentosList.tsx
import { useMentosInfiniteList } from "@/features";
import { MentosCard } from "@widgets/common";
import { MentosMainTitleComponent } from "@widgets/mentos";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

import { LoginSheet } from "@/widgets/home2/LoginSheet";
import { useAuth } from "@entities/auth";
import { createPortal } from "react-dom";

const LIMIT = 5;
const CARD_GAP = 20; // 카드 간 갭

const TITLE_MAP: Record<string, string> = {
  consumption: "소비패턴 멘토링",
  tips: "생활노하우 멘토링",
  saving: "저축방식 멘토링",
  growth: "자산증식 멘토링",
};
const CATEGORY_ID_MAP: Record<string, number> = {
  consumption: 1,
  tips: 2,
  saving: 3,
  growth: 4,
};

export default function MentosList() {
  const { category } = useParams<{ category?: string }>();
  const mainTitle = useMemo(() => (category ? (TITLE_MAP[category] ?? "") : ""), [category]);
  const categoryId = category ? CATEGORY_ID_MAP[category] : undefined;

  const headerRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const [cardH, setCardH] = useState(0);
  const [containerH, setContainerH] = useState(0);

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useMentosInfiniteList(categoryId ?? 0, LIMIT);

  const list = data?.pages.flatMap((p) => p.result.mentos) ?? [];
  const empty = status === "success" && !isLoading && !isError && list.length === 0;
  const pages = useMemo(() => chunk(list, 2), [list]);
  const { user, login } = useAuth();
  const isLoggedIn = !!user;
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const OPEN_LOGIN_SHEET = "app:login:open";
  const openGuardRef = useRef(false);
  const isLoggedInRef = useRef(isLoggedIn);
  const showLoginFormRef = useRef(showLoginForm);
  useEffect(() => {
    isLoggedInRef.current = isLoggedIn;
  }, [isLoggedIn]);
  useEffect(() => {
    showLoginFormRef.current = showLoginForm;
  }, [showLoginForm]);

  useEffect(() => {
    const calc = () => {
      const titleBottom = headerRef.current?.getBoundingClientRect().bottom ?? 0;
      const viewportH = window.innerHeight;
      const scrollPadding = 32; // px-4의 양쪽 패딩 고려
      const available = Math.max(0, viewportH - titleBottom - scrollPadding);

      // 2개 카드 + 1개 갭이 들어갈 높이
      const cardHeight = Math.floor((available - CARD_GAP) / 2);

      setCardH(cardHeight);
      setContainerH(available);
    };

    calc();
    window.addEventListener("resize", calc);
    const ro = new ResizeObserver(calc);
    if (headerRef.current) ro.observe(headerRef.current);

    return () => {
      window.removeEventListener("resize", calc);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!loaderRef.current || !scrollRef.current || !hasNextPage) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
        }
      },
      { root: scrollRef.current, rootMargin: "200px 0px" },
    );
    io.observe(loaderRef.current);
    return () => io.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    const EVENT = OPEN_LOGIN_SHEET;
    const KEY_HANDLER = "__mentos_login_handler__";
    const KEY_LAST_TS = "__mentos_login_lastts__";
    const target = document as any;

    if (!target[KEY_HANDLER]) {
      const handler = (ev: Event) => {
        const now = Date.now();
        const last = typeof target[KEY_LAST_TS] === "number" ? target[KEY_LAST_TS] : 0;
        if (now - last < 250) return;
        target[KEY_LAST_TS] = now;

        if (!isLoggedInRef.current && !showLoginFormRef.current) {
          setLoginError(null);
          setShowLoginForm(true);
        }
      };

      target.addEventListener(EVENT, handler);
      target[KEY_HANDLER] = handler;
    }

    return () => {
      const current = target[KEY_HANDLER] as EventListener | undefined;
      if (current) {
        target.removeEventListener(EVENT, current);
        delete target[KEY_HANDLER];
        delete target[KEY_LAST_TS];
      }
    };
  }, []);

  const handleLoginSubmit = async ({
    id,
    pw,
    role,
  }: {
    id: string;
    pw: string;
    role: "mentee" | "mentor";
  }) => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const userType = role === "mentor" ? "MENTO" : "MENTI";
      await login({ userType, memberId: id, memberPwd: pw });
      setShowLoginForm(false);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "로그인에 실패했습니다. 아이디/비밀번호를 확인해주세요.";
      setLoginError(msg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (!categoryId) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-50">
        <span className="text-sm text-slate-500">잘못된 카테고리입니다.</span>
      </div>
    );
  }

  return (
    <div className="to-[#c2d2f1]font-sans min-h-screen bg-gradient-to-b from-[#F7FAFF] antialiased">
      <div className="mx-auto min-h-screen max-w-md">
        {/* 타이틀 */}
        <div ref={headerRef} className="px-6 pb-4">
          <MentosMainTitleComponent mainTitle={mainTitle} />
        </div>

        {/* 스크롤 영역 */}
        <div
          ref={scrollRef}
          className="snap-y snap-mandatory overflow-y-auto px-4"
          style={containerH ? { height: `${containerH}px` } : undefined}>
          {isLoading && (
            <div className="flex items-center justify-center py-16 text-sm text-slate-600">
              멘토링을 불러오는 중...
            </div>
          )}

          {isError && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-sm">
              <span className="text-red-500">목록을 불러올 수 없습니다.</span>
              <button
                onClick={() => refetch()}
                className="rounded bg-slate-900 px-3 py-1 text-white">
                다시 시도
              </button>
            </div>
          )}

          {empty && <div className="py-20 text-center text-slate-500">표시할 멘토링이 없어요.</div>}

          <div className="flex flex-col" style={{ gap: `${CARD_GAP}px` }}>
            {pages.map((pair, pageIdx) => (
              <div
                key={`page-${pageIdx}`}
                className="flex snap-start flex-col"
                style={{ gap: `${CARD_GAP}px` }}>
                {pair.map((item) => (
                  <MentosCard
                    key={item.mentosSeq}
                    mentosSeq={item.mentosSeq}
                    title={item.mentosTitle}
                    price={item.mentosPrice}
                    location={item.region}
                    status="guest"
                    imageUrl={item.mentosImg}
                    approved={item.approved}
                    fixedHeight={cardH}
                  />
                ))}
              </div>
            ))}
          </div>

          {hasNextPage && <div ref={loaderRef} className="mt-6 h-4 w-full" />}

          {isFetchingNextPage && (
            <div className="flex justify-center py-8 text-sm text-slate-500">더 불러오는 중…</div>
          )}
        </div>
      </div>

      {typeof document !== "undefined" &&
        createPortal(
          <LoginSheet
            open={showLoginForm && !isLoggedIn}
            onClose={() => setShowLoginForm(false)}
            onSubmit={handleLoginSubmit}
            error={loginError}
            loading={isLoggingIn}
            placement="container"
            className="z-[9999]"
          />,
          (document.querySelector("[data-app-screen]") as HTMLElement) ??
            (document.getElementById("memento-sim-root") as HTMLElement) ??
            document.body,
        )}
    </div>
  );
}
