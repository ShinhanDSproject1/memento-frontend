import React, { useEffect, useState } from "react";

interface Props {
  children: React.ReactNode;
  /** 로딩 표시를 지연시킬 시간(ms). 기본 300ms */
  delay?: number;
}

/**
 * Suspense fallback 등이 너무 빨리 깜빡이지 않도록,
 * 일정 시간 이상 지속될 때만 children을 보여주는 래퍼.
 */
export default function DelayedFallback({ children, delay = 1000 }: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return show ? <>{children}</> : null;
}
