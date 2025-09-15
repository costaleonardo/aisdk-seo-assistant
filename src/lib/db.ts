import { neon } from '@neondatabase/serverless';

// Initialize Neon database client - handle missing DATABASE_URL gracefully
// This allows the build to succeed even without the environment variable
export const sql = process.env.DATABASE_URL 
  ? neon(process.env.DATABASE_URL)
  : null as any; // Will be set via environment variables in Vercel

// Helper function to check if database is configured
export const isDatabaseConfigured = () => {
  return !!process.env.DATABASE_URL;
};

// Type definitions for database tables
export interface Document {
  id: number;
  url: string;
  title: string | null;
  content: string;
  // SEO data columns
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
  meta_robots?: string | null;
  canonical_url?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  og_image?: string | null;
  og_type?: string | null;
  twitter_title?: string | null;
  twitter_description?: string | null;
  twitter_image?: string | null;
  twitter_card?: string | null;
  schema_markup?: string[] | null;
  primary_keyword?: string | null;
  // Content quality metrics columns
  word_count?: number | null;
  sentence_count?: number | null;
  paragraph_count?: number | null;
  average_sentence_length?: number | null;
  average_words_per_paragraph?: number | null;
  readability_score?: number | null;
  reading_time_minutes?: number | null;
  content_depth_score?: number | null;
  topic_keywords?: string[] | null;
  semantic_keywords?: string[] | null;
  content_type?: string | null;
  created_at: Date;
}

export interface DocumentChunk {
  id: number;
  document_id: number;
  content: string;
  embedding: number[]; // Will be stored as VECTOR(1536) in database
  created_at: Date;
}

export interface MetaTag {
  id: number;
  document_id: number;
  tag_name?: string | null;
  tag_property?: string | null;
  tag_content: string;
  created_at: Date;
}

export interface Heading {
  id: number;
  document_id: number;
  level: number;
  text: string;
  order_index: number;
  created_at: Date;
}

export interface Link {
  id: number;
  document_id: number;
  url: string;
  anchor_text: string;
  is_internal: boolean;
  created_at: Date;
}

export interface Image {
  id: number;
  document_id: number;
  src: string;
  alt: string;
  width?: number | null;
  height?: number | null;
  created_at: Date;
}