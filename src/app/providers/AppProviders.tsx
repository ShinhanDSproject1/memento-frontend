// src/app/providers/AppProviders.tsx
import DeviceSimulator from "@/app/routes/layouts/DeviceLayout";
import type { PropsWithChildren } from "react";
import AuthProvider from "./AuthProvider";
import { LoginSheetProvider } from "./LoginFormProvider";
import QueryProvider from "./QueryProvider";

const USE_SIMULATOR = import.meta.env.VITE_SIMULATOR === "true";

export default function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryProvider>
      <AuthProvider>
        {USE_SIMULATOR ? (
          <DeviceSimulator enabled={false}>
            {/* ✅ 시뮬레이터 내부에서 모달 Provider를 감싼다 */}
            <LoginSheetProvider>{children}</LoginSheetProvider>
          </DeviceSimulator>
        ) : (
          // 모바일/실기기 모드에선 평소대로
          <DeviceSimulator enabled={false}>
            {/* ✅ 시뮬레이터 내부에서 모달 Provider를 감싼다 */}
            <LoginSheetProvider>{children}</LoginSheetProvider>
          </DeviceSimulator>
        )}
      </AuthProvider>
    </QueryProvider>
  );
}
