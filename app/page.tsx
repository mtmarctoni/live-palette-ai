"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Sparkles, Download, History, Users, AlertCircle } from "lucide-react"
import { PaletteDisplay } from "@/components/palette-display"
import { socketManager } from "@/lib/socket"
import { supabase } from "@/lib/supabase/client"
import LiveCursors from "@/components/collaboration/live-cursors"
import UserPresence from "@/components/collaboration/user-presence"
import AuthButton from "@/components/auth/auth-button"
import VersionHistoryPanel from "@/components/version-history/version-history-panel"
import { ThemeToggle } from "@/components/theme-toggle"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface PaletteResponse {
  colors: string[]
  keyword: string
  source: "ai" | "fallback"
}

export default function HomePage() {
  const [keyword, setKeyword] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentPalette, setCurrentPalette] = useState<PaletteResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [currentPaletteId, setCurrentPaletteId] = useState<string | null>(null)

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        socketManager.connect(user.id, user.email || "anonymous")
      }
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const newUser = session?.user ?? null
      setUser(newUser)

      if (newUser) {
        socketManager.connect(newUser.id, newUser.email || "anonymous")
      } else {
        socketManager.disconnect()
      }
    })

    return () => {
      subscription.unsubscribe()
      socketManager.disconnect()
    }
  }, [])

  const handleGenerate = async () => {
    if (!keyword.trim()) return

    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch("/api/generate-palette", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ keyword: keyword.trim() }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate palette")
      }

      const data: PaletteResponse = await response.json()
      setCurrentPalette(data)

      if (socketManager.connected) {
        socketManager.emit("palette-update", { palette: data })
      }
    } catch (err) {
      setError("Failed to generate palette. Please try again.")
      console.error("Error:", err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSavePalette = async () => {
    if (!currentPalette || !user) return

    try {
      const response = await fetch("/api/palettes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `${currentPalette.keyword} Palette`,
          description: `Generated from keyword: ${currentPalette.keyword}`,
          colors: currentPalette.colors,
          keywords: [currentPalette.keyword],
          is_ai_generated: currentPalette.source === "ai",
        }),
      })

      if (response.ok) {
        const { palette } = await response.json()
        setCurrentPaletteId(palette.id)

        // Create initial version
        await fetch(`/api/palettes/${palette.id}/versions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            colors: currentPalette.colors,
            description: "Initial version",
          }),
        })
      }
    } catch (error) {
      console.error("Failed to save palette:", error)
    }
  }

  const handleRestoreVersion = async (version: any) => {
    setCurrentPalette({
      colors: version.colors,
      keyword: currentPalette?.keyword || "Restored",
      source: "fallback",
    })
    setShowVersionHistory(false)

    if (socketManager.connected) {
      socketManager.emit("palette-update", {
        palette: {
          colors: version.colors,
          keyword: currentPalette?.keyword || "Restored",
          source: "fallback",
        },
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-64 h-64 bg-secondary rounded-full blur-lg animate-pulse delay-1000"></div>
        <div className="absolute bottom-80 left-20 w-64 h-64 bg-accent rounded-full blur-2xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-60 right-10 w-96 h-96 bg-primary rounded-full blur-xl animate-pulse delay-500"></div>
      </div>

      <LiveCursors currentUser={user ? { id: user.id, email: user.email || "" } : undefined} />

      <VersionHistoryPanel
        paletteId={currentPaletteId}
        isOpen={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        onRestoreVersion={handleRestoreVersion}
      />

      <header className="border-b border-border bg-gradient-to-r from-background via-card to-background backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">AI Color Palette Generator</h1>
                <div className="flex gap-1 mt-1">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <div className="w-2 h-2 bg-secondary rounded-full"></div>
                  <div className="w-2 h-2 bg-accent rounded-full"></div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <UserPresence />
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowVersionHistory(true)}
                disabled={!currentPaletteId}
                className="border-primary/20 hover:bg-primary/5"
              >
                <History className="w-4 h-4 mr-2" />
                History
              </Button>
              <AuthButton />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
            Generate Beautiful
            <span className="text-primary block">Color Palettes</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Transform your mood and brand keywords into stunning color combinations using AI. Perfect for designers,
            marketers, and creative professionals.
          </p>

          <div className="max-w-md mx-auto mb-8">
            <div className="flex gap-2">
              <Input
                placeholder="e.g., energetic startup, calm healthcare..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                className="flex-1"
              />
              <Button onClick={handleGenerate} disabled={isGenerating || !keyword.trim()} className="px-6">
                {isGenerating ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {isGenerating ? "Generating..." : "Generate"}
              </Button>
            </div>
          </div>

          {error && (
            <Alert className="max-w-md mx-auto mb-8" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {["energetic startup", "calm healthcare", "luxury brand", "nature inspired", "tech minimal"].map(
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

        {currentPalette && (
          <div className="mb-12">
            <PaletteDisplay
              colors={currentPalette.colors}
              keyword={currentPalette.keyword}
              source={currentPalette.source}
              onSave={user ? handleSavePalette : undefined}
              onShowHistory={currentPaletteId ? () => setShowVersionHistory(true) : undefined}
            />
          </div>
        )}

        {currentPalette && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-center mb-8 text-foreground">See Your Palette in Action</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Primary + Secondary Combination */}
              <Card className="bg-gradient-to-br from-primary/20 to-secondary/20 border-primary/30">
                <CardHeader className="bg-primary text-primary-foreground">
                  <CardTitle className="text-lg">Primary + Secondary</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="h-3 bg-primary rounded-full"></div>
                    <div className="h-3 bg-secondary rounded-full"></div>
                    <div className="h-3 bg-gradient-to-r from-primary to-secondary rounded-full"></div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">Perfect for headers and call-to-action buttons</p>
                </CardContent>
              </Card>

              {/* Accent Combinations */}
              <Card className="bg-gradient-to-br from-accent/20 to-primary/10 border-accent/30">
                <CardHeader className="bg-accent text-accent-foreground">
                  <CardTitle className="text-lg">Accent Highlights</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="h-3 bg-accent rounded-full"></div>
                    <div className="h-3 bg-accent/70 rounded-full"></div>
                    <div className="h-3 bg-accent/40 rounded-full"></div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">Great for badges, notifications, and highlights</p>
                </CardContent>
              </Card>

              {/* Full Spectrum */}
              <Card className="bg-gradient-to-br from-background to-card border-border">
                <CardHeader className="bg-gradient-to-r from-primary via-secondary to-accent text-primary-foreground">
                  <CardTitle className="text-lg">Full Spectrum</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-5 gap-2 mb-4">
                    {currentPalette.colors.map((color, index) => (
                      <div
                        key={index}
                        className="aspect-square rounded-lg shadow-sm"
                        style={{ backgroundColor: color }}
                      ></div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">Complete palette harmony in one view</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="text-center border-primary/20 hover:border-primary/40 transition-colors hover:shadow-lg hover:shadow-primary/10">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/70 rounded-xl mx-auto mb-3 flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <CardTitle className="text-lg">AI-Powered</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Advanced AI generates palettes based on your mood and brand keywords</CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center border-secondary/20 hover:border-secondary/40 transition-colors hover:shadow-lg hover:shadow-secondary/10">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-br from-secondary to-secondary/70 rounded-xl mx-auto mb-3 flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-secondary-foreground" />
              </div>
              <CardTitle className="text-lg">Real-time Collaboration</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Work together with your team in real-time with live cursor tracking</CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center border-accent/20 hover:border-accent/40 transition-colors hover:shadow-lg hover:shadow-accent/10">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-br from-accent to-accent/70 rounded-xl mx-auto mb-3 flex items-center justify-center shadow-lg">
                <Download className="w-6 h-6 text-accent-foreground" />
              </div>
              <CardTitle className="text-lg">Export Options</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Export to CSS, SCSS, Adobe formats, and more for seamless workflow</CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center border-primary/20 hover:border-primary/40 transition-colors hover:shadow-lg hover:shadow-primary/10">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl mx-auto mb-3 flex items-center justify-center shadow-lg">
                <History className="w-6 h-6 text-primary-foreground" />
              </div>
              <CardTitle className="text-lg">Version History</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Track changes and step back through your palette evolution</CardDescription>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t border-border bg-gradient-to-r from-card via-background to-card relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5"></div>
        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-xl">
                <Sparkles className="w-8 h-8 text-primary-foreground" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">AI Color Palette Generator</h4>
              <p className="text-sm text-muted-foreground">Transform ideas into beautiful color combinations</p>
            </div>

            <div className="text-center">
              <h4 className="font-semibold text-foreground mb-4">Color Harmony</h4>
              <div className="flex justify-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg shadow-md"></div>
                <div className="w-8 h-8 bg-secondary rounded-lg shadow-md"></div>
                <div className="w-8 h-8 bg-accent rounded-lg shadow-md"></div>
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg shadow-md"></div>
              </div>
              <p className="text-sm text-muted-foreground">Perfect color relationships</p>
            </div>

            <div className="text-center">
              <h4 className="font-semibold text-foreground mb-4">Live Preview</h4>
              <div className="space-y-2 mb-4">
                <div className="h-2 bg-gradient-to-r from-primary via-secondary to-accent rounded-full"></div>
                <div className="h-2 bg-gradient-to-r from-accent via-primary to-secondary rounded-full"></div>
                <div className="h-2 bg-gradient-to-r from-secondary via-accent to-primary rounded-full"></div>
              </div>
              <p className="text-sm text-muted-foreground">See changes in real-time</p>
            </div>
          </div>

          <div className="text-center pt-8 border-t border-border/50">
            <div className="flex justify-center gap-1 mb-4">
              <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
              <div className="w-3 h-3 bg-secondary rounded-full animate-pulse delay-200"></div>
              <div className="w-3 h-3 bg-accent rounded-full animate-pulse delay-400"></div>
            </div>
            <p className="text-muted-foreground">&copy; 2025 AI Color Palette Generator. Built with Next.js and AI.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
