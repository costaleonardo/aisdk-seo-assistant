import { NextRequest, NextResponse } from 'next/server';
import { scrapeWebsite } from '@/lib/scraper';
import { chunkContent } from '@/lib/chunking';
import { storeDocument } from '@/lib/vector-store';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Valid URL is required' },
        { status: 400 }
      );
    }

    // Scrape the website using existing function
    const scrapedContent = await scrapeWebsite(url);
    
    // Chunk the content using existing function
    const chunks = chunkContent(scrapedContent.content, {
      maxLength: 500,
      overlap: 50
    });
    
    // Store document and chunks with embeddings using existing function
    const document = await storeDocument(scrapedContent, chunks);
    
    return NextResponse.json({
      document_id: document.id,
      chunks_created: chunks.length,
      success: true,
      title: scrapedContent.title
    });
    
  } catch (error) {
    console.error('Scraping error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        error: 'Failed to scrape website',
        message: errorMessage,
        success: false 
      },
      { status: 500 }
    );
  }
}