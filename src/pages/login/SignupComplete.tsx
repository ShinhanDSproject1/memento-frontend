// src/pages/SignupComplete.tsx
import { useNavigate } from "react-router-dom";

export interface SignupCompleteProps {
  onLogin?: () => void;
  onHome?: () => void;
}

export default function SignupComplete({ onLogin, onHome }: SignupCompleteProps) {
  const navigate = useNavigate();

  const goLogin = onLogin ?? (() => navigate("/"));
  const goHome = onHome ?? (() => navigate("/"));

  return (
    <main className="mx-auto flex min-h-[85vh] max-w-md flex-col items-center justify-center px-6 py-10">
      <div className="mb-8 grid h-28 w-28 place-items-center rounded-full bg-[#1161FF] shadow-[0_12px_30px_rgba(17,97,255,0.35)]">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>

      <h1 className="font-WooridaumB text-3xl font-extrabold text-[#1161FF]">환영합니다!</h1>
      <p className="font-WooridaumB mt-1 text-center text-xl font-extrabold text-slate-600">
        <span className="font-semibold">me:mento</span> 가입이 완료되었습니다
      </p>

      <p className="mt-10 text-center text-slate-500 underline underline-offset-4">
        당신의 스마트한 금융 여정을 시작하세요!
      </p>

      <div className="mt-12 grid w-full gap-4">
        <button
          type="button"
          onClick={goLogin}
          className="h-14 w-full rounded-2xl bg-[#1161FF] text-base font-extrabold text-white shadow transition hover:bg-[#0C2D62] active:scale-[0.99]">
          로그인 하기
        </button>

        <button
          type="button"
          onClick={goHome}
          className="h-14 w-full rounded-2xl bg-slate-200 text-base font-extrabold text-slate-500 transition hover:bg-slate-300 active:scale-[0.99]">
          메인화면 가기
        </button>
      </div>
    </main>
  );
}
