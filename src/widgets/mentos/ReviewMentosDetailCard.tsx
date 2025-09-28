// src/components/ReviewMentosDetailCard.tsx
import StaticStars from "../profile/StarStatic";

export interface ReviewMentosDetailCardProps {
  value: number;
  context: string;
  name: string;
}

export default function ReviewMentosDetailCard({
  value,
  context,
  name,
}: ReviewMentosDetailCardProps) {
  return (
    <div className="flex h-[100px] w-full max-w-[350px] flex-col gap-2 overflow-hidden rounded-[10px] border-[1px] border-[#E5E7ED] p-3">
      <div className="flex w-full">
        <StaticStars value={value} className="w-[80%]" />
      </div>
      <div>
        <p className="font-WooridaumR text-[0.6rem]">{context}</p>
      </div>
      <div className="flex justify-end">
        <span className="font-WooridaumR text-[0.75em]">{name}</span>
      </div>
    </div>
  );
}
