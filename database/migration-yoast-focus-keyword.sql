-- Migration: Add primary_keyword column for Yoast SEO Focus Keyword support
-- This migration adds support for storing Yoast SEO's focus keyword meta tag

-- Add primary_keyword column to documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS primary_keyword VARCHAR(255);

-- Add index for performance on primary_keyword searches
CREATE INDEX IF NOT EXISTS idx_documents_primary_keyword ON documents(primary_keyword);

-- Add comment for documentation
COMMENT ON COLUMN documents.primary_keyword IS 'Primary focus keyword from Yoast SEO meta tag (yoast-focus-keyword)';