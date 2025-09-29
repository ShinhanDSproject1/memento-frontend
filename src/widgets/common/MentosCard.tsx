// src/widgets/common/MentosCard.tsx
import Button from "@/widgets/common/Button";
import type React from "react";
import { Link } from "react-router-dom";

type Role = "mento" | "menti" | undefined;
type MentosStatus = "completed" | "pending" | "mento" | "guest";

type MentosCardProps = {
  mentosSeq: number;
  title: string;
  price?: number;
  location?: string;
  status: MentosStatus;
  imageUrl?: string;
  onReportClick?: () => void;
  onReviewClick?: () => void;
  onRefundClick?: () => void;
  onUpdateClick?: () => void;
  onDeleteClick?: () => void;
  refundDisabled?: boolean;
  reviewDisabled?: boolean;
  reportDisabled?: boolean;
  fixedHeight?: number; // 부모가 계산한 고정 높이
  /** ✅ 추가: 화면 컨텍스트(멘토/멘티)에 따라 링크 등 분기 */
  role?: Role;
};

const statusStyles: Record<MentosStatus, string> = {
  completed: "bg-emerald-500",
  pending: "bg-amber-500",
  mento: "bg-blue-500",
  guest: "bg-transparent",
};
const statusTextMap: Partial<Record<MentosStatus, string>> = {
  completed: "진행 완료",
  pending: "진행 전",
};

export default function MentosCard(props: MentosCardProps) {
  const {
    mentosSeq,
    onReviewClick,
    onDeleteClick,
    onRefundClick,
    onReportClick,
    onUpdateClick,
    title,
    price,
    location,
    status,
    imageUrl,
    refundDisabled,
    reviewDisabled,
    reportDisabled,
    fixedHeight,
    role, // ✅ 추가
  } = props;

  const act = (fn?: () => void) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fn?.();
  };

  const statusClassName = statusStyles[status] ?? "";
  const statusText = statusTextMap[status] ?? "";
  const formattedPrice =
    typeof price === "number" && Number.isFinite(price)
      ? price.toLocaleString()
      : String(price ?? "");

  const actionButton = (() => {
    switch (status) {
      case "completed": {
        const isReviewDisabled = !!reviewDisabled;
        const isReportDisabled = !!reportDisabled;
        return (
          <>
            <Button
              className={`text-xs ${isReviewDisabled ? "cursor-not-allowed opacity-70" : ""}`}
              variant="lightBlue"
              size="sm"
              disabled={isReviewDisabled}
              aria-disabled={isReviewDisabled}
              onClick={isReviewDisabled ? undefined : act(onReviewClick)}
              title={isReviewDisabled ? "이미 리뷰를 작성했습니다" : "리뷰 작성"}>
              {isReviewDisabled ? "리뷰 완료" : "리뷰 작성"}
            </Button>
            <Button
              className={`text-xs ${isReportDisabled ? "cursor-not-allowed opacity-70" : ""}`}
              variant="danger"
              size="sm"
              disabled={isReportDisabled}
              aria-disabled={isReportDisabled}
              onClick={isReportDisabled ? undefined : act(onReportClick)}
              title={isReportDisabled ? "이미 신고한 항목입니다" : "신고하기"}>
              {isReportDisabled ? "신고 완료" : "신고하기"}
            </Button>
          </>
        );
      }
      case "pending": {
        const isDisabled = !!refundDisabled;
        return (
          <Button
            className={`text-xs ${isDisabled ? "cursor-not-allowed opacity-60" : ""}`}
            variant="refund"
            size="sm"
            disabled={isDisabled}
            aria-disabled={isDisabled}
            onClick={isDisabled ? undefined : act(onRefundClick)}
            title={isDisabled ? "환불이 불가한 항목입니다" : "환불하기"}>
            환불하기
          </Button>
        );
      }
      case "mento":
        return (
          <>
            <Button className="text-xs" variant="lightBlue" size="sm" onClick={act(onUpdateClick)}>
              수정하기
            </Button>
            <Button className="text-xs" variant="danger" size="sm" onClick={act(onDeleteClick)}>
              삭제하기
            </Button>
          </>
        );
      default:
        return null;
    }
  })();

  // // 내부 비율: md에서 이미지를 더 줄이고 정보 영역을 늘림
  // const hasActions = status === "completed" || status === "pending" || status === "mento";
  // const imageBoxH = hasActions ? "h-[64%] md:h-[55%]" : "h-[72%] md:h-[63%]";
  // const infoBoxH = hasActions ? "h-[36%] md:h-[45%]" : "h-[28%] md:h-[37%]";

  // ✅ 역할에 따른 디테일 링크 분기 (필요시 동일 경로로 둘 수도 있음)

  const detailPath = `/menti/mentos-detail/${mentosSeq}`;

  const wrapperBase =
    "mx-auto w-full max-w-[400px] snap-start overflow-hidden rounded-2xl bg-white/90 " +
    "backdrop-blur-[1px] shadow-[0_6px_18px_-8px_rgba(2,6,23,0.20)] ring-1 ring-slate-200 " +
    "transition-transform active:scale-[0.997] focus-within:ring-0 content-visibility-auto will-change-transform";

  const wrapperHeightClass = fixedHeight
    ? "[height:var(--card-h)] md:[height:calc(var(--card-h)*0.88)]"
    : "";

  return (
    <div
      className={`${wrapperBase} ${wrapperHeightClass}`}
      style={
        fixedHeight
          ? ({ ["--card-h" as any]: `${fixedHeight}px` } as React.CSSProperties)
          : undefined
      }>
      <Link
        to={detailPath}
        className="flex h-full flex-col outline-none focus-visible:outline-none"
        style={{ WebkitTapHighlightColor: "transparent" }}>
        {/* 썸네일 */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 md:aspect-[16/9]">
          <img
            className="h-full w-full object-cover"
            src={imageUrl || "https://picsum.photos/seed/picsum/400/240"}
            alt={title}
            loading="lazy"
          />
          {statusText && (
            <span
              className={[
                "absolute top-3 left-3 rounded-full px-2 py-0.5 text-[11px] font-medium text-white",
                "shadow-xs",
                statusClassName,
              ].join(" ")}>
              {statusText}
            </span>
          )}
        </div>

        {/* 정보 */}
        <div className="grid min-h-0 flex-1 grid-rows-[auto_auto_auto] gap-2 px-3.5 py-3">
          <h3 className="font-WooridaumB line-clamp-2 text-[14px] leading-snug font-semibold tracking-[-0.2px] break-keep text-slate-900">
            {title}
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 items-center text-slate-500">
              <svg
                className="mr-1.5 h-4 w-4 flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="truncate text-[12px]">{location}</span>
            </div>
            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[12px] font-semibold text-slate-900">
              ₩{formattedPrice}
            </span>
          </div>
          {actionButton && <div className="mt-2 flex flex-wrap gap-2">{actionButton}</div>}{" "}
        </div>
      </Link>
    </div>
  );
}
