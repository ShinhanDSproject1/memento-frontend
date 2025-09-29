// src/widgets/home2/PrimaryActions.tsx
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function PrimaryActions({
  isLoggedIn,
  role, // ✅ "mentee" | "mentor"
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
    <div className="mx-auto mb-5 flex w-full max-w-md flex-col gap-6">
      {isLoggedIn && role === "mentee" ? (
        <>
          {/* 대화하기 버튼 (강조)
          <div className="mb-4">
            <button
              type="button"
              onClick={() => navigate("/recommend")}
              className="inline-flex w-full items-center justify-center gap-2 rounded-3xl border border-blue-300 bg-blue-100 px-6 py-4 text-[16px] font-semibold text-blue-800 shadow-md transition hover:border-blue-400 hover:bg-blue-200 hover:text-blue-900">
              대화하기
              <ArrowRight className="h-5 w-5" />
            </button>
          </div> */}

          {/* 하단 블록: 내 주변 멘토찾기 + 3컬럼 버튼 */}
          <div className="space-y-4">
            {/* 내 주변 멘토찾기 */}
            <button
              type="button"
              onClick={() => navigate("/mento/nearby")}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-300 bg-blue-50 px-5 py-3 text-[14px] font-medium text-blue-700 shadow-sm transition hover:border-blue-400 hover:bg-blue-200 hover:text-blue-800">
              내 주변 멘토찾기
              <ArrowRight className="h-4 w-4" />
            </button>

            {/* 나머지 3컬럼 버튼 */}
            <div className="grid w-full grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => navigate("/menti/myprofile")}
                className="flex flex-col items-center justify-center gap-1 rounded-3xl border border-blue-300 bg-blue-50 px-3 py-4 text-xs font-medium text-blue-700 shadow-sm transition hover:border-blue-400 hover:bg-blue-200 hover:text-blue-900 hover:shadow-md">
                {/* ✅ png 아이콘 삽입 */}
                <img
                  src="/src/shared/assets/icons/icon-myprofile.png" // 실제 프로젝트 아이콘 경로로 교체
                  alt="나의 정보관리"
                  className="h-6 w-6 object-contain"
                />
                나의 정보관리
              </button>
              <button
                type="button"
                onClick={() => navigate("/menti/mymentos")}
                className="flex flex-col items-center justify-center gap-1 rounded-3xl border border-blue-300 bg-blue-50 px-3 py-4 text-xs font-medium text-blue-700 shadow-sm transition hover:border-blue-400 hover:bg-blue-200 hover:text-blue-900 hover:shadow-md">
                <img
                  src="/src/shared/assets/icons/icon-mymentoring.png" // 실제 프로젝트 아이콘 경로로 교체
                  alt="나의 정보관리"
                  className="h-6 w-6 object-contain"
                />
                나의 멘토링
              </button>

              <button
                type="button"
                onClick={() => navigate("/chat")}
                className="flex flex-col items-center justify-center gap-1 rounded-3xl border border-blue-300 bg-blue-50 px-3 py-4 text-xs font-medium text-blue-700 shadow-sm transition hover:border-blue-400 hover:bg-blue-200 hover:text-blue-900 hover:shadow-md">
                <img
                  src="/src/shared/assets/icons/icon-chat.png" // 실제 프로젝트 아이콘 경로로 교체
                  alt="나의 정보관리"
                  className="h-6 w-6 object-contain"
                />
                멘토와 채팅
              </button>
            </div>
          </div>
        </>
      ) : isLoggedIn && role === "mentor" ? (
        <>
          {/* 멘토 상단 2열 */}
          <div className="grid w-full grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => navigate("/mento/certification")}
              className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3.5 text-xs font-medium text-emerald-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100 hover:text-emerald-800 hover:shadow-md">
              <span className="text-base">📜</span>
              AI 자격증 인증
            </button>

            <button
              type="button"
              onClick={() => navigate("/create-mentos")}
              className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3.5 text-xs font-medium text-emerald-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100 hover:text-emerald-800 hover:shadow-md">
              <span className="text-base">➕</span>
              멘토링 생성하기
            </button>
          </div>

          {/* 멘토 하단 4열 */}
          <div className="grid w-full grid-cols-4 gap-2 md:mb-8">
            <button
              type="button"
              onClick={() => navigate("/mento/my-list")}
              className="flex flex-col items-center justify-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-3 text-[11px] font-medium text-emerald-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100 hover:text-emerald-800">
              📋 관리
            </button>

            <button
              type="button"
              onClick={() => navigate("/chat")}
              className="flex flex-col items-center justify-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-3 text-[11px] font-medium text-emerald-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100 hover:text-emerald-800">
              💬 채팅
            </button>

            <button
              type="button"
              onClick={() => navigate("/reviews")}
              className="flex flex-col items-center justify-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-3 text-[11px] font-medium text-emerald-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100 hover:text-emerald-800">
              ⭐ 리뷰
            </button>

            <button
              type="button"
              onClick={() => navigate("/mento")}
              className="flex flex-col items-center justify-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-3 text-[11px] font-medium text-emerald-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100 hover:text-emerald-800">
              👤 내정보
            </button>
          </div>
        </>
      ) : (
        !isLoggedIn && (
          <>
            {/* 게스트 → 회원가입 / 로그인 */}
            <button
              type="button"
              onClick={() => navigate("/signup")}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-5 py-3 text-[15px] font-semibold text-teal-700 shadow-sm transition hover:border-teal-300 hover:bg-teal-100 hover:text-teal-800">
              회원가입
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onOpenLogin}
              className="mb-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-[15px] font-semibold text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-100 hover:text-blue-800">
              로그인
              <ArrowRight className="h-4 w-4" />
            </button>
          </>
        )
      )}
    </div>
  );
}
