import { NextRequest, NextResponse } from 'next/server';
import { GoogleSearchConsoleService } from '@/lib/google-search-console';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    
    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query parameter is required' },
        { status: 400 }
      );
    }
    
    const service = new GoogleSearchConsoleService();
    const comparison = await service.compareQueryMethods(query);
    
    // Calculate total clicks for detailed data
    const detailedTotalClicks = comparison.detailed.reduce((sum, row) => sum + (row.clicks || 0), 0);
    const queryWithPageTotalClicks = comparison.queryWithPage.reduce((sum, row) => sum + (row.clicks || 0), 0);
    
    return NextResponse.json({
      success: true,
      query,
      data: {
        detailed: {
          rows: comparison.detailed,
          totalClicks: detailedTotalClicks,
          rowCount: comparison.detailed.length,
          method: 'query + page dimensions (original)'
        },
        aggregated: {
          rows: comparison.aggregated,
          totalClicks: comparison.aggregated[0]?.clicks || 0,
          rowCount: comparison.aggregated.length,
          method: 'query only with byProperty aggregation'
        },
        queryWithPage: {
          rows: comparison.queryWithPage,
          totalClicks: queryWithPageTotalClicks,
          rowCount: comparison.queryWithPage.length,
          method: 'query + page dimensions with all data state'
        }
      }
    });
  } catch (error: any) {
    console.error('Search Console Compare API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to compare query methods',
        message: error.message 
      },
      { status: 500 }
    );
  }
}