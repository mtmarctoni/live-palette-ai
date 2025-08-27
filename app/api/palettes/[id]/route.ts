import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authHeader = request.headers.get("authorization");
  const accessToken = authHeader?.replace("Bearer ", "");

  const supabase = await createClient({ accessToken });
  const { id } = await params;
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // First check if user owns the palette
    const { data: palette, error: paletteError } = await supabase
      .from("palettes")
      .select("user_id")
      .eq("id", id)
      .single();

    if (paletteError || !palette) {
      return NextResponse.json({ error: "Palette not found" }, { status: 404 });
    }

    if (palette.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Fetch versions
    const { data: versions, error } = await supabase
      .from("palette_versions")
      .select("*")
      .eq("palette_id", id)
      .order("version_number", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ versions });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch versions" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authHeader = request.headers.get("authorization");
  const accessToken = authHeader?.replace("Bearer ", "");

  const supabase = await createClient({ accessToken });
  const { id } = await params;
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { colors, description } = body;

    // Check if user owns the palette
    const { data: palette, error: paletteError } = await supabase
      .from("palettes")
      .select("user_id")
      .eq("id", id)
      .single();

    if (paletteError || !palette) {
      return NextResponse.json({ error: "Palette not found" }, { status: 404 });
    }

    if (palette.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get next version number
    const { data: lastVersion } = await supabase
      .from("palette_versions")
      .select("version_number")
      .eq("palette_id", id)
      .order("version_number", { ascending: false })
      .limit(1)
      .single();

    const nextVersionNumber = (lastVersion?.version_number || 0) + 1;

    // Create new version
    const { data: version, error } = await supabase
      .from("palette_versions")
      .insert({
        palette_id: id,
        version_number: nextVersionNumber,
        colors,
        description,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ version });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create version" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const accessToken = authHeader?.replace("Bearer ", "");

  const url = new URL(request.url);
  // Expect paletteId as last path segment
  const paletteId = url.pathname.split("/").pop();
  if (!paletteId) {
    return NextResponse.json({ error: "Palette ID required" }, { status: 400 });
  }

  const supabase = await createClient({ accessToken });
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Only allow deleting palettes owned by the user
    const { error } = await supabase
      .from("palettes")
      .delete()
      .eq("id", paletteId)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete palette" },
      { status: 500 }
    );
  }
}
