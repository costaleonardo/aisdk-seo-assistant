import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    if (!sql) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Get total count of documents (pages) in the database
    const result = await sql`
      SELECT COUNT(*) as total_pages
      FROM documents
    `;

    const totalPages = parseInt(result[0].total_pages);

    return NextResponse.json({
      success: true,
      data: {
        totalPages
      }
    });

  } catch (error) {
    console.error('Error fetching page statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch page statistics' },
      { status: 500 }
    );
  }
}