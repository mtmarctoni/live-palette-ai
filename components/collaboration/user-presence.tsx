"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { RealtimeChannel } from "@supabase/supabase-js"
type User = {
  id: string
  email: string
}

export default function UserPresence() {
  const [users, setUsers] = useState<User[]>([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Get current user info from Supabase Auth
    let userId = "anonymous"
    let email = "anonymous@example.com"
    if (typeof window !== "undefined") {
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          userId = data.user.id
          email = data.user.email || "anonymous@example.com"
        }
      })
    }

    // Create a Supabase Realtime channel for user presence
    const channel: RealtimeChannel = supabase.channel("user-presence", {
      config: {
        presence: {
          key: userId,
        },
      },
    })

    
    channel.on("presence" as any, {}, (presenceState: Record<string, User>) => {
      // presenceState is a map of userId to user info
      const userList: User[] = Object.values(presenceState)
      setUsers(userList.filter((user) => user.id !== userId))
      setIsConnected(true)
    })
    
    channel.subscribe(async (status) => {
      if (status !== 'SUBSCRIBED') { return }
        channel.track({ id: userId, email })
      
    })

    return () => {
      channel.unsubscribe()
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
