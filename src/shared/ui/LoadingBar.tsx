import { motion } from "framer-motion";
import React from "react";

type Props = {
  /** "inline" = 라우트 내 영역용(작은 바), "overlay" = 풀스크린 오버레이 */
  variant?: "inline" | "overlay";
  label?: string; // 접근성/텍스트 안내
};

export default function LoadingBar({ variant = "inline", label = "로딩 중…" }: Props) {
  const bar = (
    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-black/10">
      <motion.div
        className="absolute inset-y-0 left-0 h-full w-1/3 rounded-full bg-[#3B82F6]"
        animate={{ x: ["-120%", "300%"] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );

  if (variant === "overlay") {
    return (
      <div
        className="fixed inset-0 z-[9999] flex h-dvh w-dvw flex-col items-center justify-center bg-white/70 backdrop-blur-[1px]"
        role="dialog"
        aria-modal="true">
        <div className="w-[240px]">{bar}</div>
        <p className="mt-3 text-center text-xs text-[#6B7280]">{label}</p>
        <span className="sr-only" role="status">
          {label}
        </span>
      </div>
    );
  }

  // inline
  return (
    <div className="flex w-full flex-col items-center justify-center p-6">
      <div className="w-[240px]">{bar}</div>
      <p className="mt-3 text-xs text-[#6B7280]">{label}</p>
      <span className="sr-only" role="status">
        {label}
      </span>
    </div>
  );
}
