// src/pages/MyMentosList.tsx
import { createReview } from "@/entities/review/api/createReview";
import { useMyMentosInfiniteList } from "@/features/mentos-list/hooks/useMyMentosInfiniteList";
import { refundPayment } from "@/shared/api/payments";
import Button from "@/widgets/common/Button";
import MentosCard from "@/widgets/common/MentosCard";
import MentosMainTitleComponent from "@/widgets/mentos/MentosMainTitleComponent";
import type { MyMentosItem } from "@entities/mentos";
import { createReport } from "@entities/mentos/api/createReport";
import { deleteMentoMentos } from "@entities/mentos/api/deleteMentoMentos";
import type { ReportType } from "@entities/mentos/model/types";
import { useMentoMentosInfiniteList } from "@features/mentos-list";
import { useModal } from "@hooks/ui/useModal";
import type { ModalKey } from "@shared/ui/ModalConfig";
import { useQueryClient } from "@tanstack/react-query";
import { CommonModal } from "@widgets/common";
import { useEffect, useMemo, useRef, useState, type FC } from "react";
import { useNavigate } from "react-router-dom";

/* -------------------------------- Types -------------------------------- */
type Role = "mento" | "menti";

type UseModalReturn = {
  isOpen: boolean;
  modalType?: ModalKey;
  modalData?: Record<string, unknown>;
  openModal: (type: ModalKey, data?: Record<string, unknown>) => void;
  closeModal: () => void;
};

interface MyMentosListProps {
  role: Role;
}

/* ------------------------------ Constants ------------------------------ */
const MY_MENTOS_QK = ["my-mentos-list"] as const; // 멘티 내역용
const GAP_PX = 24; // (이제 안 써도 OK, 남겨도 무방)
const PAGE_PADDING_BOTTOM = 0; // ← 화면 꽉 채우려면 0
const PAGE_GAP = 16; // ← 페이지(섹션) 사이 간격(px)

// 🔑 멘토 목록 쿼리키(훅과 동일한 limit 사용)
const MENTO_LIMIT = 5;
const MENTO_LIST_QK = (limit: number) => ["mentoMentos", limit] as const;

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
/* ------------------------------ Helpers ------------------------------ */
// 낙관적 삭제: 멘토 목록 캐시에서 항목 제거
function removeMentosFromCache(qc: ReturnType<typeof useQueryClient>, mentosSeq: number) {
  qc.setQueryData(MENTO_LIST_QK(MENTO_LIMIT), (old: any) => {
    if (!old?.pages) return old;
    return {
      ...old,
      pages: old.pages.map((pg: any) => ({
        ...pg,
        content: Array.isArray(pg?.content)
          ? pg.content.filter((it: any) => it.mentosSeq !== mentosSeq)
          : pg?.content,
      })),
    };
  });
}

/* -------------------------------- Utils -------------------------------- */
const fmtDateTime = (ymd?: string, time?: string) => {
  if (!ymd) return "";
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return ymd;
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][new Date(y, m - 1, d).getDay()];
  return `${m}.${d}(${weekday})${time ? ` ${time}` : ""}`;
};

const isEmptyPages = (data: any) => {
  if (!data?.pages || !Array.isArray(data.pages)) return false;
  return data.pages.every((pg: any) => {
    const content = pg?.result?.content ?? pg?.content;
    if (content == null) return true;
    return Array.isArray(content) ? content.length === 0 : true;
  });
};
const isNoContentError = (err: any) => {
  const s = err?.response?.status;
  return s === 204 || s === 404;
};

/* 모달 데이터 타입 */
interface ReviewModalData {
  reservationSeq?: number;
  initialRating?: number;
  initialContent?: string;
  // (모달 구현에 따라 onChange 콜백을 modalData로 넘길 수도 있음)
}
interface ReportModalData {
  mentosSeq?: number;
  reportType?: ReportType;
  imageFile?: File | null;
  idemKey?: string;
}
interface RefundModalData {
  reservationSeq?: number;
}
interface DeleteModalData {
  mentosSeq?: number;
}

