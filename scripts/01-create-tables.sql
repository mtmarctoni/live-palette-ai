-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create palettes table
CREATE TABLE IF NOT EXISTS public.palettes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  colors JSONB NOT NULL, -- Array of color objects with hex, name, etc.
  keywords TEXT[], -- Array of keywords used to generate
  is_ai_generated BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create palette_versions table for version history
CREATE TABLE IF NOT EXISTS public.palette_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  palette_id UUID REFERENCES public.palettes(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  colors JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.palettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.palette_versions ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create policies for palettes
CREATE POLICY "Users can view own palettes" ON public.palettes
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert own palettes" ON public.palettes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own palettes" ON public.palettes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own palettes" ON public.palettes
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for palette versions
CREATE POLICY "Users can view own palette versions" ON public.palette_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.palettes 
      WHERE palettes.id = palette_versions.palette_id 
      AND (palettes.user_id = auth.uid() OR palettes.is_public = true)
    )
  );

CREATE POLICY "Users can insert own palette versions" ON public.palette_versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.palettes 
      WHERE palettes.id = palette_versions.palette_id 
      AND palettes.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_palettes_user_id ON public.palettes(user_id);
CREATE INDEX IF NOT EXISTS idx_palettes_created_at ON public.palettes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_palettes_public ON public.palettes(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_palette_versions_palette_id ON public.palette_versions(palette_id);

-- Create function to handle user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
