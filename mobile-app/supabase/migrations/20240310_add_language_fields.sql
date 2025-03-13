-- Add language-related fields to the flashcards table
ALTER TABLE flashcards 
ADD COLUMN translation TEXT,
ADD COLUMN source_language TEXT NOT NULL DEFAULT 'en',
ADD COLUMN target_language TEXT NOT NULL DEFAULT 'en';

-- Update existing records to have default language values
UPDATE flashcards 
SET source_language = 'en', target_language = 'en'
WHERE source_language IS NULL OR target_language IS NULL;

-- Create an index on language fields for faster filtering
CREATE INDEX idx_flashcards_languages ON flashcards(source_language, target_language); 