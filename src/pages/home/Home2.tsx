// src/pages/home2/HomePage.tsx
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

  const isLoggedIn = !!user;
  const memberName = user?.memberName ?? "회원";
  const normalized = normalizeRole((user as any)?.memberType ?? (user as any)?.role);

  const aiHelperName = normalized === "mentor" ? "모리" : "토리";

  const rotateTexts =
    isLoggedIn && normalized === "mentee"
      ? [
          `어서오세요! ${memberName}님 \n오늘도 좋은 하루 되세요!`,
          `${memberName}님, 관심 분야 멘토링을 추천받고싶으시면 \n멘토링 추천받기를 눌러보세요!`,
          `궁금한 점이 있다면 언제든 물어보세요, ${memberName}님!`,
        ]
      : isLoggedIn && normalized === "mentor"
        ? [
            `환영합니다, ${memberName} 멘토님!`,
            `오늘도 멘티들과 멋진 지식을 나눠보세요.`,
            `궁금한 점이 있으면 언제든 저 ${aiHelperName}에게 물어보세요!`,
          ]
        : [
            "안녕하세요 \n로그인하고 멘토링을 추천받아보세요!",
            "아직 계정이 없으신가요?\n지금 바로 가입하고 시작해보세요!",
            "로그인 후 더 많은 기능을 이용할 수 있어요!",
          ];

  const [showLoginForm, setShowLoginForm] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

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
      className="relative flex h-screen w-full flex-col gap-10 overflow-hidden bg-[#F7FAFF] px-4 md:h-238 md:gap-20"
      data-app-screen>
      {/* 상단 카테고리 */}
      <section className="mx-auto mt-3 w-full max-w-lg shrink-0">
        <CategoryButtonGroup />
      </section>
      {/* 중앙 묶음 */}
      <section className="mx-auto mt-2 flex w-full max-w-md flex-col items-center gap-4">
        <HeroBubble
          text={`안녕하세요! 저는 메멘토의 AI 도우미 ‘${aiHelperName}’예요.`}
          highlight={memberName}
          rotateTexts={rotateTexts}
          intervalMs={10_000}
          role={normalized}
          showTalkCTA
          talkLabel="대화하기"
          onClickTalk={() => navigate("/recommend")}
        />

        <CharacterFigure glowed={isLoggedIn} role={normalized} />

        <div className="w-full">
          <PrimaryActions
            isLoggedIn={isLoggedIn}
            role={normalized}
            onRecommend={() => onDone?.("추천받기")}
            onOpenLogin={() => setShowLoginForm(true)}
          />
        </div>
      </section>
      {/* 로그인 바텀시트 */}
      <LoginSheet
        open={showLoginForm && !isLoggedIn}
        onClose={() => setShowLoginForm(false)}
        onSubmit={handleLoginSubmit}
        error={loginError}
        loading={isLoggingIn}
        placement="container" // ← 여기만 fixed 로
        className="z-[1000]" // ← 혹시 몰라 z 조금 더 올림
      />
    </main>
  );
}
