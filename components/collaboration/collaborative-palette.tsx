"use client"

import { useEffect, useState } from "react"
import { socketManager } from "@/lib/socket"
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
    const handlePaletteUpdated = (data: { palette: any; updatedBy: { id: string; email: string } }) => {
      onPaletteUpdate(data.palette)
    }

    const handleColorSelected = (data: { userId: string; email: string; color: string }) => {
      setSelectedColors((prev) => ({
        ...prev,
        [data.userId]: data.color,
      }))

      // Clear selection after 2 seconds
      setTimeout(() => {
        setSelectedColors((prev) => {
          const newSelections = { ...prev }
          delete newSelections[data.userId]
          return newSelections
        })
      }, 2000)
    }

    socketManager.on("palette-updated", handlePaletteUpdated)
    socketManager.on("color-selected", handleColorSelected)

    return () => {
      socketManager.off("palette-updated", handlePaletteUpdated)
      socketManager.off("color-selected", handleColorSelected)
    }
  }, [onPaletteUpdate])

  const handleColorClick = (color: string) => {
    // Emit color selection to other users
    socketManager.emit("color-select", { color })

    // Copy to clipboard
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
