"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase/client"
import { RealtimeChannel } from "@supabase/supabase-js"
import { PaletteDisplay } from "@/components/palette-display"

interface CollaborativePaletteProps {
  palette: {
    colors: string[]
    keyword: string
    source: "ai" | "fallback"
  } | null
  onPaletteUpdate: (palette: any) => void
  channel?: any
}

export default function CollaborativePalette({ palette, onPaletteUpdate, channel }: CollaborativePaletteProps) {
  const [selectedColors, setSelectedColors] = useState<Record<string, string>>({})
  const onPaletteUpdateRef = useRef(onPaletteUpdate)
  useEffect(() => {
    onPaletteUpdateRef.current = onPaletteUpdate
  }, [onPaletteUpdate])

  useEffect(() => {
    if (!channel) return
    // Listen for color selection
    channel.on("broadcast", { event: "color-selected" }, (payload: any) => {
      const { userId, color } = payload.payload
      setSelectedColors((prev) => ({
        ...prev,
        [userId]: color,
      }))
      setTimeout(() => {
        setSelectedColors((prev) => {
          const newSelections = { ...prev }
          delete newSelections[userId]
          return newSelections
        })
      }, 2000)
    })
    // No need to subscribe/unsubscribe here, handled in HomePage
  }, [channel])

  const handleColorClick = async (color: string) => {
    // Get userId from Supabase Auth
    let userId = "anonymous"
    const { data } = await supabase.auth.getUser()
    if (data?.user) {
      userId = data.user.id
    }
    if (channel) {
      channel.send({
        type: "broadcast",
        event: "color-selected",
        payload: { userId, color },
      })
    }
    navigator.clipboard.writeText(color)
  }

  if (!palette) return null

  // Import LiveCursors locally to avoid global render
  const LiveCursors = require("@/components/collaboration/live-cursors").default;

  return (
    <div className="relative" style={{ position: "relative" }}>
      <PaletteDisplay
        colors={palette.colors}
        keyword={palette.keyword}
        source={palette.source}
        onColorClick={handleColorClick}
        selectedColors={selectedColors}
      />
      {/* LiveCursors only inside palette container */}
      <LiveCursors />
    </div>
  )
}
