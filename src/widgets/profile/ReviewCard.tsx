import StarStatic from "@/widgets/profile/StarStatic";

export interface ReviewCardProps {
  title: string;
  date: string;
  rating: number;
  name: string;
  content: string;
  className?: string;
}

export default function ReviewCard({
  title,
  date,
  rating,
  name,
  content,
  className = "",
}: ReviewCardProps) {
  return (
    <article
      role="article"
      aria-label="리뷰"
      className={`w-full rounded-xl bg-white p-4 shadow-md ${className}`}>
      <h3 className="text-[15px] font-bold text-gray-900">{title}</h3>
      <div className="mt-2 flex items-center gap-2 rounded-md bg-gray-50 px-2 py-1 text-xs text-gray-600">
        <StarStatic value={rating} />
        <span className="font-medium text-gray-800">{name}</span>
        <span className="mx-2 h-3 w-px bg-gray-300" aria-hidden="true" />
        <span className="ml-auto text-gray-500 tabular-nums">{date}</span>
      </div>
      <p className="mt-3 text-sm leading-relaxed break-words whitespace-pre-line text-gray-700">
        {content}
      </p>
    </article>
  );
}
