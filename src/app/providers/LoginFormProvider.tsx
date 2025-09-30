// src/app/providers/LoginFormProvider.tsx
import { useAuth } from "@/entities/auth";
import { LoginSheet } from "@/widgets/home2/LoginSheet";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import ReactDOM from "react-dom";

type Placement = "fixed" | "container" | "center";

type OpenOpts = {
  onSuccess?: () => void;
  /** 모달을 붙일 포털 루트. 기본값: document.body */
  root?: HTMLElement | null;
  /** 배치 방식: fixed(뷰포트 하단), container(컨테이너 하단), center(가운데) */
  placement?: Placement;
};

const LoginSheetCtx = createContext<{
  openLogin: (opts?: OpenOpts) => void;
  closeLogin: () => void;
} | null>(null);

export function useLoginSheet() {
  const ctx = useContext(LoginSheetCtx);
  if (!ctx) throw new Error("LoginSheetProvider가 필요합니다.");
  return ctx;
}

export function LoginSheetProvider({ children }: PropsWithChildren) {
  const { login } = useAuth();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<(() => void) | null>(null);

  // 포털 루트 & 배치 상태
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);
  const [placement, setPlacement] = useState<Placement>("fixed");

  const openLogin = useCallback((opts?: OpenOpts) => {
    setPending(() => opts?.onSuccess ?? null);
    setError(null);
    setPlacement(opts?.placement ?? "fixed");
    // 기본은 body (뷰포트 기준)
    setPortalEl(opts?.root ?? (typeof document !== "undefined" ? document.body : null));
    setOpen(true);
  }, []);

  const closeLogin = useCallback(() => {
    setOpen(false);
    setError(null);
    setLoading(false);
    setPending(null);
    setPortalEl(null);
    setPlacement("fixed");
  }, []);

  const handleSubmit = useCallback(
    async ({ id, pw, role }: { id: string; pw: string; role: "mentee" | "mentor" }) => {
      if (loading) return;
      setLoading(true);
      try {
        const userType = role === "mentor" ? "MENTO" : "MENTI";
        await login({ userType, memberId: id, memberPwd: pw });
        closeLogin();
        pending?.();
      } catch (e: any) {
        setError(
          e?.response?.data?.message ||
            e?.message ||
            "로그인에 실패했습니다. 아이디/비밀번호를 확인해주세요.",
        );
      } finally {
        setLoading(false);
      }
    },
    [login, loading, pending, closeLogin],
  );

  const value = useMemo(() => ({ openLogin, closeLogin }), [openLogin, closeLogin]);

  const portalRoot = portalEl ?? (typeof document !== "undefined" ? document.body : null);

  return (
    <LoginSheetCtx.Provider value={value}>
      {children}
      {open &&
        portalRoot &&
        ReactDOM.createPortal(
          <LoginSheet
            open={open}
            onClose={closeLogin}
            onSubmit={handleSubmit}
            error={error}
            loading={loading}
            placement={placement} // ← 옵션으로 제어 (fixed/container/center)
            className="z-[10000]"
          />,
          portalRoot,
        )}
    </LoginSheetCtx.Provider>
  );
}
