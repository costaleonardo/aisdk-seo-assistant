-- Migration: Add content quality metrics columns to documents table
-- This migration adds comprehensive content analysis metrics for enhanced SEO capabilities

-- Add content quality metrics columns to documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS word_count INTEGER,
ADD COLUMN IF NOT EXISTS sentence_count INTEGER,
ADD COLUMN IF NOT EXISTS paragraph_count INTEGER,
ADD COLUMN IF NOT EXISTS average_sentence_length DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS average_words_per_paragraph DECIMAL(7,2),
ADD COLUMN IF NOT EXISTS readability_score DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS reading_time_minutes INTEGER,
ADD COLUMN IF NOT EXISTS content_depth_score INTEGER,
ADD COLUMN IF NOT EXISTS topic_keywords TEXT[],
ADD COLUMN IF NOT EXISTS semantic_keywords TEXT[],
ADD COLUMN IF NOT EXISTS content_type VARCHAR(50);

-- Add indexes for performance on frequently queried columns
CREATE INDEX IF NOT EXISTS idx_documents_word_count ON documents(word_count);
CREATE INDEX IF NOT EXISTS idx_documents_readability_score ON documents(readability_score);
CREATE INDEX IF NOT EXISTS idx_documents_content_depth_score ON documents(content_depth_score);
CREATE INDEX IF NOT EXISTS idx_documents_content_type ON documents(content_type);

-- Add comments for documentation
COMMENT ON COLUMN documents.word_count IS 'Total number of words in the content';
COMMENT ON COLUMN documents.sentence_count IS 'Total number of sentences in the content';
COMMENT ON COLUMN documents.paragraph_count IS 'Total number of paragraphs in the content';
COMMENT ON COLUMN documents.average_sentence_length IS 'Average words per sentence';
COMMENT ON COLUMN documents.average_words_per_paragraph IS 'Average words per paragraph';
COMMENT ON COLUMN documents.readability_score IS 'Flesch Reading Ease score (0-100, higher is easier)';
COMMENT ON COLUMN documents.reading_time_minutes IS 'Estimated reading time in minutes';
COMMENT ON COLUMN documents.content_depth_score IS 'Content depth and quality score (0-100)';
COMMENT ON COLUMN documents.topic_keywords IS 'Array of main topic keywords extracted from content';
COMMENT ON COLUMN documents.semantic_keywords IS 'Array of semantic keywords related to business context';
COMMENT ON COLUMN documents.content_type IS 'Content classification: informational, commercial, navigational, or mixed';