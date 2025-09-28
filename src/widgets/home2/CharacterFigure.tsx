// src/widgets/home2/CharacterFigure.tsx
import characterGomBlue from "@shared/assets/images/character/character-gom-blue.png";
import characterGomGreen from "@shared/assets/images/character/character-gom-green.png";

export function CharacterFigure({ glowed, role }: { glowed: boolean; role?: "mentee" | "mentor" }) {
  const src = role === "mentor" ? characterGomGreen : characterGomBlue;

  // ✅ 역할별 후광 색상
  const glowColor =
    role === "mentor"
      ? glowed
        ? "drop-shadow-[0_0_55px_rgba(21,128,61,0.8)]" // ✅ green-700 계열 (더 진하고 선명)
        : "drop-shadow-[0_0_36px_rgba(22,101,52,0.45)]" // ✅ green-800 계열 (어두운 초록)
      : glowed
        ? "drop-shadow-[0_0_42px_rgba(37,99,235,0.55)]" // mentee 파랑
        : "drop-shadow-[0_0_28px_rgba(37,99,235,0.25)]";

  return (
    <img
      src={src}
      alt={role === "mentor" ? "멘토 캐릭터" : "멘티 캐릭터 토리"}
      className={["mt-5 h-auto w-[45%] max-w-[180px] transition md:mt-10", glowColor].join(" ")}
    />
  );
}
