// src/widgets/buttons/CategoryButton.tsx
import { CreditCard, Lightbulb, LineChart, PiggyBank } from "lucide-react";
import { type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

type Role = "mentee" | "mentor" | undefined;

/* ----------------------------- 단일 버튼 ----------------------------- */
export function CategoryButton({
  icon,
  label,
  to,
  role,
}: {
  icon: ReactNode;
  label: string;
  to: string;
  role?: Role;
}) {
  const navigate = useNavigate();

  // ✅ 역할별 색상 분기
  const baseClass =
    role === "mentor"
      ? "bg-emerald-500 text-white hover:bg-emerald-600 border border-emerald-600"
      : "bg-blue-500 text-white hover:bg-blue-600 border border-blue-600";

  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      className={`flex w-full flex-1 items-center justify-center gap-1 rounded-xl py-2 text-[12px] font-semibold shadow-md transition ${baseClass}`}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

/* ----------------------------- 버튼 그룹 ----------------------------- */
type CategoryKey = "consumption" | "tips" | "saving" | "growth";

const categories: { key: CategoryKey; label: string; Icon: any }[] = [
  { key: "consumption", label: "소비패턴", Icon: CreditCard },
  { key: "tips", label: "생활노하우", Icon: Lightbulb },
  { key: "saving", label: "저축방식", Icon: PiggyBank },
  { key: "growth", label: "자산증식", Icon: LineChart },
];

export function CategoryButtonGroup({ role }: { role?: Role }) {
  return (
    <section className="mx-auto mt-5 flex w-full max-w-lg justify-center gap-2">
      {categories.map(({ key, label, Icon }) => (
        <CategoryButton
          key={key}
          icon={<Icon className="h-4 w-4" />}
          label={label}
          to={`/menti/${key}`}
          role={role}
        />
      ))}
    </section>
  );
}
