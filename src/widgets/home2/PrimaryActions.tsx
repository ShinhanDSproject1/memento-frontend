import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function PrimaryActions({
  isLoggedIn,
  role, // ✅ 멘티/멘토 구분
  onRecommend,
  onOpenLogin,
}: {
  isLoggedIn: boolean;
  role?: "mentee" | "mentor";
  onRecommend: () => void;
  onOpenLogin: () => void;
}) {
  const navigate = useNavigate();

  return (
    <div className="mx-auto mb-5 flex w-full max-w-md flex-col gap-3 md:mt-10 md:mb-10">
      {isLoggedIn && role === "mentee" ? (
        <>
          {/* 멘토링 추천 + 내 주변 멘토찾기 버튼 (멘티 전용, 2열) */}
          <div className="mb-3 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => navigate("/recommend")}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 shadow-sm transition hover:bg-blue-100">
              AI 멘토링 추천받기
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => navigate("/mento/nearby")}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 shadow-sm transition hover:bg-blue-100">
              내 주변 멘토찾기
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* 박스 영역 - 카드형 버튼 */}
          <div className="grid w-full grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => navigate("/menti/myprofile")}
              className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-4 text-xs font-medium text-blue-700 shadow-sm transition hover:border-blue-400 hover:bg-blue-100 hover:text-blue-800 hover:shadow-md">
              <span className="text-base">👤</span>
              나의 정보관리
            </button>

            <button
              type="button"
              onClick={() => navigate("/menti/mymentos")}
              className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-4 text-xs font-medium text-blue-700 shadow-sm transition hover:border-blue-400 hover:bg-blue-100 hover:text-blue-800 hover:shadow-md">
              <span className="text-base">📒</span>
              나의 멘토링
            </button>

            <button
              type="button"
              onClick={() => navigate("/chat")}
              className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-4 text-xs font-medium text-blue-700 shadow-sm transition hover:border-blue-400 hover:bg-blue-100 hover:text-blue-800 hover:shadow-md">
              <span className="text-base">💬</span>
              멘토와 채팅
            </button>
          </div>
        </>
      ) : isLoggedIn && role === "mentor" ? (
        // ... (멘토용 버튼 그대로)
        <>
          {/* 상단: 자격증 인증 + 멘토링 생성하기 (2열) */}
          <div className="grid w-full grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => navigate("/mento/certification")}
              className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-green-400 bg-green-50 px-3 py-4 text-xs font-medium text-green-700 shadow-sm transition hover:bg-green-100 hover:text-green-800 hover:shadow-md">
              <span className="text-base">📜</span>
              AI 자격증 인증
            </button>

            <button
              type="button"
              onClick={() => navigate("/create-mentos")}
              className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-green-400 bg-green-50 px-3 py-4 text-xs font-medium text-green-700 shadow-sm transition hover:bg-green-100 hover:text-green-800 hover:shadow-md">
              <span className="text-base">➕</span>
              멘토링 생성하기
            </button>
          </div>

          {/* 나머지 버튼들... */}
        </>
      ) : (
        !isLoggedIn && (
          <>
            {/* 게스트 → 회원가입 / 로그인 */}
            <button
              type="button"
              onClick={() => navigate("/signup")}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#14B8A6] px-5 py-3 text-[15px] font-semibold text-white shadow-md transition hover:bg-[#0D9488]">
              회원가입
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onOpenLogin}
              className="mb-10 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-5 py-3 text-[15px] font-semibold text-white shadow-md transition hover:bg-[#1E4FD9] md:mb-7">
              로그인
              <ArrowRight className="h-4 w-4" />
            </button>
          </>
        )
      )}
    </div>
  );
}
