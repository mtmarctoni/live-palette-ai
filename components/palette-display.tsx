"use client"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Copy,
  Heart,
  Share2,
  Check,
  Sparkles,
  Zap,
  History,
  Sun,
  Moon,
  Edit,
  RotateCcw,
  X,
} from "lucide-react"
import { motion } from "framer-motion"
import { PaletteExport } from "@/components/palette-export"
import { applyPaletteToTheme, revertToOriginalTheme } from "@/lib/color-theme-manager"
import type { Palette } from "@/app/types/global"

interface PaletteDisplayProps {
  palette: Palette
  onColorClick?: (color: string) => void
  onSave?: () => void
  onShowHistory?: () => void
  channel?: any
  onPaletteUpdate?: (palette: Palette) => void
}

export function PaletteDisplay({
  palette,
  onColorClick,
  onSave,
  onShowHistory,
  channel,
  onPaletteUpdate,
}: PaletteDisplayProps) {
  const [copiedColor, setCopiedColor] = useState<string | null>(null)
  const [previewActive, setPreviewActive] = useState(false)
  const [originalColors, setOriginalColors] = useState<string[]>(palette.colors)
  const [editedColors, setEditedColors] = useState<string[]>(palette.colors)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [stagingColor, setStagingColor] = useState<string>("")
  
    // Sync editedColors with colors prop when colors changes
  useEffect(() => {
    setOriginalColors(palette.colors)
    setEditedColors(palette.colors)
  }, [palette.colors])

  const colorLabels = [
    "Primary",
    "Secondary",
    "Accent", // Main colors (0-2)
    "Light Background",
    "Light Text",
    "Light Muted",
    "Light Border", // Light theme (3-6)
    "Dark Background",
    "Dark Text",
    "Dark Muted",
    "Dark Border", // Dark theme (7-10)
  ]

  const isColorModified = (index: number) => {
    return originalColors[index] !== editedColors[index]
  }

  const startEditingColor = (index: number) => {
    setEditingIndex(index)
    setStagingColor(editedColors[index])
  }

  const applyColorEdit = () => {
    if (editingIndex !== null) {
      const updatedColors = editedColors.map((c, i) => (i === editingIndex ? stagingColor : c))
      setEditedColors(updatedColors)
      onPaletteUpdate?.({
        colors: updatedColors,
        keywords: [palette.keywords[0]],
        is_ai_generated: palette.is_ai_generated,
      })
      setEditingIndex(null)
      setStagingColor("")
    }
  }

  const cancelColorEdit = () => {
    setEditingIndex(null)
    setStagingColor("")
  }

  const resetColorToOriginal = useCallback(
    (index: number) => {
      setEditedColors((prev) => {
        const newEditedColors = [...prev]
        newEditedColors[index] = originalColors[index]
        return newEditedColors
      })
      // Notify parent of palette update after state update
      onPaletteUpdate?.({
        colors: editedColors.map((c, i) => (i === index ? originalColors[index] : c)),
        keywords: [palette.keywords[0]],
        is_ai_generated: palette.is_ai_generated,
      })
    },
    [originalColors, onPaletteUpdate, palette, editedColors],
  )

  const resetAllColorsToOriginal = useCallback(() => {
    setEditedColors([...originalColors])
    setEditingIndex(null)
    // Notify parent of palette update after state update
    onPaletteUpdate?.({
      colors: [...originalColors],
      keywords: [palette.keywords[0]],
      is_ai_generated: palette.is_ai_generated,
    })
  }, [originalColors, onPaletteUpdate, palette])

  const copyToClipboard = async (color: string) => {
    await navigator.clipboard.writeText(color)
    setCopiedColor(color)
    setTimeout(() => setCopiedColor(null), 2000)
    onColorClick?.(color)
  }

  const handlePreview = () => {
    if (previewActive) {
      revertToOriginalTheme()
      setPreviewActive(false)
    } else {
      applyPaletteToTheme(editedColors)
      setPreviewActive(true)
    }
  }

  const handleApply = () => {
    setPreviewActive(false)
  }

  const handleRevert = () => {
    revertToOriginalTheme()
    setPreviewActive(false)
  }

  const handleSync = async () => {
    if (!channel) {
      alert("No realtime channel available")
      return
    }
    const syncedPalette: Palette = {
      colors: editedColors,
      keywords: [palette.keywords[0]],
      is_ai_generated: palette.is_ai_generated,
    }
    channel.send({
      type: "broadcast",
      event: "palette-updated",
      payload: {
        palette: syncedPalette,
      },
    })
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                Generated Palette
                {palette.is_ai_generated ? (
                  <Badge variant="secondary" className="gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI Generated
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1">
                    <Zap className="w-3 h-3" />
                    Curated
                  </Badge>
                )}
                {editedColors.some((color, index) => isColorModified(index)) && (
                  <Badge variant="outline" className="gap-1 text-orange-600 border-orange-600">
                    <Edit className="w-3 h-3" />
                    Modified
                  </Badge>
                )}
              </CardTitle>
              <Badge variant="secondary" className="mt-2">
                {palette.keywords[0]}
              </Badge>
            </div>
            <div className="flex gap-2">
              {editedColors.some((color, index) => isColorModified(index)) && (
                <Button variant="outline" size="sm" onClick={resetAllColorsToOriginal}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset All
                </Button>
              )}
              {onShowHistory && (
                <Button variant="outline" size="sm" onClick={onShowHistory}>
                  <History className="w-4 h-4 mr-2" />
                  History
                </Button>
              )}
              {onSave && (
                <Button variant="outline" size="sm" onClick={onSave}>
                  <Heart className="w-4 h-4 mr-2" />
                  Save
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleSync}>
                <Share2 className="w-4 h-4 mr-2" />
                Sync
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="p-6 pb-4">
            <h3 className="text-lg font-semibold mb-4">Main Colors</h3>
            <div className="grid grid-cols-3 gap-4">
              {editedColors.slice(0, 3).map((color, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative"
                >
                  <div
                    className="h-20 rounded-lg mb-2 relative overflow-hidden cursor-pointer border-2 transition-all"
                    style={{
                      backgroundColor: editingIndex === index ? stagingColor : color,
                      borderColor: isColorModified(index) ? "#f97316" : "transparent",
                    }}
                    onClick={() => copyToClipboard(color)}
                  >
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      {copiedColor === color ? (
                        <Check className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      ) : (
                        <Copy className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                    {editingIndex !== index && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          startEditingColor(index)
                        }}
                        className="absolute top-1 right-1 w-6 h-6 rounded bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        title="Edit color"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  {editingIndex === index && (
                    <div className="absolute top-0 left-0 right-0 bg-white dark:bg-gray-800 border rounded-lg p-3 shadow-lg z-10">
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="color"
                          value={stagingColor}
                          onChange={(e) => setStagingColor(e.target.value)}
                          className="w-8 h-8 rounded border cursor-pointer"
                        />
                        <input
                          type="text"
                          value={stagingColor}
                          onChange={(e) => setStagingColor(e.target.value)}
                          className="flex-1 px-2 py-1 text-xs border rounded font-mono"
                          placeholder="#000000"
                        />
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" onClick={applyColorEdit} className="flex-1">
                          <Check className="w-3 h-3 mr-1" />
                          Apply
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelColorEdit} className="flex-1 bg-transparent">
                          <X className="w-3 h-3 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="text-center">
                    <div className="text-sm font-medium flex items-center justify-center gap-1">
                      {colorLabels[index]}
                      {isColorModified(index) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            resetColorToOriginal(index)
                          }}
                          className="text-orange-600 hover:text-orange-700 transition-colors"
                          title="Reset to original"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div className="text-xs font-mono text-muted-foreground">{color}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="px-6 pb-4">
            <h3 className="text-lg font-semibold mb-4">Theme Previews</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Light Theme Preview */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Sun className="w-4 h-4" />
                  <span className="font-medium">Light Theme</span>
                </div>
                <div
                  className="p-4 rounded-lg border"
                  style={{
                    backgroundColor: editedColors[3], // Light background
                    color: editedColors[4], // Light text
                    borderColor: editedColors[6], // Light border
                  }}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: editedColors[0] }} // Primary
                      />
                      <span className="text-sm font-medium">Sample Header</span>
                    </div>
                    <div
                      className="p-2 rounded text-xs"
                      style={{ backgroundColor: editedColors[5] }} // Light muted
                    >
                      Card content with muted background
                    </div>
                    <div className="flex gap-1">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: editedColors[1] }} // Secondary
                      />
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: editedColors[2] }} // Accent
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dark Theme Preview */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Moon className="w-4 h-4" />
                  <span className="font-medium">Dark Theme</span>
                </div>
                <div
                  className="p-4 rounded-lg border"
                  style={{
                    backgroundColor: editedColors[7], // Dark background
                    color: editedColors[8], // Dark text
                    borderColor: editedColors[10], // Dark border
                  }}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: editedColors[0] }} // Primary
                      />
                      <span className="text-sm font-medium">Sample Header</span>
                    </div>
                    <div
                      className="p-2 rounded text-xs"
                      style={{ backgroundColor: editedColors[9] }} // Dark muted
                    >
                      Card content with muted background
                    </div>
                    <div className="flex gap-1">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: editedColors[1] }} // Secondary
                      />
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: editedColors[2] }} // Accent
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 pb-6">
            <h3 className="text-lg font-semibold mb-4">Complete Color System</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {editedColors.map((color, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative"
                >
                  <div
                    className="h-16 rounded-lg mb-2 relative overflow-hidden cursor-pointer border-2 transition-all"
                    style={{
                      backgroundColor: editingIndex === index ? stagingColor : color,
                      borderColor: isColorModified(index) ? "#f97316" : "transparent",
                    }}
                    onClick={() => copyToClipboard(color)}
                  >
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      {copiedColor === color ? (
                        <Check className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      ) : (
                        <Copy className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                    {editingIndex !== index && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          startEditingColor(index)
                        }}
                        className="absolute top-1 right-1 w-5 h-5 rounded bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        title="Edit color"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  {editingIndex === index && (
                    <div className="absolute top-0 left-0 right-0 bg-white dark:bg-gray-800 border rounded-lg p-3 shadow-lg z-10">
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="color"
                          value={stagingColor}
                          onChange={(e) => setStagingColor(e.target.value)}
                          className="w-8 h-8 rounded border cursor-pointer"
                        />
                        <input
                          type="text"
                          value={stagingColor}
                          onChange={(e) => setStagingColor(e.target.value)}
                          className="flex-1 px-2 py-1 text-xs border rounded font-mono"
                          placeholder="#000000"
                        />
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" onClick={applyColorEdit} className="flex-1">
                          <Check className="w-3 h-3 mr-1" />
                          Apply
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelColorEdit} className="flex-1 bg-transparent">
                          <X className="w-3 h-3 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="text-center">
                    <div className="text-xs font-medium truncate flex items-center justify-center gap-1">
                      {colorLabels[index]}
                      {isColorModified(index) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            resetColorToOriginal(index)
                          }}
                          className="text-orange-600 hover:text-orange-700 transition-colors"
                          title="Reset to original"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div className="text-xs font-mono text-muted-foreground">{color}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-2 pb-6 border-t border-border pt-6 mx-6">
            <div className="flex flex-col sm:flex-row gap-2 w-full max-w-md">
              <Button
                onClick={handlePreview}
                variant={previewActive ? "default" : "outline"}
                className="flex-1"
                size="sm"
              >
                {previewActive ? "Stop Preview" : "Preview on Website"}
              </Button>
              {previewActive && (
                <>
                  <Button onClick={handleApply} variant="default" size="sm" className="flex-1">
                    Apply Changes
                  </Button>
                  <Button onClick={handleRevert} variant="outline" size="sm" className="flex-1 bg-transparent">
                    Revert
                  </Button>
                </>
              )}
            </div>
          </div>

          <PaletteExport
            colors={editedColors}
            keyword={palette.keywords[0]}
          />
        </CardContent>
      </Card>
    </motion.div>
  )
}
