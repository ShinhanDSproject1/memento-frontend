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
const MY_MENTOS_QK = ["my-mentos-list"] as const;
const GAP_PX = 24; // 카드 간격 gap-6
const PAGE_PADDING_BOTTOM = 24; // pb-6

/* -------------------------------- Utils -------------------------------- */
const fmtDateTime = (ymd?: string, time?: string) => {
  if (!ymd) return "";
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return ymd;
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][new Date(y, m - 1, d).getDay()];
  return `${m}.${d}(${weekday})${time ? ` ${time}` : ""}`;
};

function getPaymentSeqFromLS(mentosSeq: number): number | undefined {
  const v = localStorage.getItem(`paymentSeqByMentos:${mentosSeq}`);
  return v ? Number(v) : undefined;
}
function getPaymentSeq(it: any): number | undefined {
  return (
    it?.reservationSeq ??
    it?.paymentSeq ??
    it?.paySeq ??
    it?.paymentId ??
    it?.payment?.reservationSeq ??
    it?.payment?.paymentSeq ??
    getPaymentSeqFromLS(it?.mentosSeq)
  );
}

/** 리뷰 완료 캐시 반영 */
function markReviewedInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  reservationSeq?: number,
) {
  if (!reservationSeq) return;
  queryClient.setQueryData<any>(MY_MENTOS_QK, (old) => {
    if (!old) return old;
    return {
      ...old,
      pages: old.pages?.map((pg: any) => {
        if (!pg?.result?.content) return pg;
        const newContent = pg.result.content.map((it: any) =>
          it?.reservationSeq === reservationSeq ? { ...it, reviewCompleted: true } : it,
        );
        return { ...pg, result: { ...pg.result, content: newContent } };
      }),
    };
  });
}

/** 신고 완료 캐시 반영 */
function markReportedInCache(queryClient: ReturnType<typeof useQueryClient>, mentosSeq?: number) {
  if (!mentosSeq) return;
  queryClient.setQueryData<any>(MY_MENTOS_QK, (old) => {
    if (!old) return old;
    return {
      ...old,
      pages: old.pages?.map((pg: any) => {
        if (!pg?.result?.content) return pg;
        const newContent = pg.result.content.map((it: any) =>
          it?.mentosSeq === mentosSeq ? { ...it, reportCompleted: true } : it,
        );
        return { ...pg, result: { ...pg.result, content: newContent } };
      }),
    };
  });
}

/** 빈 응답(컨텐츠 없음) 판별 */
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

interface ReviewModalData {
  mentosSeq?: number;
  initialRating?: number;
  initialContent?: string;
  reservationSeq?: number;
  onRatingChange?: (r: number) => void;
  onContentChange?: (t: string) => void;
}
interface ReportModalData {
  mentosSeq?: number;
  reportType?: ReportType;
  imageFile?: File | null;
  idemKey?: string;
}

