// src/widgets/common/DayChips.tsx
import { useEffect, useMemo, useState } from "react";

export const DAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;
export type Day = (typeof DAYS)[number];

export interface DayChipsProps {
  /** 컨트롤드 모드: 선택된 요일 배열 */
  value?: Day[];
  /** 언컨트롤드 초기값 */
  defaultDays?: Day[];
  /** 값 변경 콜백 */
  onChange?: (days: Day[]) => void;
}

export default function DayChips({ value, defaultDays = [], onChange }: DayChipsProps) {
  const isControlled = value !== undefined;

  // 언컨트롤드 모드에서만 내부 상태 사용
  const [internalSet, setInternalSet] = useState<Set<Day>>(() => new Set(defaultDays));

  // defaultDays 변경 시 언컨트롤드 초기화
  useEffect(() => {
    if (!isControlled) {
      setInternalSet(new Set(defaultDays));
    }
  }, [defaultDays, isControlled]);

  // 렌더에 사용할 현재 선택 Set (컨트롤드면 value 기반)
  const selectedSet = useMemo<Set<Day>>(
    () => (isControlled ? new Set(value) : internalSet),
    [isControlled, value, internalSet],
  );

  const emit = (nextSet: Set<Day>) => {
    onChange?.(Array.from(nextSet));
  };

  const toggle = (d: Day) => {
    const next = new Set(selectedSet);

    if (next.has(d)) {
      next.delete(d);
    } else {
      next.add(d);
    }

    if (isControlled) {
      emit(next); // onChange(Array.from(next))
    } else {
      setInternalSet(next);
      emit(next);
    }
  };

  return (
    <div className="flex justify-between gap-2">
      {DAYS.map((d) => {
        const active = selectedSet.has(d);
        return (
          <button
            key={d}
            type="button"
            onClick={() => toggle(d)}
            className={`h-12 w-12 rounded-full border shadow transition-all ${
              active
                ? "!border-emerald-600 !bg-emerald-600 !text-white"
                : "border-[#E5E7ED] bg-white text-[#667085] hover:bg-emerald-50"
            }`}
            aria-pressed={active}
            aria-label={d}>
            {d}
          </button>
        );
      })}
    </div>
  );
}
