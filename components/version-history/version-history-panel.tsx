"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { History, RotateCcw, X, Clock } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Session } from "@supabase/supabase-js"

interface PaletteVersion {
  id: string
  version_number: number
  colors: string[]
  description?: string
  created_at: string
}

interface VersionHistoryPanelProps {
  session: Session | null
  paletteId?: string | null // kept for compatibility, but not used for fetching
  isOpen: boolean
  onClose: () => void
  onRestoreVersion: (version: PaletteVersion, paletteId: string) => void
}

export default function VersionHistoryPanel({
  session,
  paletteId,
  isOpen,
  onClose,
  onRestoreVersion,
}: VersionHistoryPanelProps) {
  const [palettes, setPalettes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && session) {
      fetchAllPalettes()
    }
  }, [isOpen, session])

  const fetchVersions = async () => {
    // replaced by fetchAllPalettes
  }

  const fetchAllPalettes = async () => {
    setLoading(true)
    try {
      // Fetch all palettes for the user
      const response = await fetch(`/api/palettes`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setPalettes(data.palettes)
      }
    } catch (error) {
      console.error("Failed to fetch palettes:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const handleDeletePalette = async (paletteId: string) => {
    if (!session?.access_token) return
    setDeletingId(paletteId)
    try {
      const response = await fetch(`/api/palettes/${paletteId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
      })
      if (response.ok) {
        setPalettes((prev) => prev.filter((p) => p.id !== paletteId))
      }
    } catch (error) {
      console.error("Failed to delete palette:", error)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-100"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="border-0 shadow-none">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Saved Palettes
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>

              <CardContent>
                <ScrollArea className="h-[60vh]">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : palettes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No saved palettes found</div>
                  ) : (
                    <div className="space-y-8">
                      {palettes.map((palette) => (
                        <motion.div
                          key={palette.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{palette.name}</Badge>
                              <span className="text-xs text-muted-foreground">{palette.description}</span>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => onRestoreVersion({
                                id: palette.id,
                                version_number: 1,
                                colors: palette.colors,
                                description: palette.description,
                                created_at: palette.created_at,
                              }, palette.id)}>
                                <RotateCcw className="w-3 h-3 mr-1" />
                                Restore
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeletePalette(palette.id)}
                                disabled={deletingId === palette.id}
                              >
                                {deletingId === palette.id ? (
                                  <div className="w-4 h-4 border-2 border-destructive border-t-transparent rounded-full animate-spin mr-1" />
                                ) : null}
                                Delete
                              </Button>
                            </div>
                          </div>

                          <div className="flex gap-1">
                            {palette.colors.map((color: string, index: number) => (
                              <div
                                key={index}
                                className="w-8 h-8 rounded border"
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                            ))}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
