import { NextRequest } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { streamText, tool, stepCountIs } from 'ai';
import { z } from 'zod';
import { vectorSearch, getDocumentById, getAllDocuments } from '@/lib/vector-store';
import { performSEOAnalysis } from '@/lib/seo-analyzer';
import { calculateSEOScore, getScoreInterpretation } from '@/lib/seo-scoring';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response('Messages array is required', { status: 400 });
    }

    // Convert messages to the format expected by the AI SDK
    const modelMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content || ''
    }));

    const result = streamText({
      model: openai('gpt-4o'),
      system: `You are an expert SEO specialist and AI assistant specifically for Concentrix. You have access to the complete Concentrix website content stored in a vector database, along with comprehensive SEO metadata for each page.

You can:
1. Search through all Concentrix website content to find relevant pages
2. Analyze SEO performance of stored pages
3. Check keyword usage and density across the site
4. Compare SEO performance between different pages
5. Generate prioritized improvement recommendations
6. Access detailed heading structures, meta tags, and technical SEO data

IMPORTANT: All Concentrix website content has been pre-scraped and stored in your database. You don't need URLs - just search for relevant content based on the user's query.

When users ask about:
- "our homepage" → Search for homepage content
- "our services" → Search for services-related content
- "our [topic]" → Search for that topic in the database
- SEO analysis → Search for relevant pages and analyze their stored SEO data

Guidelines:
- Use the search tool to find relevant Concentrix content based on the query
- Analyze the stored SEO metadata for comprehensive insights
- Explain technical SEO concepts in accessible language
- Prioritize high-impact, achievable improvements for Concentrix
- Consider Concentrix's business goals in recommendations
- Provide specific, measurable suggestions based on the stored data
- Always explain findings in clear, actionable terms specific to Concentrix's needs`,
      messages: modelMessages,
      stopWhen: stepCountIs(5),
      onStepFinish: ({ text, toolCalls, toolResults, stepType, usage }) => {
        console.log('Step finished:', {
          stepType,
          toolCalls: toolCalls?.map(tc => ({ name: tc.toolName, args: tc.args })),
          toolResults: toolResults?.map(tr => ({ toolCallId: tr.toolCallId, result: tr.result })),
          textLength: text?.length || 0
        });
      },
      tools: {
        searchContent: tool({
          description: 'Search through Concentrix website content stored in the vector database',
          inputSchema: z.object({
            query: z.string().describe('The search query to find relevant Concentrix content'),
            limit: z.number().optional().default(5).describe('Number of results to return')
          }),
          execute: async ({ query, limit }) => {
            console.log('searchContent called with:', { query, limit });
            try {
              const results = await vectorSearch(query, limit);
              const enrichedResults = await Promise.all(
                results.map(async (result) => {
                  const doc = await getDocumentById(result.document_id);
                  return {
                    ...result,
                    url: doc?.url,
                    title: doc?.title,
                    meta_description: doc?.meta_description
                  };
                })
              );
              console.log('searchContent results:', enrichedResults);
              return {
                success: true,
                results: enrichedResults,
                count: enrichedResults.length
              };
            } catch (error) {
              console.error('searchContent error:', error);
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Search failed'
              };
            }
          }
        }),
        analyzePage: tool({
          description: 'Analyze SEO data for a specific page from the database by document ID',
          inputSchema: z.object({
            documentId: z.number().describe('The document ID to analyze'),
          }),
          execute: async ({ documentId }) => {
            console.log('analyzePage called with documentId:', documentId);
            try {
              const document = await getDocumentById(documentId);
              if (!document) {
                console.log('Document not found for ID:', documentId);
                return { success: false, error: 'Document not found' };
              }
              console.log('Found document:', document.url, document.title);
              
              // Get all SEO-related data from the database
              const { sql } = await import('@/lib/db');
              
              const [metaTags, headings, links, images] = await Promise.all([
                sql`SELECT * FROM meta_tags WHERE document_id = ${documentId}`,
                sql`SELECT * FROM headings WHERE document_id = ${documentId} ORDER BY order_index`,
                sql`SELECT * FROM links WHERE document_id = ${documentId}`,
                sql`SELECT * FROM images WHERE document_id = ${documentId}`
              ]);
              
              // Construct scraped content format for SEO analysis
              const scrapedContent = {
                url: document.url,
                title: document.title || '',
                content: document.content,
                meta_tags: metaTags,
                headings: headings.map((h: any) => ({
                  level: h.level,
                  text: h.text,
                  order: h.order_index
                })),
                links: links.map((l: any) => ({
                  url: l.url,
                  anchor_text: l.anchor_text,
                  is_internal: l.is_internal
                })),
                images: images.map((i: any) => ({
                  src: i.src,
                  alt: i.alt,
                  width: i.width,
                  height: i.height
                })),
                seo_data: {
                  meta_title: document.meta_title || undefined,
                  meta_description: document.meta_description || undefined,
                  meta_keywords: document.meta_keywords || undefined,
                  meta_robots: document.meta_robots || undefined,
                  canonical_url: document.canonical_url || undefined,
                  og_title: document.og_title || undefined,
                  og_description: document.og_description || undefined,
                  og_image: document.og_image || undefined,
                  og_type: document.og_type || undefined,
                  twitter_title: document.twitter_title || undefined,
                  twitter_description: document.twitter_description || undefined,
                  twitter_image: document.twitter_image || undefined,
                  twitter_card: document.twitter_card || undefined,
                  schema_markup: document.schema_markup || []
                }
              };
              
              const seoAnalysis = performSEOAnalysis(scrapedContent);
              const scoreData = calculateSEOScore(seoAnalysis);
              const interpretation = getScoreInterpretation(scoreData);
              
              return {
                success: true,
                url: document.url,
                title: document.title,
                analysis: seoAnalysis,
                score: scoreData,
                interpretation
              };
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Analysis failed'
              };
            }
          }
        }),
        listPages: tool({
          description: 'List all available Concentrix pages in the database',
          inputSchema: z.object({
            limit: z.number().optional().default(20).describe('Number of pages to return')
          }),
          execute: async ({ limit }) => {
            try {
              const documents = await getAllDocuments(limit);
              return {
                success: true,
                pages: documents.map(doc => ({
                  id: doc.id,
                  url: doc.url,
                  title: doc.title,
                  created_at: doc.created_at
                })),
                count: documents.length
              };
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to list pages'
              };
            }
          }
        })
      }
    });

    // Return data stream response
    return result.toTextStreamResponse();
    
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}