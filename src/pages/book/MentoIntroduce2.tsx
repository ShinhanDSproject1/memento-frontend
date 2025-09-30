// src/pages/MentoIntroduce.tsx
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";

import DayChips, { DAYS, type Day } from "@/widgets/common/DayChips";
import HourRangePicker, { type HourRange } from "@/widgets/common/HourRangePicker";
import LocationField, { type LocationFieldValue } from "@/widgets/common/LocationField";
import { SimpleEditor } from "@/widgets/common/tiptap-templates/simple/simple-editor";

import kogiriFace from "@assets/images/character/character-kogiri-face.svg";
import { updateMentoProfileDetail, useMentoProfileDetail } from "@entities/profile";

import { useModal } from "@hooks/ui/useModal";
import type { ModalKey } from "@shared/ui/ModalConfig";
import { CommonModal } from "@widgets/common";

/* ---------- 유틸: 서버 ↔ UI 매핑 ---------- */
const ISO_TO_KOR_DAY: Record<string, Day> = {
  MON: "월",
  TUE: "화",
  WED: "수",
  THU: "목",
  FRI: "금",
  SAT: "토",
  SUN: "일",
};

const KOR_TO_ISO_DAY: Record<Day, string> = {
  일: "SUN",
  월: "MON",
  화: "TUE",
  수: "WED",
  목: "THU",
  금: "FRI",
  토: "SAT",
};

function parseAvailableDays(src?: string | null): Day[] {
  if (!src) return [];
  const set = new Set<Day>(DAYS as unknown as Day[]);
  return src
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .map((iso) => ISO_TO_KOR_DAY[iso])
    .filter((d): d is Day => Boolean(d) && set.has(d));
}

function parseHour(hhmm?: string | null, fallback: number): number {
  if (!hhmm) return fallback;
  const [hh] = hhmm.split(":");
  const n = Number(hh);
  return Number.isFinite(n) ? n : fallback;
}

const toHHMM = (h: number) => String(h).padStart(2, "0") + ":00";

