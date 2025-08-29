import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { scrapeWebsite } from '@/lib/scraper';
import { performSEOAnalysis, generateSEOSuggestions } from '@/lib/seo-analyzer';
import { calculateSEOScore, getTopRecommendations, getCategoryInsights } from '@/lib/seo-scoring';

const suggestionsRequestSchema = z.object({
  url: z.string().url('Please provide a valid URL'),
  priority: z.enum(['all', 'high', 'critical']).optional().default('all'),
  category: z.enum(['all', 'content', 'technical', 'meta', 'structure', 'links', 'images']).optional().default('all')
});

interface DetailedSuggestion {
  category: string;
  issue: string;
  recommendation: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimated_impact: string;
  difficulty: 'easy' | 'moderate' | 'difficult';
  time_estimate: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, priority, category } = suggestionsRequestSchema.parse(body);

    // Scrape the website and extract SEO data
    const scrapedData = await scrapeWebsite(url);
    
    // Perform comprehensive SEO analysis
    const analysis = performSEOAnalysis(scrapedData);
    
    // Calculate SEO score
    const score = calculateSEOScore(analysis);
    
    // Generate basic suggestions
    const basicSuggestions = generateSEOSuggestions(analysis);
    const topRecommendations = getTopRecommendations(score);
    const categoryInsights = getCategoryInsights(score.category_scores);

    // Generate detailed suggestions with actionable steps
    const detailedSuggestions: DetailedSuggestion[] = [];

    // Title suggestions
    if (analysis.title.score < 70) {
      if (analysis.title.length === 0) {
        detailedSuggestions.push({
          category: 'Meta',
          issue: 'Missing title tag',
          recommendation: 'Add a descriptive title tag of 30-60 characters that includes your primary keyword',
          priority: 'critical',
          estimated_impact: 'High - Title tags are crucial for search rankings',
          difficulty: 'easy',
          time_estimate: '5 minutes'
        });
      } else if (analysis.title.length < 30) {
        detailedSuggestions.push({
          category: 'Meta',
          issue: 'Title too short',
          recommendation: `Expand your title from ${analysis.title.length} to 30-60 characters. Add descriptive keywords while maintaining readability`,
          priority: 'high',
          estimated_impact: 'Medium - Longer titles provide more context to search engines',
          difficulty: 'easy',
          time_estimate: '10 minutes'
        });
      } else if (analysis.title.length > 60) {
        detailedSuggestions.push({
          category: 'Meta',
          issue: 'Title too long',
          recommendation: `Shorten your title from ${analysis.title.length} to under 60 characters to prevent truncation in search results`,
          priority: 'high',
          estimated_impact: 'Medium - Prevents title truncation in SERPs',
          difficulty: 'easy',
          time_estimate: '10 minutes'
        });
      }
      if (!analysis.title.has_keywords) {
        detailedSuggestions.push({
          category: 'Meta',
          issue: 'Title lacks target keywords',
          recommendation: 'Include your primary keyword naturally in the title tag, preferably near the beginning',
          priority: 'high',
          estimated_impact: 'High - Keywords in titles strongly influence rankings',
          difficulty: 'moderate',
          time_estimate: '15 minutes'
        });
      }
    }

    // Meta description suggestions
    if (analysis.meta_description.score < 70) {
      if (analysis.meta_description.length === 0) {
        detailedSuggestions.push({
          category: 'Meta',
          issue: 'Missing meta description',
          recommendation: 'Create a compelling meta description of 150-160 characters that includes your primary keyword and encourages clicks',
          priority: 'critical',
          estimated_impact: 'High - Improves click-through rates from search results',
          difficulty: 'easy',
          time_estimate: '15 minutes'
        });
      } else if (analysis.meta_description.length < 150) {
        detailedSuggestions.push({
          category: 'Meta',
          issue: 'Meta description too short',
          recommendation: `Expand your meta description from ${analysis.meta_description.length} to 150-160 characters for maximum search result real estate`,
          priority: 'medium',
          estimated_impact: 'Medium - Utilizes full SERP space',
          difficulty: 'easy',
          time_estimate: '10 minutes'
        });
      } else if (analysis.meta_description.length > 160) {
        detailedSuggestions.push({
          category: 'Meta',
          issue: 'Meta description too long',
          recommendation: `Trim your meta description from ${analysis.meta_description.length} to under 160 characters to prevent truncation`,
          priority: 'medium',
          estimated_impact: 'Medium - Prevents description truncation in SERPs',
          difficulty: 'easy',
          time_estimate: '10 minutes'
        });
      }
    }

    // Heading structure suggestions
    if (analysis.headings.score < 70) {
      if (analysis.headings.h1_count === 0) {
        detailedSuggestions.push({
          category: 'Structure',
          issue: 'Missing H1 tag',
          recommendation: 'Add a single H1 tag that describes the main topic of the page and includes your primary keyword',
          priority: 'critical',
          estimated_impact: 'High - H1 tags are important ranking signals',
          difficulty: 'easy',
          time_estimate: '5 minutes'
        });
      } else if (analysis.headings.h1_count > 1) {
        detailedSuggestions.push({
          category: 'Structure',
          issue: 'Multiple H1 tags',
          recommendation: `Change ${analysis.headings.h1_count - 1} of your H1 tags to H2 or H3 tags to maintain proper heading hierarchy`,
          priority: 'high',
          estimated_impact: 'Medium - Improves content structure and accessibility',
          difficulty: 'easy',
          time_estimate: '10 minutes'
        });
      }
      if (!analysis.headings.hierarchy_valid) {
        detailedSuggestions.push({
          category: 'Structure',
          issue: 'Invalid heading hierarchy',
          recommendation: 'Restructure your headings to follow logical order: H1 → H2 → H3, etc. Avoid skipping heading levels',
          priority: 'medium',
          estimated_impact: 'Medium - Improves content accessibility and SEO',
          difficulty: 'moderate',
          time_estimate: '20 minutes'
        });
      }
    }

    // Technical SEO suggestions
    if (analysis.technical.score < 80) {
      if (!analysis.technical.has_canonical) {
        detailedSuggestions.push({
          category: 'Technical',
          issue: 'Missing canonical URL',
          recommendation: 'Add a canonical link tag to prevent duplicate content issues: <link rel="canonical" href="your-page-url" />',
          priority: 'high',
          estimated_impact: 'High - Prevents duplicate content penalties',
          difficulty: 'easy',
          time_estimate: '5 minutes'
        });
      }
      if (!analysis.technical.has_og_tags) {
        detailedSuggestions.push({
          category: 'Technical',
          issue: 'Missing Open Graph tags',
          recommendation: 'Add Open Graph meta tags (og:title, og:description, og:image) to improve social media sharing appearance',
          priority: 'medium',
          estimated_impact: 'Medium - Improves social media engagement',
          difficulty: 'moderate',
          time_estimate: '15 minutes'
        });
      }
      if (!analysis.technical.has_schema) {
        detailedSuggestions.push({
          category: 'Technical',
          issue: 'Missing structured data',
          recommendation: 'Add JSON-LD structured data markup relevant to your content type (Article, Organization, etc.)',
          priority: 'medium',
          estimated_impact: 'Medium - Enables rich snippets in search results',
          difficulty: 'difficult',
          time_estimate: '45 minutes'
        });
      }
    }

    // Content/keyword suggestions
    if (analysis.keywords.score < 70) {
      if (!analysis.keywords.primary_keyword) {
        detailedSuggestions.push({
          category: 'Content',
          issue: 'No clear primary keyword focus',
          recommendation: 'Identify and focus on a primary keyword. Use it naturally throughout your content, especially in the first paragraph',
          priority: 'high',
          estimated_impact: 'High - Keyword focus improves topical relevance',
          difficulty: 'difficult',
          time_estimate: '60 minutes'
        });
      } else if (analysis.keywords.density[analysis.keywords.primary_keyword] > 3) {
        const density = analysis.keywords.density[analysis.keywords.primary_keyword];
        detailedSuggestions.push({
          category: 'Content',
          issue: 'Keyword over-optimization',
          recommendation: `Reduce keyword density for "${analysis.keywords.primary_keyword}" from ${density.toFixed(1)}% to 1-2.5% by using synonyms and related terms`,
          priority: 'medium',
          estimated_impact: 'Medium - Prevents over-optimization penalties',
          difficulty: 'moderate',
          time_estimate: '30 minutes'
        });
      }
    }

    // Link suggestions
    if (analysis.links.score < 60) {
      if (analysis.links.internal_count < 3) {
        detailedSuggestions.push({
          category: 'Links',
          issue: 'Insufficient internal links',
          recommendation: 'Add 3-5 relevant internal links to other pages on your site to improve navigation and distribute page authority',
          priority: 'low',
          estimated_impact: 'Low-Medium - Improves site structure and user experience',
          difficulty: 'moderate',
          time_estimate: '20 minutes'
        });
      }
      if (analysis.links.external_count === 0) {
        detailedSuggestions.push({
          category: 'Links',
          issue: 'No external links',
          recommendation: 'Add 1-2 links to high-quality, authoritative sources that support your content',
          priority: 'low',
          estimated_impact: 'Low - Shows content quality and builds trust',
          difficulty: 'moderate',
          time_estimate: '15 minutes'
        });
      }
    }

    // Image suggestions
    if (analysis.images.score < 70 && analysis.images.total_count > 0) {
      if (analysis.images.images_without_alt > 0) {
        detailedSuggestions.push({
          category: 'Images',
          issue: `${analysis.images.images_without_alt} images missing alt text`,
          recommendation: 'Add descriptive alt text to all images for accessibility and SEO. Include keywords naturally where relevant',
          priority: 'low',
          estimated_impact: 'Low-Medium - Improves accessibility and image SEO',
          difficulty: 'easy',
          time_estimate: `${analysis.images.images_without_alt * 2} minutes`
        });
      }
    }

    // Filter suggestions based on priority and category
    let filteredSuggestions = detailedSuggestions;
    
    if (priority !== 'all') {
      if (priority === 'critical') {
        filteredSuggestions = filteredSuggestions.filter(s => s.priority === 'critical');
      } else if (priority === 'high') {
        filteredSuggestions = filteredSuggestions.filter(s => s.priority === 'critical' || s.priority === 'high');
      }
    }

    if (category !== 'all') {
      filteredSuggestions = filteredSuggestions.filter(s => 
        s.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Sort by priority
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    filteredSuggestions.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

    return NextResponse.json({
      success: true,
      url,
      current_score: score.overall_score,
      grade: score.grade,
      filters_applied: { priority, category },
      basic_suggestions: basicSuggestions,
      top_recommendations: topRecommendations,
      detailed_suggestions: filteredSuggestions,
      category_insights: categoryInsights,
      summary: {
        total_suggestions: filteredSuggestions.length,
        critical_issues: filteredSuggestions.filter(s => s.priority === 'critical').length,
        high_priority: filteredSuggestions.filter(s => s.priority === 'high').length,
        estimated_total_time: filteredSuggestions.reduce((total, s) => {
          const match = s.time_estimate.match(/(\d+)/);
          return total + (match ? parseInt(match[1]) : 0);
        }, 0) + ' minutes'
      }
    });
  } catch (error) {
    console.error('SEO suggestions error:', error);
    
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
        error: error instanceof Error ? error.message : 'Failed to generate SEO suggestions'
      },
      { status: 500 }
    );
  }
}