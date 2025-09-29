// src/pages/mentos/MentosList.tsx
import { useMentosInfiniteList } from "@/features";
import { MentosCard } from "@widgets/common";
import { MentosMainTitleComponent } from "@widgets/mentos";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";

// 로그인 바텀시트 & 인증 훅 & 포털
import { LoginSheet } from "@/widgets/home2/LoginSheet";
import { useAuth } from "@entities/auth";
import { createPortal } from "react-dom";

const LIMIT = 5;
const GAP_PX = 24; // gap-6
const PAGE_PADDING_BOTTOM = 24; // pb-6

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

  const [listH, setListH] = useState(0);
  const [cardH, setCardH] = useState(0);

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

  // 로그인 모달 상태 & 인증
  const { user, login } = useAuth();
  const isLoggedIn = !!user;
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // 헤더와 맞춘 이벤트 이름 & 중복 가드
  const OPEN_LOGIN_SHEET = "app:login:open";
  const openGuardRef = useRef(false);

  // ✅ 최신 상태를 안전하게 읽기 위한 ref (리스너는 한 번만 등록)
  const isLoggedInRef = useRef(isLoggedIn);
  const showLoginFormRef = useRef(showLoginForm);
  useEffect(() => {
    isLoggedInRef.current = isLoggedIn;
  }, [isLoggedIn]);
  useEffect(() => {
    showLoginFormRef.current = showLoginForm;
  }, [showLoginForm]);

  // 높이 계산 → 2장 고정
  useEffect(() => {
    const calcHeights = () => {
      const titleBottom =
        headerRef.current?.getBoundingClientRect().bottom ??
        scrollRef.current?.getBoundingClientRect().top ??
        0;
      const viewportH = window.innerHeight;
      const available = Math.max(0, viewportH - titleBottom - PAGE_PADDING_BOTTOM);
      setListH(available);
      setCardH(Math.floor((available - GAP_PX) / 2));
    };
    calcHeights();
    window.addEventListener("resize", calcHeights);
    return () => window.removeEventListener("resize", calcHeights);
  }, []);

  // 무한 스크롤
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

  // ✅ 헤더에서 쏜 이벤트를 이 페이지에서만 받아서 모달 오픈 (전역 싱글톤 + 디바운스)
  useEffect(() => {
    const EVENT = OPEN_LOGIN_SHEET;
    const KEY_HANDLER = "__mentos_login_handler__"; // 전역 핸들러 키
    const KEY_LAST_TS = "__mentos_login_lastts__"; // 전역 마지막 처리 시각
    const target = document as any;

    // 이미 등록되어 있으면 다시 등록하지 않음 (HMR/StrictMode 대비)
    if (!target[KEY_HANDLER]) {
      const handler = (ev: Event) => {
        // 초단기 중복 호출(더블 클릭/StrictMode/HMR) 디바운스
        const now = Date.now();
        const last = typeof target[KEY_LAST_TS] === "number" ? target[KEY_LAST_TS] : 0;
        if (now - last < 250) return; // 250ms 안에 다시 들어오면 무시
        target[KEY_LAST_TS] = now;

        if (!isLoggedInRef.current && !showLoginFormRef.current) {
          setLoginError(null);
          setShowLoginForm(true);
        }
      };

      target.addEventListener(EVENT, handler);
      target[KEY_HANDLER] = handler;
    }

    // 언마운트 시 해제 (개발/페이지 이동 시 클린업)
    return () => {
      const current = target[KEY_HANDLER] as EventListener | undefined;
      if (current) {
        target.removeEventListener(EVENT, current);
        delete target[KEY_HANDLER];
        delete target[KEY_LAST_TS];
      }
    };
  }, []); // 반드시 빈 배열: 리스너는 한 번만 등록

  // 로그인 제출 (리스트 페이지는 성공 시 모달만 닫음)
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
    // 페이지 배경: 아주 미세한 그라데이션
    <div className="to-[#c2d2f1]font-sans min-h-screen bg-gradient-to-b from-[#F7FAFF] antialiased">
      <div className="mx-auto min-h-screen max-w-md">
        {/* 타이틀 */}
        <div ref={headerRef} className="px-6 pb-2">
          <MentosMainTitleComponent mainTitle={mainTitle} />
        </div>

        {/* 스크롤 영역: 2장 스냅 */}
        <div
          ref={scrollRef}
          className="snap-y snap-mandatory overflow-y-auto px-4 pb-6"
          style={listH ? { height: `${listH}px` } : undefined}>
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

          <section className="flex flex-col gap-6 pt-4">
            {list.map((item) => (
              <MentosCard
                key={item.mentosSeq}
                mentosSeq={item.mentosSeq}
                title={item.mentosTitle}
                price={item.mentosPrice}
                location={item.region}
                status={"guest"}
                imageUrl={item.mentosImg}
                fixedHeight={cardH} // 2장 딱 맞춤
              />
            ))}
          </section>

          {hasNextPage && <div ref={loaderRef} className="mt-6 h-4 w-full" />}

          {isFetchingNextPage && (
            <div className="flex justify-center py-8 text-sm text-slate-500">더 불러오는 중…</div>
          )}
        </div>
      </div>

      {/* ✅ 포털로 로그인 모달 (뷰포트 기준) */}
      {typeof document !== "undefined" &&
        createPortal(
          <LoginSheet
            open={showLoginForm && !isLoggedIn}
            onClose={() => setShowLoginForm(false)}
            onSubmit={handleLoginSubmit}
            error={loginError}
            loading={isLoggingIn}
            placement="container" // ← fixed 대신 container
            className="z-[9999]"
          />,
          // ← 포털 타겟을 앱 화면 컨테이너로!
          (document.querySelector("[data-app-screen]") as HTMLElement) ??
            (document.getElementById("memento-sim-root") as HTMLElement) ??
            document.body,
        )}
    </div>
  );
}
