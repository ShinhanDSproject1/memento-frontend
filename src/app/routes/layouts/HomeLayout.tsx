// src/app/routes/layouts/HomeLayout.tsx
import MainHeader from "@/widgets/main/mainHeader/MainHeader";
import { Outlet } from "react-router-dom";

export default function HomeLayout() {
  return (
    <div className="mx-auto h-dvh w-full max-w-100 rounded-xl bg-[#F7FAFF]">
      <MainHeader />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
