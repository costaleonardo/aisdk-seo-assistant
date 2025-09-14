import { NextRequest, NextResponse } from 'next/server';
import { GoogleSearchConsoleService } from '@/lib/google-search-console';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const days = parseInt(searchParams.get('days') || '28');
    const dataState = searchParams.get('dataState') as 'final' | 'all' || 'all';
    
    const service = new GoogleSearchConsoleService();
    const queries = await service.getAggregatedTopQueries({
      limit,
      days,
      dataState
    });
    
    return NextResponse.json({
      success: true,
      data: queries || [],
      totalQueries: queries?.length || 0,
      params: { limit, days, dataState }
    });
  } catch (error: any) {
    console.error('Search Console Aggregated API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch aggregated queries',
        message: error.message 
      },
      { status: 500 }
    );
  }
}