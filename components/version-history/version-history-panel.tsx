"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { History, RotateCcw, X, Clock } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface PaletteVersion {
  id: string
  version_number: number
  colors: string[]
  description?: string
  created_at: string
}

interface VersionHistoryPanelProps {
  paletteId?: string
  isOpen: boolean
  onClose: () => void
  onRestoreVersion: (version: PaletteVersion) => void
}

export default function VersionHistoryPanel({
  paletteId,
  isOpen,
  onClose,
  onRestoreVersion,
}: VersionHistoryPanelProps) {
  const [versions, setVersions] = useState<PaletteVersion[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && paletteId) {
      fetchVersions()
    }
  }, [isOpen, paletteId])

  const fetchVersions = async () => {
    if (!paletteId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/palettes/${paletteId}/versions`)
      if (response.ok) {
        const data = await response.json()
        setVersions(data.versions)
      }
    } catch (error) {
      console.error("Failed to fetch versions:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
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
                  Version History
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
                  ) : versions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No version history available</div>
                  ) : (
                    <div className="space-y-4">
                      {versions.map((version) => (
                        <motion.div
                          key={version.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Version {version.version_number}</Badge>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {formatDate(version.created_at)}
                              </div>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => onRestoreVersion(version)}>
                              <RotateCcw className="w-3 h-3 mr-1" />
                              Restore
                            </Button>
                          </div>

                          {version.description && (
                            <p className="text-sm text-muted-foreground mb-3">{version.description}</p>
                          )}

                          <div className="flex gap-1">
                            {version.colors.map((color, index) => (
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
