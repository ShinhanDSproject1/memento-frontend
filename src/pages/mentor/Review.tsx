import PageContainer from "@/widgets/profile/PageContainer";
import ReviewCard from "@/widgets/profile/ReviewCard";
import { getMentoReviews, type MentorReview } from "@entities/review";
import { useCallback, useEffect, useRef, useState } from "react";

type UiReviewItem = {
  id: number;
  title: string;
  date: string;
  rating: number;
  name: string;
  content: string;
};

export default function Review() {
  const [items, setItems] = useState<UiReviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<number | undefined>(undefined);
  const [error, setError] = useState("");
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const cursorRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);
  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);
  useEffect(() => {
    cursorRef.current = cursor;
  }, [cursor]);

  const mapToUi = (r: MentorReview): UiReviewItem => ({
    id: r.reviewSeq,
    title: r.mentosTitle,
    date: r.createdAt,
    rating: r.reviewRating,
    name: r.mentiName,
    content: r.reviewContent,
  });

  const fetchMore = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return;
    if (error) return;

    try {
      setLoading(true);
      setError("");

      const res = await getMentoReviews(10, cursorRef.current);
      const mapped = res.reviews.map(mapToUi);

      setItems((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const next = [...prev];
        for (const it of mapped) {
          if (!seen.has(it.id)) {
            next.push(it);
          }
        }
        return next;
      });

      setHasMore(res.hasNext);
      setCursor(res.nextCursor ?? undefined);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "리뷰를 불러오지 못했습니다.";
      setError(msg);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getMentoReviews(10, undefined);
        if (cancelled) return;
        setItems(res.reviews.map(mapToUi));
        setHasMore(res.hasNext);
        setCursor(res.nextCursor ?? undefined);
      } catch (err: any) {
        if (!cancelled) {
          const msg = err?.response?.data?.message || err?.message || "리뷰를 불러오지 못했습니다.";
          setError(msg);
          setHasMore(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 무한 스크롤 옵저버
  useEffect(() => {
    if (!hasMore || loading) return;
    const el = sentinelRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          fetchMore();
        }
      },
      { rootMargin: "200px", threshold: 0.01 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loading, fetchMore]);

  return (
    <div className="flex h-[calc(100vh-50px)] w-full justify-center bg-[#F7FAFF] sm:h-[calc(100vh-140px)]">
      <section className="w-full max-w-4xl px-6 py-8">
        <h1 className="font-WooridaumB mb-4 text-[22px] font-bold text-black">리뷰 확인하기</h1>

        <PageContainer className="space-y-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow">
              {error}
            </div>
          )}

          {items.map((it) => (
            <ReviewCard
              key={it.id}
              title={it.title}
              date={it.date}
              rating={it.rating}
              name={it.name}
              content={it.content}
              className="p-5 shadow-md hover:shadow-lg"
            />
          ))}

          {!loading && !error && items.length === 0 && (
            <div className="text-center text-sm text-gray-500">표시할 리뷰가 없습니다.</div>
          )}

          {loading && <div className="text-center text-sm text-gray-500">불러오는 중…</div>}
          {!hasMore && !loading && items.length > 0 && (
            <div className="text-center text-xs text-gray-400">마지막 페이지입니다</div>
          )}

          <div ref={sentinelRef} />
        </PageContainer>
      </section>
    </div>
  );
}
