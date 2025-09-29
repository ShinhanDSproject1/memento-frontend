// src/app/LayoutProvider.tsx
import { useEffect, useRef, type PropsWithChildren } from "react"; // ✅ useEffect 추가!

// true/false 로 on/off 제어
const USE_DEVICE_LAYOUT = true;

export default function LayoutProvider({
  children,
  rounded = true,
}: PropsWithChildren<{ rounded?: boolean }>) {
  const frameRef = useRef<HTMLDivElement | null>(null);

  // ✅ 디바이스 레이아웃을 사용하지 않으면 children 그대로 렌더
  if (!USE_DEVICE_LAYOUT) {
    return (
      <div className="flex min-h-dvh w-full items-center justify-center">
        <div className="w-[512px]">{children}</div>
      </div>
    );
  }

  // ✅ 프레임 실제 크기를 CSS 변수로 노출
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;

    const ro = new ResizeObserver(([entry]) => {
      const cr = entry.contentRect;
      el.style.setProperty("--sim-w", `${cr.width}px`);
      el.style.setProperty("--sim-h", `${cr.height}px`);
      el.style.setProperty("--inset-top", `${(48 / 880) * cr.height}px`);
      el.style.setProperty("--inset-bottom", `${(22 / 880) * cr.height}px`);
      el.style.setProperty("--inset-side", `${(10 / 430) * cr.width}px`);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="w-full bg-gray-100">
      {/* 모바일에서는 원본 children 그대로 */}
      <div className="block md:hidden">{children}</div>

      {/* md 이상: 가운데 정렬 + 디바이스 프레임 */}
      <div className="hidden min-h-dvh w-full items-center justify-center text-slate-900 md:flex">
        <div
          ref={frameRef}
          className={[
            "relative",
            "h-dvh",
            "aspect-[430/880] w-auto",
            "max-w-[100vw] md:max-w-[700px]",
            "bg-[linear-gradient(145deg,#d4d7db,#a7abb3,#7c808a)]",
            "rounded-[52px]",
            "shadow-[0_40px_120px_rgba(0,0,0,0.40),inset_0_0_0_1px_rgba(255,255,255,0.25)]",
            "overflow-hidden",
          ].join(" ")}>
          {/* 안쪽 베젤 */}
          <div
            className={[
              "absolute",
              "inset-[12px]",
              "rounded-[44px] bg-[#101217]",
              "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]",
            ].join(" ")}>
            {/* 노치 */}
            <div
              className="absolute top-0 left-1/2 h-[32px] w-[210px] -translate-x-1/2 rounded-b-[18px] bg-[#0f1012] shadow-[0_6px_12px_rgba(0,0,0,0.35)]"
              aria-hidden
            />

            {/* 앱 화면 */}
            <div
              className={[
                "absolute",
                rounded ? "rounded-[36px]" : "",
                "overflow-hidden bg-white",
                "shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]",
              ].join(" ")}
              style={{
                left: "var(--inset-side)",
                right: "var(--inset-side)",
                top: "var(--inset-top)",
                bottom: "var(--inset-bottom)",
              }}>
              <div
                id="memento-sim-root"
                className="relative h-full w-full overflow-x-hidden overflow-y-auto"
                style={{ WebkitOverflowScrolling: "touch", touchAction: "manipulation" }}>
                {children}
              </div>
            </div>

            {/* 홈 인디케이터 */}
            <div className="absolute bottom-[10px] left-1/2 h-[4px] w-[120px] -translate-x-1/2 rounded-full bg-white/50" />
          </div>

          {/* 측면 버튼 */}
          <div className="absolute top-[140px] left-[-3px] h-[44px] w-[6px] rounded-r bg-[#6b6f77]" />
          <div className="absolute top-[220px] right-[-3px] h-[90px] w-[6px] rounded-l bg-[#6b6f77]" />
        </div>
      </div>
    </div>
  );
}
