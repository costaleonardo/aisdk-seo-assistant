import { NextRequest } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { 
  analyzePage,
  checkKeywords,
  comparePages,
  generateSuggestions,
  auditHeadings,
  checkMetaTags,
  analyzePageSchema,
  checkKeywordsSchema,
  comparePagesSchema,
  generateSuggestionsSchema,
  auditHeadingsSchema,
  checkMetaTagsSchema
} from '@/lib/seo-tools';

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response('Messages array is required', { status: 400 });
    }

    const result = streamText({
      model: openai('gpt-4o'),
      system: `You are an expert SEO specialist and AI assistant. You have access to powerful SEO analysis tools that can:

1. Analyze any webpage for comprehensive SEO performance
2. Check keyword usage and density 
3. Compare SEO performance between two pages
4. Generate prioritized improvement recommendations
5. Audit heading structure and hierarchy
6. Validate meta tag optimization

When users ask about SEO analysis, website optimization, keyword research, or competitive analysis, use these tools to provide data-driven insights. Always explain your findings in clear, actionable terms and prioritize the most impactful recommendations.

Guidelines:
- Use tools when users provide URLs or ask for SEO analysis
- Explain technical SEO concepts in accessible language
- Prioritize high-impact, achievable improvements
- Consider user intent and business goals in recommendations
- Provide specific, measurable suggestions when possible`,
      messages,
      tools: {
        analyzePage: tool({
          description: 'Perform comprehensive SEO analysis on a webpage including title, meta tags, headings, keywords, and technical SEO factors',
          inputSchema: analyzePageSchema,
          execute: async ({ url }) => {
            const result = await analyzePage(url);
            return result;
          }
        }),
        checkKeywords: tool({
          description: 'Analyze keyword usage and density on a webpage, optionally checking for specific target keywords',
          inputSchema: checkKeywordsSchema,
          execute: async ({ url, targetKeywords }) => {
            const result = await checkKeywords(url, targetKeywords);
            return result;
          }
        }),
        comparePages: tool({
          description: 'Compare SEO performance between two webpages side by side',
          inputSchema: comparePagesSchema,
          execute: async ({ url1, url2 }) => {
            const result = await comparePages(url1, url2);
            return result;
          }
        }),
        generateSuggestions: tool({
          description: 'Generate prioritized SEO improvement recommendations for a webpage',
          inputSchema: generateSuggestionsSchema,
          execute: async ({ url }) => {
            const result = await generateSuggestions(url);
            return result;
          }
        }),
        auditHeadings: tool({
          description: 'Audit heading structure and hierarchy on a webpage for SEO optimization',
          inputSchema: auditHeadingsSchema,
          execute: async ({ url }) => {
            const result = await auditHeadings(url);
            return result;
          }
        }),
        checkMetaTags: tool({
          description: 'Check and validate meta tag optimization including title, description, canonical, and Open Graph tags',
          inputSchema: checkMetaTagsSchema,
          execute: async ({ url }) => {
            const result = await checkMetaTags(url);
            return result;
          }
        })
      }
    });

    return result.toTextStreamResponse();
    
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}