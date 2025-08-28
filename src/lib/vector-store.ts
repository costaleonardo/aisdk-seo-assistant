import { sql, type Document, type DocumentChunk } from './db';
import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';

export interface SearchResult {
  content: string;
  similarity: number;
  document_id: number;
  chunk_id: number;
}

export interface StoredDocument {
  id: number;
  url: string;
  title: string | null;
  chunksCreated: number;
}

export async function storeDocument(
  content: { title: string; content: string; url: string }, 
  chunks: string[]
): Promise<StoredDocument> {
  try {
    // First, check if document with this URL already exists
    const existingDoc = await sql`
      SELECT id FROM documents WHERE url = ${content.url}
    `;
    
    if (existingDoc.length > 0) {
      // Delete existing document and its chunks
      await sql`
        DELETE FROM documents WHERE url = ${content.url}
      `;
    }
    
    // Insert new document
    const [document] = await sql`
      INSERT INTO documents (url, title, content)
      VALUES (${content.url}, ${content.title}, ${content.content})
      RETURNING id, url, title
    `;
    
    if (!document) {
      throw new Error('Failed to insert document');
    }
    
    let chunksCreated = 0;
    
    // Generate and store embeddings for each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      if (!chunk.trim()) {
        continue; // Skip empty chunks
      }
      
      try {
        // Generate embedding using AI SDK
        const { embedding } = await embed({
          model: openai.embedding('text-embedding-ada-002'),
          value: chunk
        });
        
        // Store chunk with embedding
        await sql`
          INSERT INTO document_chunks (document_id, content, embedding)
          VALUES (
            ${document.id}, 
            ${chunk}, 
            ${JSON.stringify(embedding)}::vector
          )
        `;
        
        chunksCreated++;
      } catch (error) {
        console.error(`Failed to process chunk ${i}:`, error);
        // Continue with other chunks even if one fails
      }
    }
    
    if (chunksCreated === 0) {
      // Clean up document if no chunks were successfully created
      await sql`DELETE FROM documents WHERE id = ${document.id}`;
      throw new Error('Failed to create any chunks for document');
    }
    
    return {
      id: document.id,
      url: document.url,
      title: document.title,
      chunksCreated
    };
  } catch (error) {
    throw new Error(`Failed to store document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function vectorSearch(
  query: string, 
  limit: number = 5,
  similarityThreshold: number = 0.7
): Promise<SearchResult[]> {
  try {
    if (!query.trim()) {
      return [];
    }
    
    // Generate query embedding
    const { embedding } = await embed({
      model: openai.embedding('text-embedding-ada-002'),
      value: query
    });
    
    // Search for similar chunks using cosine similarity
    const results = await sql`
      SELECT 
        dc.id as chunk_id,
        dc.document_id,
        dc.content,
        1 - (dc.embedding <=> ${JSON.stringify(embedding)}::vector) as similarity
      FROM document_chunks dc
      WHERE 1 - (dc.embedding <=> ${JSON.stringify(embedding)}::vector) > ${similarityThreshold}
      ORDER BY dc.embedding <=> ${JSON.stringify(embedding)}::vector
      LIMIT ${limit}
    `;
    
    return results.map((item: any) => ({
      chunk_id: item.chunk_id,
      document_id: item.document_id,
      content: item.content,
      similarity: parseFloat(item.similarity)
    }));
  } catch (error) {
    console.error('Vector search error:', error);
    throw new Error(`Vector search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getDocumentById(documentId: number): Promise<Document | null> {
  try {
    const result = await sql`
      SELECT * FROM documents WHERE id = ${documentId}
    `;
    return result.length > 0 ? result[0] as Document : null;
  } catch (error) {
    console.error('Error fetching document:', error);
    return null;
  }
}

export async function getAllDocuments(limit: number = 50): Promise<Document[]> {
  try {
    const documents = await sql`
      SELECT * FROM documents 
      ORDER BY created_at DESC 
      LIMIT ${limit}
    `;
    return documents as Document[];
  } catch (error) {
    console.error('Error fetching documents:', error);
    return [];
  }
}

export async function deleteDocument(documentId: number): Promise<boolean> {
  try {
    const result = await sql`
      DELETE FROM documents WHERE id = ${documentId}
    `;
    return Array.isArray(result) ? result.length > 0 : false;
  } catch (error) {
    console.error('Error deleting document:', error);
    return false;
  }
}

export async function getDocumentChunks(documentId: number): Promise<DocumentChunk[]> {
  try {
    const chunks = await sql`
      SELECT * FROM document_chunks 
      WHERE document_id = ${documentId}
      ORDER BY id
    `;
    return chunks as DocumentChunk[];
  } catch (error) {
    console.error('Error fetching document chunks:', error);
    return [];
  }
}

// Helper function to test vector search functionality
export async function testVectorStore(): Promise<void> {
  try {
    console.log('Testing vector store connection...');
    
    // Test basic database connectivity
    const testQuery = await sql`SELECT 1 as test`;
    console.log('Database connection: OK', testQuery);
    
    // Test vector extension
    const vectorTest = await sql`
      SELECT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'vector'
      ) as vector_enabled
    `;
    console.log('Vector extension:', vectorTest[0].vector_enabled ? 'OK' : 'NOT INSTALLED');
    
    // Test embedding generation
    const { embedding } = await embed({
      model: openai.embedding('text-embedding-ada-002'),
      value: 'test embedding'
    });
    console.log('Embedding generation: OK', `(${embedding.length} dimensions)`);
    
    console.log('Vector store test completed successfully');
  } catch (error) {
    console.error('Vector store test failed:', error);
    throw error;
  }
}