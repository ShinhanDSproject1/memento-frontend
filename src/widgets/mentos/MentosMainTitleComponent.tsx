// src/components/MentosMainTitleComponent.tsx
export interface MentosMainTitleComponentProps {
  mainTitle: string;
  className?: string;
}

export default function MentosMainTitleComponent({ mainTitle }: MentosMainTitleComponentProps) {
  return (
    <div>
      <p className="font-WooridaumB mt-6 pl-2 text-[20px] font-bold">{mainTitle}</p>
    </div>
  );
}
