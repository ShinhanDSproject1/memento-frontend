// src/app/routes/layouts/HomeLayout.tsx
import MainHeader from "@/widgets/main/mainHeader/MainHeader";
import { Outlet } from "react-router-dom";

export default function HomeLayout() {
  return (
    <div className="mx-auto w-full max-w-100 rounded-xl bg-white bg-gradient-to-b from-[#F7FAFF] to-[#EEF4FF]">
      <MainHeader />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
