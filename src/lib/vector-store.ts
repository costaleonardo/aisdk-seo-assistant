import { sql, type Document, type DocumentChunk, type MetaTag, type Heading, type Link, type Image } from './db';
import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';
import { type ScrapedContent } from './scraper';

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
  scrapedContent: ScrapedContent, 
  chunks: string[]
): Promise<StoredDocument> {
  try {
    // First, check if document with this URL already exists
    const existingDoc = await sql`
      SELECT id FROM documents WHERE url = ${scrapedContent.url}
    `;
    
    if (existingDoc.length > 0) {
      // Delete existing document and its chunks (cascading deletes will handle related tables)
      await sql`
        DELETE FROM documents WHERE url = ${scrapedContent.url}
      `;
    }
    
    // Prepare SEO data and content quality metrics for insertion
    const { seo_data, content_quality } = scrapedContent;
    
    // Try to insert with content quality metrics, fall back to basic insert if columns don't exist
    let document;
    try {
      // First try with content quality metrics
      [document] = await sql`
        INSERT INTO documents (
          url, title, content,
          meta_title, meta_description, meta_keywords, meta_robots, canonical_url,
          og_title, og_description, og_image, og_type,
          twitter_title, twitter_description, twitter_image, twitter_card,
          schema_markup,
          word_count, sentence_count, paragraph_count, average_sentence_length, 
          average_words_per_paragraph, readability_score, reading_time_minutes,
          content_depth_score, topic_keywords, semantic_keywords, content_type
        )
        VALUES (
          ${scrapedContent.url}, 
          ${scrapedContent.title}, 
          ${scrapedContent.content},
          ${seo_data.meta_title || null},
          ${seo_data.meta_description || null},
          ${seo_data.meta_keywords || null},
          ${seo_data.meta_robots || null},
          ${seo_data.canonical_url || null},
          ${seo_data.og_title || null},
          ${seo_data.og_description || null},
          ${seo_data.og_image || null},
          ${seo_data.og_type || null},
          ${seo_data.twitter_title || null},
          ${seo_data.twitter_description || null},
          ${seo_data.twitter_image || null},
          ${seo_data.twitter_card || null},
          ${JSON.stringify(seo_data.schema_markup)},
          ${content_quality.word_count},
          ${content_quality.sentence_count},
          ${content_quality.paragraph_count},
          ${content_quality.average_sentence_length},
          ${content_quality.average_words_per_paragraph},
          ${content_quality.readability_score},
          ${content_quality.reading_time_minutes},
          ${content_quality.content_depth_score},
          ${content_quality.topic_keywords},
          ${content_quality.semantic_keywords},
          ${content_quality.content_type}
        )
        RETURNING id, url, title
      `;
    } catch (error) {
      // Fall back to basic insert without content quality columns if they don't exist
      console.log('Content quality columns not found, using basic insert:', error);
      [document] = await sql`
        INSERT INTO documents (
          url, title, content,
          meta_title, meta_description, meta_keywords, meta_robots, canonical_url,
          og_title, og_description, og_image, og_type,
          twitter_title, twitter_description, twitter_image, twitter_card,
          schema_markup
        )
        VALUES (
          ${scrapedContent.url}, 
          ${scrapedContent.title}, 
          ${scrapedContent.content},
          ${seo_data.meta_title || null},
          ${seo_data.meta_description || null},
          ${seo_data.meta_keywords || null},
          ${seo_data.meta_robots || null},
          ${seo_data.canonical_url || null},
          ${seo_data.og_title || null},
          ${seo_data.og_description || null},
          ${seo_data.og_image || null},
          ${seo_data.og_type || null},
          ${seo_data.twitter_title || null},
          ${seo_data.twitter_description || null},
          ${seo_data.twitter_image || null},
          ${seo_data.twitter_card || null},
          ${JSON.stringify(seo_data.schema_markup)}
        )
        RETURNING id, url, title
      `;
    }
    
    if (!document) {
      throw new Error('Failed to insert document');
    }
    
    // Store meta tags
    for (const metaTag of scrapedContent.meta_tags) {
      try {
        await sql`
          INSERT INTO meta_tags (document_id, tag_name, tag_property, tag_content)
          VALUES (${document.id}, ${metaTag.name || null}, ${metaTag.property || null}, ${metaTag.content})
        `;
      } catch (error) {
        console.error('Failed to store meta tag:', error);
      }
    }
    
    // Store headings
    for (const heading of scrapedContent.headings) {
      try {
        await sql`
          INSERT INTO headings (document_id, level, text, order_index)
          VALUES (${document.id}, ${heading.level}, ${heading.text}, ${heading.order})
        `;
      } catch (error) {
        console.error('Failed to store heading:', error);
      }
    }
    
    // Store links
    for (const link of scrapedContent.links) {
      try {
        await sql`
          INSERT INTO links (document_id, url, anchor_text, is_internal)
          VALUES (${document.id}, ${link.url}, ${link.anchor_text}, ${link.is_internal})
        `;
      } catch (error) {
        console.error('Failed to store link:', error);
      }
    }
    
    // Store images
    for (const image of scrapedContent.images) {
      try {
        await sql`
          INSERT INTO images (document_id, src, alt, width, height)
          VALUES (${document.id}, ${image.src}, ${image.alt}, ${image.width || null}, ${image.height || null})
        `;
      } catch (error) {
        console.error('Failed to store image:', error);
      }
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

// SEO-specific helper functions
export async function getDocumentSEOData(documentId: number) {
  try {
    const [document] = await sql`
      SELECT 
        d.*,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', mt.id,
              'tag_name', mt.tag_name,
              'tag_property', mt.tag_property,
              'tag_content', mt.tag_content
            )
          ) FILTER (WHERE mt.id IS NOT NULL), 
          '[]'
        ) as meta_tags,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', h.id,
              'level', h.level,
              'text', h.text,
              'order_index', h.order_index
            )
            ORDER BY h.order_index
          ) FILTER (WHERE h.id IS NOT NULL),
          '[]'
        ) as headings,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', l.id,
              'url', l.url,
              'anchor_text', l.anchor_text,
              'is_internal', l.is_internal
            )
          ) FILTER (WHERE l.id IS NOT NULL),
          '[]'
        ) as links,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', i.id,
              'src', i.src,
              'alt', i.alt,
              'width', i.width,
              'height', i.height
            )
          ) FILTER (WHERE i.id IS NOT NULL),
          '[]'
        ) as images
      FROM documents d
      LEFT JOIN meta_tags mt ON d.id = mt.document_id
      LEFT JOIN headings h ON d.id = h.document_id
      LEFT JOIN links l ON d.id = l.document_id
      LEFT JOIN images i ON d.id = i.document_id
      WHERE d.id = ${documentId}
      GROUP BY d.id
    `;
    
    return document || null;
  } catch (error) {
    console.error('Error fetching SEO data:', error);
    return null;
  }
}

export async function getDocumentHeadings(documentId: number): Promise<Heading[]> {
  try {
    const headings = await sql`
      SELECT * FROM headings 
      WHERE document_id = ${documentId}
      ORDER BY order_index
    `;
    return headings as Heading[];
  } catch (error) {
    console.error('Error fetching headings:', error);
    return [];
  }
}

export async function getDocumentLinks(documentId: number, internalOnly: boolean = false): Promise<Link[]> {
  try {
    const links = await sql`
      SELECT * FROM links 
      WHERE document_id = ${documentId}
      ${internalOnly ? sql`AND is_internal = true` : sql``}
      ORDER BY id
    `;
    return links as Link[];
  } catch (error) {
    console.error('Error fetching links:', error);
    return [];
  }
}

export async function getDocumentImages(documentId: number): Promise<Image[]> {
  try {
    const images = await sql`
      SELECT * FROM images 
      WHERE document_id = ${documentId}
      ORDER BY id
    `;
    return images as Image[];
  } catch (error) {
    console.error('Error fetching images:', error);
    return [];
  }
}

// Function to detect and retrieve homepage document
export async function getHomepageDocument(): Promise<Document | null> {
  try {
    // Try exact homepage URL first: https://www.concentrix.com/
    const exactResult = await sql`
      SELECT * FROM documents 
      WHERE url = 'https://www.concentrix.com/' 
      ORDER BY created_at DESC LIMIT 1
    `;
    
    if (exactResult.length > 0) {
      console.log('✅ Found homepage: https://www.concentrix.com/');
      return exactResult[0] as Document;
    }

    // Fallback patterns if exact URL not found
    const fallbackPatterns = [
      'https://concentrix.com/',
      'http://www.concentrix.com/',
      'http://concentrix.com/'
    ];

    for (const pattern of fallbackPatterns) {
      const result = await sql`SELECT * FROM documents WHERE url = ${pattern} ORDER BY created_at DESC LIMIT 1`;
      if (result.length > 0) {
        console.log('✅ Found homepage with fallback URL:', result[0].url);
        return result[0] as Document;
      }
    }

    // Try regex pattern for domain root
    const regexResult = await sql`
      SELECT * FROM documents 
      WHERE url ~ '^https?://(www\.)?concentrix\.com/?$' 
      ORDER BY created_at DESC LIMIT 1
    `;
    
    if (regexResult.length > 0) {
      console.log('✅ Found homepage with regex pattern:', regexResult[0].url);
      return regexResult[0] as Document;
    }

    // Find the shortest Concentrix URL (most likely to be homepage)
    const shortestUrlResult = await sql`
      SELECT * FROM documents 
      WHERE url LIKE '%concentrix.com%' 
      ORDER BY LENGTH(url), created_at DESC 
      LIMIT 1
    `;
    
    if (shortestUrlResult.length > 0) {
      console.log('✅ Using shortest URL as homepage:', shortestUrlResult[0].url);
      return shortestUrlResult[0] as Document;
    }

    console.log('❌ No homepage found');
    return null;
  } catch (error) {
    console.error('❌ Error finding homepage:', error);
    return null;
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