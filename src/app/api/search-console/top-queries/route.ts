import { NextRequest, NextResponse } from 'next/server';
import { GoogleSearchConsoleService } from '@/lib/google-search-console';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    
    const service = new GoogleSearchConsoleService();
    const queries = await service.getTopQueries(limit);
    
    return NextResponse.json({
      success: true,
      data: queries || [],
      totalQueries: queries?.length || 0,
    });
  } catch (error: any) {
    console.error('Search Console API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch top queries',
        message: error.message 
      },
      { status: 500 }
    );
  }
}