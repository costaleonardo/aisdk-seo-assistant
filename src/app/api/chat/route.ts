import { NextRequest } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { vectorSearch } from '@/lib/vector-store';

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response('Messages array is required', { status: 400 });
    }

    const result = streamText({
      model: openai('gpt-4o'),
      system: `You are a helpful AI assistant that answers questions based on information from scraped websites. 

When users ask questions, use the searchKnowledge tool to find relevant information from the knowledge base to provide accurate, contextual answers.

If you find relevant information, reference it in your response and provide helpful answers based on that context. If no relevant information is found, let the user know that you don't have information about their specific question in the current knowledge base.`,
      messages,
      tools: {
        searchKnowledge: tool({
          description: 'Search the knowledge base for relevant information to answer user questions',
          parameters: z.object({
            query: z.string().describe('The search query to find relevant information')
          }),
          execute: async ({ query }) => {
            try {
              const results = await vectorSearch(query, 5);
              
              if (results.length === 0) {
                return { results: [], message: 'No relevant information found in the knowledge base.' };
              }
              
              return {
                results: results.map((result, index) => ({
                  content: result.content,
                  similarity: result.similarity,
                  rank: index + 1
                })),
                message: `Found ${results.length} relevant pieces of information.`
              };
            } catch (error) {
              console.error('Vector search error:', error);
              return { 
                results: [], 
                message: 'Error searching the knowledge base. Please try again.' 
              };
            }
          }
        })
      },
      maxToolRoundtrips: 2
    });

    return result.toDataStreamResponse();
    
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}