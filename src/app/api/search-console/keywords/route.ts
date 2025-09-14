import { NextRequest, NextResponse } from 'next/server';
import { GoogleSearchConsoleService } from '@/lib/google-search-console';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '28');
    
    const service = new GoogleSearchConsoleService();
    const data = await service.getKeywordPerformance(days);
    
    return NextResponse.json({
      success: true,
      data: data.rows || [],
      totalRows: data.rows?.length || 0,
      responseAggregationType: data.responseAggregationType,
    });
  } catch (error: any) {
    console.error('Search Console API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch keyword data',
        message: error.message 
      },
      { status: 500 }
    );
  }
}