// src/pages/mentor/CreateMentos.tsx
import MentosForm, { type MentosFormValues } from "@/pages/mentor/MentosForm";
import { useCreateMentos } from "@entities/mentos";
import { useModal } from "@hooks/ui/useModal";
import { CommonModal } from "@widgets/common";
import type { AxiosError } from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CreateMentos() {
  const navigate = useNavigate();
  const { isOpen, openModal, closeModal } = useModal(); // ✅ openModal 추가
  const { mutateAsync: createMentos, isPending } = useCreateMentos();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCreate = async (values: MentosFormValues) => {
    setErrorMsg(null);
    try {
      await createMentos({
        mentosTitle: values.title,
        mentosContent: values.content,
        categorySeq: Number(values.category),
        price: Number(values.price),
        mentosImage: values.imageFile ?? undefined,
      });

      // ✅ 성공 시: 확인 모달 오픈 (이 화면에 머무름)
      openModal("createMentos");
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      const msg = error.response?.data?.message ?? "멘토스 생성에 실패했습니다. 다시 시도해주세요.";
      setErrorMsg(msg);
      // 폼 값은 MentosForm 내부 상태로 유지됨 (초기화 안 함)
    }
  };

  // ✅ 모달 확인/취소 시 관리 페이지로 이동
  const handleConfirmClose = () => {
    closeModal();
    navigate("/mento/my-list");
  };

  return (
    <div className="flex min-h-full w-full justify-center overflow-x-hidden bg-[#F7FAFF] font-sans antialiased">
      <section className="w-full overflow-x-hidden bg-[#F7FAFF] px-4 py-5 shadow">
        <h1 className="font-WooridaumB mt-6 mb-15 pl-2 text-[20px] font-bold">멘토링 생성하기</h1>

        {/* ✅ 성공 모달: 확인 시 관리 페이지 이동 */}
        <CommonModal
          type="createMentos"
          isOpen={isOpen}
          onConfirm={handleConfirmClose}
          onCancel={handleConfirmClose}
          onSubmit={() => {}}
          modalData={{}}
        />

        {/* 로딩 모달 */}
        {isPending && (
          <CommonModal
            type="loading"
            isOpen={true}
            onConfirm={() => {}}
            onCancel={() => {}}
            onSubmit={() => {}}
            modalData={{
              title: "멘토스를 생성 중입니다...",
              description: "잠시만 기다려주세요 ⏳",
            }}
          />
        )}

        {errorMsg && (
          <div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{errorMsg}</div>
        )}

        <MentosForm mode="create" initialValues={{}} onSubmit={handleCreate} />
      </section>
    </div>
  );
}
