// src/pages/MyProfile.tsx
import { withdrawMember } from "@/entities/profile/api/withdrawMemeber";
import { clearAccessToken, clearUserSnapshot } from "@/shared";
import DateField from "@/widgets/profile/BirthDate";
import SectionCard from "@/widgets/profile/CardSection";
import CommonInput from "@/widgets/profile/CommonInput";
import FieldRow from "@/widgets/profile/FieldRow";
import PageContainer from "@/widgets/profile/PageContainer";
import { updateMyPassword, useMyProfile, useUpdateMyProfile } from "@entities/profile";
import type { AxiosError } from "axios";
import { type ChangeEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/* ✅ 모달 훅/컴포넌트 */
import { useModal } from "@hooks/ui/useModal";
import { CommonModal } from "@widgets/common";

/* ---------- utils ---------- */
const toDate = (v: string | null | undefined): Date | null => {
  if (!v) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const [y, m, d] = v.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  const m = v.match(/^(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일$/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  const dt = new Date(v);
  return isNaN(dt.getTime()) ? null : dt;
};
const toISO = (date: Date | null): string =>
  !date
    ? ""
    : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
        date.getDate(),
      ).padStart(2, "0")}`;
const fmtKOR = (v: string | null | undefined): string => {
  if (!v) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const [y, m, d] = v.split("-");
    return `${y}년 ${m}월 ${d}일`;
  }
  return v;
};
/* ── local view types (동일) ─────────────────── */
type User = { name: string; phone: string; dob: string; userid: string; pw: string };
type ProfileDraft = { phone: string; dob: string };
type InfoDraft = { current: string; next: string; confirm: string };

/* ── server → view mapper (동일) ─────────────── */
function mapProfileToUser(p: {
  memberName: string;
  memberPhoneNumber: string;
  memberBirthDate: string;
  memberId: string;
}): User {
  return {
    name: p.memberName,
    phone: p.memberPhoneNumber,
    dob: p.memberBirthDate,
    userid: p.memberId,
    pw: "********",
  };
}

export default function MyProfile() {
  const navigate = useNavigate();
  const { data: profile, isLoading, isError } = useMyProfile();
  const { mutateAsync: updateProfile } = useUpdateMyProfile();

  /* ✅ 모달 훅 */
  type ModalType = "profileUpdated" | "withdrawConfirm" | "withdrawComplete" | "withdrawFailed";
  const { isOpen, modalType, openModal, closeModal } = useModal<ModalType>();

  const [user, setUser] = useState<User>({
    name: "",
    phone: "",
    dob: "",
    userid: "",
    pw: "********",
  });
  const [editProfile, setEditProfile] = useState(false);
  const [editInfo, setEditInfo] = useState(false);
  const [profileDraft, setProfileDraft] = useState<ProfileDraft>({ phone: "", dob: "" });
  const [infoDraft, setInfoDraft] = useState<InfoDraft>({ current: "", next: "", confirm: "" });

  /* 서버 데이터 주입 */
  useEffect(() => {
    if (!profile) return;
    const u = mapProfileToUser(profile);
    setUser(u);
    setProfileDraft({ phone: u.phone, dob: toISO(toDate(u.dob)) });
  }, [profile]);

  /* 비번 버튼 활성화 */
  const isCurrentOk = infoDraft.current.length > 0;
  const isNewMatch = infoDraft.next.length > 0 && infoDraft.next === infoDraft.confirm;
  const canSubmit = isCurrentOk && isNewMatch;

  /* ── handlers ───────────────────────────── */
  const handleProfileSave = async () => {
    try {
      await updateProfile({
        memberPhoneNumber: profileDraft.phone,
        memberBirthDate: profileDraft.dob,
      });
      setUser((prev) => ({ ...prev, phone: profileDraft.phone, dob: profileDraft.dob }));
      setEditProfile(false);
      openModal("profileUpdated"); // ✅ 모달로 안내
    } catch {
      openModal("withdrawFailed"); // 재사용(실패 모달)
    }
  };

  const handleInfoSave = async () => {
    if (!canSubmit) return;
    try {
      await updateMyPassword({
        currentPassword: infoDraft.current,
        newPassword: infoDraft.next,
        confirmPassword: infoDraft.confirm,
      });
      setEditInfo(false);
      setInfoDraft({ current: "", next: "", confirm: "" });
      setUser((prev) => ({ ...prev, pw: "********" }));
      openModal("profileUpdated"); // ✅ 모달로 안내
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      console.error("[update password] failed:", error.response?.data?.message);
      openModal("withdrawFailed");
    }
  };

  const handleWithdrawClick = () => {
    openModal("withdrawConfirm"); // ✅ 확인 모달
  };

  const handleModalConfirm = async () => {
    if (modalType === "withdrawConfirm") {
      try {
        const res = await withdrawMember();
        if (res.code === 1000) {
          // 완료 모달로 전환
          clearAccessToken();
          clearUserSnapshot();
          openModal("withdrawComplete");
        } else {
          openModal("withdrawFailed");
        }
      } catch {
        openModal("withdrawFailed");
      }
      return;
    }

    if (modalType === "withdrawComplete") {
      closeModal();
      clearAccessToken(); // ✅ AT 정리
      navigate("/login", { replace: true });
      return;
    }

    // profileUpdated, withdrawFailed 등
    closeModal();
  };

  const handleModalCancel = () => closeModal();

  const onChangePhone = (e: ChangeEvent<HTMLInputElement>) =>
    setProfileDraft((d) => ({ ...d, phone: e.target.value }));
  const onChangeCurrent = (e: ChangeEvent<HTMLInputElement>) =>
    setInfoDraft((d) => ({ ...d, current: e.target.value }));
  const onChangeNext = (e: ChangeEvent<HTMLInputElement>) =>
    setInfoDraft((d) => ({ ...d, next: e.target.value }));
  const onChangeConfirm = (e: ChangeEvent<HTMLInputElement>) =>
    setInfoDraft((d) => ({ ...d, confirm: e.target.value }));

  const headingCls =
    "mb-6 text-left text-[24px] leading-[28px] tracking-tight font-bold text-[#121418]";

  /* ── loading / error (동일) ───────────────────── */
  if (isLoading) {
    /* ...로딩 뷰 동일... */
  }
  if (isError || !profile) {
    /* ...에러 뷰 동일... */
  }

  /* ── view ───────────────────────────── */
  return (
    <div className="font-WooridaumB flex min-h-screen justify-center bg-[#f5f6f8] antialiased">
      <main className="min-h-dvh w-full bg-gradient-to-b from-[#F7FAFF] to-[#c2d2f1] px-4 py-8 shadow">
        <PageContainer>
          {/* 내 프로필 */}
          <h2 className={headingCls}>내 프로필</h2>
          <section className="mb-8">
            <SectionCard>
              <FieldRow label="이름" htmlFor="name">
                <CommonInput id="name" value={user.name} editable={false} />
              </FieldRow>
              <FieldRow label="전화번호" htmlFor="phone">
                <CommonInput
                  id="phone"
                  value={editProfile ? profileDraft.phone : user.phone}
                  editable={editProfile}
                  onChange={onChangePhone}
                  placeholder={editProfile ? "전화번호를 입력하세요" : ""}
                />
              </FieldRow>
              <FieldRow label="생년월일" htmlFor="dob">
                {editProfile ? (
                  <DateField
                    selected={toDate(profileDraft.dob)}
                    onChange={(date) => setProfileDraft((d) => ({ ...d, dob: toISO(date) }))}
                  />
                ) : (
                  <CommonInput id="dob" value={fmtKOR(user.dob)} editable={false} />
                )}
              </FieldRow>
              <div className="flex justify-end">
                {editProfile ? (
                  <button
                    className="cursor-pointer rounded-lg bg-[#005EF9] px-4 py-2 text-sm font-semibold text-white hover:bg-[#005EF9] md:text-base"
                    onClick={handleProfileSave}
                    type="button">
                    수정 완료
                  </button>
                ) : (
                  <button
                    className="cursor-pointer rounded-lg bg-[#005EF9] px-4 py-2 text-sm font-semibold text-white hover:bg-[#005EF9] md:text-base"
                    onClick={() => setEditProfile(true)}
                    type="button">
                    프로필 수정
                  </button>
                )}
              </div>
            </SectionCard>
          </section>

          {/* 기본정보 */}
          <h2 className={headingCls}>기본정보</h2>
          <section className="mb-8">
            <SectionCard>
              <FieldRow label="아이디" htmlFor="userid">
                <CommonInput id="userid" value={user.userid} editable={false} />
              </FieldRow>

              {!editInfo ? (
                <>
                  <FieldRow label="비밀번호" htmlFor="pw">
                    <CommonInput
                      id="pw"
                      type="password"
                      value={"*".repeat(String(user.pw).length || 8)}
                      editable={false}
                    />
                  </FieldRow>
                  <div className="flex justify-end">
                    <button
                      className="cursor-pointer rounded-lg bg-[#005EF9] px-4 py-2 text-sm font-semibold text-white hover:bg-[#005EF9] md:text-base"
                      onClick={() => setEditInfo(true)}
                      type="button">
                      기본정보 변경
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <FieldRow label="현재 비밀번호" htmlFor="currentPw">
                    <CommonInput
                      id="currentPw"
                      type="password"
                      value={infoDraft.current}
                      onChange={onChangeCurrent}
                      editable
                      placeholder={infoDraft.current ? "" : "현재 비밀번호를 입력하세요"}
                    />
                  </FieldRow>
                  <FieldRow label="새 비밀번호" htmlFor="newPw">
                    <CommonInput
                      id="newPw"
                      type="password"
                      value={infoDraft.next}
                      onChange={onChangeNext}
                      editable
                      placeholder="8자 이상 권장"
                    />
                  </FieldRow>
                  <FieldRow label="비밀번호 확인" htmlFor="confirmPw">
                    <div className="w-full">
                      <CommonInput
                        id="confirmPw"
                        type="password"
                        value={infoDraft.confirm}
                        onChange={onChangeConfirm}
                        editable
                        validation={
                          infoDraft.confirm.length === 0
                            ? undefined
                            : infoDraft.next.trim() === infoDraft.confirm.trim()
                              ? "ok"
                              : "error"
                        }
                      />
                      {infoDraft.confirm.length > 0 &&
                        infoDraft.next.trim() !== infoDraft.confirm.trim() && (
                          <p className="mt-1 text-sm text-red-500">비밀번호가 일치하지 않습니다.</p>
                        )}
                    </div>
                  </FieldRow>
                  <div className="mt-1 flex justify-end">
                    <button
                      className={[
                        "cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-white md:text-base",
                        canSubmit
                          ? "bg-[#005EF9] hover:bg-[#0C2D62]"
                          : "cursor-not-allowed bg-gray-300",
                      ].join(" ")}
                      disabled={!canSubmit}
                      onClick={handleInfoSave}
                      type="button">
                      변경 완료
                    </button>
                  </div>
                </>
              )}
            </SectionCard>
          </section>

          {/* 계정 탈퇴 */}
          <div className="flex w-full justify-end">
            <button
              className="w-fit cursor-pointer rounded-lg text-sm font-semibold text-black underline"
              type="button"
              onClick={handleWithdrawClick}>
              계정 탈퇴
            </button>
          </div>
        </PageContainer>
      </main>

      {/* ✅ 공통 모달 (1개만 배치) */}
      <CommonModal
        type={modalType ?? "profileUpdated"}
        isOpen={isOpen}
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
        onSubmit={() => {}}
        modalData={{}}
      />
    </div>
  );
}
