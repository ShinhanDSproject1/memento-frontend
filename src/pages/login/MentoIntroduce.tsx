// src/pages/MentoIntroduce.tsx
import { useEffect, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";

import Button from "@/widgets/common/Button";
import DayChips, { type Day } from "@/widgets/common/DayChips";
import HourRangePicker, { type HourRange } from "@/widgets/common/HourRangePicker";
import LocationField, { type LocationFieldValue } from "@/widgets/common/LocationField";
import { SimpleEditor } from "@/widgets/common/tiptap-templates/simple/simple-editor";

import {
  loadMentorOnboardingDraft,
  saveMentorOnboardingDraft,
} from "@/shared/lib/mentorProfileStorage";
import kogiriFace from "@assets/images/character/character-kogiri-face.svg";
import logo from "@assets/images/logo/memento-logo.svg";

export default function MentoIntroduce() {
  const navigate = useNavigate();

  // ----- 입력 전용 상태들 -----
  // 이미지: 기본은 placeholder, 업로드 시 미리보기(dataURL)
  const [overrideImage, setOverrideImage] = useState<string | null>(null);
  const profileImage = overrideImage ?? kogiriFace;
  const hasRealImage = Boolean(overrideImage);

  // 소개글(에디터) — ❗SimpleEditor가 value/onChange를 지원한다고 가정
  const [profileContent, setProfileContent] = useState<string>("");

  // 요일/시간/장소
  const [selectedDays, setSelectedDays] = useState<Day[]>([]);
  const [hours, setHours] = useState<HourRange>({ start: 10, end: 18 });
  const [location, setLocation] = useState<LocationFieldValue>({
    zonecode: "",
    address: "",
    detail: "",
    bname: undefined,
  });

  // ✅ 1) 마운트 시 세션스토리지에서 복원
  useEffect(() => {
    const d = loadMentorOnboardingDraft();
    if (!d) return;

    if (d.profileImageDataUrl) setOverrideImage(d.profileImageDataUrl);
    if (typeof d.profileContent === "string") setProfileContent(d.profileContent);

    if (Array.isArray(d.days)) setSelectedDays(d.days as Day[]);

    setHours({
      start: typeof d.start === "number" ? d.start : 10,
      end: typeof d.end === "number" ? d.end : 18,
    });

    setLocation({
      zonecode: d.zonecode ?? "",
      address: d.address ?? "",
      detail: d.detail ?? "",
      bname: d.bname,
    });
  }, []);

  // 이미지 선택 핸들러
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setOverrideImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // 다음 단계로 (세션에 저장은 자동으로 되고 있으나, 안전하게 한 번 더 저장할 수 있음)
  const handleSubmit = () => {
    saveMentorOnboardingDraft({
      profileImageDataUrl: profileImage,
      profileContent,
      days: selectedDays,
      start: hours.start,
      end: hours.end,
      zonecode: location.zonecode,
      address: location.address,
      detail: location.detail,
      bname: location.bname,
    });
    navigate("/signup/mentor");
  };

  return (
    <main>
      <div className="mx-auto w-full max-w-screen-sm space-y-10 px-4 pt-8 pb-10 sm:max-w-md md:max-w-lg">
        {/* 로고 + 인사 */}
        <div className="mb-5 text-center">
          <div className="flex items-center justify-center">
            <img src={logo} className="w-40" />
            <h1 className="mt-2 text-sm font-extrabold">
              <span className="mx-2 text-slate-900">에 오신것을 환영합니다</span>
            </h1>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            멘티와 함께 하는 스마트한 금융 여정을 시작하세요
          </p>
        </div>

        {/* 프로필 이미지 */}
        <section className="flex flex-col items-center gap-2">
          <label htmlFor="profile-upload" className="group cursor-pointer">
            <div className="relative inline-block rounded-full bg-gradient-to-r from-blue-400 to-green-400 p-[3px]">
              <img
                src={profileImage}
                alt="프로필 이미지"
                className="h-32 w-32 rounded-full bg-white object-cover shadow-lg shadow-blue-100 transition-transform duration-200 group-hover:scale-105"
              />
              {/* 선택적 오버레이 */}
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="text-sm font-semibold text-white">변경</span>
              </div>
            </div>
          </label>

          <input
            id="profile-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />

          <p className="font-WooridaumB text-gray-500">
            {hasRealImage ? "프로필 이미지" : "프로필 이미지를 등록하세요"}
          </p>
        </section>

        {/* 소개글 */}
        <section className="flex flex-col gap-2">
          <p className="font-WooridaumB text-lg font-bold">소개글 입력</p>
          <div className="flex h-80 max-w-[90vw] items-center justify-center overflow-hidden rounded border border-gray-200 bg-white">
            {/* ✅ SimpleEditor가 value/onChange를 지원해야 합니다 */}
            <SimpleEditor value={profileContent} onChange={setProfileContent} />
          </div>
        </section>

        {/* 요일 */}
        <section>
          <p className="font-WooridaumB mb-3 ml-1 text-[18px] font-bold text-[#0F172A]">
            멘토링 가능 요일
          </p>
          {/* ✅ DayChips가 value/onChange를 지원한다고 가정 */}
          <DayChips value={selectedDays} onChange={setSelectedDays} />
          {/* 만약 현재 컴포넌트가 value 미지원이면:
              1) DayChips에 value prop 추가(내부에서 controlled로 처리)
              2) 임시로 defaultDays={selectedDays} 로는 '복원 표시'가 제대로 안 됨 */}
        </section>

        {/* 근무 시간 */}
        <section>
          <p className="font-WooridaumB mb-3 ml-1 text-[18px] font-bold text-[#0F172A]">
            멘토링 가능 시간
          </p>
          <HourRangePicker value={hours} onChange={setHours} />
        </section>

        {/* 장소 */}
        <section>
          <p className="font-WooridaumB mb-3 ml-1 text-[18px] font-bold text-[#0F172A]">
            멘토링 장소
          </p>
          <LocationField onChange={setLocation} />
        </section>

        {/* 다음 버튼 */}
        <footer className="mt-6 flex w-full justify-center">
          <Button
            className="w-full cursor-pointer"
            size="lg"
            variant="primary"
            onClick={handleSubmit}>
            다음
          </Button>
        </footer>
      </div>
    </main>
  );
}
