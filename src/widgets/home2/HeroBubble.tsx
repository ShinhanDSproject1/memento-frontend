import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type Props = {
  /** 기본 문장 (로테이션을 쓰지 않을 때 사용) */
  text: string;
  /** 하이라이트할 단어(예: 멤버 이름) */
  highlight?: string;
  /** 로테이션으로 순환시킬 문장들 (제공되면 text 대신 이 배열을 사용) */
  rotateTexts?: string[];
  /** 교체 주기(ms). 기본 30초 */
  intervalMs?: number;
};

export function HeroBubble({ text, highlight, rotateTexts, intervalMs = 30_000 }: Props) {
  const prefersReducedMotion = useReducedMotion();

  // 현재 표시할 문장(로테이션이 있으면 그 중 하나, 아니면 text)
  const [currentText, setCurrentText] = useState<string>(text);

  // 타이핑 상태
  const [typed, setTyped] = useState("");
  const [done, setDone] = useState(prefersReducedMotion);
  const timer = useRef<number | null>(null);
  const i = useRef(0);

  // ✅ 로테이션: rotateTexts가 있으면 interval로 문장 교체
  useEffect(() => {
    if (!rotateTexts || rotateTexts.length === 0) {
      // 로테이션 안 쓰는 경우: 외부 text가 바뀌면 그대로 적용
      setCurrentText(text);
      return;
    }

    // 접근성: 모션 감소 선호 시 즉시 변경(애니메이션 최소화)
    if (prefersReducedMotion) {
      setCurrentText(rotateTexts[0]);
      let idx = 0;
      const id = window.setInterval(() => {
        idx = (idx + 1) % rotateTexts.length;
        setCurrentText(rotateTexts[idx]);
      }, intervalMs);
      return () => window.clearInterval(id);
    }

    // 일반 모드: interval로 순환
    let idx = 0;
    setCurrentText(rotateTexts[idx]); // 처음 값
    const id = window.setInterval(() => {
      idx = (idx + 1) % rotateTexts.length;
      setCurrentText(rotateTexts[idx]);
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [text, rotateTexts, intervalMs, prefersReducedMotion]);

  // ✅ 타이핑 애니메이션 (currentText 기준)
  useEffect(() => {
    // 타이핑 초기화
    if (timer.current) window.clearTimeout(timer.current);
    i.current = 0;
    setTyped("");
    setDone(prefersReducedMotion);

    // 모션 감소면 즉시 전체 표시
    if (prefersReducedMotion) {
      setTyped(currentText);
      setDone(true);
      return;
    }

    const step = () => {
      i.current += 1;
      setTyped(currentText.slice(0, i.current));
      if (i.current < currentText.length) timer.current = window.setTimeout(step, 50);
      else setDone(true);
    };
    // 살짝 딜레이 후 시작
    timer.current = window.setTimeout(step, 200);

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [currentText, prefersReducedMotion]);

  // ✅ 하이라이트 적용 함수
  const renderWithHighlight = (content: string) => {
    if (!highlight || !content.includes(highlight)) return content;
    const parts = content.split(highlight);
    return (
      <>
        {parts[0]}
        <span className="animate-pulse font-bold text-blue-600">{highlight}</span>
        {parts[1]}
      </>
    );
  };

  return (
    <motion.div
      className="h-[132px] w-full overflow-hidden rounded-2xl border border-blue-200 bg-white/95 px-4 py-10 shadow-md backdrop-blur"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
      <p className="text-center text-[15px] leading-6 whitespace-pre-line text-[#23272E]">
        {renderWithHighlight(typed)}
        {/* 타이핑 중 커서 */}
        {!done && (
          <motion.span
            aria-hidden
            className="ml-1 inline-block h-[1em] w-[2px] bg-[#23272E] align-[-0.2em]"
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
          />
        )}
        {/* 타이핑 완료 후에도 살아있는 깜빡임 */}
        {done && (
          <motion.span
            aria-hidden
            className="ml-1 inline-block h-[1em] w-[2px] bg-[#23272E] align-[-0.2em]"
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </p>
    </motion.div>
  );
}
