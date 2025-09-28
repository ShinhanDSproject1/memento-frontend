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

const LoginSheetCtx = createContext<{
  openLogin: (opts?: { onSuccess?: () => void }) => void;
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

  const openLogin = useCallback((opts?: { onSuccess?: () => void }) => {
    setPending(() => opts?.onSuccess ?? null);
    setError(null);
    setOpen(true);
  }, []);

  const closeLogin = useCallback(() => {
    setOpen(false);
    setError(null);
    setLoading(false);
    setPending(null);
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

  // ✅ portal target: 무조건 #memento-sim-root
  const portalRoot =
    typeof document !== "undefined" ? document.getElementById("memento-sim-root") : null;

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
          />,
          portalRoot,
        )}
    </LoginSheetCtx.Provider>
  );
}
