import BookingSummaryCard from "@/widgets/booking/BookingSummaryCard";
import TermsAccordion from "@/widgets/booking/TermsAccordion";
import PrivacyCollectTerms from "@/widgets/booking/term/PrivacyCollectTerms";
import PrivacyThirdPartyTerms from "@/widgets/booking/term/PrivacyThirdPartyTerms";
import TermsOfUse from "@/widgets/booking/term/TermsOfUse";

import { initMentosPayment } from "@/shared/api/payments";
import { createReservation } from "@/shared/api/reservations";
import { getAccessToken } from "@/shared/auth/token";
import { useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

type BookingState = {
  title: string;
  date: string;
  time: string;
  price: number;
  mentosSeq?: number;
};

const weekdayKo = ["일", "월", "화", "수", "목", "금", "토"];
const fmt = (ymd: string, time: string) => {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  return `${m}.${d}(${weekdayKo[dt.getDay()]}) ${time}`;
};

export default function BookingConfirm() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [sp] = useSearchParams();
  const booking = (state || {}) as Partial<BookingState>;

  const mentosSeq = booking.mentosSeq ?? Number(sp.get("mentosSeq") ?? sp.get("mentorId") ?? 0);

  const valid =
    !!booking.date &&
    !!booking.time &&
    !!booking.title &&
    typeof booking.price === "number" &&
    mentosSeq > 0;

  const whenText = useMemo(
    () => (valid ? fmt(booking!.date!, booking!.time!) : "-"),
    [valid, booking],
  );

  const [submitting, setSubmitting] = useState(false);

  const handlePay = async () => {
    if (!getAccessToken()) {
      alert("로그인이 필요한 기능입니다.");
      navigate("/login", { state: { from: location.pathname + location.search } });
      return;
    }
    if (!valid || submitting) return;

    setSubmitting(true);
    try {
      await createReservation({
        mentosSeq,
        mentosAt: booking.date!,
        mentosTime: booking.time!,
      });

      const init = await initMentosPayment({
        mentosSeq,
        mentosAt: booking.date!,
        mentosTime: booking.time!,
      });

      if (!init?.successUrl || !init?.orderId) {
        throw new Error("결제 리다이렉트 URL 또는 주문번호가 없습니다.");
      }

      sessionStorage.setItem(
        "mentos.pay.ctx",
        JSON.stringify({
          mentosSeq,
          date: booking.date!,
          time: booking.time!,
          title: booking.title ?? "멘토링",
          price: booking.price ?? 0,
        }),
      );

      const { loadTossPayments } = await import("@tosspayments/payment-sdk");
      const toss = await loadTossPayments(import.meta.env.VITE_TOSS_CLIENT_KEY as string);

      const successUrl = `${window.location.origin}/payments/success`;
      const failUrl = `${window.location.origin}/payments/fail`;

      await toss.requestPayment("카드", {
        amount: init.amount,
        orderId: init.orderId,
        orderName: init.orderName,
        successUrl,
        failUrl,
      });
    } catch (e: any) {
      console.log("[RESERVATION/INIT ERR]", e?.response?.data ?? e);
      alert(e?.response?.data?.message ?? e.message ?? "오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-full w-full justify-center overflow-x-hidden bg-[#f5f6f8] font-sans antialiased">
      <section className="w-full overflow-x-hidden bg-[#F7FAFF] px-4 py-5 shadow">
        <h1 className="font-WooridaumB mt-6 mb-15 pl-2 text-[20px] font-bold">예약 내역</h1>
        <div className="px-2">
          <p className="font-WooridaumR mb-4 text-[16px] text-[#000008]">
            선택하신 항목이 맞는지 확인해주세요.
          </p>

          <BookingSummaryCard title={booking.title ?? "-"} whenText={whenText} />

          <div className="mt-2 mb-4 flex items-center justify-between">
            <span className="font-WooridaumR text-[17px] text-[#3F3E6D]">지금 결제할 금액</span>
            <span className="font-WooridaumR text-[17px] text-[#FC4C4E]">
              {typeof booking.price === "number" ? booking.price.toLocaleString() : "-"}원
            </span>
          </div>

          <TermsAccordion title="개인정보 수집, 제공" defaultOpen>
            <TermsAccordion.Item title="이용약관 동의">
              <TermsOfUse />
            </TermsAccordion.Item>
            <TermsAccordion.Item title="개인정보 수집 및 이용 동의">
              <PrivacyCollectTerms />
            </TermsAccordion.Item>
            <TermsAccordion.Item title="개인정보 제 3자 제공 동의">
              <PrivacyThirdPartyTerms />
            </TermsAccordion.Item>
          </TermsAccordion>

          <button
            onClick={handlePay}
            disabled={!valid || submitting}
            className={[
              "mt-4 mb-3 h-14 w-full rounded-2xl text-base font-extrabold text-white shadow transition active:scale-[0.99]",
              valid && !submitting
                ? "cursor-pointer bg-[#1161FF] hover:bg-[#0C2D62]"
                : "cursor-not-allowed bg-[#1E90FF]/40",
              "font-WooridaumB",
            ].join(" ")}>
            {submitting ? "처리 중..." : "결제하기"}
          </button>

          <button
            onClick={() => navigate(-1)}
            className="font-WooridaumB h-14 w-full rounded-2xl bg-gray-300 text-base font-extrabold text-gray-600 hover:bg-gray-400">
            취소하기
          </button>
        </div>
      </section>
    </div>
  );
}
