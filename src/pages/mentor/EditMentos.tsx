// src/pages/EditMentosPage.tsx
import MentosForm, { type MentosFormValues } from "@/pages/mentor/MentosForm";
import type { MentosDetailResult } from "@entities/mentos";
import { getUpdateMentos, updateMentoMentos, type UpdateMentosRequest } from "@entities/mentos";
import { useModal } from "@hooks/ui/useModal";
import { CommonModal } from "@widgets/common";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function EditMentosPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isOpen, openModal, closeModal } = useModal();

  type InitialValues = Partial<MentosFormValues> & { fileName?: string };

  const [initialValues, setInitialValues] = useState<InitialValues | null>(null);
  const [fetching, setFetching] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  /** 서버 → 폼 매핑 */
  const toFormValues = (src: MentosDetailResult): InitialValues => ({
    title: src.mentosTitle ?? "",
    content: src.mentosContent ?? "",
    price: src.price != null ? String(src.price) : "",
    category: src.categorySeq ? String(src.categorySeq) : "",
    imageFile: null, // 서버에선 파일 객체 제공 안 함 → 새 업로드 시만 값 세팅
    fileName: src.mentosImage ? src.mentosImage.split("/").pop() || "" : "",
    location: "", // 현재 응답 스펙에는 없음
  });

  /** 상세 조회 */
  useEffect(() => {
    if (!id) return;
    (async () => {
      setFetching(true);
      setErrorMsg(null);
      try {
        const detail = await getUpdateMentos(Number(id));
        setInitialValues(toFormValues(detail));
      } catch {
        setErrorMsg("멘토스 정보를 불러오지 못했습니다.");
        setInitialValues(null);
      } finally {
        setFetching(false);
      }
    })();
  }, [id]);

  /** 수정 요청 */
  const handleUpdate = async (values: MentosFormValues) => {
    if (!id) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const payload: UpdateMentosRequest = {
        requestDto: {
          mentosTitle: values.title,
          mentosContent: values.content,
          categorySeq: Number(values.category || 0),
          price: Number(values.price),
        },
        imageFile: values.imageFile ?? null,
      };
      const res = await updateMentoMentos(Number(id), payload);
      if (res.code === 1000) {
        openModal("updateMentos");
      } else {
        setErrorMsg(res.message || "수정에 실패했습니다.");
      }
    } catch {
      setErrorMsg("수정 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmClose = () => {
    closeModal();
    window.location.replace("/mento/my-list");
  };

  if (fetching) return <div className="p-6">불러오는 중…</div>;
  if (!initialValues) return <div className="p-6 text-red-600">{errorMsg ?? "데이터 없음"}</div>;

  return (
    <div className="flex h-[calc(100vh-50px)] w-full justify-center bg-[#F7FAFF] sm:h-[calc(100vh-140px)]">
      <section className="w-full bg-[#F7FAFF] px-4 py-5 shadow">
        <h1 className="font-WooridaumB mt-6 mb-9 pl-2 text-[20px] font-bold">멘토링 수정하기</h1>

        {/* 성공 모달 */}
        <CommonModal
          type="updateMentos"
          isOpen={isOpen}
          onConfirm={handleConfirmClose}
          onCancel={handleConfirmClose}
          onSubmit={() => {}}
          modalData={{}}
        />

        {/* 수정 로딩 모달 */}
        {isSubmitting && (
          <CommonModal
            type="loading"
            isOpen
            onConfirm={() => {}}
            onCancel={() => {}}
            onSubmit={() => {}}
            modalData={{
              title: "멘토스를 수정 중입니다...",
              description: "잠시만 기다려주세요 ⏳",
            }}
          />
        )}

        {errorMsg && (
          <div className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{errorMsg}</div>
        )}

        <MentosForm mode="edit" initialValues={initialValues} onSubmit={handleUpdate} />
      </section>
    </div>
  );
}
