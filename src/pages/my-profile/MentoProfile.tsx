// src/pages/Profile/MentorProfile.tsx
import DateField from "@/widgets/profile/BirthDate";
import SectionCard from "@/widgets/profile/CardSection";
import CommonInput from "@/widgets/profile/CommonInput";
import FieldRow from "@/widgets/profile/FieldRow";
import PageContainer from "@/widgets/profile/PageContainer";
import { updateMyPassword, useMyProfile, useUpdateMyProfile } from "@entities/profile";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/* ✅ 추가: 공통 모달 훅/컴포넌트 + 탈퇴 API & 토큰 클리어 */
import { withdrawMember } from "@/entities/profile/api/withdrawMemeber";
import { clearAccessToken, clearUserSnapshot } from "@/shared";
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

/* ---------- local view types ---------- */
type User = {
  name: string;
  phone: string;
  dob: string; // ISO
  userid: string;
  pw: string; // 표시용
  intro: string;
  certs: string[];
};
type ProfileDraft = { phone: string; dob: string };
type InfoDraft = { current: string; next: string; confirm: string };

/* ---------- server → view mapper ---------- */
function mapProfileToUser(p: {
  memberName: string;
  memberPhoneNumber: string;
  memberBirthDate: string;
  memberId: string;
  certifications?: { certificationName: string }[];
}): User {
  return {
    name: p.memberName,
    phone: p.memberPhoneNumber,
    dob: p.memberBirthDate,
    userid: p.memberId,
    pw: "********",
    intro: "",
    certs: (p.certifications ?? []).map((c) => c.certificationName),
  };
}

