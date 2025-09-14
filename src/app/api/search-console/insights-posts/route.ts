import { NextRequest, NextResponse } from 'next/server';
import { GoogleSearchConsoleService } from '@/lib/google-search-console';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    
    const service = new GoogleSearchConsoleService();
    const insightsPosts = await service.getAllTimeInsightsPosts(limit);
    
    // Extract post titles from URLs for better display
    const enrichedPosts = insightsPosts.map(post => {
      const url = post.keys?.[0] || '';
      const urlParts = url.split('/');
      const slug = urlParts[urlParts.length - 2] || urlParts[urlParts.length - 1] || '';
      const title = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      return {
        ...post,
        extractedTitle: title,
        postType: url.includes('/insights/') ? 'insights' : 'other'
      };
    });
    
    return NextResponse.json({
      success: true,
      data: enrichedPosts || [],
      totalPosts: enrichedPosts?.length || 0,
      dateRange: '16 months (Google Search Console maximum)',
      type: 'insights-posts',
      description: 'Top performing Insights posts by organic traffic (all-time)'
    });
  } catch (error: any) {
    console.error('Search Console Insights Posts API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch insights posts performance',
        message: error.message 
      },
      { status: 500 }
    );
  }
}