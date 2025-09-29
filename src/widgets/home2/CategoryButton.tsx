// src/widgets/buttons/CategoryButton.tsx
import { CreditCard, Lightbulb, LineChart, PiggyBank } from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

/* ----------------------------- 타입 ----------------------------- */
export type CategoryKey = "consumption" | "tips" | "saving" | "growth";

export type CategoryItem = {
  key: CategoryKey;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  to?: string; // 라우팅용
  onClick?: (key: CategoryKey) => void; // 콜백용
};

/* ----------------------------- 기본 카테고리 ----------------------------- */
const DEFAULT_CATEGORIES: CategoryItem[] = [
  { key: "consumption", label: "소비패턴", Icon: CreditCard },
  { key: "tips", label: "생활노하우", Icon: Lightbulb },
  { key: "saving", label: "저축방식", Icon: PiggyBank },
  { key: "growth", label: "자산증식", Icon: LineChart },
];

/* ----------------------------- 단일 버튼 ----------------------------- */
export function CategoryButton({
  icon,
  label,
  onClick,
  to,
}: {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  to?: string;
}) {
  const navigate = useNavigate();

  const base =
    "group inline-flex items-center justify-center gap-1.5 rounded-xl " +
    "border border-blue-200/70 bg-blue-50 px-3 py-2 text-[13px] font-medium text-blue-700 " +
    "shadow-sm transition hover:-translate-y-[1px] hover:bg-blue-100 " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300";

  const handleClick = () => {
    if (onClick) return onClick();
    if (to) return navigate(to);
  };

  return (
    <button type="button" onClick={handleClick} className={base}>
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}

/* ----------------------------- 버튼 그룹 ----------------------------- */
export function CategoryButtonGroup({
  items = DEFAULT_CATEGORIES,
  onSelect,
  toMapper,
  className = "",
}: {
  items?: CategoryItem[];
  onSelect?: (key: CategoryKey) => void;
  toMapper?: (key: CategoryKey) => string | undefined;
  className?: string;
}) {
  return (
    <section
      className={`grid w-full grid-cols-2 gap-2 rounded-2xl bg-white/70 p-2 shadow-sm ring-1 ring-black/5 backdrop-blur ${className}`}>
      {items.map(({ key, label, Icon, to, onClick }) => {
        const click = onClick ? () => onClick(key) : onSelect ? () => onSelect(key) : undefined;

        // ✅ 기본 경로: `/menti/${key}` (기존 코드 유지)
        const path = to ?? (toMapper ? toMapper(key) : `/menti/${key}`);

        return (
          <CategoryButton
            key={key}
            icon={<Icon className="h-4 w-4 opacity-80 group-hover:opacity-100" />}
            label={label}
            onClick={click}
            to={path}
          />
        );
      })}
    </section>
  );
}
