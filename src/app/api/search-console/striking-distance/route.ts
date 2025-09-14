import { NextRequest, NextResponse } from 'next/server';
import { GoogleSearchConsoleService } from '@/lib/google-search-console';

export async function GET() {
  try {
    const service = new GoogleSearchConsoleService();
    const keywords = await service.getStrikingDistanceKeywords();
    
    return NextResponse.json({
      success: true,
      data: keywords || [],
      totalKeywords: keywords?.length || 0,
    });
  } catch (error: any) {
    console.error('Search Console API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch striking distance keywords',
        message: error.message 
      },
      { status: 500 }
    );
  }
}