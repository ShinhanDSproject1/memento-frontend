// src/widgets/common/CommonModal.tsx
import {
  MODAL_CONFIG,
  isFormConfig,
  type ModalDataMap,
  type ModalKey,
} from "@shared/ui/ModalConfig";
import type React from "react";
import { createPortal } from "react-dom";
import Button, { type ButtonProps } from "./Button";

type CommonModalProps<K extends ModalKey> = {
  type: K;
  isOpen: boolean;
  onCancel?: () => void; // 알럿/폼 공통 취소
  onConfirm?: () => void; // 알럿 확인/컨펌
  onSubmit?: () => void; // 폼 제출
  modalData?: ModalDataMap[K];
};

/** object & not null 안전 판별 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** 선택적 문자열 프로퍼티 안전 접근 */
function pickString<T extends string>(obj: unknown, key: T): string | undefined {
  if (!isRecord(obj)) return undefined;
  const v = obj[key];
  return typeof v === "string" ? v : undefined;
}

export default function CommonModal<K extends ModalKey>({
  type,
  isOpen,
  onCancel,
  onConfirm,
  onSubmit,
  modalData,
}: CommonModalProps<K>) {
  if (!isOpen) return null;

  const config = MODAL_CONFIG[type];
  if (!config) {
    if (import.meta.env?.DEV) {
      // eslint-disable-next-line no-console
      console.error("[CommonModal] Unknown modal type:", type, "data:", modalData);
    }
    return null;
  }

  const isLoading = type === "loading";
  const isForm = isFormConfig(config);

  // loading 전용: description 동적 표시
  const loadingDescription = isLoading ? pickString(modalData, "description") : undefined;

  // alert 전용: 동적 메시지(우선) > 정적 메시지
  let finalAlertMessage: string | React.ReactNode | undefined;
  if (!isForm && !isLoading) {
    const dynamicMessage = pickString(modalData, "message");
    const staticMessage =
      "message" in config ? (config.message as string | React.ReactNode | undefined) : undefined;
    finalAlertMessage = dynamicMessage ?? staticMessage ?? "오류가 발생했습니다.";
  }

  const modal = (
    <div
      style={{ scrollbarWidth: "none" }}
      className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/50">
      <div className="flex w-full max-w-[270px] flex-col items-center gap-4 rounded-[10px] bg-white p-4">
        {isLoading ? (
          <>
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            <p className="mt-3 text-sm text-gray-700">{loadingDescription ?? "처리 중입니다..."}</p>
          </>
        ) : isForm ? (
          <>
            {/* 제목(옵션) */}
            {(() => {
              const title = pickString(modalData, "title");
              return title ? (
                <span className="px-4 pt-2 text-center text-[16px] font-bold whitespace-pre text-[#333]">
                  {title}
                </span>
              ) : null;
            })()}

            {/* form content: 없으면 빈 객체 주입 */}
            {config.content(modalData ?? ({} as ModalDataMap[K]))}
          </>
        ) : (
          // ⚠️ ALERT: 에러 스타일(빨간 텍스트), 아이콘은 모달별 config.icon 사용
          <>
            {"icon" in config && config.icon ? (
              <div className="flex justify-center">
                <img className="w-[15vw] max-w-[60px]" src={config.icon} alt="모달 아이콘" />
              </div>
            ) : null}

            {typeof finalAlertMessage === "string" ? (
              <p className="text-center font-semibold text-black">{finalAlertMessage}</p>
            ) : finalAlertMessage ? (
              <div className="text-center text-red-600">{finalAlertMessage}</div>
            ) : null}
          </>
        )}

        {/* 버튼 영역 */}
        <div className={`flex justify-center gap-4 ${isForm ? "px-4 pb-4" : ""}`}>
          {config.buttons.map((btn, index) => {
            const { text, actionType, ...buttonRest } = btn;

            let onClickHandler: (() => void) | undefined;
            if (actionType === "submit") onClickHandler = onSubmit;
            else if (actionType === "confirm") onClickHandler = onConfirm;
            else onClickHandler = onCancel;

            const safeProps = { ...buttonRest } as Omit<ButtonProps, "children" | "onClick">;

            return (
              <Button key={index} {...safeProps} onClick={onClickHandler ?? (() => {})}>
                {text}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
