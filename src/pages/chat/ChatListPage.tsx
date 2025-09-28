import type { Room } from "@/pages/chat/services/chat";
import { getRooms, isMentiUser } from "@/pages/chat/services/chat";
import defaultimage from "@assets/images/character/character-gom.svg";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

function groupBy<T extends Record<string, any>, K extends keyof T>(
  arr: T[],
  key: K,
): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const k = String(item[key] ?? "");
    (acc[k] ||= []).push(item);
    return acc;
  }, {});
}

function formatTime(ts?: number) {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");

  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) return `${pad(d.getHours())}:${pad(d.getMinutes())}`;

  const sameYear = d.getFullYear() === now.getFullYear();
  if (sameYear) return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;

  return `${String(d.getFullYear()).slice(2)}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

export default function ChatListPage() {
  const [rooms, setRooms] = useState<Room[] | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // JWT payload에서 role 가져오기
        const role: "mento" | "menti" = isMentiUser() ? "menti" : "mento";
        const list = await getRooms(role);
        if (!alive) return;
        setRooms(list);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "채팅방 목록 조회 실패");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const grouped = useMemo(() => {
    const result = groupBy(rooms ?? [], "group");
    return result;
  }, [rooms]);

  const groupEntries = useMemo(() => {
    const entries = Object.entries(grouped).sort(([a], [b]) =>
      a.localeCompare(b, "ko", { numeric: true }),
    );
    return entries;
  }, [grouped]);

  return (
    <div className="l flex min-h-screen w-full justify-center overflow-x-hidden bg-[#f5f6f8] antialiased">
      <section className="w-full overflow-x-hidden bg-gradient-to-b from-[#F7FAFF] to-[#c2d2f1] px-4 py-5">
        <h1 className="font-WooridaumB mt-6 mb-15 pl-2 text-[20px]">멘티 채팅</h1>

        {rooms === null && !error && (
          <div className="font-WooridaumL px-3 py-6 text-sm text-slate-500">
            채팅방을 불러오는 중…
          </div>
        )}
        {!!error && <div className="px-3 py-6 text-sm text-red-500">{error}</div>}
        {rooms?.length === 0 && !error && (
          <div className="font-WooridaumL px-3 py-6 text-sm text-slate-500">
            표시할 채팅방이 없습니다.
          </div>
        )}

        {rooms && rooms.length > 0 && (
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-3">
            {groupEntries.map(([title, items], i) => (
              <section key={title} className={i > 0 ? "border-t border-[#eef0f4] pt-3" : ""}>
                <h3 className="font-WooridaumR mb-3 px-1 text-[18px] text-[#3c3d3c]">{title}</h3>
                <ul className="space-y-3">
                  {items.map((r) => (
                    <li key={r.id}>
                      <Link
                        to={`/chat/${r.id}`}
                        state={{ room: { id: r.id, name: r.name, group: r.group } }}
                        className="flex items-center gap-3 rounded-[14px] border border-[#eef0f4] bg-white px-4 py-3 shadow-[0_1px_0_rgba(17,17,17,0.02)] hover:bg-[#fafafa]">
                        <div className="grid h-12 w-12 place-items-center rounded-full bg-[#f1f3f6] text-xl">
                          <img src={defaultimage} alt="gom" />
                        </div>
                        <div className="min-w-0 flex-1">
                          {/* 이름 + 시간 */}
                          <div className="flex items-start justify-between">
                            <div className="font-WooridaumR truncate text-[14px]">{r.name}</div>
                            {r.lastAt ? (
                              <div className="ml-2 shrink-0 text-[11px] text-[#9aa2ae]">
                                {formatTime(r.lastAt)}
                              </div>
                            ) : null}
                          </div>
                          {/* 미리보기 */}
                          <div className="font-WooridaumL truncate text-[12px] text-[#9aa2ae]">
                            {r.preview}
                          </div>
                        </div>
                        {r.unread && <span className="h-2.5 w-2.5 rounded-full bg-[#ef233c]" />}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
