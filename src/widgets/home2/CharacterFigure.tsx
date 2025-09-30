import {
  default as characterGomBlue,
  default as characterGomGreen,
} from "@shared/assets/images/character/character-main-sit.png";

export function CharacterFigure({ glowed, role }: { glowed: boolean; role?: "mentee" | "mentor" }) {
  const src = role === "mentor" ? characterGomGreen : characterGomBlue;

  // ✅ 역할과 관계없이 흰색 후광 적용
  const glowColor = glowed
    ? "drop-shadow-[0_0_55px_rgba(255,255,255,2.9)]" // 진한 흰색 후광
    : "drop-shadow-[0_0_36px_rgba(255,255,255,0.45)]"; // 옅은 흰색 후광

  return (
    <img
      src={src}
      alt={role === "mentor" ? "멘토 캐릭터" : "멘티 캐릭터 토리"}
      className={["mt-5 h-auto max-w-[200px] transition md:mt-10 md:max-w-[270px]", glowColor].join(
        " ",
      )}
    />
  );
}
