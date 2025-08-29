import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { scrapeWebsite } from '@/lib/scraper';
import { analyzeKeywordDensity } from '@/lib/seo-analyzer';

const keywordsRequestSchema = z.object({
  url: z.string().url('Please provide a valid URL'),
  min_density: z.number().min(0).max(10).optional().default(0.5),
  max_density: z.number().min(0).max(100).optional().default(5),
  min_word_length: z.number().min(1).max(20).optional().default(3),
  limit: z.number().min(1).max(100).optional().default(20)
});

interface KeywordInsight {
  keyword: string;
  count: number;
  density: number;
  category: 'optimal' | 'low' | 'high' | 'excessive';
  recommendation: string;
}

interface KeywordPhrase {
  phrase: string;
  count: number;
  words: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, min_density, max_density, min_word_length, limit } = keywordsRequestSchema.parse(body);

    // Scrape the website
    const scrapedData = await scrapeWebsite(url);
    
    // Analyze keyword density
    const keywordAnalysis = analyzeKeywordDensity(scrapedData.content);
    
    // Extract and analyze phrases (2-4 words)
    const phrases = extractPhrases(scrapedData.content, min_word_length);
    
    // Create keyword insights
    const keywordInsights: KeywordInsight[] = Object.entries(keywordAnalysis.density)
      .filter(([word, density]) => 
        word.length >= min_word_length && 
        density >= min_density && 
        density <= max_density
      )
      .map(([word, density]) => ({
        keyword: word,
        count: keywordAnalysis.keyword_count[word],
        density,
        category: categorizeDensity(density),
        recommendation: getKeywordRecommendation(word, density, keywordAnalysis.primary_keyword)
      }))
      .sort((a, b) => b.density - a.density)
      .slice(0, limit);

    // Analyze title and meta description for keyword usage
    const titleKeywords = extractTitleKeywords(scrapedData.title, keywordInsights);
    const metaKeywords = scrapedData.seo_data.meta_description ? 
      extractMetaKeywords(scrapedData.seo_data.meta_description, keywordInsights) : [];

    // Analyze heading keywords
    const headingKeywords = analyzeHeadingKeywords(scrapedData.headings, keywordInsights);

    // Content analysis
    const contentStats = {
      total_words: scrapedData.content.split(/\s+/).length,
      unique_words: Object.keys(keywordAnalysis.keyword_count).length,
      average_word_length: calculateAverageWordLength(scrapedData.content),
      reading_level: estimateReadingLevel(scrapedData.content)
    };

    // Keyword distribution analysis
    const keywordDistribution = analyzeKeywordDistribution(scrapedData.content, keywordAnalysis.primary_keyword);

    // Top recommendations
    const recommendations = [];
    
    if (!keywordAnalysis.primary_keyword) {
      recommendations.push("No clear primary keyword identified. Focus your content around a main topic.");
    } else {
      const primaryDensity = keywordAnalysis.density[keywordAnalysis.primary_keyword];
      if (primaryDensity < 1) {
        recommendations.push(`Increase usage of primary keyword "${keywordAnalysis.primary_keyword}" (currently ${primaryDensity.toFixed(1)}%)`);
      } else if (primaryDensity > 3) {
        recommendations.push(`Reduce usage of primary keyword "${keywordAnalysis.primary_keyword}" (currently ${primaryDensity.toFixed(1)}%)`);
      }
    }

    const overOptimizedKeywords = keywordInsights.filter(k => k.category === 'excessive').length;
    if (overOptimizedKeywords > 0) {
      recommendations.push(`${overOptimizedKeywords} keywords are over-optimized. Use synonyms and related terms.`);
    }

    if (titleKeywords.length === 0) {
      recommendations.push("Title doesn't contain any of your main keywords. Consider optimization.");
    }

    return NextResponse.json({
      success: true,
      url,
      primary_keyword: keywordAnalysis.primary_keyword,
      keyword_insights: keywordInsights,
      phrases: phrases.slice(0, 10),
      title_analysis: {
        keywords_found: titleKeywords,
        optimization_score: calculateTitleOptimizationScore(titleKeywords, keywordInsights)
      },
      meta_description_analysis: {
        keywords_found: metaKeywords,
        optimization_score: calculateMetaOptimizationScore(metaKeywords, keywordInsights)
      },
      heading_analysis: headingKeywords,
      content_stats: contentStats,
      keyword_distribution: keywordDistribution,
      recommendations,
      filters: {
        min_density,
        max_density,
        min_word_length,
        limit
      }
    });
  } catch (error) {
    console.error('Keyword analysis error:', error);
    
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
        error: error instanceof Error ? error.message : 'Failed to analyze keywords'
      },
      { status: 500 }
    );
  }
}

function categorizeDensity(density: number): 'optimal' | 'low' | 'high' | 'excessive' {
  if (density >= 1 && density <= 2.5) return 'optimal';
  if (density < 1) return 'low';
  if (density <= 4) return 'high';
  return 'excessive';
}

function getKeywordRecommendation(keyword: string, density: number, primaryKeyword?: string): string {
  const category = categorizeDensity(density);
  const isPrimary = keyword === primaryKeyword;
  
  switch (category) {
    case 'optimal':
      return isPrimary ? 'Great! This is your primary keyword with optimal density.' : 'Good keyword density for this term.';
    case 'low':
      return isPrimary ? 'Consider using this primary keyword more frequently in your content.' : 'Could use this keyword more if relevant to your topic.';
    case 'high':
      return 'Good usage, but monitor to avoid over-optimization.';
    case 'excessive':
      return 'Over-optimized! Use synonyms and related terms instead of repeating this keyword.';
    default:
      return 'Analyze keyword usage in context of your content.';
  }
}

