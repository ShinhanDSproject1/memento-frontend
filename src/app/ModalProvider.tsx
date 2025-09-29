// src/app/ModalProvider.tsx
import { useAuth } from "@/entities/auth";
import { LoginSheet } from "@/widgets/home2/LoginSheet";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import ReactDOM from "react-dom";

type Ctx = {
  openLogin: (opts?: { onSuccess?: () => void }) => void;
  closeLogin: () => void;
};
const LoginSheetCtx = createContext<Ctx | null>(null);

export function useLoginSheet() {
  const ctx = useContext(LoginSheetCtx);
  if (!ctx) throw new Error("LoginSheetProvider가 필요합니다.");
  return ctx;
}

export default function ModalProvider({ children }: PropsWithChildren) {
  const { login } = useAuth();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<(() => void) | null>(null);

  // 🔑 지금 보이는 화면(디바이스 프레임 내부)을 포털 타겟으로 매번 “열 때” 찾는다
  const portalTargetRef = useRef<HTMLElement | null>(null);
  const resolvePortalTarget = () => {
    // 1) 각 페이지 루트에 권장: <main data-app-screen>
    const appScreen = document.querySelector("[data-app-screen]") as HTMLElement | null;
    if (appScreen) return appScreen;

    // 2) 디바이스 레이아웃 내부 루트
    const deviceRoot = document.getElementById("memento-sim-root");
    if (deviceRoot) return deviceRoot;

    // 3) 최후: body (디바이스 프레임 외부 — 되도록 1/2가 잡히도록 페이지에 data-app-screen 달아주세요)
    return document.body;
  };

  const openLogin = useCallback((opts?: { onSuccess?: () => void }) => {
    // 버튼이 눌린 "그 시점의" 컨테이너를 타겟으로
    portalTargetRef.current = resolvePortalTarget();

    setPending(() => opts?.onSuccess ?? null);
    setError(null);
    setOpen(true);

    // 컨테이너 스크롤 잠금 (디바이스 내부만)
    const tgt = portalTargetRef.current;
    if (tgt) {
      const prev = tgt.style.overflow;
      tgt.style.overflow = "hidden";
      // cleanup on next tick when close
      const restore = () => (tgt.style.overflow = prev);
      (openLogin as any).__restore = restore;
    }
  }, []);

  const closeLogin = useCallback(() => {
    setOpen(false);
    setError(null);
    setLoading(false);
    setPending(null);

    // 스크롤 잠금 원복
    const restore = (openLogin as any).__restore as (() => void) | undefined;
    if (restore) {
      restore();
      (openLogin as any).__restore = undefined;
    }
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

  return (
    <LoginSheetCtx.Provider value={value}>
      {children}

      {open &&
        portalTargetRef.current &&
        ReactDOM.createPortal(
          <LoginSheet
            // ✅ “컨테이너 기준”으로 뜨게 유지 (디바이스 프레임 안)
            placement="container"
            open={open}
            onClose={closeLogin}
            onSubmit={handleSubmit}
            error={error}
            loading={loading}
          />,
          portalTargetRef.current,
        )}
    </LoginSheetCtx.Provider>
  );
}