export default function MentorProfile() {
  const navigate = useNavigate();

  // 서버에서 프로필 조회
  const { data: profile, isLoading, isError, refetch } = useMyProfile();
  const { mutateAsync: updateProfile } = useUpdateMyProfile();

  // ✅ 공통 모달
  type ModalType = "profileUpdated" | "withdrawConfirm" | "withdrawComplete" | "withdrawFailed";
  const { isOpen, modalType, openModal, closeModal } = useModal<ModalType>();

  // 로컬 상태
  const [user, setUser] = useState<User>({
    name: "",
    phone: "",
    dob: "",
    userid: "",
    pw: "********",
    intro: "",
    certs: [],
  });
  const [editProfile, setEditProfile] = useState(false);
  const [editInfo, setEditInfo] = useState(false);

  const [profileDraft, setProfileDraft] = useState<ProfileDraft>({ phone: "", dob: "" });
  const [infoDraft, setInfoDraft] = useState<InfoDraft>({ current: "", next: "", confirm: "" });

  // 서버 데이터 → 로컬 주입
  useEffect(() => {
    if (!profile) return;
    const u = mapProfileToUser(profile);
    setUser(u);
    setProfileDraft({ phone: u.phone, dob: toISO(toDate(u.dob)) });
  }, [profile]);

  // 비번 변경 버튼 활성화: 현재 비번 "입력됨" + 새 비번 일치
  const isCurrentOk = infoDraft.current.length > 0;
  const isNewMatch = infoDraft.next.length > 0 && infoDraft.next === infoDraft.confirm;
  const canSubmit = isCurrentOk && isNewMatch;

  /* ---------- handlers ---------- */
  const handleProfileSave = async () => {
    try {
      await updateProfile({
        memberPhoneNumber: profileDraft.phone,
        memberBirthDate: profileDraft.dob,
      });
      setUser((prev) => ({ ...prev, phone: profileDraft.phone, dob: profileDraft.dob }));
      setEditProfile(false);
      openModal("profileUpdated"); // ✅ 성공 모달
    } catch {
      openModal("withdrawFailed"); // 실패 모달 재사용
    }
  };

  const handleInfoCancel = () => {
    setEditInfo(false);
    setInfoDraft({ current: "", next: "", confirm: "" });
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
      openModal("profileUpdated"); // ✅ 성공 모달
    } catch {
      openModal("withdrawFailed");
    }
  };

  // 소개글 수정 (멘토 전용)
  const handleEditIntro = () => navigate("/mento/introduce2");

  // ✅ 탈퇴 버튼 → 확인 모달
  const handleWithdrawClick = () => openModal("withdrawConfirm");

  // ✅ 모달 confirm/cancel
  const handleModalConfirm = async () => {
    if (modalType === "withdrawConfirm") {
      try {
        const res = await withdrawMember();
        if (res.code === 1000) {
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
      clearAccessToken();
      clearUserSnapshot();
      navigate("/login", { replace: true });
      return;
    }
    // profileUpdated, withdrawFailed
    closeModal();
  };
  const handleModalCancel = () => closeModal();

  const headingCls =
    "mb-6 text-left text-[24px] leading-[28px] tracking-tight font-bold text-[#121418]";

  /* ---------- loading / error ---------- */
  if (isLoading) {
    return (
      <div className="font-WooridaumB flex min-h-dvh justify-center bg-[#F7FAFF] antialiased">
        <main className="min-h-dvh w-full bg-transparent px-4 py-8">
          <PageContainer>
            <div className="py-10 text-center text-sm text-gray-600">프로필을 불러오는 중…</div>
          </PageContainer>
        </main>
      </div>
    );
  }
  if (isError || !profile) {
    return (
      <div className="font-WooridaumB flex min-h-dvh justify-center bg-[#F7FAFF] antialiased">
        <main className="min-h-dvh w-full bg-transparent px-4 py-8">
          <PageContainer>
            <div className="py-10 text-center text-sm text-red-500">
              프로필을 불러오지 못했습니다.
              <button
                onClick={() => refetch()}
                className="ml-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-700"
                type="button">
                다시 시도
              </button>
            </div>
          </PageContainer>
        </main>
      </div>
    );
  }

  /* ---------- view ---------- */
  return (
    <div className="font-WooridaumB flex min-h-dvh justify-center bg-[#F7FAFF] antialiased">
      {/* 투명 메인 + 카드 스타일 섹션 카드로 통일 */}
      <main className="min-h-dvh w-full bg-transparent px-4 py-8">
        <PageContainer>
          {/* 내 프로필 */}
          <h2 className={headingCls}>내 프로필</h2>
          <section className="mb-8">
            <SectionCard className="border-emerald-100">
              <FieldRow label="이름" htmlFor="name">
                <CommonInput id="name" value={user.name} editable={false} />
              </FieldRow>

              <FieldRow label="전화번호" htmlFor="phone">
                <CommonInput
                  id="phone"
                  value={editProfile ? profileDraft.phone : user.phone}
                  editable={editProfile}
                  onChange={(e) => setProfileDraft((d) => ({ ...d, phone: e.target.value }))}
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
            <SectionCard className="border-emerald-100">
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
                      onChange={(e) => setInfoDraft((d) => ({ ...d, current: e.target.value }))}
                      editable
                      placeholder={
                        infoDraft.current.length === 0 ? "현재 비밀번호를 입력하세요" : ""
                      }
                    />
                  </FieldRow>
                  <FieldRow label="새 비밀번호" htmlFor="newPw">
                    <CommonInput
                      id="newPw"
                      type="password"
                      value={infoDraft.next}
                      onChange={(e) => setInfoDraft((d) => ({ ...d, next: e.target.value }))}
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
                        onChange={(e) => setInfoDraft((d) => ({ ...d, confirm: e.target.value }))}
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
                  <div className="mt-1 flex justify-end gap-x-2">
                    <button
                      type="button"
                      className="cursor-pointer rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300 md:text-base"
                      onClick={handleInfoCancel}>
                      취소
                    </button>
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

          {/* 보유 자격증 */}
          <h2 className={headingCls}>보유 자격증</h2>
          <section className="mb-8">
            <div className="rounded-xl border border-gray-200 bg-white/90 px-5 py-4 text-sm leading-6 text-[#444] shadow-sm">
              {user.certs.length > 0 ? user.certs.join("  /  ") : "등록된 자격증이 없습니다."}
            </div>

            <div className="mt-4 flex items-start justify-between">
              <div className="flex flex-col gap-2">
                <button
                  className="cursor-pointer rounded-lg bg-[#005EF9] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#005EF9]"
                  onClick={handleEditIntro}
                  type="button">
                  소개글 수정
                </button>
                {/* 자격증 추가 버튼이 필요하면 주석 해제
                <button
                  className="cursor-pointer rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                  onClick={() => navigate("/mento/certification")}
                  type="button">
                  자격증 추가
                </button> */}
              </div>

              {/* ✅ 계정 탈퇴 버튼 (텍스트 링크 유지) */}
              <button
                className="w-fit cursor-pointer rounded-lg pt-10 text-sm font-semibold text-black/80 underline underline-offset-2 hover:text-black"
                type="button"
                onClick={handleWithdrawClick}>
                계정 탈퇴
              </button>
            </div>
          </section>
        </PageContainer>
      </main>

      {/* ✅ 공통 모달 한 번만 배치 */}
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
