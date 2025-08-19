import { generateText } from "ai"
import { google } from "@ai-sdk/google"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { keyword } = await request.json()

    if (!keyword || typeof keyword !== "string") {
      return NextResponse.json({ error: "Keyword is required" }, { status: 400 })
    }

    const { text } = await generateText({
      model: google("gemini-2.0-flash-exp"),
      prompt: `Generate a complete color system based on the keyword/mood: "${keyword}".

Create a comprehensive palette that includes:

MAIN COLORS (3 colors):
- Primary: Main brand/accent color
- Secondary: Supporting color that complements primary
- Accent: Highlight color for calls-to-action

LIGHT THEME COLORS (4 colors):
- Light Background: Main background color (very light)
- Light Foreground: Main text color (dark, high contrast against light background)
- Light Muted: Subtle background for cards/surfaces
- Light Border: Subtle border color

DARK THEME COLORS (4 colors):
- Dark Background: Main background color (very dark)
- Dark Foreground: Main text color (light, high contrast against dark background)
- Dark Muted: Subtle background for cards/surfaces in dark mode
- Dark Border: Subtle border color for dark mode

Requirements:
- Return EXACTLY 11 hex color codes (including the #)
- Each color on a new line in the exact order specified above
- No additional text, explanations, or formatting
- Ensure proper contrast ratios (4.5:1 minimum for text)
- Colors should work harmoniously together
- Consider color psychology for the given keyword

Example format:
#3B82F6
#8B5CF6
#10B981
#FFFFFF
#1F2937
#F9FAFB
#E5E7EB
#0F172A
#F8FAFC
#1E293B
#334155

Keyword: ${keyword}`,
    })

    const colors = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.match(/^#[0-9A-Fa-f]{6}$/))
      .slice(0, 11)

    if (colors.length !== 11) {
      const fallbackPalettes: Record<string, string[]> = {
        energetic: [
          "#FF6B6B",
          "#4ECDC4",
          "#45B7D1", // Main colors
          "#FFFFFF",
          "#1F2937",
          "#F9FAFB",
          "#E5E7EB", // Light theme
          "#0F172A",
          "#F8FAFC",
          "#1E293B",
          "#334155", // Dark theme
        ],
        calm: [
          "#74B9FF",
          "#A29BFE",
          "#6C5CE7",
          "#FFFFFF",
          "#2D3436",
          "#F8F9FA",
          "#DDD6FE",
          "#0F172A",
          "#F1F3F4",
          "#2C3E50",
          "#34495E",
        ],
        luxury: [
          "#2D3436",
          "#636E72",
          "#FD79A8",
          "#FFFFFF",
          "#2D3436",
          "#F8F9FA",
          "#E9ECEF",
          "#0F0F0F",
          "#F8F9FA",
          "#1A1A1A",
          "#2D2D2D",
        ],
        nature: [
          "#00B894",
          "#55A3FF",
          "#FDCB6E",
          "#FFFFFF",
          "#2D3436",
          "#F0FDF4",
          "#D1FAE5",
          "#0F172A",
          "#F0FDF4",
          "#1F2937",
          "#374151",
        ],
        tech: [
          "#0891B2",
          "#6366F1",
          "#8B5CF6",
          "#FFFFFF",
          "#1F2937",
          "#F8FAFC",
          "#E2E8F0",
          "#0F172A",
          "#F8FAFC",
          "#1E293B",
          "#334155",
        ],
      }

      const matchedKey = Object.keys(fallbackPalettes).find((key) => keyword.toLowerCase().includes(key))
      const fallbackColors = fallbackPalettes[matchedKey || "tech"]

      return NextResponse.json({
        colors: fallbackColors,
        keyword,
        source: "fallback",
      })
    }

    return NextResponse.json({
      colors,
      keyword,
      source: "ai",
    })
  } catch (error) {
    console.error("Error generating palette:", error)
    return NextResponse.json({ error: "Failed to generate palette" }, { status: 500 })
  }
}
