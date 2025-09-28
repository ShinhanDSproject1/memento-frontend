import characterGom from "@shared/assets/images/character/character-gom-blue.png";

export function CharacterFigure({ glowed }: { glowed: boolean }) {
  return (
    <img
      src={characterGom}
      alt="메멘토 캐릭터 토리"
      className={[
        "mt-5 h-auto w-[45%] max-w-[180px] transition md:mt-10",
        glowed
          ? "drop-shadow-[0_0_42px_rgba(37,99,235,0.55)]"
          : "drop-shadow-[0_0_28px_rgba(37,99,235,0.25)]",
      ].join(" ")}
    />
  );
}
