import { NextRequest, NextResponse } from 'next/server';
import { GoogleSearchConsoleService } from '@/lib/google-search-console';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const contentPath = searchParams.get('path');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    if (!contentPath) {
      return NextResponse.json(
        { success: false, error: 'Content path parameter is required' },
        { status: 400 }
      );
    }
    
    const service = new GoogleSearchConsoleService();
    const pages = await service.getAllTimeContentTypePerformance(contentPath, limit);
    
    // Enrich data with extracted info
    const enrichedPages = pages.map(page => {
      const url = page.keys?.[0] || '';
      const urlParts = url.split('/');
      const slug = urlParts[urlParts.length - 2] || urlParts[urlParts.length - 1] || '';
      const title = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      return {
        ...page,
        extractedTitle: title,
        contentType: contentPath
      };
    });
    
    return NextResponse.json({
      success: true,
      data: enrichedPages || [],
      totalPages: enrichedPages?.length || 0,
      dateRange: '16 months (Google Search Console maximum)',
      contentPath,
      type: 'content-type-performance',
      description: `Top performing pages containing "${contentPath}" by organic traffic (all-time)`
    });
  } catch (error: any) {
    console.error('Search Console Content Type API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch content type performance',
        message: error.message 
      },
      { status: 500 }
    );
  }
}