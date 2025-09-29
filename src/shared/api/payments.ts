import { getAccessToken } from "@/shared/auth/token";
import { http } from "@api/https";

export async function initMentosPayment(body: {
  mentosSeq: number;
  mentosAt: string;
  mentosTime: string;
}) {
  const { data } = await http.post("/mentos/payments/init", body);
  return data?.result ?? data;
}

export async function confirmPayment(query: {
  orderId: string;
  paymentKey: string;
  amount: number;
}) {
  const config = {
    params: {
      orderId: query.orderId,
      paymentKey: query.paymentKey,
      amount: query.amount,
    },
    headers: {
      Authorization: `Bearer ${getAccessToken?.() ?? ""}`,
    },
    withCredentials: true,
  } as const;

  // body는 필요 없음 → 서버가 @RequestParam으로만 받음
  const { data } = await http.post("/payments/success", null, config);

  console.log("[confirm] data:", data);

  const pseq =
    data?.result?.paymentsSeq ?? data?.paymentsSeq ?? data?.result?.paymentSeq ?? data?.paymentSeq;

  console.log("[confirm] pseq saved:", pseq);

  if (pseq) {
    // 환불 버튼 눌렀을 때 쓸 수 있도록 localStorage에 저장
    localStorage.setItem(`paymentSeq:${query.orderId}`, String(pseq));
  }
  return data;
}

export async function refundPayment(reservationSeq: number) {
  const config = {
    headers: {
      Authorization: `Bearer ${getAccessToken?.() ?? ""}`,
    },
    withCredentials: true,
  } as const;

  const { data } = await http.post(`/mentos/refund/${reservationSeq}`, {}, config);
  return data;
}
