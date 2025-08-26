"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase/client"
import { PaletteDisplay } from "@/components/palette-display"
import LiveCursors from "./live-cursors"

interface CollaborativePaletteProps {
  palette: {
    colors: string[]
    keyword: string
    source: "ai" | "fallback"
  } | null
  onPaletteUpdate: (palette: any) => void
  channel?: any
}

export default function CollaborativePalette({ palette: initialPalette, onPaletteUpdate, channel }: CollaborativePaletteProps) {
  const [palette, setPalette] = useState(initialPalette)
  const [selectedColors, setSelectedColors] = useState<Record<string, string>>({})
  const paletteContainerRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;

  // Always call parent callback and update local state
  const handlePaletteUpdate = (updatedPalette: any) => {
    setPalette(updatedPalette)
    onPaletteUpdate(updatedPalette)
  }

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
    // Listen for palette-updated broadcast to update local palette
    channel.on("broadcast", { event: "palette-updated" }, (payload: any) => {
      setPalette(payload.payload.palette)
      onPaletteUpdate(payload.payload.palette)
    })
    // No need to subscribe/unsubscribe here, handled in HomePage
  }, [channel, onPaletteUpdate])

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

  return (
    <div className="relative" style={{ position: "relative" }} ref={paletteContainerRef}>
      <PaletteDisplay
        colors={palette.colors}
        keyword={palette.keyword}
        source={palette.source}
        onColorClick={handleColorClick}
        selectedColors={selectedColors}
        channel={channel}
        onPaletteUpdate={handlePaletteUpdate}
      />
      {/* LiveCursors only inside palette container, pass ref */}
      <LiveCursors containerRef={paletteContainerRef} />
    </div>
  )
}
