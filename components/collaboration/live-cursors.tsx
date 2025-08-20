"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import { RealtimeChannel } from "@supabase/supabase-js"

type CursorPosition = { x: number; y: number }

type PresencePayload = {
  user_id: string
  username: string
  color: string
  online_at: number
  position?: CursorPosition
}

type BroadcastCursorMovePayload = {
  userId: string
  x: number
  y: number
}

type SupabasePresenceState = Record<string, PresencePayload[]>

type CursorUser = {
  username: string
  color: string
  position: CursorPosition | undefined
  online_at: number
}

// Helper for random color
function getRandomColor() {
  const colors = [
    '#FF5F5F', '#5F9EFF', '#5FFF8F', '#FF5FE0', '#FFC55F', '#AC5FFF',
    '#FF9F5F', '#5FFFA7', '#5FCAFF', '#D25FFF', '#FFA75F', '#5FFFED'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Helper for random username
function getRandomUsername() {
  const adjectives = ['Happy', 'Clever', 'Brave', 'Bright', 'Kind'];
  const nouns = ['Panda', 'Tiger', 'Eagle', 'Dolphin', 'Fox'];
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}${Math.floor(Math.random() * 100)}`;
}

export default function LiveCursors() {
  const [isConnected, setIsConnected] = useState(false)
  const [userCursors, setUserCursors] = useState<Record<string, CursorUser>>({})
  const [localCursorPosition, setLocalCursorPosition] = useState<CursorPosition>({ x: 50, y: 50 })
  const userId = useRef<string>(Math.random().toString(36).substring(2, 15))
  const userColor = useRef<string>(getRandomColor())
  const username = useRef<string>("")
  const containerRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const isInitialSetup = useRef(true)

  // Listen for auth changes to update userId and username
  useEffect(() => {
    let isMounted = true;
    const updateUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!isMounted) return;
      if (data?.user) {
        userId.current = data.user.id;
        username.current = data.user.user_metadata?.username || data.user.email || getRandomUsername();
      } else {
        username.current = getRandomUsername();
      }
    };
    updateUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        userId.current = session.user.id;
        username.current = session.user.user_metadata?.username || session.user.email || getRandomUsername();
      } else {
        username.current = getRandomUsername();
      }
    });
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Setup channel and presence
  useEffect(() => {
    let isMounted = true;
    const channel = supabase.channel("live-cursors");
    channelRef.current = channel;

    // Presence: sync user info
    // Grace period map for users scheduled for removal
    const removalTimeouts: Record<string, NodeJS.Timeout> = {};
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState() as SupabasePresenceState;
      const updatedUserInfo: Record<string, CursorUser> = {};
      Object.keys(state).forEach(key => {
        const presences = state[key] as PresencePayload[];
        presences.forEach((presence: PresencePayload) => {
          if (presence.user_id === userId.current) return;
          updatedUserInfo[presence.user_id] = {
            username: presence.username,
            color: presence.color,
            position: presence.position ?? { x: 50, y: 50 },
            online_at: presence.online_at
          };
        });
      });
      setUserCursors(prev => {
        const newCursors = { ...prev };
        // Add/update present users
        Object.keys(updatedUserInfo).forEach(id => {
          newCursors[id] = {
            ...newCursors[id],
            ...updatedUserInfo[id]
          };
          // If user was scheduled for removal, cancel it
          if (removalTimeouts[id]) {
            clearTimeout(removalTimeouts[id]);
            delete removalTimeouts[id];
          }
        });
        // Schedule removal for users no longer present
        Object.keys(newCursors).forEach(id => {
          const userExists = Object.values(state).some(
            (presences: PresencePayload[]) => presences.some((presence: PresencePayload) => presence.user_id === id)
          );
          if (!userExists && !removalTimeouts[id]) {
            removalTimeouts[id] = setTimeout(() => {
              setUserCursors(current => {
                const copy = { ...current };
                delete copy[id];
                return copy;
              });
              delete removalTimeouts[id];
            }, 3000); // 3 seconds grace period
          }
        });
        return newCursors;
      });
    });

    // Broadcast: cursor position
    channel.on("broadcast", { event: "cursor_move" }, (payload: { payload: BroadcastCursorMovePayload }) => {
      if (payload.payload.userId === userId.current) return;
      const { userId: cursorUserId, x, y } = payload.payload;
      setUserCursors(prev => {
        if (!prev[cursorUserId]) return prev;
        return {
          ...prev,
          [cursorUserId]: {
            ...prev[cursorUserId],
            position: { x, y }
          }
        };
      });
    });

    channel.subscribe(async (status: string) => {
      if (status === "SUBSCRIBED") {
        const presencePayload: PresencePayload = {
          user_id: userId.current,
          username: username.current,
          color: userColor.current,
          online_at: new Date().getTime(),
          position: localCursorPosition
        };
        await channel.track(presencePayload);
        setIsConnected(true);
        isInitialSetup.current = false;
      }
    });

    // Cleanup (always unsubscribe channel)
    return () => {
      isMounted = false;
      channel.unsubscribe();
    };
  }, [localCursorPosition]);

  // Broadcast local cursor position
  const broadcastCursorPosition = useCallback((position: CursorPosition) => {
    if (!channelRef.current || !isConnected || isInitialSetup.current) return;
    const payload: BroadcastCursorMovePayload = {
      userId: userId.current,
      x: position.x,
      y: position.y
    };
    channelRef.current.send({
      type: "broadcast",
      event: "cursor_move",
      payload
    });
  }, [isConnected]);

  // Track and broadcast mouse movement (global listener)
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = ((e.clientX - rect.left) / rect.width) * 100;
    const relativeY = ((e.clientY - rect.top) / rect.height) * 100;
    const newPosition: CursorPosition = { x: relativeX, y: relativeY };
    setLocalCursorPosition(newPosition);
    broadcastCursorPosition(newPosition);
    // Do NOT update own presence with cursor position
  }, [broadcastCursorPosition]);

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove)
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
    }
  }, [handleMouseMove])

  return (
    <div
      className="fixed inset-0 pointer-events-none z-50"
      ref={containerRef}
      style={{ cursor: 'none' }}
    >

      {/* Other users' cursors */}
      {Object.entries(userCursors)
        .filter(([id]) => id !== userId.current)
        .map(([id, { position, username, color }]) => {
          const pos = position || null;
          if (!pos) return null; // Skip if no position available
          return (
            <div
              key={id}
              className="absolute pointer-events-none flex flex-col items-start"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                zIndex: 100,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div
                className="absolute w-3 h-3 rounded-full opacity-40"
                style={{
                  backgroundColor: color,
                  transform: 'translate(-50%, -50%)',
                  filter: 'blur(3px)'
                }}
              />
              <svg width="24" height="24" viewBox="0 0 20 20" style={{ color }} className="drop-shadow-md">
                <path d="M0 0L0 16L5.5 12L8.5 18L11 17L8 11L14 11L0 0Z" fill={color} stroke="white" strokeWidth="1" />
              </svg>
              <div
                className="mt-2 px-2 py-1 rounded text-xs whitespace-nowrap"
                style={{
                  backgroundColor: color,
                  color: '#fff',
                  fontWeight: 500,
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                }}
              >
                {username}
              </div>
            </div>
          )
        })}

      {/* Connection status */}
      {!isConnected && (
        <div className="absolute top-16 left-0 right-0 flex justify-center">
          <div className="bg-red-500/80 text-white px-4 py-2 rounded-full text-sm">
            Connecting to Supabase Realtime...
          </div>
        </div>
      )}

      {/* Active users list */}
      <div className="absolute top-4 right-4 flex gap-2 flex-col justify-end">
        {Object.entries(userCursors)
          .filter(([id]) => id !== userId.current)
          .map(([id, { username, color }]) => (
            <div
              key={id}
              className="flex items-center gap-2 p-1.5 pl-2 pr-3 rounded-full bg-neutral-800 text-neutral-200 text-xs font-medium"
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
              ></div>
              {username}
            </div>
          ))}
        {/* Include yourself in the list */}
        <div
          className="flex items-center gap-2 p-1.5 pl-2 pr-3 rounded-full bg-neutral-800 text-neutral-200 text-xs font-medium"
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: userColor.current }}
          ></div>
          {username.current} (you)
        </div>
      </div>
    </div>
  )
}
