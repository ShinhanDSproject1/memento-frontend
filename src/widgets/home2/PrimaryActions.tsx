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
          {/* 멘토링 추천받기 버튼 (멘티 전용, 박스 위쪽) */}
          <button
            type="button"
            onClick={() => navigate("/recommend")}
            className="mb-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 shadow-sm transition hover:bg-blue-100">
            멘토링 추천받기
            <ArrowRight className="h-4 w-4" />
          </button>

          {/* 박스 영역 - 모던 카드형 버튼 */}
          <div className="grid w-full grid-cols-3 gap-3">
            {/* 나의 정보관리 */}
            <button
              type="button"
              onClick={() => navigate("/menti/myprofile")}
              className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-4 text-xs font-medium text-blue-700 shadow-sm transition hover:border-blue-400 hover:bg-blue-100 hover:text-blue-800 hover:shadow-md">
              <span className="text-base">👤</span>
              나의 정보관리
            </button>

            {/* 나의 멘토링 내역 */}
            <button
              type="button"
              onClick={() => navigate("/menti/mymentos")}
              className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-4 text-xs font-medium text-blue-700 shadow-sm transition hover:border-blue-400 hover:bg-blue-100 hover:text-blue-800 hover:shadow-md">
              <span className="text-base">📒</span>
              나의 멘토링
            </button>

            {/* 멘토와 채팅하기 */}
            <button
              type="button"
              onClick={() => navigate("/chat")}
              className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-4 text-xs font-medium text-blue-700 shadow-sm transition hover:border-blue-400 hover:bg-blue-100 hover:text-blue-800 hover:shadow-md">
              <span className="text-base">💬</span>
              멘토와 채팅
            </button>
          </div>
        </>
      ) : !isLoggedIn ? (
        <>
          <button
            type="button"
            onClick={onRecommend}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#14B8A6] px-5 py-3 text-[15px] font-semibold whitespace-pre-line text-white shadow-md transition hover:bg-[#0D9488]">
            {"추천받기"}
            <ArrowRight className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onOpenLogin}
            className="mb-10 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-5 py-3 text-[15px] font-semibold whitespace-pre-line text-white shadow-md transition hover:bg-[#1E4FD9] md:mb-7">
            {"로그인"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </>
      ) : null}
    </div>
  );
}
