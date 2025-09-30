// src/pages/SignupSelect.tsx
import gom from "@assets/images/character/character-gom.svg";
import kogiri from "@assets/images/character/character-kogiri.svg";
import { useNavigate } from "react-router-dom";

export interface SignupSelectProps {
  onSelect?: (role: "mentee" | "mentor") => void;
}

export default function SignupSelect({ onSelect }: SignupSelectProps) {
  const navigate = useNavigate();

  const handleSelect = (role: "mentee" | "mentor") => {
    if (onSelect) return onSelect(role);
    if (role === "mentor") {
      // 멘토: 온보딩 1로 진입
      navigate("/mento/introduce");
    } else {
      // 멘티: 바로 멘티 폼
      navigate("/signup/mentee");
    }
  };

  return (
    <main className="font-WooridaumB mx-auto h-[calc(100vh-50px)] w-full max-w-md py-20 sm:h-[calc(100vh-140px)]">
      <h1 className="mb-8 text-center text-xl font-extrabold text-slate-900">
        가입하시려는 유형을 선택해주세요
      </h1>

      <div className="mt-20 space-y-10 pr-10">
        {/* 멘티 */}
        <button
          type="button"
          onClick={() => handleSelect("mentee")}
          className="group flex w-full items-center justify-between rounded-r-full bg-[#9BB9FF] px-6 py-6 text-left shadow-[0_10px_30px_rgba(155,185,255,0.35)] transition-transform hover:scale-[1.01] active:scale-[0.99]">
          <span className="text-xl font-extrabold text-white">멘티</span>
          <div className="h-20 w-20 rounded-full bg-white/95 shadow-[0_6px_16px_rgba(0,0,0,0.1)]">
            <img src={gom} alt="멘티" className="h-20 w-20" />
          </div>
        </button>

        {/* 멘토 */}
        <button
          type="button"
          onClick={() => handleSelect("mentor")}
          className="group flex w-full items-center justify-between rounded-r-full bg-[#1161FF] px-6 py-6 text-left shadow-[0_12px_32px_rgba(17,97,255,0.35)] transition-transform hover:scale-[1.01] active:scale-[0.99]">
          <span className="text-xl font-extrabold text-white">멘토</span>
          <div className="h-20 w-20 rounded-full bg-white/95 shadow-[0_6px_16px_rgba(0,0,0,0.12)]">
            <img src={kogiri} alt="멘토" className="h-20 w-20" />
          </div>
        </button>
      </div>
    </main>
  );
}
