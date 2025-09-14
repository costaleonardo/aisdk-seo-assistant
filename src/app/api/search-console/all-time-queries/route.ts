import { NextRequest, NextResponse } from 'next/server';
import { GoogleSearchConsoleService } from '@/lib/google-search-console';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const service = new GoogleSearchConsoleService();
    const queries = await service.getAllTimeTopQueries(limit);
    
    return NextResponse.json({
      success: true,
      data: queries || [],
      totalQueries: queries?.length || 0,
      dateRange: '16 months (Google Search Console maximum)',
      type: 'all-time-queries'
    });
  } catch (error: any) {
    console.error('Search Console All-Time Queries API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch all-time top queries',
        message: error.message 
      },
      { status: 500 }
    );
  }
}