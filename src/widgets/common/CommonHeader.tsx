// src/widgets/common/CommonHeader.tsx
import backIcon from "@assets/icons/icon-back.png";
import loginIcon from "@assets/icons/icon-login.svg";
import homeIcon from "@assets/icons/icon-move-home.svg";
import { useAuth } from "@entities/auth";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface CommonHeaderProps {
  onClickHome?: () => void;
}

export default function CommonHeader({ onClickHome }: CommonHeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isLogoutOpen, setLogoutOpen] = useState(false);

  const goBack = () => navigate(-1);
  const goHome = onClickHome ?? (() => window.location.replace("/"));

  const goLogin = async () => {
    if (user) {
      await logout();
      setLogoutOpen(true);
    } else {
      window.location.replace("/");
    }
  };

  // ✅ 공통: 강제 다크/스마트 인버트에도 아이콘 원본색 유지
  const iconFixClass =
    "transition duration-200 hover:brightness-90 select-none " +
    "filter-none mix-blend-normal invert-0 dark:invert-0 " +
    "[filter:none] [-webkit-filter:none]";

  const iconFixStyle: React.CSSProperties = {
    filter: "none",
    WebkitFilter: "none",
    mixBlendMode: "normal",
    colorScheme: "light", // 일부 브라우저에서 강제 다크 우회
  };

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between bg-white px-4 py-3 sm:px-6 lg:px-8"
      style={{ colorScheme: "light" }} // ✅ 헤더 영역만큼은 라이트 스킴 강제
    >
      {/* 왼쪽: 뒤로가기 */}
      <button type="button" onClick={goBack} aria-label="back">
        <img
          src={backIcon}
          alt="backIcon"
          className={`mx-0 h-6 w-auto cursor-pointer ${iconFixClass}`}
          style={iconFixStyle}
          draggable={false}
        />
      </button>

      {/* 오른쪽: 로그인/홈 */}
      <div className="flex items-center gap-4">
        <button type="button" onClick={goLogin} aria-label="login">
          <img
            src={loginIcon}
            alt="loginIcon"
            className={`h-6 w-6 cursor-pointer ${iconFixClass}`}
            style={iconFixStyle}
            draggable={false}
          />
        </button>

        <button type="button" onClick={goHome} aria-label="go home">
          <img
            src={homeIcon}
            alt="homeIcon"
            className={`h-6 w-6 cursor-pointer ${iconFixClass}`}
            style={iconFixStyle}
            draggable={false}
          />
        </button>
      </div>

      {/* 로그아웃 완료 모달 (기능 변경 없음) */}
      {isLogoutOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[1000] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setLogoutOpen(false);
              window.location.replace("/");
            }}
          />
          <div className="relative z-10 w-[86%] max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-3 text-base font-semibold text-[#121418]">로그아웃 되었습니다</div>
            <p className="mb-5 text-sm text-[#606264]">이용해 주셔서 감사합니다.</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg bg-[#005EF9] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0C2D62]"
                onClick={() => {
                  setLogoutOpen(false);
                  window.location.replace("/");
                }}>
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
