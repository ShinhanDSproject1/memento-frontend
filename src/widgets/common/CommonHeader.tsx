// src/widgets/common/CommonHeader.tsx
import backIcon from "@assets/icons/icon-back.png";
import loginIcon from "@assets/icons/icon-login.svg";
import homeIcon from "@assets/icons/icon-move-home.svg";
import { useAuth } from "@entities/auth";
import { useNavigate } from "react-router-dom";

interface CommonHeaderProps {
  onClickHome?: () => void;
}

const OPEN_LOGIN_SHEET = "app:login:open";
const APP_LOGOUT = "app:logout";

export default function CommonHeader({ onClickHome }: CommonHeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const goBack = () => navigate(-1);
  const goHome = () => (onClickHome ? onClickHome() : navigate("/"));

  const goLogin = async () => {
    if (!user) {
      // 로그인 안됨 → 현재 경로를 detail에 포함해서 브로드캐스트
      document.dispatchEvent(
        new CustomEvent(OPEN_LOGIN_SHEET, {
          detail: {
            source: "header",
            targetPath: window.location.pathname, // ★ 지금 보고있는 경로
            ts: Date.now(), // (선택) 디버깅/가드용 타임스탬프
          },
          bubbles: true,
          composed: true,
        }),
      );
      return;
    }

    // 이미 로그인 → 로그아웃 후 브로드캐스트(선택)
    await logout();
    document.dispatchEvent(
      new CustomEvent(APP_LOGOUT, {
        detail: { source: "header", ts: Date.now() },
        bubbles: true,
        composed: true,
      }),
    );
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between bg-white px-4 py-3 sm:px-6 lg:px-8">
      <button type="button" onClick={goBack} aria-label="back">
        <img
          src={backIcon}
          alt="backIcon"
          className="mx-0 h-6 w-auto cursor-pointer hover:brightness-60"
        />
      </button>

      <div className="flex items-center gap-4">
        <button type="button" onClick={goLogin} aria-label="login">
          <img
            src={loginIcon}
            alt="loginIcon"
            className="h-auto w-6 cursor-pointer transition duration-200 hover:brightness-60"
          />
        </button>
        <button type="button" onClick={goHome} aria-label="go home">
          <img
            src={homeIcon}
            alt="homeIcon"
            className="h-auto w-6 cursor-pointer transition duration-200 hover:brightness-60"
          />
        </button>
      </div>
    </header>
  );
}
