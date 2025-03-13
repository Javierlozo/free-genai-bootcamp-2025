export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      flashcards: {
        Row: {
          id: string;
          created_at: string;
          word: string;
          translation: string | null;
          source_language: string;
          target_language: string;
          images: string[];
          last_reviewed: string | null;
          review_count: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          word: string;
          translation?: string | null;
          source_language: string;
          target_language: string;
          images: string[];
          last_reviewed?: string | null;
          review_count?: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          word?: string;
          translation?: string | null;
          source_language?: string;
          target_language?: string;
          images?: string[];
          last_reviewed?: string | null;
          review_count?: number;
        };
      };
    };
  };
}
