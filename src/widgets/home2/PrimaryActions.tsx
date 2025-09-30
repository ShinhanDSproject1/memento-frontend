// src/widgets/home2/PrimaryActions.tsx
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

// ✅ 아이콘을 import로 가져오기 (Vite 권장)
import iconCertifi from "@/shared/assets/icons/icon-certifi.png";
import iconChat from "@/shared/assets/icons/icon-chat.png";
import iconConfig from "@/shared/assets/icons/icon-config.png";
import iconMap from "@/shared/assets/icons/icon-map.png";
import iconMyMentoring from "@/shared/assets/icons/icon-mymentoring.png";
import iconMyProfile from "@/shared/assets/icons/icon-myprofile.png";
import iconReview from "@/shared/assets/icons/icon-review.png";

export function PrimaryActions({
  isLoggedIn,
  role,
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
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => navigate("/mento/nearby")}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-300 bg-blue-100 px-5 py-3 text-[15px] font-medium text-blue-800 shadow-sm transition hover:border-blue-400 hover:bg-blue-200 hover:text-blue-900">
            <img src={iconMap} alt="내 주변 멘토찾기" className="h-6 w-6 object-contain" />
            내 주변 멘토찾기
            <ArrowRight className="h-4 w-4" />
          </button>

          <div className="grid w-full grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => navigate("/menti/myprofile")}
              className="flex flex-col items-center justify-center gap-1 rounded-3xl border border-blue-300 bg-blue-100 px-3 py-4 text-xs font-medium text-blue-800 shadow-sm transition hover:border-blue-400 hover:bg-blue-200 hover:text-blue-900 hover:shadow-md">
              <img src={iconMyProfile} alt="나의 정보관리" className="h-6 w-6 object-contain" />
              나의 정보관리
            </button>

            <button
              type="button"
              onClick={() => navigate("/menti/mymentos")}
              className="flex flex-col items-center justify-center gap-1 rounded-3xl border border-blue-200 bg-blue-50 px-3 py-4 text-xs font-medium text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-200 hover:text-blue-800 hover:shadow-md">
              <img src={iconMyMentoring} alt="나의 멘토링" className="h-6 w-6 object-contain" />
              나의 멘토링
            </button>

            <button
              type="button"
              onClick={() => navigate("/chat")}
              className="flex flex-col items-center justify-center gap-1 rounded-3xl border border-blue-200 bg-blue-50 px-3 py-4 text-xs font-medium text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-200 hover:text-blue-800 hover:shadow-md">
              <img src={iconChat} alt="멘토와 채팅" className="h-6 w-6 object-contain" />
              멘토와 채팅
            </button>
          </div>
        </div>
      ) : isLoggedIn && role === "mentor" ? (
        <>
          <div className="grid w-full grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => navigate("/mento/certification")}
              className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-blue-300 bg-blue-100 px-3 py-4 text-xs font-medium text-blue-800 shadow-sm transition hover:border-blue-400 hover:bg-blue-200 hover:text-blue-900 hover:shadow-md">
              <img src={iconCertifi} alt="AI 자격증 인증" className="h-6 w-6 object-contain" />
              AI 자격증 인증
            </button>

            <button
              type="button"
              onClick={() => navigate("/create-mentos")}
              className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-blue-300 bg-blue-100 px-3 py-4 text-xs font-medium text-blue-800 shadow-sm transition hover:border-blue-400 hover:bg-blue-200 hover:text-blue-900 hover:shadow-md">
              <span className="text-base">➕</span>
              멘토링 생성하기
            </button>
          </div>

          <div className="grid w-full grid-cols-4 gap-2 md:mb-8">
            <button
              type="button"
              onClick={() => navigate("/mento/my-list")}
              className="flex flex-col items-center justify-center gap-1 rounded-lg border border-blue-300 bg-blue-100 px-2 py-3 text-[11px] font-medium text-blue-800 shadow-sm transition hover:border-blue-400 hover:bg-blue-200 hover:text-blue-900">
              <img src={iconMyMentoring} alt="나의 멘토링" className="h-6 w-6 object-contain" />
              관리
            </button>

            <button
              type="button"
              onClick={() => navigate("/chat")}
              className="flex flex-col items-center justify-center gap-1 rounded-lg border border-blue-300 bg-blue-100 px-2 py-3 text-[11px] font-medium text-blue-800 shadow-sm transition hover:border-blue-400 hover:bg-blue-200 hover:text-blue-900">
              <img src={iconChat} alt="채팅" className="h-6 w-6 object-contain" />
              채팅
            </button>

            <button
              type="button"
              onClick={() => navigate("/reviews")}
              className="flex flex-col items-center justify-center gap-1 rounded-lg border border-blue-300 bg-blue-100 px-2 py-3 text-[11px] font-medium text-blue-800 shadow-sm transition hover:border-blue-400 hover:bg-blue-200 hover:text-blue-900">
              <img src={iconReview} alt="리뷰" className="h-6 w-6 object-contain" />
              리뷰
            </button>

            <button
              type="button"
              onClick={() => navigate("/mento")}
              className="flex flex-col items-center justify-center gap-1 rounded-lg border border-blue-300 bg-blue-100 px-2 py-3 text-[11px] font-medium text-blue-800 shadow-sm transition hover:border-blue-400 hover:bg-blue-200 hover:text-blue-900">
              <img src={iconConfig} alt="내정보" className="h-6 w-6 object-contain" />
              내정보
            </button>
          </div>
        </>
      ) : (
        !isLoggedIn && (
          <>
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
