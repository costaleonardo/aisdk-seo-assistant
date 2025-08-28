-- Migration to add SEO data support to the database
-- Run this SQL script on your Neon database

-- 1. Add SEO columns to the existing documents table
ALTER TABLE documents 
ADD COLUMN meta_title VARCHAR(512),
ADD COLUMN meta_description TEXT,
ADD COLUMN meta_keywords TEXT,
ADD COLUMN meta_robots VARCHAR(100),
ADD COLUMN canonical_url TEXT,
ADD COLUMN og_title VARCHAR(512),
ADD COLUMN og_description TEXT,
ADD COLUMN og_image TEXT,
ADD COLUMN og_type VARCHAR(100),
ADD COLUMN twitter_title VARCHAR(512),
ADD COLUMN twitter_description TEXT,
ADD COLUMN twitter_image TEXT,
ADD COLUMN twitter_card VARCHAR(100),
ADD COLUMN schema_markup JSONB;

-- 2. Create meta_tags table for storing all meta tags
CREATE TABLE IF NOT EXISTS meta_tags (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    tag_name VARCHAR(255),
    tag_property VARCHAR(255),
    tag_content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create headings table for storing heading hierarchy
CREATE TABLE IF NOT EXISTS headings (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    level INTEGER NOT NULL CHECK (level >= 1 AND level <= 6),
    text TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Create links table for storing internal and external links
CREATE TABLE IF NOT EXISTS links (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    anchor_text TEXT NOT NULL,
    is_internal BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Create images table for storing image data
CREATE TABLE IF NOT EXISTS images (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    src TEXT NOT NULL,
    alt TEXT NOT NULL DEFAULT '',
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_meta_tags_document_id ON meta_tags (document_id);
CREATE INDEX IF NOT EXISTS idx_meta_tags_name ON meta_tags (tag_name);
CREATE INDEX IF NOT EXISTS idx_meta_tags_property ON meta_tags (tag_property);

CREATE INDEX IF NOT EXISTS idx_headings_document_id ON headings (document_id);
CREATE INDEX IF NOT EXISTS idx_headings_level ON headings (level);
CREATE INDEX IF NOT EXISTS idx_headings_order ON headings (order_index);

CREATE INDEX IF NOT EXISTS idx_links_document_id ON links (document_id);
CREATE INDEX IF NOT EXISTS idx_links_internal ON links (is_internal);

CREATE INDEX IF NOT EXISTS idx_images_document_id ON images (document_id);

-- 7. Add indexes for SEO columns in documents table
CREATE INDEX IF NOT EXISTS idx_documents_meta_title ON documents (meta_title);
CREATE INDEX IF NOT EXISTS idx_documents_canonical ON documents (canonical_url);

-- 8. Comments for documentation
COMMENT ON TABLE meta_tags IS 'Stores all meta tags from scraped web pages';
COMMENT ON TABLE headings IS 'Stores heading hierarchy (H1-H6) from web pages';
COMMENT ON TABLE links IS 'Stores all links with internal/external classification';
COMMENT ON TABLE images IS 'Stores image metadata from web pages';
COMMENT ON COLUMN documents.schema_markup IS 'JSON-LD and structured data markup';