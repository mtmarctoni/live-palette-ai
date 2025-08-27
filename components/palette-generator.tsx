"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Palette as PaletteIcon } from "lucide-react"
import { Badge } from "./ui/badge"

interface PaletteGeneratorProps {
  onGenerate: (keyword: string) => void
  isGenerating: boolean
}

export function PaletteGenerator({ onGenerate, isGenerating }: PaletteGeneratorProps) {
  const [keyword, setKeyword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (keyword.trim()) {
      onGenerate(keyword.trim())
    }
  }

  const sampleKeywords = [
    "energetic startup",
    "calm healthcare",
    "luxury brand",
    "nature inspired",
    "tech minimal",
    "warm cozy",
    "bold creative",
    "professional corporate",
  ]

  return (
    <Card className="w-full mx-auto">
      <CardHeader className="text-center">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <PaletteIcon className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Generate Your Palette</CardTitle>
        <CardDescription>Describe the mood, brand, or feeling you want to capture</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="e.g., energetic startup, calm healthcare, luxury brand..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isGenerating || !keyword.trim()}>
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground text-center">Try these popular keywords:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {sampleKeywords.map(
              (sample) => (
                <Badge
                  key={sample}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                  onClick={() => setKeyword(sample)}
                >
                  {sample}
                </Badge>
              ),
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
