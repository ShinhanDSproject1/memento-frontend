// src/pages/EditMentosPage.tsx
import { getMentos, updateMentos } from "@api/mentos";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import MentosForm from "./MentosForm";

type Mentos = {
  title: string;
  content: string;
  price: string;
  location: string;
  fileName?: string;
};

export default function EditMentosPage() {
  const { id } = useParams<{ id: string }>();
  // 예시 타입
  type MentosItem = {
    title?: string;
    content?: string;
    price?: string | number;
    location?: string;
    fileName?: string;
  };
  type MentosFormValues = {
    title: string;
    content: string;
    price: string; // 폼은 문자열로 관리
    location: string;
    fileName?: string;
  };

  // 변환 함수
  function toFormValues(src: MentosItem): MentosFormValues {
    return {
      title: src.title ?? "",
      content: src.content ?? "",
      // number가 올 수 있으니 문자열로 정규화
      price: src.price != null ? String(src.price) : "",
      location: src.location ?? "",
      fileName: src.fileName ?? "",
    };
  }

  // 사용처
  const [data, setData] = useState<MentosFormValues | null | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    getMentos(Number(id))
      .then((res) => {
        if (res === null) {
          setData(null);
          return;
        }
        setData(toFormValues(res)); // ✅ 여기서 타입 맞춰 줌
      })
      .catch(() => setData(null));
  }, [id]);

  const handleUpdate = async (values: MentosFormValues) => {
    if (!id) return;
    console.log("PUT /api/mentos/" + id, values); // 추후 api 연동
    await updateMentos(id, values);
  };

  if (data === undefined) return <div className="p-6">불러오는 중…</div>;

  return (
    <div className="flex min-h-full w-full justify-center overflow-x-hidden bg-[#F7FAFF] font-sans antialiased">
      <section className="w-full overflow-x-hidden bg-[#F7FAFF] px-4 py-5 shadow">
        <h1 className="font-WooridaumB mt-6 mb-10 pl-2 text-[20px] font-bold">멘토링 수정하기</h1>
        <MentosForm mode="edit" initialValues={data ?? {}} onSubmit={handleUpdate} />
      </section>
    </div>
  );
}
