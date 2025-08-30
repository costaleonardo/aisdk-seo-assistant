import { NextRequest } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { streamText, tool, stepCountIs } from 'ai';
import { z } from 'zod';
import { vectorSearch, getDocumentById, getAllDocuments, getHomepageDocument } from '@/lib/vector-store';
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
      system: `You are an expert SEO specialist and content quality analyst specifically for Concentrix. You have access to the complete Concentrix website content stored in a vector database, along with comprehensive SEO metadata and advanced content quality metrics for each page.

You can:
1. Search through all Concentrix website content to find relevant pages
2. Analyze SEO performance of stored pages with enhanced content quality insights
3. Check content readability, depth, and target audience analysis
4. Analyze topic coverage and semantic keyword richness
5. Compare SEO performance and content quality between different pages
6. Generate prioritized improvement recommendations for both SEO and content quality
7. Access detailed heading structures, meta tags, technical SEO data, and content metrics

Content Quality Features Available:
- Word count, sentence count, paragraph analysis
- Flesch Reading Ease scores (0-100, higher = more readable)
- Content depth scoring (0-100, based on comprehensiveness)
- Topic keyword extraction and semantic keyword identification
- Content type classification (informational, commercial, navigational, mixed)
- Reading time estimation and target audience identification

Available Tools:
- getHomepage: Get the Concentrix homepage specifically (use when users ask about "homepage", "home page", "main page")
- searchContent: Vector search through Concentrix content
- analyzePage: Comprehensive SEO + content quality analysis by document ID
- listPages: Browse available pages in the database
- analyzeContentQuality: Deep content quality metrics analysis
- checkReadability: Readability and target audience analysis
- analyzeContentDepth: Content depth, topic coverage, and semantic richness

IMPORTANT: All Concentrix website content has been pre-scraped and stored in your database. You don't need URLs - just search for relevant content based on the user's query.

When users ask about:
- "our homepage" or "home page" → ALWAYS use getHomepage tool first (NEVER use searchContent for homepage queries)
- "homepage meta description" → Use getHomepage, then analyzePage with the returned document ID
- "our services" → Search for services-related content
- "content quality" → Use content quality analysis tools
- "readability" → Use readability analysis tools
- SEO analysis → Search for relevant pages and analyze their comprehensive data

CRITICAL: NEVER use searchContent for homepage queries. The homepage is always at https://www.concentrix.com/ and must be retrieved using getHomepage tool only.

Guidelines:
- Use search tools to find relevant Concentrix content based on queries
- Analyze both SEO metadata AND content quality metrics for comprehensive insights
- Explain technical SEO and content concepts in accessible language
- Prioritize high-impact improvements for both SEO and content strategy
- Consider Concentrix's business goals in all recommendations
- Provide specific, measurable suggestions based on stored SEO and content data
- Always explain findings in clear, actionable terms specific to Concentrix's needs`,
      messages: modelMessages,
      stopWhen: stepCountIs(5),
      onStepFinish: ({ text, toolCalls, toolResults, usage }) => {
        console.log('Step finished:', {
          toolCalls: toolCalls?.map(tc => ({ name: tc.toolName })),
          toolResults: toolResults?.map(tr => ({ toolCallId: tr.toolCallId })),
          textLength: text?.length || 0
        });
      },
      tools: {
        getHomepage: tool({
          description: 'Get the Concentrix homepage document - use this when users ask about the homepage, home page, main page, or landing page',
          inputSchema: z.object({}),
          execute: async () => {
            console.log('getHomepage called');
            try {
              const homepage = await getHomepageDocument();
              if (!homepage) {
                console.log('Homepage not found');
                return { success: false, error: 'Homepage not found in database' };
              }
              
              console.log('Found homepage:', homepage.url, homepage.title);
              
              // VALIDATION: Ensure this is actually the correct homepage
              if (homepage.url !== 'https://www.concentrix.com/') {
                console.warn('⚠️ WARNING: Detected homepage URL is not https://www.concentrix.com/');
                console.warn('   Detected URL:', homepage.url);
              }
              
              // VALIDATION: Check meta description
              const expectedMetaStart = "Concentrix is a global technology and services leader";
              if (homepage.meta_description && !homepage.meta_description.startsWith(expectedMetaStart)) {
                console.warn('⚠️ WARNING: Meta description does not match expected homepage meta');
                console.warn('   Expected to start with:', expectedMetaStart);
                console.warn('   Actual:', homepage.meta_description);
              }
              
              return {
                success: true,
                homepage: {
                  id: homepage.id,
                  url: homepage.url,
                  title: homepage.title,
                  meta_description: homepage.meta_description,
                  created_at: homepage.created_at
                },
                validation: {
                  isCorrectUrl: homepage.url === 'https://www.concentrix.com/',
                  hasCorrectMeta: homepage.meta_description?.startsWith(expectedMetaStart) || false
                },
                message: `Found the Concentrix homepage: ${homepage.title} (${homepage.url}). Meta description: "${homepage.meta_description}". Document ID: ${homepage.id}`
              };
            } catch (error) {
              console.error('getHomepage error:', error);
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to retrieve homepage'
              };
            }
          }
        }),
        searchContent: tool({
          description: 'Search through Concentrix website content stored in the vector database',
          inputSchema: z.object({
            query: z.string().describe('The search query to find relevant Concentrix content'),
            limit: z.number().optional().default(5).describe('Number of results to return')
          }),
          execute: async ({ query, limit }) => {
            console.log('searchContent called with:', { query, limit });
            try {
              // Check if this is a homepage-related query
              const isHomepageQuery = /\b(homepage|home\s*page|main\s*page|landing\s*page)\b/i.test(query);
              
              if (isHomepageQuery) {
                console.log('Homepage query detected, checking for homepage first');
                const homepage = await getHomepageDocument();
                if (homepage) {
                  // Return homepage as first result, then add vector search results
                  const vectorResults = await vectorSearch(query, Math.max(1, limit - 1));
                  const enrichedVectorResults = await Promise.all(
                    vectorResults
                      .filter(result => result.document_id !== homepage.id) // Avoid duplicates
                      .map(async (result) => {
                        const doc = await getDocumentById(result.document_id);
                        return {
                          ...result,
                          url: doc?.url,
                          title: doc?.title,
                          meta_description: doc?.meta_description
                        };
                      })
                  );
                  
                  // Create homepage result entry
                  const homepageResult = {
                    document_id: homepage.id,
                    content: homepage.content?.substring(0, 500) + '...' || 'Homepage content',
                    similarity: 1.0, // Highest priority
                    chunk_id: 0,
                    url: homepage.url,
                    title: homepage.title,
                    meta_description: homepage.meta_description
                  };
                  
                  const allResults = [homepageResult, ...enrichedVectorResults];
                  console.log('searchContent results (homepage first):', allResults.length);
                  return {
                    success: true,
                    results: allResults,
                    count: allResults.length,
                    note: 'Homepage prioritized for this query'
                  };
                }
              }
              
              // Regular vector search
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
              const mappedHeadings = headings.map((h: any) => ({
                level: h.level,
                text: h.text,
                order: h.order_index
              }));

              // Import the content analysis function
              const { analyzeContentQuality } = await import('@/lib/scraper');
              const contentQuality = analyzeContentQuality(document.content, document.title || '', mappedHeadings);

              const scrapedContent = {
                url: document.url,
                title: document.title || '',
                content: document.content,
                content_quality: contentQuality,
                meta_tags: metaTags,
                headings: mappedHeadings,
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
        }),
        analyzeContentQuality: tool({
          description: 'Analyze content quality metrics including readability, word count, and content depth for a specific document',
          inputSchema: z.object({
            documentId: z.number().describe('The document ID to analyze content quality for')
          }),
          execute: async ({ documentId }) => {
            console.log('analyzeContentQuality called with documentId:', documentId);
            try {
              const document = await getDocumentById(documentId);
              if (!document) {
                return { success: false, error: 'Document not found' };
              }
              
              // Get content quality metrics from database or calculate them
              const contentQuality = {
                word_count: document.word_count || 0,
                sentence_count: document.sentence_count || 0,
                paragraph_count: document.paragraph_count || 0,
                average_sentence_length: document.average_sentence_length || 0,
                average_words_per_paragraph: document.average_words_per_paragraph || 0,
                readability_score: document.readability_score || 0,
                reading_time_minutes: document.reading_time_minutes || 0,
                content_depth_score: document.content_depth_score || 0,
                topic_keywords: document.topic_keywords || [],
                semantic_keywords: document.semantic_keywords || [],
                content_type: document.content_type || 'unknown'
              };

              // Import helper functions
              const { getReadabilityLevel, getContentDepthLevel } = await import('@/lib/seo-tools');
              
              const analysis = {
                url: document.url,
                title: document.title,
                metrics: contentQuality,
                readabilityLevel: getReadabilityLevel(contentQuality.readability_score),
                contentDepthLevel: getContentDepthLevel(contentQuality.content_depth_score),
                summary: `Content quality for ${document.url}: ${contentQuality.word_count} words (${contentQuality.reading_time_minutes} min read), ${contentQuality.readability_score}/100 readability, ${contentQuality.content_depth_score}/100 depth score. Content type: ${contentQuality.content_type}.`
              };
              
              return {
                success: true,
                analysis
              };
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to analyze content quality'
              };
            }
          }
        }),
        checkReadability: tool({
          description: 'Check readability metrics and target audience for a specific document',
          inputSchema: z.object({
            documentId: z.number().describe('The document ID to check readability for')
          }),
          execute: async ({ documentId }) => {
            console.log('checkReadability called with documentId:', documentId);
            try {
              const document = await getDocumentById(documentId);
              if (!document) {
                return { success: false, error: 'Document not found' };
              }
              
              const readabilityData = {
                readability_score: document.readability_score || 0,
                average_sentence_length: document.average_sentence_length || 0,
                sentence_count: document.sentence_count || 0,
                paragraph_count: document.paragraph_count || 0,
                reading_time_minutes: document.reading_time_minutes || 0
              };

              // Import helper functions
              const { getReadabilityLevel, determineTargetAudience } = await import('@/lib/seo-tools');
              
              const audit = {
                url: document.url,
                title: document.title,
                readabilityScore: readabilityData.readability_score,
                readabilityLevel: getReadabilityLevel(readabilityData.readability_score),
                averageSentenceLength: readabilityData.average_sentence_length,
                targetAudience: determineTargetAudience(readabilityData.readability_score),
                readingTime: readabilityData.reading_time_minutes,
                summary: `Readability for ${document.url}: ${getReadabilityLevel(readabilityData.readability_score)} (${readabilityData.readability_score}/100). Average ${readabilityData.average_sentence_length} words/sentence. ${readabilityData.reading_time_minutes} minute read. Target: ${determineTargetAudience(readabilityData.readability_score)}.`
              };
              
              return {
                success: true,
                audit
              };
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to check readability'
              };
            }
          }
        }),
        analyzeContentDepth: tool({
          description: 'Analyze content depth, topic coverage, and semantic richness for a specific document',
          inputSchema: z.object({
            documentId: z.number().describe('The document ID to analyze content depth for')
          }),
          execute: async ({ documentId }) => {
            console.log('analyzeContentDepth called with documentId:', documentId);
            try {
              const document = await getDocumentById(documentId);
              if (!document) {
                return { success: false, error: 'Document not found' };
              }
              
              const depthData = {
                content_depth_score: document.content_depth_score || 0,
                word_count: document.word_count || 0,
                topic_keywords: document.topic_keywords || [],
                semantic_keywords: document.semantic_keywords || []
              };

              // Import helper functions
              const { getContentDepthLevel, assessTopicCoverage, assessSemanticRichness } = await import('@/lib/seo-tools');
              
              const analysis = {
                url: document.url,
                title: document.title,
                depthScore: depthData.content_depth_score,
                depthLevel: getContentDepthLevel(depthData.content_depth_score),
                wordCount: depthData.word_count,
                topicKeywords: depthData.topic_keywords,
                semanticKeywords: depthData.semantic_keywords,
                topicCoverage: assessTopicCoverage(depthData),
                semanticRichness: assessSemanticRichness(depthData),
                summary: `Content depth for ${document.url}: ${getContentDepthLevel(depthData.content_depth_score)} (${depthData.content_depth_score}/100). ${depthData.word_count} words with ${depthData.topic_keywords.length} topic keywords and ${depthData.semantic_keywords.length} semantic keywords. Topic coverage: ${assessTopicCoverage(depthData)}, Semantic richness: ${assessSemanticRichness(depthData)}.`
              };
              
              return {
                success: true,
                analysis
              };
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to analyze content depth'
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