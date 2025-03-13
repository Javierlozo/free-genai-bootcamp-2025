export type Flashcard = {
  id: string;
  word: string;
  images: string[];
  last_reviewed: string | null;
  review_count: number;
  created_at: string;
};

export type FlashcardFilter = {
  reviewedBefore?: boolean;
  minReviewCount?: number;
  maxReviewCount?: number;
};
