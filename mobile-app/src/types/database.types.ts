export type Flashcard = {
  id: string;
  word: string;
  translation: string | null;
  source_language: string;
  target_language: string;
  images: string[];
  last_reviewed: string | null;
  review_count: number;
  created_at: string;
};

export type FlashcardFilter = {
  reviewedBefore?: boolean;
  minReviewCount?: number;
  maxReviewCount?: number;
  sourceLanguage?: string;
  targetLanguage?: string;
};
