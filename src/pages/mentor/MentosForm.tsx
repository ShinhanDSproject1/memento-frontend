// src/pages/mentor/MentosForm.tsx
import Button from "@/widgets/common/Button";
import { SimpleEditor } from "@/widgets/common/tiptap-templates/simple/simple-editor";
import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useRef, useState } from "react";

/* 분류 옵션 */
const CATEGORY_OPTIONS = [
  { label: "소비 패턴", value: "1" },
  { label: "생활\n노하우", value: "2" }, // Changed
  { label: "저축 방식", value: "3" },
  { label: "자산 증식", value: "4" },
];

/* 외부에서 import */
export interface MentosFormValues {
  title: string;
  content: string;
  price: string;
  location: string;
  category: string;
  imageFile?: File | null;
}

export interface MentosFormProps {
  mode?: "create" | "edit";
  /** 상세조회에서 온 파일명을 보여주고 싶다면 fileName 넣어주기 */
  initialValues?: Partial<MentosFormValues> & { fileName?: string };
  onSubmit?: (values: MentosFormValues) => Promise<void> | void;
}

export default function MentosForm({
  mode = "create",
  initialValues = {},
  onSubmit,
}: MentosFormProps) {
  const [fileName, setFileName] = useState<string>("");
  const [form, setForm] = useState<MentosFormValues>({
    title: initialValues.title ?? "",
    content: initialValues.content ?? "",
    price: initialValues.price ?? "",
    location: initialValues.location ?? "",
    category: initialValues.category ?? "",
    imageFile: initialValues.imageFile ?? null,
  });

  // ✅ 유효성 모달
  const [validationMsg, setValidationMsg] = useState<string | null>(null);

  // 최초 1회만 initialValues 반영
  const didInitRef = useRef(false);
  useEffect(() => {
    if (didInitRef.current) return;

    const hasAny =
      !!initialValues.title ||
      !!initialValues.content ||
      !!initialValues.price ||
      !!initialValues.location ||
      !!initialValues.category ||
      !!initialValues.imageFile ||
      !!initialValues.fileName;

    if (hasAny) {
      setForm({
        title: initialValues.title ?? "",
        content: initialValues.content ?? "",
        price: initialValues.price ?? "",
        location: initialValues.location ?? "",
        category: initialValues.category ?? "",
        imageFile: initialValues.imageFile ?? null,
      });
      // ✅ 상세조회로부터 받은 표시용 파일명 우선 사용
      const nameFromDetail = initialValues.fileName || initialValues.imageFile?.name || "";
      setFileName(nameFromDetail);
    }
    didInitRef.current = true;
  }, [initialValues]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setForm((prev) => ({ ...prev, imageFile: file }));
    setFileName(file?.name ?? "");
  };

  const formatPrice = (value: string) => {
    const numeric = value.replace(/[^0-9]/g, "");
    if (!numeric) return "";
    return Number(numeric).toLocaleString();
  };
  const handlePriceChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const numeric = raw.replace(/[^0-9]/g, "");
    setForm((prev) => ({ ...prev, price: numeric }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!onSubmit) return;

    // ✅ alert 대신 모달
    if (!form.title.trim()) return setValidationMsg("제목을 입력해 주세요.");
    if (!form.content.trim()) return setValidationMsg("내용을 입력해 주세요.");
    if (!form.category?.trim()) return setValidationMsg("분류를 선택해 주세요.");
    if (!form.price.trim()) return setValidationMsg("가격을 입력해 주세요.");

    await onSubmit(form);
  };

  return (
    <>
      <form className="space-y-3" onSubmit={handleSubmit}>
        {/* 제목 */}
        <div className="grid grid-cols-[56px_1fr] items-start gap-3">
          <label htmlFor="title" className="pl-2 leading-7 font-bold text-[#333]">
            제목
          </label>
          <input
            id="title"
            name="title"
            value={form.title}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-[#2F6CFF] focus:shadow-[0_0_0_3px_rgba(47,108,255,0.15)]"
            required
          />
        </div>

        {/* 분류 (버튼 그룹) */}
        <div className="grid grid-cols-[56px_1fr] items-center gap-3">
          <label className="pl-2 font-bold text-[#333]">분류</label>
          <div className="flex w-full justify-between gap-2">
            {CATEGORY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, category: opt.value }))}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold whitespace-pre-line transition-colors ${
                  // Changed
                  form.category === opt.value
                    ? "bg-[#1161FF] text-white"
                    : "bg-sky-100 text-black hover:bg-gray-200"
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 내용 */}
        <div className="grid grid-cols-[56px_1fr] items-start gap-3">
          <label className="pl-2 leading-7 font-bold text-[#333]">내용</label>
        </div>
        <div className="h-80 w-full overflow-hidden rounded-lg border border-[#e5e7ed] bg-white">
          <SimpleEditor
            value={form.content}
            onChange={(html) => setForm((prev) => ({ ...prev, content: html }))}
          />
        </div>

        {/* 사진 */}
        <div className="grid grid-cols-[56px_minmax(0,1fr)_112px] items-center gap-3">
          <span className="pl-2 leading-7 font-bold text-[#333]">사진</span>

          <input
            id="mentos-image"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="w-full min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-ellipsis whitespace-nowrap text-slate-500">
            <span className={`block truncate ${fileName ? "text-slate-700" : "text-slate-400"}`}>
              {fileName || "이미지 업로드"}
            </span>
          </div>

          <label
            htmlFor="mentos-image"
            className="w-[112px] shrink-0 cursor-pointer justify-self-end rounded-xl bg-[#1161FF] px-4 py-3 text-center text-sm font-extrabold text-white transition-colors hover:bg-[#0C2D62]">
            파일 선택
          </label>
        </div>

        {/* 가격 */}
        <div className="grid grid-cols-[56px_1fr] items-start gap-3">
          <label htmlFor="price" className="pl-2 leading-7 font-bold text-[#333]">
            가격
          </label>
          <input
            id="price"
            inputMode="numeric"
            name="price"
            value={formatPrice(form.price)}
            onChange={handlePriceChange}
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-[#2F6CFF] focus:shadow-[0_0_0_3px_rgba(47,108,255,0.15)]"
            placeholder="가격을 입력해주세요."
            required
          />
        </div>

        {/* 제출 */}
        <div className="mt-6 flex justify-center">
          <Button type="submit" variant="primary" size="lg" className="w-full">
            {mode === "edit" ? "수정완료" : "생성하기"}
          </Button>
        </div>
      </form>

      {/* ✅ 로컬 유효성 모달 */}
      {validationMsg && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[1000] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setValidationMsg(null)} />
          <div className="relative z-10 w-[86%] max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-3 text-base font-semibold text-[#121418]">입력 확인이 필요해요</div>
            <p className="mb-5 text-sm text-[#606264]">{validationMsg}</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg bg-[#005EF9] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0C2D62]"
                onClick={() => setValidationMsg(null)}>
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
