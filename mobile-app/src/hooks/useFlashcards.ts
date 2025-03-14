import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Database } from "../types/supabase";

type Flashcard = Database["public"]["Tables"]["flashcards"]["Row"];

export function useFlashcards() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all flashcards
  const fetchFlashcards = async (
    sourceLanguage?: string,
    targetLanguage?: string
  ) => {
    try {
      setLoading(true);
      let query = supabase
        .from("flashcards")
        .select("*")
        .order("created_at", { ascending: false });

      // Apply language filters if provided
      if (sourceLanguage) {
        query = query.eq("source_language", sourceLanguage);
      }

      if (targetLanguage) {
        query = query.eq("target_language", targetLanguage);
      }

      const { data, error } = await query;

      if (error) throw error;
      setFlashcards(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Create a new flashcard
  const createFlashcard = async (
    word: string,
    images: string[],
    sourceLanguage: string = "en",
    targetLanguage: string = "en",
    translation: string | null = null
  ) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("flashcards")
        .insert([
          {
            word,
            images,
            source_language: sourceLanguage,
            target_language: targetLanguage,
            translation,
            review_count: 0,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      setFlashcards((prev) => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update flashcard review status
  const updateReviewStatus = async (id: string) => {
    try {
      const { error } = await supabase
        .from("flashcards")
        .update({
          last_reviewed: new Date().toISOString(),
          review_count: supabase.rpc("increment_review_count"),
        })
        .eq("id", id);

      if (error) throw error;
      await fetchFlashcards(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      throw err;
    }
  };

  // Delete a flashcard
  const deleteFlashcard = async (id: string) => {
    try {
      const { error } = await supabase.from("flashcards").delete().eq("id", id);

      if (error) throw error;
      setFlashcards((prev) => prev.filter((card) => card.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      throw err;
    }
  };

  // Load flashcards on mount
  useEffect(() => {
    fetchFlashcards();
  }, []);

  return {
    flashcards,
    loading,
    error,
    createFlashcard,
    updateReviewStatus,
    deleteFlashcard,
    refreshFlashcards: fetchFlashcards,
  };
}
