import { CategoryButtonGroup } from "@/widgets/home2/CategoryButton";
import { useAuth } from "@entities/auth";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { CharacterFigure } from "@/widgets/home2/CharacterFigure";
import { HeroBubble } from "@/widgets/home2/HeroBubble";
import { LoginSheet } from "@/widgets/home2/LoginSheet";
import { PrimaryActions } from "@/widgets/home2/PrimaryActions";

type Role = "mentee" | "mentor";

function normalizeRole(memberType?: string | null): Role | undefined {
  const t = (memberType ?? "").toUpperCase().trim();
  if (t === "MENTEE" || t === "MENTI") return "mentee";
  if (t === "MENTOR" || t === "MENTO") return "mentor";
  return undefined;
}

export default function HomePage({
  onDone,
  onLogin,
}: {
  onDone?: (message?: string) => void;
  onLogin?: (id: string, password: string, role?: Role) => Promise<any> | void;
}) {
  const navigate = useNavigate();
  const { user, login } = useAuth();

  // ✅ 로그인 여부/회원명/역할은 user에서 파생
  const isLoggedIn = !!user;
  const memberName = user?.memberName ?? "회원";
  const normalized = normalizeRole((user as any)?.memberType ?? (user as any)?.role);

  const defaultText =
    "안녕하세요! 저는 메멘토의 AI 도우미 ‘토리’예요.\n저와 함께 멘티님에게 딱 맞는 멘토링을 찾아볼까요?";

  // ✅ 모달 UI 상태만 로컬로 관리
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // ✅ 로그인 처리
  const handleLoginSubmit = async ({ id, pw, role }: { id: string; pw: string; role: Role }) => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      if (onLogin) {
        await Promise.resolve(onLogin(id, pw, role));
      } else {
        const userType = role === "mentor" ? "MENTO" : "MENTI";
        await login({ userType, memberId: id, memberPwd: pw });
      }
      // 로그인 성공 → AuthProvider가 user 업데이트 → isLoggedIn 자동 true
      setShowLoginForm(false);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "로그인에 실패했습니다. 아이디/비밀번호를 확인해주세요.";
      setLoginError(msg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <main
      className="relative grid h-screen w-full grid-rows-[auto_1fr_auto] bg-gradient-to-b from-[#F7FAFF] to-[#c2d2f1] px-4 md:h-full"
      data-app-screen>
      {/* 상단 카테고리 */}
      <section className="mx-auto mt-5 w-full max-w-lg">
        <CategoryButtonGroup />
      </section>

      {/* 중앙 히어로 */}
      <section className="mx-auto mt-10 flex w-full max-w-md flex-col items-center justify-center">
        <HeroBubble
          text={`안녕하세요! 저는 메멘토의 AI 도우미 ‘토리’예요.`} // fallback
          highlight={memberName}
          rotateTexts={
            isLoggedIn && normalized === "mentee"
              ? [
                  `어서오세요! ${memberName}님 \n오늘도 좋은 하루 되세요!`,
                  `${memberName}님, 관심 분야 멘토링을 추천받고싶으시면 \n멘토링 추천받기를 눌러보세요!`,
                  `궁금한 점이 있다면 언제든 물어보세요, ${memberName}님!`,
                ]
              : !isLoggedIn
                ? [
                    "안녕하세요 \n로그인하고 멘토링을 추천받아보세요!",
                    "아직 계정이 없으신가요?\n지금 바로 가입하고 시작해보세요!",
                    "로그인 후 더 많은 기능을 이용할 수 있어요!",
                  ]
                : [] // 멘토 로그인 등 다른 경우는 회전 문구 없음
          }
          intervalMs={10_000}
        />
        <CharacterFigure glowed={isLoggedIn} />
      </section>

      {/* 하단 액션 */}
      <PrimaryActions
        isLoggedIn={isLoggedIn}
        role={normalized} // ✅ 멘티/멘토 구분 전달
        onRecommend={() => onDone?.("추천받기")}
        onOpenLogin={() => setShowLoginForm(true)}
      />

      {/* ✅ 바텀시트 */}
      <LoginSheet
        open={showLoginForm && !isLoggedIn}
        onClose={() => setShowLoginForm(false)}
        onSubmit={handleLoginSubmit}
        error={loginError}
        loading={isLoggingIn}
      />
    </main>
  );
}
