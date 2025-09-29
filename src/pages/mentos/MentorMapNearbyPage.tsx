import { KakaoMapController } from "@entities/editor";
import { Info, Loader2, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function MentoNearbyPage() {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const ctrlRef = useRef<KakaoMapController | null>(null);
  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
  const [statusText, setStatusText] = useState("위치 기반 멘토 검색을 시작하세요");
  const [loading, setLoading] = useState(false);
  const [foundCount, setFoundCount] = useState<number | null>(null);

  // 검색
  const locateAndSearch = async (opts?: { useBrowserGeo?: boolean }) => {
    const useBrowserGeo = opts?.useBrowserGeo ?? true;
    const ctrl = ctrlRef.current;
    if (!ctrl) {
      setStatusText("지도가 아직 준비되지 않았습니다.");
      return;
    }

    setLoading(true);
    setStatusText(useBrowserGeo ? "현재 위치를 가져오는 중..." : "기본 위치로 검색합니다.");

    try {
      let lat: number | null = null;
      let lon: number | null = null;

      if (useBrowserGeo && "geolocation" in navigator) {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 0,
          });
        });
        lat = pos.coords.latitude;
        lon = pos.coords.longitude;
      } else {
        const center = ctrl.getCenter(); // { lat, lng }
        if (center) {
          lat = center.lat;
          lon = center.lng;
        }
      }

      if (lat == null || lon == null) {
        setStatusText("위치 정보를 가져올 수 없습니다. 브라우저 권한을 확인해주세요.");
        setFoundCount(null);
        return;
      }

      ctrl.setMyLocation(lat, lon);
      const count = await ctrl.showMentors(lat, lon, 10);
      setFoundCount(count);
      setStatusText(count > 0 ? "주변 멘토를 찾았습니다." : "주변 멘토가 없습니다.");
    } catch {
      if (useBrowserGeo) {
        await locateAndSearch({ useBrowserGeo: false });
        setStatusText("위치 권한이 없어 기본 위치로 검색합니다.");
      } else {
        setStatusText("위치 정보 검색에 실패했습니다.");
        setFoundCount(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!mapDivRef.current) return;
      const ctrl = new KakaoMapController(mapDivRef.current);
      ctrlRef.current = ctrl;
      try {
        await ctrl.init();
        if (!mounted) return;
        await locateAndSearch({ useBrowserGeo: true });
      } catch {
        setStatusText("지도를 초기화하는 중 오류가 발생했습니다.");
      }
    })();

    return () => {
      mounted = false;
      ctrlRef.current?.destroy();
      ctrlRef.current = null;
    };
  }, []);

  const searchCurrentArea = async () => {
    const ctrl = ctrlRef.current;
    if (!ctrl) {
      setStatusText("지도가 아직 준비되지 않았습니다.");
      return;
    }

    setLoading(true);
    setStatusText("현재 지도 영역에서 멘토를 검색 중...");

    try {
      const center = ctrl.getCenter(); // 현재 지도 중심 가져오기
      if (!center) {
        setStatusText("지도 중심을 가져올 수 없습니다.");
        setFoundCount(null);
        return;
      }

      const count = await ctrl.showMentors(center.lat, center.lng, 10);
      setFoundCount(count);
      setStatusText(count > 0 ? "현재 영역의 멘토를 찾았습니다." : "현재 영역에 멘토가 없습니다.");
    } catch (error) {
      setStatusText("멘토 검색에 실패했습니다.");
      setFoundCount(null);
    } finally {
      setLoading(false);
    }
  };
  const handleSearchArea = () => searchCurrentArea(); // 현재 영역 검색

  return (
    <div className="mx-auto w-full max-w-[1000px] bg-[#F7FAFF] px-4 py-6">
      <h1 className="font-WooridaumB text-center text-[20px]">내 주변 멘토 찾기</h1>
      <p className="font-WooridaumB mt-1 text-center text-[13px] text-[#8B8888]">
        위치 기반 맞춤형 금융 전문가 매칭
      </p>

      {/* 버튼 */}
      <div className="mt-4 flex justify-center">
        <button
          onClick={handleSearchArea}
          disabled={loading}
          className="font-WooridaumR flex w-full max-w-[520px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#005EF9] px-5 py-3 text-white shadow hover:bg-blue-700 disabled:opacity-60">
          <MapPin className="h-5 w-5" />
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> 검색 중...
            </span>
          ) : (
            "주변 멘토 검색하기"
          )}
        </button>
      </div>

      {/* 상태 카드 */}
      <div className="mt-3 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm">
        <Info className="h-4 w-4 text-gray-400" />
        <span className="flex-1">
          {statusText}
          {foundCount !== null && (
            <span className="ml-1 font-medium text-gray-900">({foundCount}명)</span>
          )}
        </span>
      </div>

      {/* 지도 카드 */}
      <div className="mt-4 h-[600px] w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow">
        <div ref={mapDivRef} className="bg-opacity-50 h-full w-full" id="kakao-map" />
      </div>
    </div>
  );
}
