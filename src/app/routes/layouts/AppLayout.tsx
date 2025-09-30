// src/app/routes/layouts/AppLayout.tsx
import CommonHeader from "@/widgets/common/CommonHeader";
import { Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <div className="mx-auto h-dvh w-full max-w-100 rounded-xl bg-[#F7FAFF]">
      <CommonHeader />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
