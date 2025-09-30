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

const OPEN_LOGIN_SHEET = "app:login:open";
const APP_LOGOUT = "app:logout";

export default function CommonHeader({ onClickHome }: CommonHeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isLogoutOpen, setLogoutOpen] = useState(false);

  const goBack = () => navigate(-1);
  const goHome = onClickHome ?? (() => window.location.replace("/"));

  const goLogin = async () => {
    if (user) {
      await logout();
      setLogoutOpen(true); // ← 모달 오픈
    } else {
      window.location.replace("/");
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
      {/* ✅ 로그아웃 완료 모달 */}
      {isLogoutOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[1000] flex items-center justify-center">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setLogoutOpen(false);
              window.location.replace("/"); // 바깥 클릭 시에도 홈 이동
            }}
          />
          {/* content */}
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
