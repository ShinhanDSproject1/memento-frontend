import { ensureConnected, sendChatMessage, subscribeRoom } from "@/pages/chat/services/chatSocket";
import { markAsRead } from "@/pages/chat/services/chat";
import { http } from "@/shared/api/https";
import defaultimage from "@assets/images/character/character-gom.svg";
import { Send } from "lucide-react";
import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";

// --- 인터페이스 정의 ---
export interface RoomInfo {
  id: string;
  name: string; // mentosTitle
  group: string; // 상대방 이름
}

export type MessageRole = "bot" | "me";
export interface ChatMessage {
  id: string;
  roomId: string;
  role: MessageRole;
  text: string;
  ts: number;
  profileImageUrl?: string; // 상대방 프로필 이미지
}

type LocationState = { room?: RoomInfo } | null;

// --- useMe 커스텀 훅 ---
// 사용자 정보 로딩 완료 상태를 명확히 하기 위해 isLoaded로 상태 이름 변경
function useMe() {
  const [memberSeq, setMemberSeq] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await http.get(`/mypage/profile`);
        const userSeqFromResult = res?.data?.result?.memberSeq;
        console.log("✅ [useMe] API 응답 받음, memberSeq:", userSeqFromResult);
        if (alive) {
          setMemberSeq(typeof userSeqFromResult === "number" ? userSeqFromResult : null);
        }
      } catch (error) {
        console.error("내 정보를 가져오는데 실패했습니다:", error);
        if (alive) setMemberSeq(null);
      } finally {
        if (alive) setIsLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { memberSeq, isLoaded };
}

