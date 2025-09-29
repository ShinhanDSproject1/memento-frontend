import { useDaumPostcode } from "@shared/hooks";
import { useEffect, useState, type ChangeEvent } from "react";

export interface LocationFieldValue {
  zonecode: string;
  address: string;
  detail: string;
  bname?: string;
}

export interface LocationFieldProps {
  value?: LocationFieldValue; // ✅ 부모 값
  onChange?: (value: LocationFieldValue) => void;
}

export default function LocationField({ value, onChange }: LocationFieldProps) {
  const [zonecode, setZonecode] = useState(value?.zonecode ?? "");
  const [address, setAddress] = useState(value?.address ?? "");
  const [detail, setDetail] = useState(value?.detail ?? "");
  const [bname, setBname] = useState<string | undefined>(value?.bname);

  useEffect(() => {
    if (!value) return;
    if (value.zonecode !== zonecode) setZonecode(value.zonecode ?? "");
    if (value.address !== address) setAddress(value.address ?? "");
    if (value.detail !== detail) setDetail(value.detail ?? "");
    if (value.bname !== bname) setBname(value.bname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.zonecode, value?.address, value?.detail, value?.bname]);

  const { loaded, openPostcode } = useDaumPostcode();

  const emit = (z = zonecode, a = address, d = detail, b = bname) => {
    onChange?.({ zonecode: z, address: a, detail: d, bname: b });
  };

  return (
    <div className="grid grid-cols-1 gap-3">
      {/* 우편번호 + 주소 (div로 Input처럼 보이게) */}
      <div className="flex items-center gap-2">
        <div className="font-WooridaumL flex h-12 w-28 min-w-[7rem] items-center rounded-[14px] border border-[#E5E7ED] bg-white px-3 text-[15px] text-[#0F172A]">
          {zonecode ? (
            <span className="tracking-[0.02em]">{zonecode}</span>
          ) : (
            <span className="text-[#9AA2AE]">우편번호</span>
          )}
        </div>

        <div className="relative min-w-0 flex-1">
          <div className="font-WooridaumL flex h-12 w-full min-w-0 items-center overflow-hidden rounded-[14px] border border-[#E5E7ED] bg-white pr-[7.5rem] pl-4 text-[15px] text-[#0F172A] shadow-sm">
            {address ? (
              <span className="block w-full truncate" title={address}>
                {address}
              </span>
            ) : (
              <span className="text-[#9AA2AE]">도로명/지번 주소</span>
            )}
          </div>

          <button
            type="button"
            disabled={!loaded}
            aria-disabled={!loaded}
            onClick={() =>
              openPostcode((data) => {
                const z = data.zonecode || "";
                const a = data.roadAddress || data.jibunAddress || "";
                const b = data.bname || undefined;
                setZonecode(z);
                setAddress(a);
                setBname(b);
                emit(z, a, detail, b);
              })
            }
            className={`font-WooridaumB absolute top-1/2 right-2 h-10 w-[5.5rem] -translate-y-1/2 cursor-pointer rounded-lg text-sm transition-colors ${
              loaded
                ? "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-300"
                : "cursor-not-allowed bg-slate-200 text-white"
            }`}>
            주소 검색
          </button>
        </div>
      </div>

      {/* 상세주소 (사용자 입력) */}
      <input
        value={detail}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          const d = e.target.value;
          setDetail(d);
          emit(zonecode, address, d, bname);
        }}
        placeholder="상세 주소"
        className="font-WooridaumL h-12 w-full rounded-[14px] border border-[#E5E7ED] bg-white px-4 text-[15px] text-[#0F172A] placeholder:text-[#9AA2AE] focus:ring-2 focus:ring-[#005EF9]/60 focus:outline-none"
      />
    </div>
  );
}
