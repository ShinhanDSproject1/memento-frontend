import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { useCalendar, useKoreanHolidays } from "@hooks";
import { Calendar } from "@widgets/booking";
import TimeGrid from "@widgets/booking/TimeGrid";

import { toYM, toYMD } from "@shared/lib/datetime";
import { fetchAvailability } from "@/shared/api/reservations";
import { getAccessToken } from "@/shared/auth/token";
import { fetchMentosDetail, type MentosDetail } from "@/shared/api/mentos";

interface BookingPageProps {
  mentorId?: number;
  defaultMonth?: Date;
}

type NavState = Partial<{
  title: string;
  price: number;
  mentosSeq: number;
}>;

export default function BookingPage({ mentorId, defaultMonth = new Date() }: BookingPageProps) {
  const navigate = useNavigate();
  const location = useLocation() as { pathname: string; search: string; state?: NavState };
  const state = location.state;

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");

  const [search] = useSearchParams();
  const qs = search.get("mentorId") ?? search.get("mentosSeq");
  const mentosSeq = state?.mentosSeq ?? (qs && !Number.isNaN(Number(qs)) ? Number(qs) : mentorId);

  const { data: detail, isFetching: isLoadingDetail } = useQuery<MentosDetail>({
    queryKey: ["mentosDetail", mentosSeq],
    queryFn: () => fetchMentosDetail(mentosSeq),
    enabled: !!mentosSeq && (!state?.title || typeof state?.price !== "number"),
    staleTime: 5 * 60_000,
  });

  const title = state?.title ?? detail?.mentosTitle ?? "";
  const price =
    typeof state?.price === "number"
      ? state.price
      : typeof detail?.price === "number"
        ? detail.price
        : 0;

  // 달력 훅
  const {
    currentMonth,
    setCurrentMonth,
    goToPrevMonth,
    goToNextMonth,
    generateCalendar,
    isToday,
    isPastDate,
    isCurrentMonth,
  } = useCalendar(defaultMonth);

  const monthKey = useMemo(() => toYM(currentMonth), [currentMonth]);

  // 공휴일
  const { isHoliday, getHolidayName } = useKoreanHolidays(currentMonth.getFullYear());

  // 최초 진입 시 오늘 날짜/현재 월로 세팅
  useEffect(() => {
    if (selectedDate) return;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    setSelectedDate(today);
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthKey]);

  const ymd = selectedDate ? toYMD(selectedDate) : "";

  if (!mentosSeq) {
    return (
      <div className="p-6">
        <p className="mb-3 font-semibold">멘토 정보가 없습니다.</p>
      </div>
    );
  }
  const days = generateCalendar(currentMonth);

  // 가용 시간 조회
  const { data: availability, isFetching: isLoadingTimes } = useQuery({
    queryKey: ["availability", mentosSeq, ymd],
    queryFn: () => fetchAvailability(mentosSeq, ymd),
    enabled: !!mentosSeq && !!ymd,
    staleTime: 60_000,
  });

  const availableTimes = availability?.availableTime ?? [];

  // 날짜 클릭
  const handleDateClick = (date: Date) => {
    if (isPastDate(date)) return;
    if (!isCurrentMonth(date)) {
      setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
    setSelectedDate(date);
    setSelectedTime("");
  };

  // 예약하기: 여기서는 API 호출 X → 확인 페이지로 state만 전달
  const handleReservation = () => {
    if (!selectedDate || !selectedTime) {
      alert("날짜와 시간을 선택해 주세요.");
      return;
    }

    if (!getAccessToken()) {
      alert("로그인이 필요한 기능입니다.");
      navigate("/login", { state: { from: location.pathname + location.search } });
      return;
    }

    // 선택한 시간이 여전히 가용한지 최종 확인
    if (
      Array.isArray(availableTimes) &&
      availableTimes.length > 0 &&
      !availableTimes.includes(selectedTime)
    ) {
      alert("선택한 시간이 더 이상 예약 불가합니다. 다시 선택해 주세요.");
      setSelectedTime("");
      return;
    }

    const date = toYMD(selectedDate);

    navigate("/booking/confirm", {
      state: {
        title,
        price,
        mentosSeq,
        date,
        time: selectedTime,
      },
    });
  };

  const canReserve =
    !!selectedDate && !!selectedTime && !isLoadingTimes && !isLoadingDetail && !!title;

  return (
    <div className="flex h-[calc(100vh-48px)] w-full justify-center overflow-x-hidden bg-[#F7FAFF] font-sans antialiased">
      <section className="w-full overflow-x-hidden bg-white px-4 py-5 shadow">
        <h1 className="font-WooridaumB mt-6 mb-[50px] pl-2 text-[20px] font-bold">
          {title || "로딩 중..."}
        </h1>

        <div className="px-2">
          {/* 달력 */}
          <Calendar
            currentMonth={currentMonth}
            days={days}
            isToday={isToday}
            isPastDate={isPastDate}
            isHoliday={isHoliday}
            getHolidayName={getHolidayName}
            selectedDate={selectedDate}
            onSelectDate={handleDateClick}
            onPrev={goToPrevMonth}
            onNext={goToNextMonth}
          />

          {/* 시간 그리드: API에서 받은 시간만 렌더 */}
          <TimeGrid
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onSelectTime={setSelectedTime}
            apiTimes={availableTimes}
            listType="reserved"
          />

          {/* 예약 버튼 */}
          <button
            type="button"
            onClick={handleReservation}
            disabled={!canReserve}
            className={`font-WooridaumB h-14 w-full rounded-2xl text-base font-extrabold text-white shadow transition active:scale-[0.99] ${
              canReserve
                ? "cursor-pointer bg-[#1161FF] hover:bg-[#0C2D62]"
                : "cursor-not-allowed bg-gray-300 text-gray-500 hover:bg-gray-300"
            }`}>
            예약하기
          </button>
        </div>
      </section>
    </div>
  );
}
