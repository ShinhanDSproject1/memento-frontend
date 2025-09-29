// src/pages/mentos/CertificationPage.tsx
import Button from "@/widgets/common/Button";
import certificationSuccess from "@assets/images/certification/certification-success.svg";
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useMyProfile, profileQueryKeys } from "@entities/profile";
import { clearUserSnapshot } from "@/shared";

// ✅ 분리한 API 모듈 사용
import { registerCertification } from "@entities/certification/api/registerCertification";

type CertResult = {
  isValid: boolean;
  verifiedCertificationImage?: string;
  certificationName?: string;
  name?: string;
  certificationNum?: string;
  birthDate?: string;
  admissionDate?: string;
  expirationdate?: string;
  stampSimilarity?: number;
  file?: File; // (실패페이지 용도로만 사용)
};

const SS_KEY = "cert.lastResultPayload";

const CertificationPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: profile } = useMyProfile();
  const queryClient = useQueryClient();
  const location = useLocation();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 업로드 페이지에서 navigate로 넘긴 payload
  const navState = (location.state || null) as CertResult | null;

  // 새로고침/직접 접근 대비: 세션스토리지 복원
  const data: CertResult | null = useMemo(() => {
    if (navState && typeof navState === "object") return navState;
    try {
      const raw = sessionStorage.getItem(SS_KEY);
      return raw ? (JSON.parse(raw) as CertResult) : null;
    } catch {
      return null;
    }
  }, [navState]);

  // 새 payload가 있으면 저장
  useEffect(() => {
    if (navState) {
      try {
        sessionStorage.setItem(SS_KEY, JSON.stringify(navState));
      } catch {}
    }
  }, [navState]);

  // 성공 페이지가 의미있게 보이려면 데이터가 있어야 함
  useEffect(() => {
    if (!data) navigate("/mento/certification");
  }, [data, navigate]);

  useEffect(() => {
    // 에러 메시지가 이미 있다면 중복 검사 실행 X
    if (errorMsg) return;

    if (data?.certificationName && profile && profile.memberType === "MENTO") {
      const existingCerts = profile.certifications?.map((c) => c.certificationName) ?? [];
      if (existingCerts.includes(data.certificationName)) {
        setErrorMsg("이미 등록된 자격증입니다.");
      }
    }
  }, [data, profile, errorMsg]);

  const img = data?.verifiedCertificationImage;

  // 이미지 URL → File 변환 (S3 등 원격 이미지 첨부용)
  const fetchImageAsFile = async (url: string): Promise<File | undefined> => {
    try {
      const res = await fetch(url, { credentials: "omit" });
      if (!res.ok) return undefined;
      const blob = await res.blob();
      const ext =
        (blob.type && blob.type.split("/")[1]) || url.split(".").pop()?.split("?")[0] || "png";
      return new File([blob], `certification.${ext}`, { type: blob.type || "image/png" });
    } catch {
      return undefined;
    }
  };

  // 데이터 등록 로직
  const registerCertMutation = useMutation({
    mutationFn: registerCertification, // API 호출 함수
    onSuccess: () => {
      clearUserSnapshot();

      // 성공 시 실행
      queryClient.removeQueries({ queryKey: profileQueryKeys.me() });
      sessionStorage.removeItem(SS_KEY);
      navigate("/mento", { replace: true });
    },
    onError: (err: any) => {
      // 실패 시 실행
      setErrorMsg(err?.message || "자격증 등록에 실패했습니다.");
    },
  });

  const handleConfirm = async () => {
    if (errorMsg === "이미 등록된 자격증입니다.") {
      navigate("/mento", { replace: true });
      return;
    }

    if (!data || !data.certificationName || errorMsg) return;

    registerCertMutation.mutate({
      certificationName: data.certificationName,
      certificationImgUrl: data.verifiedCertificationImage ?? "",
    });
  };

  return (
    <div className="mx-auto flex min-h-[85vh] w-full max-w-3xl flex-col gap-6 px-4 py-6">
      {/* 헤더 */}
      <header>
        <h1 className="font-WooridaumB text-lg text-slate-900 sm:text-xl">
          자격증이 <span className="text-[#1161FF]">인증</span>되었습니다
        </h1>
        <p className="font-WooridaumR mt-2 text-sm text-slate-500 sm:text-sm">
          클래스 생성 시 자격증 뱃지가 나타납니다.
        </p>
      </header>

      {/* 자격증 이미지 크게 */}
      <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-semibold text-slate-700">자격증 이미지</p>
        </div>
        <div className="flex max-h-[500px] items-center justify-center bg-slate-50 p-4">
          <img
            src={img || certificationSuccess}
            alt="인증 결과"
            className="max-h-[460px] w-auto object-contain"
          />
        </div>
        {data?.certificationName && (
          <div className="border-t border-slate-100 px-4 py-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              📄 {data.certificationName}
            </span>
          </div>
        )}
      </div>

      {/* 상세 정보 박스 */}
      <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-semibold text-slate-700">인증 상세 정보</p>
        </div>

        <div className="px-4 py-4">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            <InfoItem label="이름" value={data?.name} />
            <InfoItem label="자격증명" value={data?.certificationName} />
            <InfoItem label="자격증 번호" value={data?.certificationNum} />
            <InfoItem label="생년월일" value={data?.birthDate} />
            <InfoItem label="취득일" value={data?.admissionDate} />
            <InfoItem
              label="스탬프 유사도"
              value={
                typeof data?.stampSimilarity === "number"
                  ? `${Math.round(data.stampSimilarity)}%`
                  : undefined
              }
            />
          </dl>
        </div>
      </div>

      {/* 에러 메시지 */}
      {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

      {/* CTA */}
      <footer>
        <Button
          onClick={handleConfirm}
          variant="primary"
          className="font-WooridaumB w-full rounded-2xl px-8 py-4 font-bold"
          disabled={registerCertMutation.isPending}>
                    {registerCertMutation.isPending ? "등록 중..." : "확인"}
        </Button>
      </footer>
    </div>
  );
};

export default CertificationPage;

function InfoItem({
  label,
  value,
  className = "",
}: {
  label: string;
  value?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-0.5 min-h-[20px] text-sm font-semibold text-slate-800">
        {value || <span className="text-slate-400">-</span>}
      </dd>
    </div>
  );
}
