import { NextRequest, NextResponse } from 'next/server';
import { GoogleSearchConsoleService } from '@/lib/google-search-console';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '28');
    const limit = parseInt(searchParams.get('limit') || '20');
    const dataState = searchParams.get('dataState') as 'final' | 'all' || 'all';
    const aggregationType = searchParams.get('aggregationType') as 'auto' | 'byPage' | 'byProperty' || 'auto';
    
    const service = new GoogleSearchConsoleService();
    
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = new Date().toISOString().split('T')[0];
    
    const params = {
      startDate,
      endDate,
      dimensions: ['query'],
      rowLimit: limit,
      dataState,
      aggregationType
    };
    
    const debugInfo = service.getDebugInfo(params);
    
    // Get actual data using these parameters
    const data = await service.getSearchAnalytics(params);
    
    return NextResponse.json({
      success: true,
      debugInfo,
      data: {
        rows: data.rows || [],
        responseAggregationType: data.responseAggregationType,
        totalRows: data.rows?.length || 0
      },
      requestParams: {
        days,
        limit,
        dataState,
        aggregationType,
        dateRange: `${startDate} to ${endDate}`
      }
    });
  } catch (error: any) {
    console.error('Search Console Debug API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to debug query',
        message: error.message 
      },
      { status: 500 }
    );
  }
}