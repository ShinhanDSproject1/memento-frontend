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

  const handleOpenPostcode = () => {
    openPostcode((data) => {
      const z = data.zonecode || "";
      const a = data.roadAddress || data.jibunAddress || "";
      const b = data.bname || undefined;
      setZonecode(z);
      setAddress(a);
      setBname(b);
      // 검색 후 상세주소는 초기화해주는 것이 사용자 경험에 좋습니다.
      setDetail("");
      emit(z, a, "", b);
    });
  };

  const handleDetailChange = (e: ChangeEvent<HTMLInputElement>) => {
    const d = e.target.value;
    setDetail(d);
    emit(zonecode, address, d, bname);
  };

  return (
    <div className="flex w-full flex-col gap-3">
      {/* ✨ 1. flex-1을 사용하여 입력창이 남은 공간을 모두 채우도록 수정 */}
      <div className="flex w-full items-center gap-2">
        <input
          type="text"
          value={zonecode}
          readOnly
          placeholder="우편번호"
          className="font-WooridaumL h-12 flex-1 rounded-[14px] border border-[#E5E7ED] bg-white px-4 text-[15px] text-[#0F172A] placeholder:text-[#9AA2AE] focus:ring-2 focus:ring-[#005EF9]/60 focus:outline-none"
        />
        <button
          type="button"
          disabled={!loaded}
          aria-disabled={!loaded}
          onClick={handleOpenPostcode}
          className={`font-WooridaumB h-12 w-28 flex-shrink-0 cursor-pointer rounded-lg text-sm transition-colors ${
            loaded
              ? "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-300"
              : "cursor-not-allowed bg-slate-200 text-white"
          }`}>
          주소 검색
        </button>
      </div>

      {/* ✨ 2. 아래 입력창들은 w-full을 유지하여 첫 번째 줄과 길이가 일치하게 됩니다. */}
      <input
        type="text"
        value={address}
        readOnly
        placeholder="도로명/지번 주소"
        className="font-WooridaumL h-12 w-full rounded-[14px] border border-[#E5E7ED] bg-white px-4 text-[15px] text-[#0F172A] placeholder:text-[#9AA2AE] focus:ring-2 focus:ring-[#005EF9]/60 focus:outline-none"
      />

      {/* ✨ 3. 주소가 있을 때만 상세주소 입력창을 보여줍니다. */}
      {address && (
        <input
          value={detail}
          onChange={handleDetailChange}
          placeholder="상세 주소"
          className="font-WooridaumL h-12 w-full rounded-[14px] border border-[#E5E7ED] bg-white px-4 text-[15px] text-[#0F172A] placeholder:text-[#9AA2AE] focus:ring-2 focus:ring-[#005EF9]/60 focus:outline-none"
        />
      )}
    </div>
  );
}
