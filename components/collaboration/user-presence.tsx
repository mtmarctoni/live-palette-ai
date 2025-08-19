"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"
import { socketManager, type User } from "@/lib/socket"

export default function UserPresence() {
  const [users, setUsers] = useState<User[]>([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const handleCollaborationState = (data: { users: User[] }) => {
      setUsers(data.users.filter((user) => user.id !== "current-user")) // Filter out current user
      setIsConnected(true)
    }

    const handleUserJoined = (user: User) => {
      setUsers((prev) => [...prev.filter((u) => u.id !== user.id), user])
    }

    const handleUserLeft = (data: { userId: string }) => {
      setUsers((prev) => prev.filter((user) => user.id !== data.userId))
    }

    socketManager.on("collaboration-state", handleCollaborationState)
    socketManager.on("user-joined", handleUserJoined)
    socketManager.on("user-left", handleUserLeft)

    return () => {
      socketManager.off("collaboration-state", handleCollaborationState)
      socketManager.off("user-joined", handleUserJoined)
      socketManager.off("user-left", handleUserLeft)
    }
  }, [])

  if (!isConnected) {
    return (
      <Badge variant="outline" className="gap-1">
        <Users className="w-3 h-3" />
        Connecting...
      </Badge>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="secondary" className="gap-1">
        <Users className="w-3 h-3" />
        {users.length + 1} online
      </Badge>
      {users.length > 0 && (
        <div className="flex -space-x-2">
          {users.slice(0, 3).map((user, index) => (
            <div
              key={user.id}
              className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white flex items-center justify-center text-xs text-white font-medium"
              title={user.email}
            >
              {user.email?.charAt(0).toUpperCase()}
            </div>
          ))}
          {users.length > 3 && (
            <div className="w-6 h-6 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center text-xs text-white font-medium">
              +{users.length - 3}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
