-- ============================================================================
-- SEO Assistant Complete Database Schema Export
-- PostgreSQL with pgvector extension
-- Generated: 2025-01-22
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- 2. CORE TABLES
-- ============================================================================

-- Main documents table for storing scraped web pages
CREATE TABLE IF NOT EXISTS documents (
    id BIGSERIAL PRIMARY KEY,
    url TEXT UNIQUE NOT NULL,
    title VARCHAR(512),
    content TEXT NOT NULL,
    
    -- SEO metadata columns
    meta_title VARCHAR(512),
    meta_description TEXT,
    meta_keywords TEXT,
    meta_robots VARCHAR(100),
    canonical_url TEXT,
    og_title VARCHAR(512),
    og_description TEXT,
    og_image TEXT,
    og_type VARCHAR(100),
    twitter_title VARCHAR(512),
    twitter_description TEXT,
    twitter_image TEXT,
    twitter_card VARCHAR(100),
    schema_markup JSONB,
    
    -- Yoast SEO focus keyword
    primary_keyword VARCHAR(255),
    
    -- Content quality metrics
    word_count INTEGER,
    sentence_count INTEGER,
    paragraph_count INTEGER,
    average_sentence_length DECIMAL(5,2),
    average_words_per_paragraph DECIMAL(7,2),
    readability_score DECIMAL(5,2),
    reading_time_minutes INTEGER,
    content_depth_score INTEGER,
    topic_keywords TEXT[],
    semantic_keywords TEXT[],
    content_type VARCHAR(50),
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Document chunks table for vector embeddings
CREATE TABLE IF NOT EXISTS document_chunks (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding VECTOR(1536), -- OpenAI text-embedding-ada-002 dimension
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 3. SEO ANALYSIS TABLES
-- ============================================================================

-- Meta tags table for storing all meta tags from web pages
CREATE TABLE IF NOT EXISTS meta_tags (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    tag_name VARCHAR(255),
    tag_property VARCHAR(255),
    tag_content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Headings table for storing heading hierarchy (H1-H6)
CREATE TABLE IF NOT EXISTS headings (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    level INTEGER NOT NULL CHECK (level >= 1 AND level <= 6),
    text TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Links table for storing internal and external links
CREATE TABLE IF NOT EXISTS links (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    anchor_text TEXT NOT NULL,
    is_internal BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Images table for storing image metadata
CREATE TABLE IF NOT EXISTS images (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    src TEXT NOT NULL,
    alt TEXT NOT NULL DEFAULT '',
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 4. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Vector similarity search index (HNSW algorithm)
CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON document_chunks 
    USING hnsw (embedding vector_cosine_ops);

-- Core table indexes
CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON document_chunks (document_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents (created_at);
CREATE INDEX IF NOT EXISTS idx_documents_url ON documents (url);

-- SEO column indexes
CREATE INDEX IF NOT EXISTS idx_documents_meta_title ON documents (meta_title);
CREATE INDEX IF NOT EXISTS idx_documents_canonical ON documents (canonical_url);
CREATE INDEX IF NOT EXISTS idx_documents_primary_keyword ON documents (primary_keyword);

-- Content quality metric indexes
CREATE INDEX IF NOT EXISTS idx_documents_word_count ON documents (word_count);
CREATE INDEX IF NOT EXISTS idx_documents_readability_score ON documents (readability_score);
CREATE INDEX IF NOT EXISTS idx_documents_content_depth_score ON documents (content_depth_score);
CREATE INDEX IF NOT EXISTS idx_documents_content_type ON documents (content_type);

-- SEO analysis table indexes
CREATE INDEX IF NOT EXISTS idx_meta_tags_document_id ON meta_tags (document_id);
CREATE INDEX IF NOT EXISTS idx_meta_tags_name ON meta_tags (tag_name);
CREATE INDEX IF NOT EXISTS idx_meta_tags_property ON meta_tags (tag_property);

CREATE INDEX IF NOT EXISTS idx_headings_document_id ON headings (document_id);
CREATE INDEX IF NOT EXISTS idx_headings_level ON headings (level);
CREATE INDEX IF NOT EXISTS idx_headings_order ON headings (order_index);

CREATE INDEX IF NOT EXISTS idx_links_document_id ON links (document_id);
CREATE INDEX IF NOT EXISTS idx_links_internal ON links (is_internal);

CREATE INDEX IF NOT EXISTS idx_images_document_id ON images (document_id);

-- ============================================================================
-- 5. TABLE AND COLUMN COMMENTS (Documentation)
-- ============================================================================

-- Table comments
COMMENT ON TABLE documents IS 'Main table storing web pages with SEO metadata and content quality metrics';
COMMENT ON TABLE document_chunks IS 'Chunked content with vector embeddings for semantic search';
COMMENT ON TABLE meta_tags IS 'All meta tags extracted from scraped web pages';
COMMENT ON TABLE headings IS 'Heading hierarchy (H1-H6) extracted from web pages';
COMMENT ON TABLE links IS 'All links with internal/external classification';
COMMENT ON TABLE images IS 'Image metadata from web pages including alt text and dimensions';

-- Column comments for documents table
COMMENT ON COLUMN documents.url IS 'Unique URL of the scraped web page';
COMMENT ON COLUMN documents.title IS 'Page title extracted from <title> tag';
COMMENT ON COLUMN documents.content IS 'Full text content of the page';

-- SEO metadata comments
COMMENT ON COLUMN documents.meta_title IS 'Content of meta title tag';
COMMENT ON COLUMN documents.meta_description IS 'Content of meta description tag';
COMMENT ON COLUMN documents.meta_keywords IS 'Content of meta keywords tag';
COMMENT ON COLUMN documents.meta_robots IS 'Robots meta tag directives';
COMMENT ON COLUMN documents.canonical_url IS 'Canonical URL if specified';
COMMENT ON COLUMN documents.og_title IS 'Open Graph title for social sharing';
COMMENT ON COLUMN documents.og_description IS 'Open Graph description';
COMMENT ON COLUMN documents.og_image IS 'Open Graph image URL';
COMMENT ON COLUMN documents.og_type IS 'Open Graph content type';
COMMENT ON COLUMN documents.twitter_title IS 'Twitter Card title';
COMMENT ON COLUMN documents.twitter_description IS 'Twitter Card description';
COMMENT ON COLUMN documents.twitter_image IS 'Twitter Card image URL';
COMMENT ON COLUMN documents.twitter_card IS 'Twitter Card type (summary, summary_large_image, etc.)';
COMMENT ON COLUMN documents.schema_markup IS 'JSON-LD and structured data markup';
COMMENT ON COLUMN documents.primary_keyword IS 'Primary focus keyword from Yoast SEO meta tag';

-- Content quality metric comments
COMMENT ON COLUMN documents.word_count IS 'Total number of words in the content';
COMMENT ON COLUMN documents.sentence_count IS 'Total number of sentences in the content';
COMMENT ON COLUMN documents.paragraph_count IS 'Total number of paragraphs in the content';
COMMENT ON COLUMN documents.average_sentence_length IS 'Average words per sentence';
COMMENT ON COLUMN documents.average_words_per_paragraph IS 'Average words per paragraph';
COMMENT ON COLUMN documents.readability_score IS 'Flesch Reading Ease score (0-100, higher is easier to read)';
COMMENT ON COLUMN documents.reading_time_minutes IS 'Estimated reading time in minutes';
COMMENT ON COLUMN documents.content_depth_score IS 'Content depth and quality score (0-100)';
COMMENT ON COLUMN documents.topic_keywords IS 'Array of main topic keywords extracted from content';
COMMENT ON COLUMN documents.semantic_keywords IS 'Array of semantic keywords related to business context';
COMMENT ON COLUMN documents.content_type IS 'Content classification: informational, commercial, navigational, or mixed';

-- Column comments for document_chunks
COMMENT ON COLUMN document_chunks.embedding IS 'Vector embedding from OpenAI text-embedding-ada-002 (1536 dimensions)';
COMMENT ON COLUMN document_chunks.content IS 'Chunked text content for embedding';

-- ============================================================================
-- 6. SAMPLE QUERIES
-- ============================================================================

/*
-- Find similar content using vector similarity
SELECT 
    dc.content,
    d.url,
    d.title,
    1 - (dc.embedding <=> $1::vector) as similarity
FROM document_chunks dc
JOIN documents d ON dc.document_id = d.id
WHERE dc.embedding <=> $1::vector < 0.5
ORDER BY dc.embedding <=> $1::vector
LIMIT 5;

-- Get SEO analysis for a specific URL
SELECT 
    d.*,
    COUNT(DISTINCT h.id) as heading_count,
    COUNT(DISTINCT l.id) as link_count,
    COUNT(DISTINCT i.id) as image_count
FROM documents d
LEFT JOIN headings h ON h.document_id = d.id
LEFT JOIN links l ON l.document_id = d.id
LEFT JOIN images i ON i.document_id = d.id
WHERE d.url = 'https://example.com'
GROUP BY d.id;

-- Find pages with low readability scores
SELECT url, title, readability_score, word_count
FROM documents
WHERE readability_score < 30
ORDER BY readability_score ASC;

-- Find pages by focus keyword
SELECT url, title, primary_keyword, meta_description
FROM documents
WHERE primary_keyword ILIKE '%customer experience%';

-- Analyze heading structure
SELECT 
    d.url,
    d.title,
    h.level,
    h.text,
    h.order_index
FROM documents d
JOIN headings h ON h.document_id = d.id
WHERE d.id = 123
ORDER BY h.order_index;
*/

-- ============================================================================
-- 7. MAINTENANCE QUERIES
-- ============================================================================

/*
-- Check database size
SELECT 
    pg_database.datname,
    pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
WHERE datname = current_database();

-- Check table sizes
SELECT
    schemaname AS schema,
    tablename AS table,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Vacuum and analyze for performance
VACUUM ANALYZE documents;
VACUUM ANALYZE document_chunks;
VACUUM ANALYZE meta_tags;
VACUUM ANALYZE headings;
VACUUM ANALYZE links;
VACUUM ANALYZE images;
*/

-- ============================================================================
-- END OF SCHEMA EXPORT
-- ============================================================================