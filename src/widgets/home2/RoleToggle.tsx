export type Role = "mentee" | "mentor";

export function RoleToggle({ value, onChange }: { value: Role; onChange: (r: Role) => void }) {
  return (
    <div className="mb-2 flex items-center justify-center gap-2">
      {(["mentee", "mentor"] as Role[]).map((r) => {
        const active = value === r;
        return (
          <button
            key={r}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(r)}
            className={[
              "rounded-full px-4 py-2 text-sm font-semibold transition-all",
              active
                ? "bg-[#1161FF] text-white shadow-[0_5px_10px_rgba(17,97,255,0.35)]"
                : "bg-white text-slate-600 ring-1 ring-slate-300 hover:bg-slate-50",
            ].join(" ")}>
            {r === "mentee" ? "멘티" : "멘토"}
          </button>
        );
      })}
    </div>
  );
}
