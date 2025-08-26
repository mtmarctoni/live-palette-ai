"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { PaletteGenerator } from "@/components/palette-generator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Sparkles, Download, History, Users, AlertCircle } from "lucide-react"
import CollaborativePalette from "@/components/collaboration/collaborative-palette"
import { useRef } from "react"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { supabase } from "@/lib/supabase/client"
import VersionHistoryPanel from "@/components/version-history/version-history-panel"
import type { RealtimeChannel, Session, User as SupabaseUser } from "@supabase/supabase-js"

interface PaletteResponse {
  colors: string[]
  keyword: string
  source: "ai" | "fallback"
}

export default function HomePage() {
  const [session, setSession] = useState<Session | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentPalette, setCurrentPalette] = useState<PaletteResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [currentPaletteId, setCurrentPaletteId] = useState<string | null>(null)
  const channelRef = useRef<RealtimeChannel>(null)

  useEffect(() => {
    // Create and subscribe to the collaborative-palette channel once
    if (!channelRef.current) {
      channelRef.current = supabase.channel("collaborative-palette")
      channelRef.current.on("broadcast", { event: "palette-updated" }, (payload: any) => {
        setCurrentPalette(payload.payload.palette)
      })
      channelRef.current.subscribe()
    }
    const getAuthData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };

    getAuthData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setSession(session ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleGenerate = async (keyword: string) => {
    if (!keyword.trim()) return

    setIsGenerating(true)
    setError(null)
    setCurrentPaletteId(null)

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

      // Broadcast palette update to Supabase Realtime using the shared channel
      if (channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "palette-updated",
          payload: { palette: data },
        })
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
          "Authorization": `Bearer ${session?.access_token}`,
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
        await fetch(`/api/palettes/${palette.id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`,
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
    const restoredPalette: PaletteResponse = {
      colors: version.colors,
      keyword: currentPalette?.keyword || "Restored",
      source: "fallback" as "ai" | "fallback",
    }
    setCurrentPalette(restoredPalette)
    setShowVersionHistory(false)

    // Broadcast palette update to Supabase Realtime
    const channel = supabase.channel("collaborative-palette")
    channel.send({
      type: "broadcast",
      event: "palette-updated",
      payload: { palette: restoredPalette },
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-64 h-64 bg-secondary rounded-full blur-lg animate-pulse delay-1000"></div>
        <div className="absolute bottom-80 left-20 w-64 h-64 bg-accent rounded-full blur-2xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-60 right-10 w-96 h-96 bg-primary rounded-full blur-xl animate-pulse delay-500"></div>
      </div>

      <VersionHistoryPanel
        session={session}
        isOpen={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        onRestoreVersion={handleRestoreVersion}
      />

      <Header 
        onShowHistory={() => setShowVersionHistory(true)}
        showHistoryDisabled={!user}
      />

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

          <div className="max-w-4xl mx-auto mb-8">
            <PaletteGenerator
              onGenerate={(kw) => {
                handleGenerate(kw)
              }}
              isGenerating={isGenerating}
            />
          </div>

          {error && (
            <Alert className="max-w-md mx-auto mb-8" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        
        </div>

        {currentPalette && (
          <div className="mb-12">
            <CollaborativePalette
              palette={currentPalette}
              onPaletteUpdate={(palette) => setCurrentPalette(palette)}
              channel={channelRef.current}
            />
            {user && (
              <div className="flex justify-center mt-6">
                <Button onClick={handleSavePalette} disabled={!!currentPaletteId}>
                  {currentPaletteId ? "Palette Saved" : "Save Palette"}
                </Button>
              </div>
            )}
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

  <Footer />
    </div>
  )
}