/* ============================== Component ============================== */
const MyMentosList: FC<MyMentosListProps> = ({ role }) => {
  // 공통 레이아웃: 2장 고정 높이 계산
  const headerRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const [listH, setListH] = useState(0);
  const [cardH, setCardH] = useState(0);

  useEffect(() => {
    const calc = () => {
      const titleBottom =
        headerRef.current?.getBoundingClientRect().bottom ??
        scrollRef.current?.getBoundingClientRect().top ??
        0;
      const viewportH = window.innerHeight;
      const available = Math.max(0, viewportH - titleBottom - PAGE_PADDING_BOTTOM);
      setListH(available);
      setCardH(Math.floor((available - GAP_PX) / 2));
    };

    // 첫 계산 (레이아웃 잡힌 뒤 실행)
    const raf = requestAnimationFrame(calc);

    // 윈도우 리사이즈 대응
    window.addEventListener("resize", calc);

    // 헤더 자체 사이즈 변화(폰트 로딩, 줄바꿈 등) 대응
    const ro = new ResizeObserver(calc);
    if (headerRef.current) ro.observe(headerRef.current);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", calc);
      ro.disconnect();
    };
  }, []);

  // 모달/네비게이션
  const reviewDraftRef = useRef<{ rating: number; content: string }>({ rating: 0, content: "" });
  const { isOpen, modalType, openModal, closeModal, modalData } = useModal() as UseModalReturn;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  /** 확인/취소/제출 핸들러 (기존 로직 유지) */
  const handleConfirmAction = async () => {
    if (modalType === "refundMentos") {
      const { reservationSeq } = (modalData ?? {}) as { reservationSeq?: number };
      if (!reservationSeq) {
        openModal("faildPayment", {
          message: "결제 정보가 없습니다. 새로고침 후 다시 시도해주세요.",
        });
        return closeModal();
      }
      openModal("loading", { title: "환불 처리 중입니다…", description: "잠시만 기다려주세요 ⏳" });
      try {
        const res = await refundPayment(reservationSeq);
        closeModal();
        if (res?.status === 200 || res?.code === 1000) {
          await queryClient.invalidateQueries({ queryKey: MY_MENTOS_QK });
          await mentee.refetch?.();
          openModal("refundComplete");
        } else {
          openModal("faildPayment", { message: res?.message ?? "환불에 실패했습니다." });
        }
      } catch (e: any) {
        closeModal();
        openModal("faildPayment", {
          message: e?.response?.data?.message ?? "환불 중 오류가 발생했습니다.",
        });
      }
      return;
    }

    if (modalType === "deleteMentos") {
      const { mentosSeq } = (modalData ?? {}) as { mentosSeq?: number };
      if (!mentosSeq) return closeModal();
      openModal("loading", { title: "삭제 중입니다…", description: "잠시만 기다려주세요 ⏳" });
      try {
        const res = await deleteMentoMentos(mentosSeq);
        closeModal();
        if (res.code === 1000) {
          openModal("deleteComplete");
          mentor.refetch();
        } else {
          openModal("withdrawFailed", { message: res.message || "삭제에 실패했습니다." });
        }
      } catch {
        closeModal();
        openModal("withdrawFailed", { message: "삭제 중 오류가 발생했습니다." });
      }
      return;
    }

    if (modalType === "dismissUser") {
      closeModal();
      openModal("dismissSuccess");
      return;
    }
    closeModal();
  };
  const handleCancelAction = () => closeModal();

  const handleSubmit = async () => {
    if (modalType === "reviewMentos") {
      const { reservationSeq } = (modalData ?? {}) as ReviewModalData;
      const { rating, content } = reviewDraftRef.current;
      if (!reservationSeq)
        return openModal("needReviewContent", { message: "예약 정보가 없습니다." });
      if (!rating || !content.trim())
        return openModal("needReviewContent", { message: "별점과 내용을 입력하세요." });

      openModal("loading", { title: "리뷰 작성 중…", description: "잠시만 기다려주세요 ⏳" });
      try {
        const res = await createReview({
          reservationSeq,
          reviewRating: rating,
          reviewContent: content,
        });
        closeModal();
        if (res.code === 1000) {
          markReviewedInCache(queryClient, reservationSeq);
          openModal("reviewComplete");
          await queryClient.invalidateQueries({ queryKey: MY_MENTOS_QK });
          await mentee.refetch?.();
        } else {
          openModal("withdrawFailed", { message: res.message || "리뷰 작성에 실패했습니다." });
        }
      } catch {
        closeModal();
        openModal("withdrawFailed", { message: "리뷰 작성에 실패했습니다." });
      }
      return;
    }

    if (modalType === "reportMentos") {
      const { mentosSeq, reportType, imageFile, idemKey } = (modalData ?? {}) as ReportModalData;
      if (!mentosSeq || !reportType || !idemKey)
        return openModal("withdrawFailed", { message: "신고 정보가 올바르지 않습니다." });
      try {
        openModal("loading", { title: "신고 접수 중…", description: "잠시만 기다려주세요 ⏳" });
        await createReport({
          requestDto: { reportType, mentosSeq },
          imageFile: imageFile ?? null,
          idemKey,
        });
        closeModal();
        markReportedInCache(queryClient, mentosSeq);
        openModal("reportComplete");
      } catch {
        closeModal();
        openModal("withdrawFailed", { message: "신고 접수에 실패했습니다." });
      }
      return;
    }
  };

  // 버튼 액션
  const onReviewClick = (reservationSeq?: number, alreadyCompleted?: boolean) => {
    if (alreadyCompleted) {
      openModal("withdrawFailed", { message: "이미 리뷰를 작성한 항목입니다." });
      return;
    }
    openModal("reviewMentos", {
      title: "리뷰 작성",
      reservationSeq,
      initialRating: 3,
      initialContent: "",
      onRatingChange: (r: number) => (reviewDraftRef.current.rating = r),
      onContentChange: (t: string) => (reviewDraftRef.current.content = t),
    });
  };
  const onDeleteClick = (mentosSeq: number) => openModal("deleteMentos", { mentosSeq });
  const onUpdateClick = (mentosSeq: number) => navigate(`/edit/${mentosSeq}`);
  const onReportClick = (mentosSeq: number) =>
    openModal("reportMentos", { title: "신고하기", mentosSeq, idemKey: crypto.randomUUID() });
  const onRefundClick = (reservationSeq: number) => openModal("refundMentos", { reservationSeq });

  /* ------------------------------ Data hooks ------------------------------ */
  // 멘티
  const mentee = useMyMentosInfiniteList(5, { enabled: role === "menti" });
  const menteeList = useMemo(() => {
    const seen = new Set<number>();
    return (mentee.data?.pages ?? [])
      .flatMap((p) => p.result.content)
      .filter((it) => {
        if (seen.has(it.mentosSeq)) return false;
        seen.add(it.mentosSeq);
        return true;
      });
  }, [mentee.data]);

  const menteeEmpty = !mentee.isLoading && menteeList.length === 0;
  const menteeNoContent =
    (!mentee.isLoading && isEmptyPages(mentee.data)) ||
    (mentee.isError && isNoContentError(mentee.error));

  useEffect(() => {
    if (role === "menti") mentee.refetch();
  }, [role]);

  // 멘토
  const mentor = useMentoMentosInfiniteList(5, { enabled: role === "mento" });
  const mentorList = useMemo(() => {
    const seen = new Set<number>();
    return (mentor.data?.pages ?? [])
      .flatMap((p) => p.content)
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

  // 무한 스크롤: 스냅 컨테이너 기준
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

  /* ============================== Renders ============================== */
  const pageTitle = role === "mento" ? "멘토링 관리" : "나의 멘토링 내역";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F7FAFF] to-[#c2d2f1] font-sans antialiased">
      <div className="mx-auto min-h-screen max-w-md bg-gradient-to-b from-[#F7FAFF] to-[#c2d2f1]">
        {/* Title (MentosList와 동일하게) */}
        <div ref={headerRef} className="relative z-10 px-6 pb-2">
          <div className="flex items-baseline justify-between">
            <MentosMainTitleComponent mainTitle={pageTitle} />
            {role === "mento" && (
              <Button
                variant="primary"
                size="sm"
                className="!h-[32px] !rounded-[8px] !px-3 !text-[13px]"
                onClick={() => navigate("/create-mentos")}>
                멘토링 생성하기
              </Button>
            )}
          </div>
        </div>

        {/* Scroll area: 2-card snap */}
        <div
          ref={scrollRef}
          className="snap-y snap-mandatory overflow-y-auto px-4 pb-6"
          style={listH ? { height: `${listH}px` } : undefined}>
          {/* Loading / Error / Empty */}
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
                    status="mento" // ✅ 멘토 전용 버튼(수정/삭제) 활성화
                    role="mento" // ✅ 링크 분기 등 컨텍스트 전달
                    imageUrl={item.mentosImage}
                    reportDisabled={!!item.reportCompleted}
                    onUpdateClick={() => onUpdateClick(item.mentosSeq)}
                    onDeleteClick={() => onDeleteClick(item.mentosSeq)}
                    fixedHeight={cardH}
                  />
                ))
              : menteeList.map((item: MyMentosItem) => {
                  const dateLabel = fmtDateTime(item.mentosAt, item.mentosTime);
                  const locationLabel = dateLabel
                    ? `${dateLabel}${item.region ? ` · ${item.region}` : ""}`
                    : item.region;

                  const status = item.reviewCompleted ? "completed" : "pending";

                  return (
                    <MentosCard
                      key={item.mentosSeq}
                      mentosSeq={item.mentosSeq}
                      title={item.mentosTitle}
                      price={item.price}
                      location={locationLabel}
                      imageUrl={item.mentosImage}
                      status={status as any}
                      onReviewClick={() => onReviewClick(item.reservationSeq, item.reviewCompleted)}
                      onRefundClick={() =>
                        item.reservationSeq
                          ? onRefundClick(item.reservationSeq)
                          : openModal("withdrawFailed", {
                              message: "해당 항목에는 예약 내역이 없습니다.",
                            })
                      }
                      onReportClick={() =>
                        item.reportCompleted
                          ? openModal("withdrawFailed", { message: "이미 신고한 항목입니다." })
                          : onReportClick(item.mentosSeq)
                      }
                      refundDisabled={!item.reservationSeq}
                      reviewDisabled={item.reviewCompleted}
                      reportDisabled={!!item.reportCompleted}
                      fixedHeight={cardH}
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
          onConfirm={
            modalType === "reviewMentos" || modalType === "reportMentos"
              ? handleSubmit
              : handleConfirmAction
          }
          onCancel={handleCancelAction}
          isOpen={isOpen}
          onSubmit={handleSubmit}
          modalData={modalData}
        />
      ) : null}
    </div>
  );
};

export default MyMentosList;
