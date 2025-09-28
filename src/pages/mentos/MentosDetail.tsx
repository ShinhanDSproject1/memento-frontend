// src/pages/mentos/MentosDetail.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { useAuth } from "@entities/auth";
import { KakaoMapController } from "@entities/editor";

import type { MentosDetailResult, ReviewItem } from "@shared/api/mentos";
import { getMentosDetail, getMentosReviewsPage } from "@shared/api/mentos";

import Button from "@/widgets/common/Button";
import SnapCarousel from "@/widgets/common/SnapCarousel";
import { LoginSheet } from "@/widgets/home2/LoginSheet";
import ReviewMentosDetailCard from "@/widgets/mentos/ReviewMentosDetailCard";

import clockIcon from "@assets/icons/icon-clock.svg";
import locationIcon from "@assets/icons/icon-location.svg";
import starIcon from "@assets/icons/icon-star.svg";

import DOMPurify from "dompurify";
import { createPortal } from "react-dom";

/* ---------- HTML sanitize ---------- */
function toHtml(input?: string): { __html: string } {
  const raw = input ?? "";
  const withBreaks = raw.replace(/\r\n|\r|\n/g, "<br/>");
  const sanitized = DOMPurify.sanitize(withBreaks, {
    ALLOWED_TAGS: [
      "b",
      "strong",
      "i",
      "em",
      "u",
      "s",
      "br",
      "p",
      "div",
      "span",
      "ul",
      "ol",
      "li",
      "a",
      "blockquote",
      "code",
      "pre",
    ],
    ALLOWED_ATTR: ["href", "target", "rel"],
  });
  return { __html: sanitized };
}

/* ---------- 유틸 ---------- */
type UserType = "mentee" | "mentor" | "admin" | "guest";
function normalizeRole(memberType?: string | null): UserType | undefined {
  const t = (memberType ?? "").toUpperCase().trim();
  if (t === "MENTEE" || t === "MENTI") return "mentee";
  if (t === "MENTOR" || t === "MENTO") return "mentor";
  if (t === "ADMIN") return "admin";
  return undefined;
}

type MentoLike = { mentoName?: string; mentoImg?: string; mentoDescription?: string };
function pickFirstMento(mento: unknown): MentoLike | undefined {
  if (!mento) return undefined;
  if (Array.isArray(mento)) return (mento[0] as MentoLike) ?? undefined;
  return mento as MentoLike;
}

