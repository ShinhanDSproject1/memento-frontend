// src/components/MainHeader.tsx
import { useAuth } from "@/entities/auth";
import loginIcon from "@assets/icons/icon-login.svg";
import logo from "@assets/images/logo/memento-logo.svg";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
export interface MainHeaderProps {
  onClickLogin?: () => void;
  onClickHome?: () => void;
}

export default function MainHeader({ onClickHome }: MainHeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // ✅ 로그아웃 완료 모달
  const [isLogoutOpen, setLogoutOpen] = useState(false);

  const goLogin = async () => {
    if (user) {
      await logout();
      setLogoutOpen(true); // ← 모달 오픈
    } else {
      navigate("/");
    }
  };

  const goHome = onClickHome ?? (() => navigate("/"));

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between bg-white px-4 py-3 sm:px-6 lg:px-8">
      {/* 왼쪽 로고 */}
      <img
        src={logo}
        alt="memento logo"
        className="h-auto w-[120px] cursor-pointer hover:brightness-60 sm:w-[140px] lg:w-[160px]"
        onClick={() => navigate("/")}
      />

      {/* 오른쪽 아이콘들 */}
      <div className="flex items-center gap-4">
        <button type="button" onClick={goLogin} aria-label="login">
          <img
            src={loginIcon}
            alt="loginIcon"
            className="h-auto w-6 cursor-pointer transition duration-200 hover:brightness-60"
          />
        </button>
        {/* <button type="button" onClick={goHome} aria-label="go home">
          <img
            src={homeIcon}
            alt="homeIcon"
            className="h-auto w-6 cursor-pointer transition duration-200 hover:brightness-60"
          />
        </button> */}
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
              navigate("/"); // 바깥 클릭 시에도 홈 이동
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
                  navigate("/");
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
