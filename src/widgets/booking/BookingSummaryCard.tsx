export default function BookingSummaryCard({
  title,
  whenText,
}: {
  title: string;
  whenText: string;
}) {
  return (
    <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4">
      <div className="font-WooridaumB mb-2 text-[20px] text-[#000008]">{title}</div>
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span className="font-WooridaumL inline-block rounded-full border border-gray-200 px-2 py-0.5 text-[11px] text-slate-500">
          일정
        </span>
        <span className="font-WooridaumL text-[13px]">{whenText}</span>
      </div>
    </div>
  );
}
