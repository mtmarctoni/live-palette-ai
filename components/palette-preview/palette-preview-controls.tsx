"use client"
import { Button } from "@/components/ui/button"
import { Eye, RotateCcw, Palette, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface PalettePreviewControlsProps {
  colors: string[]
  isPreviewActive: boolean
  onPreview: () => void
  onApply: () => void
  onRevert: () => void
}

export function PalettePreviewControls({
  colors,
  isPreviewActive,
  onPreview,
  onApply,
  onRevert,
}: PalettePreviewControlsProps) {
  return (
    <div className="flex flex-col gap-3 p-4 bg-card rounded-lg border">
      <div className="flex items-center gap-2">
        <Palette className="w-4 h-4 text-primary" />
        <span className="font-medium text-sm">Live Preview</span>
        {isPreviewActive && (
          <Badge variant="secondary" className="text-xs">
            Active
          </Badge>
        )}
      </div>

      <div className="flex gap-2">
        <Button onClick={onPreview} variant={isPreviewActive ? "secondary" : "outline"} size="sm" className="flex-1">
          <Eye className="w-4 h-4 mr-2" />
          {isPreviewActive ? "Previewing" : "Preview"}
        </Button>

        <Button onClick={onApply} variant="default" size="sm" className="flex-1" disabled={!isPreviewActive}>
          <Check className="w-4 h-4 mr-2" />
          Apply
        </Button>

        <Button onClick={onRevert} variant="outline" size="sm" disabled={!isPreviewActive}>
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Preview applies colors to the entire website. Click Apply to make permanent.
      </p>
    </div>
  )
}
