"use client"

import { useEffect, useState } from "react"
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
}

export default function CollaborativePalette({ palette, onPaletteUpdate }: CollaborativePaletteProps) {
  const [selectedColors, setSelectedColors] = useState<Record<string, string>>({})

  useEffect(() => {
    // Create a Supabase Realtime channel for palette collaboration
    const channel: RealtimeChannel = supabase.channel("collaborative-palette")

    // Listen for palette updates
    channel.on("broadcast", { event: "palette-updated" }, (payload) => {
      onPaletteUpdate(payload.payload.palette)
    })

    // Listen for color selection
    channel.on("broadcast", { event: "color-selected" }, (payload) => {
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

    channel.subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [onPaletteUpdate])

  const handleColorClick = async (color: string) => {
    // Get userId from Supabase Auth
    let userId = "anonymous"
    const { data } = await supabase.auth.getUser()
    if (data?.user) {
      userId = data.user.id
    }
    const channel: RealtimeChannel = supabase.channel("collaborative-palette")
    channel.send({
      type: "broadcast",
      event: "color-selected",
      payload: { userId, color },
    })
    navigator.clipboard.writeText(color)
  }

  if (!palette) return null

  return (
    <div className="relative">
      <PaletteDisplay
        colors={palette.colors}
        keyword={palette.keyword}
        source={palette.source}
        onColorClick={handleColorClick}
        selectedColors={selectedColors}
      />
    </div>
  )
}
