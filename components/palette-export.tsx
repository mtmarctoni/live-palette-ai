import { Download, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { exportPaletteFile } from "@/lib/palette-exporter"

interface PaletteExportProps {
  colors: string[]
  keyword: string
}

export function PaletteExport({ colors, keyword }: PaletteExportProps) {
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: Number.parseInt(result[1], 16),
          g: Number.parseInt(result[2], 16),
          b: Number.parseInt(result[3], 16),
        }
      : null
  }

  const hexToHsl = (hex: string) => {
    const rgb = hexToRgb(hex)
    if (!rgb) return null

    const r = rgb.r / 255
    const g = rgb.g / 255
    const b = rgb.b / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0,
      s = 0
    const l = (max + min) / 2

    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0)
          break
        case g:
          h = (b - r) / d + 2
          break
        case b:
          h = (r - g) / d + 4
          break
      }
      h /= 6
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    }
  }

  const handleExport = (format: "css" | "scss" | "adobe" | "json" | "tailwind" | "figma") => {
    exportPaletteFile({
      format,
      colors,
      keyword,
      hexToRgb,
      hexToHsl,
    })
  }

  return (
    <div className="flex justify-center gap-2 pb-6 mx-6">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => handleExport("css")}>CSS Variables</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport("scss")}>SCSS Variables</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport("tailwind")}>Tailwind Config</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport("json")}>JSON Format</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport("adobe")}>Adobe Swatch</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport("figma")}>Figma Plugin</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}