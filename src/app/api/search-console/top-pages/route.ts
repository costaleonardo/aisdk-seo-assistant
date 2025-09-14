import { NextRequest, NextResponse } from 'next/server';
import { GoogleSearchConsoleService } from '@/lib/google-search-console';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const service = new GoogleSearchConsoleService();
    const pages = await service.getTopPages(limit);
    
    return NextResponse.json({
      success: true,
      data: pages || [],
      totalPages: pages?.length || 0,
    });
  } catch (error: any) {
    console.error('Search Console API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch top pages',
        message: error.message 
      },
      { status: 500 }
    );
  }
}