// --- ChatRoomPage 컴포넌트 ---
export default function ChatRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { state } = useLocation() as { state: LocationState };

  // 훅에서 isLoaded 상태를 받아와 실행 시점을 제어
  const { memberSeq, isLoaded } = useMe();

  // memberSeq를 저장할 ref를 생성
  const memberSeqRef = useRef(memberSeq);

  const [room, setRoom] = useState<RoomInfo | null>(state?.room ?? null);
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>("");

  const formRef = useRef<HTMLFormElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // memberSeq 상태가 변경될 때마다 ref의 값을 업데이트
  useEffect(() => {
    memberSeqRef.current = memberSeq;
  }, [memberSeq]);

  // 과거 메시지 로드, 채팅방 정보 설정, 소켓 구독 로직
  useEffect(() => {
    // 사용자 정보 로딩이 끝나고, memberSeq가 유효할 때만 모든 로직을 실행
    if (!roomId || !isLoaded || !memberSeq) {
      if (isLoaded && !memberSeq) {
        console.error("사용자 인증 정보가 없어 채팅방을 시작할 수 없습니다.");
      }
      return;
    }

    console.log(`🚀 [useEffect] 실행됨, 현재 memberSeq: ${memberSeq}`);

    let subscription: { unsubscribe: () => void } | null = null;

    const setupChatRoom = async () => {
      try {
        // 이제 memberSeq가 항상 유효하므로 직접 사용
        const myCurrentSeq = memberSeq;

        // 1. API 호출들을 먼저 수행
        await markAsRead(roomId);
        const res = await http.get(`/chat/rooms/${roomId}/messages`);
        const details = res?.data?.result;

        if (!details) {
          console.error("채팅방 정보를 불러오지 못했습니다.");
          return;
        }

        const other = details.participants.find((p: any) => p.memberSeq !== myCurrentSeq);
        setRoom({
          id: String(details.chattingRoomSeq),
          name: details.mentosTitle,
          group: other?.memberName || "상대방",
        });

        const oldMessages = details.messages.map(
          (msg: any): ChatMessage => ({
            id: `${msg.chattingRoomSeq}-${msg.sentAt}-${msg.senderSeq}`,
            roomId,
            role: msg.senderSeq === myCurrentSeq ? "me" : "bot",
            text: msg.message,
            ts: new Date(msg.sentAt.replace(" ", "T")).getTime(),
            profileImageUrl: msg.senderSeq !== myCurrentSeq ? msg.senderProfileImage : undefined,
          }),
        );
        setMsgs(oldMessages);

        // 2. 모든 HTTP 작업이 끝난 후, 마지막에 WebSocket 연결을 시도
        await ensureConnected();

        // 3. 연결 성공 후 방을 구독
        subscription = subscribeRoom(roomId, (body: any) => {
          // 3. 콜백 함수 안에서는 항상 최신 값을 보장하는 ref를 사용
          const currentMemberSeq = memberSeqRef.current;
          const newMessage: ChatMessage = {
            id: `${body.chattingRoomSeq}-${body.sentAt}-${body.senderSeq}-${Math.random()}`,
            roomId,
            role: body.senderSeq === currentMemberSeq ? "me" : "bot",
            text: body.message,
            ts: new Date(body.sentAt.replace(" ", "T")).getTime(),
            profileImageUrl:
              body.senderSeq !== currentMemberSeq ? body.senderProfileImage : undefined,
          };
          setMsgs((prev) => [...prev, newMessage]);
        });
      } catch (error) {
        console.error("채팅방 설정 중 에러:", error);
      }
    };

    setupChatRoom();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
    // useEffect가 isLoaded와 memberSeq 값의 변경에 반응하도록 설정
  }, [roomId, isLoaded, memberSeq]);

  // 스크롤 맨 아래로 이동
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [msgs.length]);

  // 메시지 전송 함수
  const onSend = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = input.trim();
    // memberSeq를 직접 사용 (useRef 불필요)
    if (!text || !roomId || !memberSeq) return;

    setInput("");

    sendChatMessage({
      roomId,
      message: text,
    }).catch((err) => {
      console.error("메시지 전송 실패:", err);
    });
  };

  // 입력창 핸들러
  const onChangeInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const onKeyDownInput = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isComposing = (e.nativeEvent as any).isComposing || (e as any).isComposing;
    if (isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) formRef.current?.requestSubmit();
    }
  };

  // JSX 렌더링 ---
  return (
    <div className="flex h-dvh w-full flex-col overscroll-none rounded-[18px] bg-white">
      <div className="sticky top-0 z-10 flex items-center border-b border-[#f1f3f6] bg-white px-4 py-4 pt-[env(safe-area-inset-top)]">
        <div className="text-[18px] font-bold text-[#4B4E51]">{room ? room.name : "채팅"} </div>
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-[#E6EDFF]/[0.22] px-4 py-5">
        {msgs.map((m, i) => {
          const prev = msgs[i - 1];
          const isOther = m.role !== "me";
          const showName = isOther && (!prev || prev.role === "me");
          return (
            <div key={m.id} className="w-full">
              {showName && (
                <div className="font-WooridaumL mb-1 ml-12 text-[11.5px] font-medium text-[#333]">
                  {room?.group ?? "상대"}
                </div>
              )}

              <div
                className={`flex w-full items-end gap-2 ${m.role === "me" ? "justify-end" : "justify-start"}`}>
                {isOther && (
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#565C63]">
                    <img
                      src={m.profileImageUrl || defaultimage}
                      alt="profile"
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  </div>
                )}
                <div
                  className={`max-w-[78%] rounded-[18px] px-4 py-2 break-words whitespace-pre-wrap text-white ${
                    m.role === "me" ? "bg-[#2563eb]" : "bg-[#93B1FF]"
                  }`}>
                  {m.text}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <form
        ref={formRef}
        onSubmit={onSend}
        className="sticky bottom-0 z-10 flex min-h-[60px] shrink-0 items-center gap-3 border-t border-[#e9eef4] bg-white px-4 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_6px_rgba(0,0,0,0.08)]">
        <div className="flex flex-1 items-center rounded-full border border-[#e6eaf0] bg-[#f9fafb] px-4 py-2">
          <textarea
            value={input}
            onChange={onChangeInput}
            onKeyDown={onKeyDownInput}
            rows={1}
            className="w-full resize-none overflow-hidden bg-transparent text-[14px] outline-none placeholder:text-[#c0c7d2]"
            placeholder="채팅을 입력하세요 (Enter: 전송, Shift+Enter: 줄바꿈)"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="ml-2 flex items-center justify-center hover:opacity-80 disabled:opacity-40">
            <Send size={20} strokeWidth={2} className="text-[#2563eb]" fill="currentColor" />
          </button>
        </div>
      </form>
    </div>
  );
}
