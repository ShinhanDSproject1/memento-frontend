// src/app/providers/AuthProvider.tsx
import type { AuthContextValue, LoginInput } from "@entities/auth";
import { AuthContext, login as loginApi, logout as logoutApi } from "@entities/auth";
import { refreshSilently } from "@shared/api";
import {
  clearAccessToken,
  clearUserSnapshot,
  loadUserSnapshot,
  setAccessToken as saveAccessToken,
  saveUserSnapshot,
} from "@shared/auth";
import { motion } from "framer-motion"; // ⬅️ 로딩바 애니메이션용
import React, { useEffect, useMemo, useState } from "react";

// (선택) 브랜드 로고를 로딩에도 재사용하고 싶다면 경로 맞춰주세요.
import mementoLogo from "@shared/assets/images/logo/memento-logo.svg";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthContextValue["user"]>(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  // 부트스트랩: 스냅샷 우선 반영 → 가능하면 조용히 리프레시
  useEffect(() => {
    (async () => {
      try {
        const snap = loadUserSnapshot();
        if (snap) {
          setUser(snap);
          if (snap.accessToken) {
            saveAccessToken(snap.accessToken);
            setAccessToken(snap.accessToken);
          }
        }
        const at = await refreshSilently().catch(() => null);
        if (at) {
          saveAccessToken(at);
          setAccessToken(at);
          if (snap) {
            const next = { ...snap, accessToken: at };
            saveUserSnapshot(next);
            setUser(next);
          }
        }
      } finally {
        setBootstrapped(true);
      }
    })();
  }, []);

  // 브라우저 탭 간 동기화
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "auth:user") {
        const cached = loadUserSnapshot();
        setUser(cached);
        setAccessToken(cached?.accessToken ?? null);
      }
      if (e.key === "accessToken") {
        const at = localStorage.getItem("accessToken");
        setAccessToken(at);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const login = async (input: LoginInput) => {
    const dto = await loginApi(input);
    const result = dto.result;
    setUser(result);
    if (result.accessToken) {
      saveAccessToken(result.accessToken);
      setAccessToken(result.accessToken);
    }
    saveUserSnapshot(result);
  };

  const logout = async () => {
    try {
      await logoutApi();
    } finally {
      clearAccessToken();
      clearUserSnapshot();
      setAccessToken(null);
      setUser(null);
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isAuthenticated: !!(accessToken ?? user?.accessToken),
      login,
      logout,
    }),
    [user, accessToken],
  );

  if (!bootstrapped) return <AuthBootLoading />; // ⬅️ 로딩 오버레이 표시
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** 인증 부트스트랩 로딩 오버레이 */
function AuthBootLoading() {
  return (
    <div
      className="fixed inset-0 z-[9999] flex h-dvh w-dvw flex-col items-center justify-center bg-white"
      role="dialog"
      aria-modal="true">
      {/* 로고 */}
      <img src={mementoLogo} alt="memento logo" className="mb-6 h-auto w-[140px] opacity-90" />

      {/* 인디케이터 바 (무한 진행) */}
      <div className="w-[240px]">
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-black/10">
          <motion.div
            className="absolute inset-y-0 left-0 h-full w-1/3 rounded-full bg-[#3B82F6]"
            animate={{ x: ["-120%", "300%"] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        <p className="mt-3 text-center text-xs text-[#6B7280]">인증 확인 중…</p>
      </div>

      {/* 접근성: 스크린리더용 상태 */}
      <span className="sr-only" role="status">
        인증 정보를 확인하는 중입니다.
      </span>
    </div>
  );
}
