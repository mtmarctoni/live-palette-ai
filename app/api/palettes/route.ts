import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const supabase = createClient()
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 })
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { data: palettes, error } = await supabase
      .from("palettes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ palettes })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch palettes" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 })
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, description, colors, keywords, is_ai_generated } = body

    const { data: palette, error } = await supabase
      .from("palettes")
      .insert({
        user_id: user.id,
        name,
        description,
        colors,
        keywords,
        is_ai_generated: is_ai_generated || false,
        is_public: false,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ palette })
  } catch (error) {
    return NextResponse.json({ error: "Failed to save palette" }, { status: 500 })
  }
}
