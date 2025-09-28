import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { RoleToggle, type Role } from "./RoleToggle";

type Placement = "container" | "fixed";

export function LoginSheet({
  open,
  onClose,
  onSubmit,
  error,
  loading,
  placement = "container", // ✅ 추가: 'fixed'면 화면 하단에서 올라오는 바텀시트
  className = "",
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: { id: string; pw: string; role: Role }) => Promise<void> | void;
  error?: string | null;
  loading?: boolean;
  placement?: Placement;
  className?: string;
}) {
  const [role, setRole] = useState<Role>("mentee");
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);

  const canSubmit = id.trim() && pw.trim() && !loading;

  // ESC로 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // 스크롤 잠금 (placement에 따라 대상 다름)
  useEffect(() => {
    if (!open) return;
    const target =
      placement === "fixed"
        ? (document.documentElement as HTMLElement) // 뷰포트 전체 고정
        : ((document.querySelector("[data-app-screen]") as HTMLElement | null) ??
          (document.getElementById("memento-sim-root") as HTMLElement | null));

    const prevOverflow = target?.style.overflow ?? "";
    if (target) target.style.overflow = "hidden";
    return () => {
      if (target) target.style.overflow = prevOverflow;
    };
  }, [open, placement]);

  const handle = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    await onSubmit({ id: id.trim(), pw, role });
  };

  // ✅ 위치 클래스: container 모드(부모 기준 absolute) vs fixed 모드(뷰포트 기준 fixed)
  const overlayPos = placement === "fixed" ? "fixed inset-0" : "absolute inset-0";
  const sheetPos =
    placement === "fixed" ? "fixed inset-x-0 bottom-0" : "absolute right-0 bottom-0 left-0";

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.button
            type="button"
            aria-label="로그인 모달 닫기"
            onClick={onClose}
            className={`${overlayPos} z-[60] bg-black/40`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Bottom sheet */}
          <motion.div
            className={`${sheetPos} z-[70] ${className}`}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 420, damping: 40 }}
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto w-full max-w-md rounded-t-2xl bg-white p-4 shadow-2xl ring-1 ring-black/5">
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-black/15" />

              <form onSubmit={handle} className="flex flex-col gap-4">
                <RoleToggle value={role} onChange={setRole} />

                {/* 아이디 */}
                <div className="relative">
                  <input
                    id="login-id"
                    type="text"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    placeholder="아이디"
                    autoComplete="username"
                    className={`peer w-full rounded-lg border px-3 pt-5 pb-2 text-sm placeholder-transparent shadow-sm outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6] ${
                      error ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  <label
                    htmlFor="login-id"
                    className="absolute top-2 left-3 text-xs text-gray-500 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-xs peer-focus:text-[#3B82F6]">
                    아이디
                  </label>
                </div>

                {/* 비밀번호 */}
                <div className="relative">
                  <input
                    id="login-pw"
                    type={showPw ? "text" : "password"}
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    placeholder="비밀번호"
                    autoComplete="current-password"
                    className={`peer w-full rounded-lg border px-3 pt-5 pb-2 text-sm placeholder-transparent shadow-sm outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6] ${
                      error ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  <label
                    htmlFor="login-pw"
                    className="absolute top-2 left-3 text-xs text-gray-500 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-xs peer-focus:text-[#3B82F6]">
                    비밀번호
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    aria-label={showPw ? "비밀번호 숨기기" : "비밀번호 보기"}>
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {error && <p className="text-xs text-red-600">* {error}</p>}

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={`mt-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition ${
                    !canSubmit
                      ? "cursor-not-allowed bg-[#9BB9FF]"
                      : "bg-[#3B82F6] hover:bg-[#1D4ED8] active:scale-[0.98]"
                  }`}>
                  {loading ? "로그인 중..." : "로그인"}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
