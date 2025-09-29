import Button from "@/widgets/common/Button";
import { Link } from "react-router-dom";

type MentosStatus = "completed" | "pending" | "mento" | "guest";

type MentosCardProps = {
  mentosSeq: number;
  title: string;
  price?: number;
  location?: string;
  status: MentosStatus;
  approved?: boolean;
  imageUrl?: string;
  onReportClick?: () => void;
  onReviewClick?: () => void;
  onRefundClick?: () => void;
  onUpdateClick?: () => void;
  onDeleteClick?: () => void;
  refundDisabled?: boolean;
  reviewDisabled?: boolean;
  /** 2장 딱 맞춤용 고정 높이 (리스트에서 내려줌) */
  fixedHeight?: number;
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

export default function MentosCard({
  mentosSeq,
  onReviewClick,
  onDeleteClick,
  onRefundClick,
  onReportClick,
  onUpdateClick,
  approved = false,
  title,
  price,
  location,
  status,
  imageUrl,
  refundDisabled,
  reviewDisabled,
  fixedHeight,
}: MentosCardProps) {
  const statusClassName = statusStyles[status] ?? "";
  const statusText = statusTextMap[status] ?? "";
  const formattedPrice =
    typeof price === "number" && Number.isFinite(price)
      ? price.toLocaleString()
      : String(price ?? "");

  const actionButton = (() => {
    switch (status) {
      case "completed": {
        const isDisabled = !!reviewDisabled;
        return (
          <>
            <Button
              className={`text-xs ${isDisabled ? "cursor-not-allowed opacity-70" : ""}`}
              variant="lightBlue"
              size="sm"
              disabled={isDisabled}
              aria-disabled={isDisabled}
              onClick={isDisabled ? undefined : onReviewClick}
              title={isDisabled ? "이미 리뷰를 작성했습니다" : "리뷰 작성"}>
              {isDisabled ? "리뷰 완료" : "리뷰 작성"}
            </Button>
            <Button className="text-xs" variant="danger" size="sm" onClick={onReportClick}>
              신고하기
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
            onClick={isDisabled ? undefined : onRefundClick}
            title={isDisabled ? "환불이 불가한 항목입니다" : "환불하기"}>
            환불하기
          </Button>
        );
      }
      case "mento":
        return (
          <>
            <Button className="text-xs" variant="lightBlue" size="sm" onClick={onUpdateClick}>
              수정하기
            </Button>
            <Button className="text-xs" variant="danger" size="sm" onClick={onDeleteClick}>
              삭제하기
            </Button>
          </>
        );
      default:
        return null;
    }
  })();

  return (
    <div
      className={[
        "mx-auto w-full max-w-[400px] snap-start",
        // Glass-lite 카드
        "overflow-hidden rounded-2xl bg-white/90 backdrop-blur-[1px]",
        "shadow-[0_6px_18px_-8px_rgba(2,6,23,0.20)] ring-1 ring-slate-200",
        // 터치 시만 미세한 압축감
        "transition-transform active:scale-[0.997]",
        // 파랑 하이라이트 제거
        "focus-within:ring-0",
        // 성능
        "content-visibility-auto will-change-transform",
      ].join(" ")}
      style={fixedHeight ? ({ height: `${fixedHeight}px` } as React.CSSProperties) : undefined}>
      <Link
        to={`/menti/mentos-detail/${mentosSeq}`}
        className="block h-full outline-none focus-visible:outline-none"
        style={{ WebkitTapHighlightColor: "transparent" }}>
        {/* 썸네일: 72% (더 크게) */}
        <div className="relative h-[72%] overflow-hidden bg-slate-100">
          {approved && (
            <div className="absolute top-[20px] right-[-35px] z-10 flex h-[35px] w-[140px] rotate-45 items-center justify-center overflow-hidden bg-[#1161ff]">
              <div className="font-WooridaumR text-center text-[16px] text-white">EXPERT</div>
            </div>
          )}
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

        <div className="flex h-[28%] flex-col justify-between px-3.5 py-3">
          {/* 제목 */}
          <h3 className="font-WooridaumR line-clamp-2 text-[16px] leading-snug font-semibold tracking-[-0.2px] text-slate-900">
            {title}
          </h3>

          {/* 메타 & 가격 */}
          <div className="mt-2 flex items-center justify-between">
            <div className="font-WooridaumR flex items-center text-slate-500">
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
              <span className="truncate text-[12px]"> {location} </span>
            </div>

            {/* 뉴트럴 가격 pill (작게, 고대비) */}
            <span className="font-WooridaumR rounded-full bg-slate-100 px-2 py-0.5 text-[12px] font-semibold text-slate-900">
              ₩{formattedPrice}
            </span>
          </div>

          {/* 필요한 경우만 버튼 */}
          {actionButton && <div className="mt-2 flex gap-2">{actionButton}</div>}
        </div>
      </Link>
    </div>
  );
}
