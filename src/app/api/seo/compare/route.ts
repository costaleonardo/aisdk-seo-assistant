import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { scrapeWebsite } from '@/lib/scraper';
import { performSEOAnalysis, compareSEOAnalysis } from '@/lib/seo-analyzer';
import { calculateSEOScore } from '@/lib/seo-scoring';

const compareRequestSchema = z.object({
  url1: z.string().url('Please provide a valid URL for the first site'),
  url2: z.string().url('Please provide a valid URL for the second site')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url1, url2 } = compareRequestSchema.parse(body);

    // Scrape both websites in parallel
    const [scrapedData1, scrapedData2] = await Promise.all([
      scrapeWebsite(url1),
      scrapeWebsite(url2)
    ]);
    
    // Perform SEO analysis for both sites
    const [analysis1, analysis2] = [
      performSEOAnalysis(scrapedData1),
      performSEOAnalysis(scrapedData2)
    ];
    
    // Calculate scores for both sites
    const [score1, score2] = [
      calculateSEOScore(analysis1),
      calculateSEOScore(analysis2)
    ];

    // Compare the analyses
    const comparison = compareSEOAnalysis(analysis1, analysis2, url1, url2);

    // Determine overall winner and differences
    const scoreDifference = score1.overall_score - score2.overall_score;
    const significantDifference = Math.abs(scoreDifference) >= 10;
    
    let summary = '';
    if (comparison.overall_winner === 'url1') {
      summary = `${url1} performs better overall with a ${Math.abs(scoreDifference)} point advantage.`;
    } else if (comparison.overall_winner === 'url2') {
      summary = `${url2} performs better overall with a ${Math.abs(scoreDifference)} point advantage.`;
    } else {
      summary = 'Both sites have similar SEO performance.';
    }

    // Category-by-category breakdown
    const categoryBreakdown = {
      content: {
        winner: score1.category_scores.content > score2.category_scores.content ? 'url1' : 
                score2.category_scores.content > score1.category_scores.content ? 'url2' : 'tie',
        url1_score: score1.category_scores.content,
        url2_score: score2.category_scores.content,
        difference: Math.abs(score1.category_scores.content - score2.category_scores.content)
      },
      technical: {
        winner: score1.category_scores.technical > score2.category_scores.technical ? 'url1' : 
                score2.category_scores.technical > score1.category_scores.technical ? 'url2' : 'tie',
        url1_score: score1.category_scores.technical,
        url2_score: score2.category_scores.technical,
        difference: Math.abs(score1.category_scores.technical - score2.category_scores.technical)
      },
      meta: {
        winner: score1.category_scores.meta > score2.category_scores.meta ? 'url1' : 
                score2.category_scores.meta > score1.category_scores.meta ? 'url2' : 'tie',
        url1_score: score1.category_scores.meta,
        url2_score: score2.category_scores.meta,
        difference: Math.abs(score1.category_scores.meta - score2.category_scores.meta)
      },
      structure: {
        winner: score1.category_scores.structure > score2.category_scores.structure ? 'url1' : 
                score2.category_scores.structure > score1.category_scores.structure ? 'url2' : 'tie',
        url1_score: score1.category_scores.structure,
        url2_score: score2.category_scores.structure,
        difference: Math.abs(score1.category_scores.structure - score2.category_scores.structure)
      }
    };

    // Key differences
    const keyDifferences = [];
    
    if (categoryBreakdown.meta.difference >= 15) {
      const winner = categoryBreakdown.meta.winner === 'url1' ? url1 : url2;
      keyDifferences.push(`${winner} has significantly better meta optimization (${categoryBreakdown.meta.difference} point difference)`);
    }
    
    if (categoryBreakdown.technical.difference >= 15) {
      const winner = categoryBreakdown.technical.winner === 'url1' ? url1 : url2;
      keyDifferences.push(`${winner} has superior technical SEO implementation (${categoryBreakdown.technical.difference} point difference)`);
    }
    
    if (categoryBreakdown.content.difference >= 15) {
      const winner = categoryBreakdown.content.winner === 'url1' ? url1 : url2;
      keyDifferences.push(`${winner} has better content optimization (${categoryBreakdown.content.difference} point difference)`);
    }

    return NextResponse.json({
      success: true,
      comparison: {
        url1,
        url2,
        url1_score: score1.overall_score,
        url2_score: score2.overall_score,
        score_difference: scoreDifference,
        significant_difference: significantDifference,
        overall_winner: comparison.overall_winner,
        summary,
        category_breakdown: categoryBreakdown,
        key_differences: keyDifferences
      },
      detailed_comparison: comparison,
      url1_analysis: {
        score: score1,
        analysis: analysis1
      },
      url2_analysis: {
        score: score2,
        analysis: analysis2
      }
    });
  } catch (error) {
    console.error('SEO comparison error:', error);
    
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
        error: error instanceof Error ? error.message : 'Failed to compare SEO'
      },
      { status: 500 }
    );
  }
}