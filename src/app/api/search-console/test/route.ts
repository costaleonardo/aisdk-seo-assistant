import { NextRequest, NextResponse } from 'next/server';
import { GoogleSearchConsoleService } from '@/lib/google-search-console';

export async function GET() {
  try {
    const service = new GoogleSearchConsoleService();
    const result = await service.testConnection();
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Search Console test endpoint error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to test Search Console connection',
        error: error.message 
      },
      { status: 500 }
    );
  }
}