function extractPhrases(content: string, minWordLength: number): KeywordPhrase[] {
  const sentences = content.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= minWordLength);
  
  const phrases: { [phrase: string]: number } = {};
  
  // Extract 2-word phrases
  for (let i = 0; i < sentences.length - 1; i++) {
    const phrase = `${sentences[i]} ${sentences[i + 1]}`;
    phrases[phrase] = (phrases[phrase] || 0) + 1;
  }
  
  // Extract 3-word phrases
  for (let i = 0; i < sentences.length - 2; i++) {
    const phrase = `${sentences[i]} ${sentences[i + 1]} ${sentences[i + 2]}`;
    phrases[phrase] = (phrases[phrase] || 0) + 1;
  }
  
  return Object.entries(phrases)
    .filter(([phrase, count]) => count >= 2) // Only phrases that appear at least twice
    .map(([phrase, count]) => ({
      phrase,
      count,
      words: phrase.split(' ').length
    }))
    .sort((a, b) => b.count - a.count);
}

function extractTitleKeywords(title: string, keywordInsights: KeywordInsight[]): string[] {
  const titleWords = title.toLowerCase().split(/\s+/);
  return keywordInsights
    .filter(insight => titleWords.some((word: string) => word.includes(insight.keyword) || insight.keyword.includes(word)))
    .map(insight => insight.keyword);
}

function extractMetaKeywords(metaDescription: string, keywordInsights: KeywordInsight[]): string[] {
  const metaWords = metaDescription.toLowerCase().split(/\s+/);
  return keywordInsights
    .filter(insight => metaWords.some((word: string) => word.includes(insight.keyword) || insight.keyword.includes(word)))
    .map(insight => insight.keyword);
}

function analyzeHeadingKeywords(headings: any[], keywordInsights: KeywordInsight[]) {
  const headingsByLevel: { [level: number]: string[] } = {};
  
  headings.forEach(heading => {
    if (!headingsByLevel[heading.level]) {
      headingsByLevel[heading.level] = [];
    }
    
    const headingWords = heading.text.toLowerCase().split(/\s+/);
    const foundKeywords = keywordInsights
      .filter(insight => headingWords.some((word: string) => word.includes(insight.keyword) || insight.keyword.includes(word)))
      .map(insight => insight.keyword);
    
    headingsByLevel[heading.level].push(...foundKeywords);
  });
  
  return {
    h1_keywords: headingsByLevel[1] || [],
    h2_keywords: headingsByLevel[2] || [],
    h3_keywords: headingsByLevel[3] || [],
    total_heading_keywords: Object.values(headingsByLevel).flat().length
  };
}

function calculateAverageWordLength(content: string): number {
  const words = content.replace(/[^\w\s]/g, '').split(/\s+/).filter(word => word.length > 0);
  const totalLength = words.reduce((sum, word) => sum + word.length, 0);
  return totalLength / words.length;
}

function estimateReadingLevel(content: string): string {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const words = content.split(/\s+/).filter(w => w.length > 0).length;
  const syllables = estimateSyllables(content);
  
  // Flesch Reading Ease Score
  const score = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
  
  if (score >= 90) return 'Very Easy';
  if (score >= 80) return 'Easy';
  if (score >= 70) return 'Fairly Easy';
  if (score >= 60) return 'Standard';
  if (score >= 50) return 'Fairly Difficult';
  if (score >= 30) return 'Difficult';
  return 'Very Difficult';
}

function estimateSyllables(content: string): number {
  const words = content.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
  return words.reduce((total, word: string) => {
    return total + Math.max(1, word.replace(/[^aeiou]/g, '').length);
  }, 0);
}

function analyzeKeywordDistribution(content: string, primaryKeyword?: string) {
  if (!primaryKeyword) {
    return { distribution: 'No primary keyword identified', sections: [] };
  }
  
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const totalParagraphs = paragraphs.length;
  const paragraphsWithKeyword = paragraphs.filter(p => 
    p.toLowerCase().includes(primaryKeyword.toLowerCase())
  ).length;
  
  const distribution = (paragraphsWithKeyword / totalParagraphs) * 100;
  
  let distributionLevel = '';
  if (distribution >= 30) distributionLevel = 'Well distributed';
  else if (distribution >= 15) distributionLevel = 'Moderately distributed';
  else distributionLevel = 'Poorly distributed';
  
  return {
    distribution: distributionLevel,
    percentage: Math.round(distribution),
    sections: {
      total_paragraphs: totalParagraphs,
      paragraphs_with_keyword: paragraphsWithKeyword,
      first_paragraph_has_keyword: paragraphs[0]?.toLowerCase().includes(primaryKeyword.toLowerCase()) || false
    }
  };
}

function calculateTitleOptimizationScore(titleKeywords: string[], keywordInsights: KeywordInsight[]): number {
  if (titleKeywords.length === 0) return 0;
  
  const topKeywords = keywordInsights.slice(0, 5).map(k => k.keyword);
  const hasTopKeyword = titleKeywords.some(tk => topKeywords.includes(tk));
  
  let score = 0;
  if (hasTopKeyword) score += 60;
  if (titleKeywords.length >= 2) score += 20;
  if (titleKeywords.length >= 1) score += 20;
  
  return Math.min(score, 100);
}

function calculateMetaOptimizationScore(metaKeywords: string[], keywordInsights: KeywordInsight[]): number {
  if (metaKeywords.length === 0) return 0;
  
  const topKeywords = keywordInsights.slice(0, 5).map(k => k.keyword);
  const hasTopKeyword = metaKeywords.some(mk => topKeywords.includes(mk));
  
  let score = 0;
  if (hasTopKeyword) score += 50;
  if (metaKeywords.length >= 2) score += 25;
  if (metaKeywords.length >= 1) score += 25;
  
  return Math.min(score, 100);
}