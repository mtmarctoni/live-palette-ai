"use client"

import { useEffect, useState } from "react"
import { socketManager, type User } from "@/lib/socket"

interface LiveCursorsProps {
  currentUser?: User
}

export default function LiveCursors({ currentUser }: LiveCursorsProps) {
  const [users, setUsers] = useState<Record<string, User>>({})

  useEffect(() => {
    const handleCursorUpdate = (data: { userId: string; email: string; cursor: { x: number; y: number } }) => {
      setUsers((prev) => ({
        ...prev,
        [data.userId]: {
          ...prev[data.userId],
          id: data.userId,
          email: data.email,
          cursor: data.cursor,
        },
      }))
    }

    const handleUserJoined = (user: User) => {
      setUsers((prev) => ({
        ...prev,
        [user.id]: user,
      }))
    }

    const handleUserLeft = (data: { userId: string }) => {
      setUsers((prev) => {
        const newUsers = { ...prev }
        delete newUsers[data.userId]
        return newUsers
      })
    }

    socketManager.on("cursor-update", handleCursorUpdate)
    socketManager.on("user-joined", handleUserJoined)
    socketManager.on("user-left", handleUserLeft)

    // Track mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      if (socketManager.connected) {
        socketManager.emit("cursor-move", {
          cursor: { x: e.clientX, y: e.clientY },
        })
      }
    }

    document.addEventListener("mousemove", handleMouseMove)

    return () => {
      socketManager.off("cursor-update", handleCursorUpdate)
      socketManager.off("user-joined", handleUserJoined)
      socketManager.off("user-left", handleUserLeft)
      document.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {Object.values(users).map((user) => {
        if (!user.cursor || user.id === currentUser?.id) return null

        return (
          <div
            key={user.id}
            className="absolute transition-all duration-100 ease-out pointer-events-none"
            style={{
              left: user.cursor.x,
              top: user.cursor.y,
              transform: "translate(-2px, -2px)",
            }}
          >
            {/* Cursor */}
            <div className="relative">
              <svg width="20" height="20" viewBox="0 0 20 20" className="drop-shadow-lg">
                <path d="M0 0L0 16L5.5 12L8.5 18L11 17L8 11L14 11L0 0Z" fill="#3b82f6" stroke="white" strokeWidth="1" />
              </svg>
              {/* User label */}
              <div className="absolute top-5 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {user.email?.split("@")[0]}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
