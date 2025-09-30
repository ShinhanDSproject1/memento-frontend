// src/widgets/home2/HeroBubble.tsx
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type Role = "mentee" | "mentor";

type Props = {
  text: string;
  highlight?: string; // 유저네임
  rotateTexts?: string[];
  intervalMs?: number;
  role?: Role;
};

export function HeroBubble({ text, highlight, rotateTexts, intervalMs = 30_000, role }: Props) {
  const prefersReducedMotion = useReducedMotion();
  const [currentText, setCurrentText] = useState<string>(text);
  const [typed, setTyped] = useState("");
  const [done, setDone] = useState(prefersReducedMotion);
  const timer = useRef<number | null>(null);
  const i = useRef(0);
  const navigate = useNavigate();
  const location = useLocation(); // ✅ 현재 경로 확인

  useEffect(() => {
    if (!rotateTexts || rotateTexts.length === 0) {
      setCurrentText(text);
      return;
    }
    if (prefersReducedMotion) {
      setCurrentText(rotateTexts[0]);
      let idx = 0;
      const id = window.setInterval(() => {
        idx = (idx + 1) % rotateTexts.length;
        setCurrentText(rotateTexts[idx]);
      }, intervalMs);
      return () => window.clearInterval(id);
    }

    let idx = 0;
    setCurrentText(rotateTexts[idx]);
    const id = window.setInterval(() => {
      idx = (idx + 1) % rotateTexts.length;
      setCurrentText(rotateTexts[idx]);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [text, rotateTexts, intervalMs, prefersReducedMotion]);

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    i.current = 0;
    setTyped("");
    setDone(prefersReducedMotion);

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
    timer.current = window.setTimeout(step, 200);

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [currentText, prefersReducedMotion]);

  // ✅ 유저네임 + 캐릭터이름 하이라이트
  const renderWithHighlight = (content: string) => {
    const highlightColor = role === "mentor" ? "text-teal-500" : "text-blue-600";
    const targetWords = [highlight, "토리", "모리"].filter(Boolean) as string[];

    let result: (string | JSX.Element)[] = [content];
    targetWords.forEach((word) => {
      result = result.flatMap((chunk) => {
        if (typeof chunk !== "string") return [chunk];
        return chunk.split(word).flatMap((part, idx, arr) =>
          idx < arr.length - 1
            ? [
                part,
                <span key={word + idx} className={`animate-pulse font-bold ${highlightColor}`}>
                  {word}
                </span>,
              ]
            : [part],
        );
      });
    });
    return result;
  };

  return (
    <motion.div
      className="flex h-[160px] w-full items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-white/95 px-4 shadow-md backdrop-blur"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
      {/* 말풍선 텍스트 */}
      <p className="text-center text-[14px] leading-6 whitespace-pre-line text-[#23272E]">
        {renderWithHighlight(typed)}
        {!done && (
          <motion.span
            aria-hidden
            className="ml-1 inline-block h-[1em] w-[2px] bg-[#23272E] align-[-0.2em]"
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
          />
        )}
        {done && (
          <motion.span
            aria-hidden
            className="ml-1 inline-block h-[1em] w-[2px] bg-[#23272E] align-[-0.2em]"
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </p>

      {/* 대화하기 버튼 (말풍선 오른쪽 하단) → /chat 페이지에서는 숨김 */}
      {role == "mentee" && location.pathname !== "/recommend" && (
        <button
          type="button"
          onClick={() => navigate("/recommend")}
          className="absolute right-2 bottom-2 inline-flex items-center justify-center gap-1.5 rounded-full border border-blue-300 bg-blue-400 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:border-blue-400 hover:bg-blue-500 hover:shadow-md">
          대화하기
        </button>
      )}
    </motion.div>
  );
}