export default function MentoIntroduce() {
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch, isFetching } = useMentoProfileDetail();

  const { isOpen, modalType, modalData, openModal, closeModal } = useModal() as {
    isOpen: boolean;
    modalType?: ModalKey;
    modalData?: Record<string, unknown>;
    openModal: (type: ModalKey, data?: Record<string, unknown>) => void;
    closeModal: () => void;
  };

  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [overrideImage, setOverrideImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const profileImage = overrideImage ?? data?.mentoProfileImage ?? kogiriFace;
  const hasRealImage = Boolean(overrideImage || data?.mentoProfileImage);

  const [profileContent, setProfileContent] = useState<string>("");
  const [selectedDays, setSelectedDays] = useState<Day[]>([]);
  const emptyDays = useMemo<Day[]>(() => [], []);
  const [hours, setHours] = useState<HourRange>({ start: 10, end: 18 });

  const [location, setLocation] = useState<LocationFieldValue>({
    zonecode: "",
    address: "",
    detail: "",
    bname: undefined,
  } as LocationFieldValue);

  useEffect(() => {
    setOverrideImage(null);
    setImageFile(null);
    setProfileContent("");
    setSelectedDays([]);
    setHours({ start: 10, end: 18 });
    setLocation({ zonecode: "", address: "", detail: "", bname: undefined } as LocationFieldValue);
    refetch();
  }, []);

  useEffect(() => {
    if (!data) return;

    if (data.mentoProfileImage) setOverrideImage(data.mentoProfileImage);
    if (typeof data.mentoProfileContent === "string") {
      setProfileContent(data.mentoProfileContent);
    }

    setSelectedDays(parseAvailableDays(data.availableDays));
    setHours({
      start: parseHour(data.startTime, 10),
      end: parseHour(data.endTime, 18),
    });

    setLocation({
      zonecode: data.mentoPostcode ?? "",
      address: data.mentoRoadAddress ?? "",
      detail: data.mentoDetail ?? "",
      bname: data.mentoBname ?? undefined,
    });
  }, [data]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") setOverrideImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    const requestDto = {
      mentoProfileContent: profileContent,
      startTime: toHHMM(hours.start),
      endTime: toHHMM(hours.end),
      availableDays: selectedDays.map((d) => KOR_TO_ISO_DAY[d]).join(","),
      mentoPostcode: location.zonecode,
      mentoRoadAddress: location.address,
      mentoBname: location.bname ?? "",
      mentoDetail: location.detail ?? "",
    };

    openModal("loading", { title: "저장 중입니다…", description: "잠시만 기다려주세요 ⏳" });

    try {
      const res = await updateMentoProfileDetail({ requestDto, imageFile });
      closeModal();
      if (res.code === 1000) {
        setSubmissionSuccess(true);
        openModal("reviewComplete", { message: "프로필이 저장되었습니다." });
        await refetch();
      } else {
        openModal("withdrawFailed", { message: res.message || "프로필 저장에 실패했습니다." });
      }
    } catch (e: any) {
      closeModal();
      openModal("withdrawFailed", {
        message: e?.response?.data?.message || "프로필 저장 중 오류가 발생했습니다.",
      });
    }
  };

  const handleSuccessConfirm = () => {
    closeModal();
  };

  useEffect(() => {
    if (!submissionSuccess || isOpen) return;

    navigate("/mento");
  }, [submissionSuccess, isOpen, navigate]);

  if (isLoading || isFetching) {
    return (
      <div className="p-6 text-center">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-[#005EF9] border-t-transparent" />
        <p>프로필 불러오는 중…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-center text-red-600">
        {(error as Error)?.message ?? "프로필 조회 실패"}
        <div className="mt-3 flex justify-center">
          <button
            className="rounded-lg bg-[#005EF9] px-4 py-2 text-white hover:bg-[#005EF9]"
            onClick={() => refetch()}
            type="button">
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-dvh">
      <div className="mx-auto w-full max-w-screen-sm space-y-11 px-4 pt-8 pb-10 sm:max-w-md md:max-w-lg">
        <h1 className="font-WooridaumB text-center">멘티들이 확인할 정보를 입력해주세요</h1>

        {/* 프로필 이미지 */}
        <section className="flex flex-col items-center gap-2">
          <label htmlFor="profile-upload" className="group cursor-pointer">
            <div className="relative inline-block rounded-full p-[3px]">
              <img
                src={profileImage}
                alt="프로필 이미지"
                className="h-32 w-32 rounded-full bg-white object-cover shadow-lg shadow-blue-100 transition-transform duration-200 group-hover:scale-105"
              />
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
            {hasRealImage ? "프로필 이미지" : "이미지를 등록하세요"}
          </p>
        </section>

        {/* 소개글 */}
        <section className="flex flex-col gap-2">
          <p className="font-WooridaumB text-lg font-bold">소개글 입력</p>
          <div className="flex h-80 max-w-[90vw] items-center justify-center overflow-hidden rounded border border-gray-200 bg-white">
            <SimpleEditor value={profileContent} onChange={setProfileContent} />
          </div>
        </section>

        {/* 요일 */}
        <section>
          <p className="font-WooridaumB mb-3 ml-1 text-[18px] font-bold text-[#0F172A]">
            멘토링 가능 요일
          </p>
          <DayChips
            defaultDays={selectedDays.length ? selectedDays : emptyDays}
            onChange={setSelectedDays}
          />
        </section>

        {/* 시간 */}
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
          <LocationField value={location} onChange={(v) => setLocation(v)} />
        </section>

        {/* 저장 */}
        <footer className="mt-6 flex w-full justify-center">
          <button
            className="w-full rounded-lg bg-[#005EF9] px-4 py-3 font-semibold text-white hover:bg-[#005EF9]"
            onClick={handleSubmit}
            type="button">
            등록
          </button>
        </footer>
      </div>

      {isOpen && modalType ? (
        <CommonModal
          type={modalType}
          isOpen={isOpen}
          onCancel={closeModal}
          onConfirm={modalType === "reviewComplete" ? handleSuccessConfirm : closeModal}
          onSubmit={closeModal}
          modalData={modalData}
        />
      ) : null}
    </main>
  );
}
