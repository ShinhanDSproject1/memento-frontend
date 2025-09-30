// src/pages/CertificationRegister.tsx
import Button from "@/widgets/common/Button";
import { FileInput, Label } from "flowbite-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

// ✅ pdf.js (모바일 호환 미리보기: 1페이지를 이미지로 렌더)
import * as pdfjsLib from "pdfjs-dist";
// Vite: 워커를 정적 자산으로 끌어와서 CORS 문제 회피
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const ACCEPT_MIME = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];
const MAX_SIZE_MB = 5;

type PreviewKind = "image" | "pdf" | null;

export default function CertificationRegister() {
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // 이미지 dataURL 또는 objectURL
  const [previewKind, setPreviewKind] = useState<PreviewKind>(null);

  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 미리보기 정리
  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const validateFile = (f: File) => {
    if (!ACCEPT_MIME.includes(f.type)) {
      throw new Error("PNG, JPG, PDF 파일만 업로드할 수 있어요.");
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      throw new Error(`파일 용량은 ${MAX_SIZE_MB}MB 이하만 가능합니다.`);
    }
  };

  // ✅ PDF → 첫 페이지 이미지로 렌더 (모바일 100% 호환용)
  const renderPdfFirstPageToImage = useCallback(async (blob: Blob): Promise<string> => {
    const url = URL.createObjectURL(blob);
    try {
      const loadingTask = pdfjsLib.getDocument({ url });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);

      // 화면 가용폭에 맞춰 렌더 (너무 크지 않게)
      const containerWidth = Math.min(window.innerWidth * 0.92, 640); // 여백 살짝
      const viewport = page.getViewport({ scale: 1 });
      const scale = containerWidth / viewport.width;
      const scaled = page.getViewport({ scale: Math.max(0.5, Math.min(2.0, scale)) });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { alpha: false })!;
      canvas.width = Math.floor(scaled.width);
      canvas.height = Math.floor(scaled.height);

      const renderTask = page.render({ canvasContext: ctx, viewport: scaled });
      await renderTask.promise;

      // dataURL로 변환 (이미지 미리보기와 동일 경로)
      return canvas.toDataURL("image/png");
    } finally {
      URL.revokeObjectURL(url);
    }
  }, []);

  const makePreview = useCallback(
    async (f: File) => {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);

      if (f.type === "application/pdf") {
        try {
          const dataUrl = await renderPdfFirstPageToImage(f);
          setPreviewUrl(dataUrl);
          setPreviewKind("image"); // 이미지로 통일
          return;
        } catch {
          // pdf.js 실패 시 object 태그로 폴백
          const url = URL.createObjectURL(f);
          setPreviewUrl(url);
          setPreviewKind("pdf");
          return;
        }
      }

      // 이미지인 경우
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
      setPreviewKind("image");
    },
    [previewUrl, renderPdfFirstPageToImage],
  );

  const handleFilePicked = (f: File | null) => {
    if (!f) return;
    (async () => {
      try {
        validateFile(f);
        setFile(f);
        setErrorMsg(null);
        await makePreview(f);
      } catch (err: any) {
        setFile(null);
        if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setPreviewKind(null);
        setErrorMsg(err?.message || "잘못된 파일입니다.");
      }
    })();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    handleFilePicked(f);
  };

  const onDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0] ?? null;
    handleFilePicked(f);
  }, []);

  const onDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(true);
  };
  const onDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(false);
  };

  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const handleUpload = async () => {
    if (!file) {
      setErrorMsg("파일을 업로드해주세요. (PNG, JPG, PDF)");
      return;
    }

    setErrorMsg(null);
    setLoading(true);
    setScanning(true);

    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 15_000);

    try {
      const form = new FormData();
      form.append("file", file);

      const req = fetch("/py/certs/extract", {
        method: "POST",
        body: form,
        signal: ctl.signal,
      }).then(async (res) => {
        let payload: any = {};
        try {
          payload = await res.json();
        } catch {}
        if (!res.ok) {
          const msg =
            payload?.message ||
            (res.status === 404
              ? "서버 주소를 확인해주세요. (404)"
              : res.status === 500
                ? "서버 내부 오류입니다. (500)"
                : `업로드 실패 (${res.status})`);
          throw new Error(msg);
        }
        return payload;
      });

      const [payload] = await Promise.all([req, delay(1500)]); // UX용 살짝 딜레이

      if (!payload?.name) {
        navigate("/mento/certification/fail", { state: { ...payload, file } });
      } else {
        navigate("/mento/certification/inprogress", { state: payload });
      }
    } catch (err: any) {
      if (err?.name === "AbortError") {
        setErrorMsg("요청 시간이 초과되었습니다. 서버가 실행 중인지 확인해주세요.");
      } else if (err?.message?.includes("Failed to fetch")) {
        setErrorMsg(
          "서버에 연결할 수 없습니다. 같은 네트워크인지, 프록시/방화벽 설정을 확인하세요.",
        );
      } else {
        setErrorMsg(err?.message || "업로드 실패");
      }
      setScanning(false);
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewKind(null);
    setErrorMsg(null);
  };

  // 애니메이션 사용 여부 (접근성)
  const reducedMotion = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches,
    [],
  );

  return (
    <div className="flex min-h-[calc(100dvh-150px)] w-full flex-col gap-6 p-4 sm:min-h-[calc(100dvh-140px)]">
      {/* ✅ 모바일 친화 애니메이션 키프레임 (backdrop-filter 안씀) */}
      <style>
        {`
        @keyframes scanMove {
          0% { transform: translateY(-100%); opacity: 0.0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(100%); opacity: 0.0; }
        }
        @keyframes glossy {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(50%); }
        }
        `}
      </style>

      {/* 제목 */}
      <div className="flex w-full">
        <p className="font-WooridaumB text-[21px] text-black">
          보유중인 <span className="font-WooridaumB text-50px text-[#005EF9]">자격증</span>을 <br />
          업로드해주세요!
        </p>
      </div>

      {/* 업로드 + 미리보기 */}
      <div className="flex w-full flex-col items-center justify-center gap-3">
        <Label
          htmlFor="dropzone-file"
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={[
            "relative",
            "flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-10",
            "min-h-[340px] sm:min-h-[420px]",
            dragOver ? "border-blue-400 bg-blue-50" : "border-gray-300 bg-gray-50",
            "hover:bg-gray-100",
            "transition-colors",
          ].join(" ")}>
          <div className="flex w-full flex-col items-center justify-center px-3 pt-8 text-center">
            {!previewUrl ? (
              <>
                <svg
                  className="mb-5 h-12 w-12 text-gray-500"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 20 16">
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5
                       5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5
                       5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8
                       8m2-2 2 2"
                  />
                </svg>
                <p className="mb-2 text-base text-gray-800">
                  <span className="font-semibold">클릭</span> 또는{" "}
                  <span className="font-semibold">파일을 끌어다 놓기</span>
                </p>
                <p className="text-sm text-gray-500">PNG, JPG, PDF (MAX. {MAX_SIZE_MB}MB)</p>
              </>
            ) : (
              <div className="relative mx-auto w-full">
                {previewKind === "image" ? (
                  <img
                    src={previewUrl}
                    alt="미리보기 이미지"
                    className="mx-auto max-h-[60vh] w-auto object-contain"
                  />
                ) : (
                  <object
                    data={previewUrl}
                    type="application/pdf"
                    className="mx-auto h-[60vh] w-full">
                    <p className="text-xs text-gray-500">
                      브라우저가 PDF 미리보기를 지원하지 않습니다. 파일을 다운로드해 확인해주세요.
                    </p>
                  </object>
                )}

                {/* 🔍 스캔 애니메이션 (모든 모바일 호환) */}
                {scanning && !reducedMotion && (
                  <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-md">
                    {/* 어두운 마스크 */}
                    <div className="absolute inset-0 bg-black/35" />
                    {/* 스캐너 바 */}
                    <div
                      className="absolute right-0 left-0 h-[35%] bg-gradient-to-b from-transparent via-blue-500/90 to-transparent will-change-transform"
                      style={{ animation: "scanMove 2.2s linear infinite" }}
                    />
                    {/* 글로시 라인 */}
                    <div
                      className="absolute top-0 left-1/2 h-full w-[140%] -translate-x-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent will-change-transform"
                      style={{ animation: "glossy 1.8s linear infinite" }}
                    />
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-1 text-[9px] font-bold whitespace-nowrap text-white shadow-lg md:text-[11px]">
                      🔍 AI가 자격증을 스캔하는중…
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <FileInput
            id="dropzone-file"
            className="hidden"
            onChange={handleFileChange}
            accept={ACCEPT_MIME.join(",")}
          />
        </Label>

        {/* 파일 없으면 안내 (시각 강조 + 커서 표시) */}
        {!file && (
          <p className="mt-2 animate-pulse text-sm font-semibold text-red-600">
            파일을 업로드해주세요. (PNG, JPG, PDF)
          </p>
        )}

        {file && !scanning && (
          <button
            type="button"
            onClick={clearFile}
            className="rounded-md border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50">
            선택 해제
          </button>
        )}
      </div>

      {/* 에러 메시지 */}
      {errorMsg && (
        <p className="text-sm font-medium text-red-600" role="alert">
          {errorMsg}
        </p>
      )}

      <div className="mt-auto flex flex-col items-center justify-center gap-2">
        <Button
          onClick={handleUpload}
          variant="primary"
          className={`font-WooridaumB w-full px-8 py-4 font-bold ${!file ? "cursor-not-allowed bg-gray-300 text-gray-500" : ""}`}
          size="xl"
          disabled={loading || scanning || !file}>
          {scanning ? "스캔 중..." : loading ? "업로드 중..." : "추가하기"}
        </Button>
      </div>
    </div>
  );
}
