export interface Palette {
  colors: string[];
  keywords: string[];
  is_ai_generated: boolean;
}

export interface StoredUserPalettes extends Palette {
  id: string;
  user_id: string;
  name: string;
  description: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}
