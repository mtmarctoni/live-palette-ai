import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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
    // First check if user owns the palette
    const { data: palette, error: paletteError } = await supabase
      .from("palettes")
      .select("user_id")
      .eq("id", params.id)
      .single()

    if (paletteError || !palette) {
      return NextResponse.json({ error: "Palette not found" }, { status: 404 })
    }

    if (palette.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Fetch versions
    const { data: versions, error } = await supabase
      .from("palette_versions")
      .select("*")
      .eq("palette_id", params.id)
      .order("version_number", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ versions })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch versions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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
    const { colors, description } = body

    // Check if user owns the palette
    const { data: palette, error: paletteError } = await supabase
      .from("palettes")
      .select("user_id")
      .eq("id", params.id)
      .single()

    if (paletteError || !palette) {
      return NextResponse.json({ error: "Palette not found" }, { status: 404 })
    }

    if (palette.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get next version number
    const { data: lastVersion } = await supabase
      .from("palette_versions")
      .select("version_number")
      .eq("palette_id", params.id)
      .order("version_number", { ascending: false })
      .limit(1)
      .single()

    const nextVersionNumber = (lastVersion?.version_number || 0) + 1

    // Create new version
    const { data: version, error } = await supabase
      .from("palette_versions")
      .insert({
        palette_id: params.id,
        version_number: nextVersionNumber,
        colors,
        description,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ version })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create version" }, { status: 500 })
  }
}
