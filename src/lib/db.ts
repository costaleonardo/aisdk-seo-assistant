import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Initialize Neon database client
export const sql = neon(process.env.DATABASE_URL);

// Type definitions for database tables
export interface Document {
  id: number;
  url: string;
  title: string | null;
  content: string;
  created_at: Date;
}

export interface DocumentChunk {
  id: number;
  document_id: number;
  content: string;
  embedding: number[]; // Will be stored as VECTOR(1536) in database
  created_at: Date;
}