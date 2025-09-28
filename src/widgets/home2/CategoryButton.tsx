// src/widgets/buttons/CategoryButton.tsx
import { CreditCard, Lightbulb, LineChart, PiggyBank } from "lucide-react";
import { type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

/* ----------------------------- 단일 버튼 ----------------------------- */
export function CategoryButton({
  icon,
  label,
  to,
}: {
  icon: ReactNode;
  label: string;
  to: string;
}) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      className="flex w-full flex-1 items-center justify-center gap-2 rounded-xl bg-[#3B82F6] py-2 text-[12px] font-semibold text-white shadow-md transition hover:bg-[#2563EB]">
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

export function CategoryButtonGroup() {
  return (
    <section className="mx-auto mt-1 flex w-full max-w-lg justify-center gap-2 md:mt-5">
      {categories.map(({ key, label, Icon }) => (
        <CategoryButton
          key={key}
          icon={<Icon className="h-4 w-4" />}
          label={label}
          to={`/menti/${key}`}
        />
      ))}
    </section>
  );
}