export default function MentosDetail() {
  const { user, login } = useAuth();
  const normalized = normalizeRole((user as any)?.memberType ?? (user as any)?.role);
  const isMentor = (normalized ?? "guest") === "mentor";
  const isLoggedIn = !!user;

  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();

  const [data, setData] = useState<MentosDetailResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // 로그인 시트 상태
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // 리뷰 상태
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [rvCursor, setRvCursor] = useState<string | null>(null);
  const [rvHasNext, setRvHasNext] = useState(true);
  const [rvLoading, setRvLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(false);
  const rvSeenRef = useRef<Set<number>>(new Set());
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // 지도
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const ctrlRef = useRef<KakaoMapController | null>(null);

  // 이벤트 이름 (헤더와 일치)
  const OPEN_LOGIN_SHEET = "app:login:open";

  // 최신 상태를 이벤트 핸들러에서 참조하기 위한 ref
  const isLoggedInRef = useRef(isLoggedIn);
  const showLoginFormRef = useRef(showLoginForm);
  useEffect(() => {
    isLoggedInRef.current = isLoggedIn;
  }, [isLoggedIn]);
  useEffect(() => {
    showLoginFormRef.current = showLoginForm;
  }, [showLoginForm]);

  /* 상세 API */
  useEffect(() => {
    if (!id) return;
    let alive = true;
    (async () => {
      try {
        const res = await getMentosDetail(Number(id));
        if (alive) setData(res);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "불러오기에 실패했어요.";
        if (alive) setErr(msg);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  /* 헤더 이벤트 → 로그인 시트 열기 (이 페이지에서만 반응, 중복 리스너 방지) */
  useEffect(() => {
    const HANDLER_KEY = "__mentos_login_handler__";
    const target: any = document;

    const handler = (ev: Event) => {
      const _detail = (ev as CustomEvent).detail;
      if (!isLoggedInRef.current && !showLoginFormRef.current) {
        setLoginError(null);
        setShowLoginForm(true);
      }
    };

    if (!target[HANDLER_KEY]) {
      target.addEventListener(OPEN_LOGIN_SHEET, handler);
      target[HANDLER_KEY] = handler;
    }

    return () => {
      const current = target[HANDLER_KEY] as undefined;
      if (current) {
        target.removeEventListener(OPEN_LOGIN_SHEET, current);
        delete target[HANDLER_KEY];
      }
    };
  }, []);

  /* 리뷰 페이지 로더 */
  const loadMoreReviews = useCallback(async () => {
    if (!id || rvLoading || !rvHasNext) return;
    setRvLoading(true);
    try {
      const page = await getMentosReviewsPage(Number(id), { limit: 5, cursor: rvCursor });
      setRvHasNext(page.hasNext);
      setRvCursor(page.nextCursor);
      setReviews((prev) => {
        if (rvCursor === null) {
          rvSeenRef.current.clear();
          page.reviews.forEach((r) => rvSeenRef.current.add(r.reviewSeq));
          return page.reviews;
        }
        const more = page.reviews.filter((r) => !rvSeenRef.current.has(r.reviewSeq));
        more.forEach((r) => rvSeenRef.current.add(r.reviewSeq));
        return [...prev, ...more];
      });
    } finally {
      setRvLoading(false);
    }
  }, [id, rvCursor, rvHasNext, rvLoading]);

  // ID 바뀔 때 초기화
  useEffect(() => {
    rvSeenRef.current.clear();
    setReviews([]);
    setRvCursor(null);
    setRvHasNext(true);
    setRvLoading(false);
    setInitialLoad(false);
  }, [id]);

  // 첫 페이지
  useEffect(() => {
    if (!data || !id || initialLoad) return;
    setInitialLoad(true);
    loadMoreReviews();
  }, [data, id, initialLoad, loadMoreReviews]);

  // 무한 스크롤
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !rvHasNext || rvLoading) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && loadMoreReviews()),
      { root: null, rootMargin: "200px 0px", threshold: 0.1 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [rvHasNext, rvLoading, loadMoreReviews]);

  /* 지도 초기화 */
  useEffect(() => {
    if (!data) return;
    const host = mapDivRef.current;
    if (!host) return;
    const ctrl = new KakaoMapController(host);
    ctrlRef.current = ctrl;
    (async () => {
      try {
        await ctrl.init();
        ctrl.relayout();
        setTimeout(() => ctrl.relayout(), 0);
      } catch {
        // 지도 초기화 실패 무시 (콘솔 출력 제거)
      }
    })();
    return () => {
      try {
        ctrlRef.current?.destroy();
      } catch {}
      ctrlRef.current = null;
    };
  }, [data]);

  /* 주소 지오코딩 */
  useEffect(() => {
    const ctrl = ctrlRef.current;
    const address = data?.mentosLocation;
    if (!ctrl || !address) return;
    const services = (window as any)?.kakao?.maps?.services;
    if (!services) {
      // SDK에 &libraries=services 미포함 시 무시 (콘솔 출력 제거)
      return;
    }
    const geocoder = new services.Geocoder();
    geocoder.addressSearch(address, (result: any[], status: string) => {
      if (status === "OK" && result?.[0]) {
        const lat = parseFloat(result[0].y);
        const lng = parseFloat(result[0].x);
        ctrl.setMyLocation(lat, lng);
        ctrl.relayout();
      } else {
        ctrl.setMyLocation(37.5665, 126.978);
        ctrl.relayout();
      }
    });
  }, [data?.mentosLocation]);

  /* 예약 버튼 */
  const handleGoBooking = () => {
    if (!id || !data) return;
    if (isMentor) return; // 멘토는 예약 불가
    if (!isLoggedIn) {
      setShowLoginForm(true);
      setLoginError(null);
      return;
    }
    navigate("/booking", {
      state: { mentosSeq: Number(id), title: data.mentosTitle, price: data.mentosPrice },
    });
  };

  /* 로그인 제출 */
  const handleLoginSubmit = async ({
    id: pid,
    pw: ppw,
    role: rrole,
  }: {
    id: string;
    pw: string;
    role: "mentee" | "mentor";
  }) => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const userType = rrole === "mentor" ? "MENTO" : "MENTI";
      await login({ userType, memberId: pid, memberPwd: ppw });
      setShowLoginForm(false);
      if (rrole === "mentee" && data) {
        navigate("/booking", {
          state: {
            mentosSeq: Number(id),
            title: data.mentosTitle,
            price: data.mentosPrice,
            from: location,
          },
        });
      }
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

  /* 가드 */
  if (loading) return <div className="p-4">불러오는 중…</div>;
  if (err) return <div className="p-4 text-red-600">에러: {err}</div>;
  if (!data) return <div className="p-4">데이터가 없어요.</div>;

  const mento = pickFirstMento((data as unknown as { mento?: MentoLike | MentoLike[] }).mento);
  const ratingAvg = Number.isFinite(data.reviewRatingAvg) ? data.reviewRatingAvg : 0;
  const reviewCountText = Number(data.reviewTotalCnt ?? 0).toLocaleString();

  return (
    <main className="relative flex w-full flex-col gap-5 bg-white">
      {/* 상단 이미지 */}
      <section className="flex h-[20%] w-full items-center justify-center">
        <img className="w-full" src={data.mentosImage} alt="mentos image" />
      </section>

      {/* 타이틀, 위치, 시간, 별점 */}
      <section className="flex w-full flex-col gap-3 px-4">
        <p className="font-WooridaumB text-[1.2rem] font-bold">{data.mentosTitle}</p>

        <div className="flex flex-row items-center gap-1.5 text-sm">
          <img src={locationIcon} alt="location" />
          <span className="font-WooridaumR text-[0.8rem] leading-3 text-[#a0a09c]">
            {data.mentosLocation}
          </span>
        </div>

        <div className="flex h-full items-center justify-between">
          <div className="flex w-auto flex-row items-center gap-1.5 text-sm">
            <img src={clockIcon} alt="clock" />
            <span className="font-WooridaumR text-[0.8rem] leading-3 text-[#a0a09c]">총 1시간</span>
          </div>

          <div className="flex h-full items-center">
            <div className="flex gap-1">
              <img
                className="inline-block h-[0.6rem] w-[0.6rem] align-middle"
                src={starIcon}
                alt="star"
              />
              <span className="font-WooridaumB text-[0.9rem] leading-3 font-bold text-gray-900">
                {ratingAvg.toFixed(2)}
              </span>
            </div>
            <span className="mx-1.5 h-1 w-1 rounded-full bg-gray-500" />
            <span className="font-WooridaumB text-[0.8rem] leading-3 font-medium text-gray-900 underline">
              {reviewCountText}건 리뷰
            </span>
          </div>
        </div>
      </section>

      {/* 리뷰 캐러셀 */}
      <section className="w-full pt-6">
        {reviews.length > 0 ? (
          <SnapCarousel className="flex w-full">
            {reviews.map((rv) => (
              <div key={rv.reviewSeq} className="snap-item w-[85%] flex-none snap-center">
                <ReviewMentosDetailCard
                  value={rv.reviewRating}
                  context={rv.reviewContent}
                  name={rv.memberName ?? "익명 멘토"}
                />
              </div>
            ))}

            {/* 더 불러오기 트리거 */}
            {rvHasNext && (
              <div
                ref={sentinelRef}
                className="snap-item flex w-[85%] flex-none snap-center items-center justify-center">
                <button
                  type="button"
                  disabled={rvLoading}
                  onClick={loadMoreReviews}
                  className="rounded-xl border px-4 py-3 text-sm disabled:opacity-50">
                  {rvLoading ? "불러오는 중…" : "리뷰 더 불러오기"}
                </button>
              </div>
            )}
          </SnapCarousel>
        ) : (
          <div className="flex w-full justify-center py-8">
            <div className="text-sm text-gray-500">
              {rvLoading ? "리뷰를 불러오는 중..." : "아직 리뷰가 없어요."}
            </div>
          </div>
        )}
      </section>

      {/* 지도 섹션 */}
      <section className="flex w-full justify-center border-b border-b-zinc-100 px-4 py-2">
        <div className="w-full overflow-hidden rounded-xl border border-gray-200">
          <div ref={mapDivRef} id="mentos-detail-map" className="h-[220px] min-h-[220px] w-full" />
        </div>
      </section>

      {/* 멘토 소개 & 상세 설명 */}
      <section className="flex w-full justify-center px-4 pt-10">
        <div className="w-full max-w-sm">
          <h2 className="font-WooridaumB mb-3 text-center text-xl font-extrabold">멘토 소개</h2>

          <div className="flex justify-center">
            <div className="h-40 w-40 overflow-hidden rounded-full shadow-md ring-4 ring-white">
              <img
                src={mento?.mentoImg}
                alt="멘토 프로필"
                className="h-full w-full rounded-full object-cover"
              />
            </div>
          </div>

          <div className="mt-3 flex justify-center">
            <span className="rounded-full bg-[#0059FF] px-4 py-1 text-sm font-bold text-white">
              {mento?.mentoName ?? "익명 멘토"}
            </span>
          </div>

          <div className="-mt-4 rounded-[20px] bg-[#F4F4F4] p-6 shadow-sm">
            <div
              className="text-[17px] leading-relaxed font-medium"
              dangerouslySetInnerHTML={toHtml(mento?.mentoDescription)}
            />
          </div>

          <div className="mt-6 flex w-full flex-col items-center px-2 pb-4 text-center text-[0.9rem]">
            <div
              className="text-center leading-relaxed"
              dangerouslySetInnerHTML={toHtml(data.mentosDescription)}
            />
          </div>
        </div>
      </section>

      {/* 하단 가격 + 버튼 / 멘토 안내 */}
      <div className="flex w-full items-center gap-4 border-t border-t-zinc-100 p-4">
        <div className="flex-1 text-center">
          <span className="font-WooridaumB font-bold">
            {Number(data.mentosPrice).toLocaleString()}원
          </span>
        </div>
        {isMentor ? (
          <div className="flex-1 text-center text-sm text-gray-500">멘토는 예약할 수 없습니다</div>
        ) : (
          <Button variant="primary" size="lg" className="flex-1" onClick={handleGoBooking}>
            예약하기
          </Button>
        )}
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
            placement="container"
            className="z-[9999]"
          />,
          (document.querySelector("[data-app-screen]") as HTMLElement) ??
            (document.getElementById("memento-sim-root") as HTMLElement) ??
            document.body,
        )}
    </main>
  );
}
