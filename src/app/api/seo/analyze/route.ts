import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { scrapeWebsite } from '@/lib/scraper';
import { performSEOAnalysis } from '@/lib/seo-analyzer';
import { calculateSEOScore, getScoreInterpretation, getTopRecommendations, getCategoryInsights } from '@/lib/seo-scoring';

const analyzeRequestSchema = z.object({
  url: z.string().url('Please provide a valid URL')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = analyzeRequestSchema.parse(body);

    // Scrape the website and extract SEO data
    const scrapedData = await scrapeWebsite(url);
    
    // Perform comprehensive SEO analysis
    const analysis = performSEOAnalysis(scrapedData);
    
    // Calculate SEO score
    const score = calculateSEOScore(analysis);
    
    // Generate insights and recommendations
    const interpretation = getScoreInterpretation(score);
    const topRecommendations = getTopRecommendations(score);
    const categoryInsights = getCategoryInsights(score.category_scores);

    return NextResponse.json({
      success: true,
      url,
      analysis,
      score,
      interpretation,
      top_recommendations: topRecommendations,
      category_insights: categoryInsights,
      scraped_data: {
        title: scrapedData.title,
        meta_tags_count: scrapedData.meta_tags.length,
        headings_count: scrapedData.headings.length,
        links_count: scrapedData.links.length,
        images_count: scrapedData.images.length,
        content_length: scrapedData.content.length,
        has_schema: scrapedData.seo_data.schema_markup.length > 0
      }
    });
  } catch (error) {
    console.error('SEO analysis error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request data',
          details: error.issues.map((e: any) => e.message).join(', ')
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to analyze SEO'
      },
      { status: 500 }
    );
  }
}