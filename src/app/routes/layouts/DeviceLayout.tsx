// src/widgets/DeviceS.tsx
import type { PropsWithChildren } from "react";

export default function DeviceSimulator({
  children,
  showStatusBar = true,
  rounded = true,
}: PropsWithChildren<{ showStatusBar?: boolean; rounded?: boolean }>) {
  return (
    <div className="min-h-screen w-full bg-gray-100">
      {/* 모바일에서는 그대로 children 출력 */}
      <div className="block md:hidden">{children}</div>

      {/* md 이상일 때만 폰 시뮬레이터 보이기 */}
      <div className="hidden min-h-screen w-full items-center justify-center p-4 text-slate-900 md:flex">
        {/* 📱 폰 외곽 프레임 */}
        <div
          className={[
            "relative",
            "h-[880px] w-[430px]",
            "bg-[linear-gradient(145deg,#d4d7db,#a7abb3,#7c808a)]",
            "rounded-[52px]",
            "shadow-[0_40px_120px_rgba(0,0,0,0.40),inset_0_0_0_1px_rgba(255,255,255,0.25)]",
          ].join(" ")}>
          {/* 안쪽 베젤 */}
          <div
            className={[
              "absolute inset-[12px]",
              "rounded-[44px] bg-[#101217]",
              "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]",
            ].join(" ")}>
            {/* 노치 */}
            <div
              className="absolute top-0 left-1/2 h-[32px] w-[210px] -translate-x-1/2 rounded-b-[18px] bg-[#0f1012] shadow-[0_6px_12px_rgba(0,0,0,0.35)]"
              aria-hidden
            />

            {/* 상태바 */}
            {showStatusBar && (
              <div className="absolute top-[14px] right-0 left-0 flex items-center justify-between px-8 text-[12px] text-white/70 select-none">
                <span>오후 5:39</span>
                <div className="flex items-center gap-2">
                  <span className="block h-[10px] w-[18px] rounded-sm bg-white/70" />
                  <span className="block h-[10px] w-[16px] rounded-sm bg-white/70" />
                  <span className="block h-[10px] w-[22px] rounded-sm bg-white/70" />
                </div>
              </div>
            )}

            {/* 앱 화면 */}
            <div
              className={[
                "absolute right-[10px] left-[10px]",
                "top-[48px] bottom-[22px]",
                rounded ? "rounded-[36px]" : "",
                "overflow-hidden bg-white",
                "shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]",
              ].join(" ")}>
              {/* 📌 이 div가 모달 포털 기준 컨테이너가 됨 */}
              <div
                id="memento-sim-root"
                className="relative h-full w-full overflow-x-hidden overflow-y-auto">
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
