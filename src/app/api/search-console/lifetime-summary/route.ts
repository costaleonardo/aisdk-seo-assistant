import { NextRequest, NextResponse } from 'next/server';
import { GoogleSearchConsoleService } from '@/lib/google-search-console';

export async function GET() {
  try {
    const service = new GoogleSearchConsoleService();
    const summary = await service.getLifetimePerformanceSummary();
    
    return NextResponse.json({
      success: true,
      data: summary,
      type: 'lifetime-summary',
      description: 'Complete site performance summary for maximum available period (16 months)'
    });
  } catch (error: any) {
    console.error('Search Console Lifetime Summary API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch lifetime performance summary',
        message: error.message 
      },
      { status: 500 }
    );
  }
}