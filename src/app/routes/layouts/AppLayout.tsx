// src/app/routes/layouts/AppLayout.tsx
import CommonHeader from "@/widgets/common/CommonHeader";
import { Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <div className="mx-auto w-full max-w-100 rounded-xl bg-gradient-to-b from-[#F7FAFF] to-[#EEF4FF]">
      <CommonHeader />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