/* ============================== Component ============================== */
const MyMentosList: FC<MyMentosListProps> = ({ role }) => {
  // 레이아웃 계산
  const headerRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const [listH, setListH] = useState(0);
  // const [cardH, setCardH] = useState(0);

  useEffect(() => {
    const calc = () => {
      const titleBottom =
        headerRef.current?.getBoundingClientRect().bottom ??
        scrollRef.current?.getBoundingClientRect().top ??
        0;
      const viewportH = window.innerHeight;
      const available = Math.max(0, viewportH - titleBottom - PAGE_PADDING_BOTTOM);
      setListH(available);
      // setCardH(Math.floor((available - GAP_PX) / 2));
    };
    const raf = requestAnimationFrame(calc);
    window.addEventListener("resize", calc);
    const ro = new ResizeObserver(calc);
    if (headerRef.current) ro.observe(headerRef.current);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", calc);
      ro.disconnect();
    };
  }, []);

  // 모달/네비/캐시
  const { isOpen, modalType, openModal, closeModal, modalData } = useModal() as UseModalReturn;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 리뷰 작성 임시 상태(모달 내부에서 onChange로 업데이트)
  const reviewDraftRef = useRef<{ rating: number; content: string }>({ rating: 0, content: "" });

  const theme =
    role === "mento"
      ? {
          bg: "bg-gradient-to-b from-emerald-50 to-emerald-100",
          title: "text-emerald-800",
          button: "bg-emerald-600 hover:bg-emerald-700 text-white",
        }
      : {
          bg: "bg-[#F0F7FF]",
          title: "text-[#1E3A8A]",
          button: "bg-[#005EF9] hover:bg-[#0045c9] text-white",
        };

  const pageTitle = role === "mento" ? "멘토링 관리" : "나의 멘토링 내역";

  /* ------------------------------ Data hooks ------------------------------ */
  // 멘티 목록
  const mentee = useMyMentosInfiniteList(5, { enabled: role === "menti" });
  const menteeList = useMemo(() => {
    const seen = new Set<number>();
    return (mentee.data?.pages ?? [])
      .flatMap((p) => p.result?.content ?? [])
      .filter((it) => {
        if (seen.has(it.mentosSeq)) return false;
        seen.add(it.mentosSeq);
        return true;
      });
  }, [mentee.data]);

  const menteeEmpty = !mentee.isLoading && menteeList.length === 0;
  const menteePages = useMemo(() => chunk(menteeList, 2), [menteeList]);

  const menteeNoContent =
    (!mentee.isLoading && isEmptyPages(mentee.data)) ||
    (mentee.isError && isNoContentError(mentee.error));

  // 멘토 목록
  const mentor = useMentoMentosInfiniteList(MENTO_LIMIT, { enabled: role === "mento" });
  const mentorList = useMemo(() => {
    const seen = new Set<number>();
    return (mentor.data?.pages ?? [])
      .flatMap((p) => p.content ?? [])
      .filter((it) => {
        if (seen.has(it.mentosSeq)) return false;
        seen.add(it.mentosSeq);
        return true;
      });
  }, [mentor.data]);

  const mentorEmpty = !mentor.isLoading && mentorList.length === 0;
  const mentorNoContent =
    (!mentor.isLoading && isEmptyPages(mentor.data)) ||
    (mentor.isError && isNoContentError(mentor.error));

  // 무한 스크롤
  useEffect(() => {
    const hasNext = role === "mento" ? mentor.hasNextPage : mentee.hasNextPage;
    const fetching = role === "mento" ? mentor.isFetchingNextPage : mentee.isFetchingNextPage;
    const loadMore = role === "mento" ? mentor.fetchNextPage : mentee.fetchNextPage;

    if (!loaderRef.current || !scrollRef.current || !hasNext) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && hasNext && !fetching) loadMore();
      },
      { root: scrollRef.current, rootMargin: "200px 0px" },
    );
    io.observe(loaderRef.current);
    return () => io.disconnect();
  }, [
    role,
    mentor.hasNextPage,
    mentor.isFetchingNextPage,
    mentor.fetchNextPage,
    mentee.hasNextPage,
    mentee.isFetchingNextPage,
    mentee.fetchNextPage,
  ]);

  /* ------------------------------ Modal handlers ------------------------------ */
  const handleConfirmAction = async () => {
    try {
      // 삭제 (멘토)
      if (modalType === "deleteMentos") {
        const { mentosSeq } = (modalData ?? {}) as DeleteModalData;
        if (!mentosSeq) return closeModal();

        // 이전 캐시 저장 (실패 시 롤백)
        const prev = queryClient.getQueryData(MENTO_LIST_QK(MENTO_LIMIT));

        // 낙관적 업데이트 → 즉시 카드 제거
        removeMentosFromCache(queryClient, mentosSeq);

        openModal("loading", { title: "삭제 중입니다…", description: "잠시만 기다려주세요 ⏳" });

        try {
          const res = await deleteMentoMentos(mentosSeq);
          closeModal();

          if (res.code === 1000) {
            // 서버 동기화
            await queryClient.invalidateQueries({ queryKey: MENTO_LIST_QK(MENTO_LIMIT) });
            await mentor.refetch();
            openModal("deleteComplete");
          } else {
            // 실패 시 롤백
            queryClient.setQueryData(MENTO_LIST_QK(MENTO_LIMIT), prev);
            openModal("withdrawFailed", { message: res.message || "삭제에 실패했습니다." });
          }
        } catch (e: any) {
          closeModal();
          queryClient.setQueryData(MENTO_LIST_QK(MENTO_LIMIT), prev);
          openModal("withdrawFailed", {
            message: e?.response?.data?.message ?? "삭제 중 오류가 발생했습니다.",
          });
        }
        return;
      }

      // 환불 (멘티)
      if (modalType === "refundMentos") {
        const { reservationSeq } = (modalData ?? {}) as RefundModalData;
        if (!reservationSeq) return closeModal();
        openModal("loading", { title: "환불 처리 중…", description: "잠시만 기다려주세요 ⏳" });
        const res = await refundPayment(reservationSeq);
        closeModal();

        if (res?.status === 200 || res?.code === 1000) {
          await queryClient.invalidateQueries({ queryKey: MY_MENTOS_QK });
          await mentee.refetch();
          openModal("refundComplete");
        } else {
          openModal("faildPayment", { message: res?.message ?? "환불에 실패했습니다." });
        }
        return;
      }

      // 신고 (멘티)
      if (modalType === "reportMentos") {
        const { mentosSeq, reportType, imageFile, idemKey } = (modalData ?? {}) as ReportModalData;
        if (!mentosSeq || !reportType || !idemKey) return closeModal();
        openModal("loading", { title: "신고 접수 중…", description: "잠시만 기다려주세요 ⏳" });
        await createReport({
          requestDto: { reportType, mentosSeq },
          imageFile: imageFile ?? null,
          idemKey,
        });
        closeModal();

        await queryClient.invalidateQueries({ queryKey: MY_MENTOS_QK });
        await mentee.refetch();
        openModal("reportComplete");
        return;
      }

      // 리뷰 작성 (멘티)
      if (modalType === "reviewMentos") {
        const { reservationSeq } = (modalData ?? {}) as ReviewModalData;
        const { rating, content } = reviewDraftRef.current;
        if (!reservationSeq || !rating || !content?.trim()) {
          return openModal("needReviewContent", { message: "별점과 내용을 입력하세요." });
        }
        openModal("loading", { title: "리뷰 작성 중…", description: "잠시만 기다려주세요 ⏳" });
        const res = await createReview({
          reservationSeq,
          reviewRating: rating,
          reviewContent: content,
        });
        closeModal();
        if (res.code === 1000) {
          await queryClient.invalidateQueries({ queryKey: MY_MENTOS_QK });
          await mentee.refetch();
          openModal("reviewComplete");
        } else {
          openModal("withdrawFailed", { message: res.message || "리뷰 작성에 실패했습니다." });
        }
        return;
      }
    } catch (e: any) {
      closeModal();
      openModal("withdrawFailed", {
        message: e?.response?.data?.message ?? "요청 처리 중 오류가 발생했습니다.",
      });
      return;
    }

    closeModal();
  };

  const handleCancelAction = () => closeModal();

  /* ============================== Render ============================== */
  return (
    <div className={`min-h-screen w-full font-sans antialiased ${theme.bg}`}>
      <div className="mx-auto min-h-screen max-w-md bg-transparent">
        {/* Title */}
        <div ref={headerRef} className="relative z-10 px-6 pb-2">
          <div className="flex items-baseline justify-between">
            <MentosMainTitleComponent mainTitle={pageTitle} className={theme.title} />
            {role === "mento" && (
              <Button
                variant="primary"
                size="sm"
                className={`!h-[32px] !rounded-[8px] !px-3 !text-[13px] ${theme.button}`}
                onClick={() => navigate("/create-mentos")}>
                멘토링 생성하기
              </Button>
            )}
          </div>
        </div>

        {/* Scroll area */}
        <div
          ref={scrollRef}
          className="snap-y snap-mandatory overflow-y-auto px-4"
          style={listH ? { height: `${listH}px` } : undefined}>
          {/* Loading / Empty */}
          {(role === "mento" ? mentor.isLoading : mentee.isLoading) && (
            <div className="flex items-center justify-center py-16 text-sm text-slate-600">
              불러오는 중…
            </div>
          )}
          {(role === "mento" ? mentorEmpty || mentorNoContent : menteeEmpty || menteeNoContent) && (
            <div className="py-20 text-center text-sm text-slate-500">
              {role === "mento"
                ? "멘토가 작성한 멘토링 내역이 존재하지 않습니다."
                : "멘토링 내역이 없습니다."}
            </div>
          )}

          {/* List */}
          <section className="flex flex-col gap-6 pt-1">
            {role === "mento"
              ? mentorList.map((item) => (
                  <MentosCard
                    key={item.mentosSeq}
                    mentosSeq={item.mentosSeq}
                    title={item.mentosTitle}
                    price={item.price}
                    location={item.region}
                    status="mento"
                    role="mento"
                    imageUrl={item.mentosImage}
                    // ▶ 버튼 → 모달 오픈
                    onUpdateClick={() => navigate(`/edit/${item.mentosSeq}`)}
                    onDeleteClick={() => openModal("deleteMentos", { mentosSeq: item.mentosSeq })}
                  />
                ))
              : menteeList.map((item: MyMentosItem) => {
                  const dateLabel = fmtDateTime(item.mentosAt, item.mentosTime);
                  const locationLabel = dateLabel
                    ? `${dateLabel}${item.region ? ` · ${item.region}` : ""}`
                    : item.region;

                  // ✅ 진행 상태 뱃지는 progressStatus 기준
                  const status: "pending" | "completed" =
                    item.progressStatus === "진행 완료" ? "completed" : "pending";

                  return (
                    <MentosCard
                      key={item.mentosSeq}
                      mentosSeq={item.mentosSeq}
                      title={item.mentosTitle}
                      price={item.price}
                      location={locationLabel}
                      imageUrl={item.mentosImage}
                      status={status}
                      role="menti"
                      onReviewClick={() =>
                        openModal("reviewMentos", {
                          reservationSeq: item.reservationSeq,
                          initialRating: 3,
                          initialContent: "",
                          onRatingChange: (r: number) => (reviewDraftRef.current.rating = r),
                          onContentChange: (t: string) => (reviewDraftRef.current.content = t),
                        } as any)
                      }
                      onRefundClick={() =>
                        item.reservationSeq
                          ? openModal("refundMentos", { reservationSeq: item.reservationSeq })
                          : openModal("withdrawFailed", {
                              message: "해당 항목에는 예약 내역이 없습니다.",
                            })
                      }
                      onReportClick={() =>
                        item.reportCompleted
                          ? openModal("withdrawFailed", { message: "이미 신고한 항목입니다." })
                          : openModal("reportMentos", {
                              mentosSeq: item.mentosSeq,
                              idemKey: crypto.randomUUID(),
                            })
                      }
                      refundDisabled={!item.reservationSeq}
                      reviewDisabled={item.reviewCompleted} // ✅ 리뷰 여부는 여기서 처리
                      reportDisabled={!!item.reportCompleted}
                    />
                  );
                })}
          </section>

          {/* Infinite loader */}
          {(role === "mento" ? mentor.hasNextPage : mentee.hasNextPage) && (
            <div ref={loaderRef} className="mt-6 h-4 w-full" />
          )}
          {(role === "mento" ? mentor.isFetchingNextPage : mentee.isFetchingNextPage) && (
            <div className="flex justify-center py-8 text-sm text-slate-500">더 불러오는 중…</div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isOpen && modalType ? (
        <CommonModal
          type={modalType}
          isOpen={isOpen}
          onConfirm={handleConfirmAction}
          onCancel={closeModal}
          onSubmit={handleConfirmAction}
          modalData={modalData}
        />
      ) : null}
    </div>
  );
};

export default MyMentosList;
