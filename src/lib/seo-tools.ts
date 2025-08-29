import { z } from 'zod';
import { performSEOAnalysis, compareSEOAnalysis, SEOAnalysis, ComparisonResult } from './seo-analyzer';
import { scrapeWebsite, ScrapedContent } from './scraper';
import { storeDocument } from './vector-store';
import { calculateSEOScore, getScoreInterpretation } from './seo-scoring';

// Tool schemas for AI SDK
export const analyzePageSchema = z.object({
  url: z.string().url().describe('The URL of the webpage to analyze for SEO')
});

export const checkKeywordsSchema = z.object({
  url: z.string().url().describe('The URL of the webpage to analyze for keyword usage'),
  targetKeywords: z.array(z.string()).optional().describe('Specific keywords to check for (optional)')
});

export const comparePagesSchema = z.object({
  url1: z.string().url().describe('The first URL to compare'),
  url2: z.string().url().describe('The second URL to compare')
});

export const generateSuggestionsSchema = z.object({
  url: z.string().url().describe('The URL to generate SEO improvement suggestions for')
});

export const auditHeadingsSchema = z.object({
  url: z.string().url().describe('The URL to audit heading structure for')
});

export const checkMetaTagsSchema = z.object({
  url: z.string().url().describe('The URL to check meta tag optimization for')
});

// Tool implementations
export async function analyzePage(url: string) {
  try {
    // First scrape the website to get content
    const scrapedContent = await scrapeWebsite(url);
    
    // Perform comprehensive SEO analysis
    const seoAnalysis = performSEOAnalysis(scrapedContent);
    
    // Calculate overall score
    const scoreData = calculateSEOScore(seoAnalysis);
    const scoreInterpretation = getScoreInterpretation(scoreData);
    
    return {
      success: true,
      url,
      title: scrapedContent.title,
      analysis: seoAnalysis,
      score: scoreData,
      interpretation: scoreInterpretation,
      summary: `SEO analysis completed for ${url}. Overall score: ${scoreData.overall_score}/100 (${scoreData.grade}). Top priorities: ${scoreData.priority_issues.slice(0, 3).map(p => p.category).join(', ')}.`
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze page',
      url
    };
  }
}

export async function checkKeywords(url: string, targetKeywords?: string[]) {
  try {
    const scrapedContent = await scrapeWebsite(url);
    const seoAnalysis = performSEOAnalysis(scrapedContent);
    
    // Extract keyword data from the analysis
    const keywordDensityEntries = Object.entries(seoAnalysis.keywords.density).slice(0, 10);
    const keywordData = {
      mainKeywords: keywordDensityEntries.map(([word, density]) => ({ word, density })),
      keywordDensity: seoAnalysis.keywords.density,
      targetKeywordAnalysis: targetKeywords ? 
        targetKeywords.map(keyword => {
          const density = seoAnalysis.keywords.density[keyword.toLowerCase()] || 0;
          return {
            keyword,
            found: density > 0,
            density
          };
        }) : []
    };
    
    return {
      success: true,
      url,
      keywords: keywordData,
      summary: `Keyword analysis for ${url}: Found ${keywordDensityEntries.length} main keywords. ${targetKeywords ? `Target keywords analysis: ${keywordData.targetKeywordAnalysis.filter(k => k.found).length}/${targetKeywords.length} found.` : ''}`
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze keywords',
      url
    };
  }
}

export async function comparePages(url1: string, url2: string) {
  try {
    const scrapedContent1 = await scrapeWebsite(url1);
    const scrapedContent2 = await scrapeWebsite(url2);
    
    const analysis1 = performSEOAnalysis(scrapedContent1);
    const analysis2 = performSEOAnalysis(scrapedContent2);
    
    const comparison = compareSEOAnalysis(analysis1, analysis2, url1, url2);
    
    // Calculate scores for comparison
    const score1 = calculateSEOScore(analysis1);
    const score2 = calculateSEOScore(analysis2);
    
    return {
      success: true,
      url1,
      url2,
      comparison,
      scores: { url1: score1, url2: score2 },
      summary: `SEO comparison between ${url1} (Score: ${score1.overall_score}) and ${url2} (Score: ${score2.overall_score}). ${score1.overall_score > score2.overall_score ? 'First page' : 'Second page'} performs better overall.`
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to compare pages',
      url1,
      url2
    };
  }
}

export async function generateSuggestions(url: string) {
  try {
    const scrapedContent = await scrapeWebsite(url);
    const seoAnalysis = performSEOAnalysis(scrapedContent);
    const scoreData = calculateSEOScore(seoAnalysis);
    const scoreInterpretation = getScoreInterpretation(scoreData);
    
    // Collect all recommendations from different categories
    const allRecommendations = [
      ...seoAnalysis.title.recommendations.map(rec => ({ category: 'title', issue: rec })),
      ...seoAnalysis.meta_description.recommendations.map(rec => ({ category: 'meta_description', issue: rec })),
      ...seoAnalysis.headings.recommendations.map(rec => ({ category: 'headings', issue: rec })),
      ...seoAnalysis.keywords.recommendations.map(rec => ({ category: 'keywords', issue: rec })),
      ...seoAnalysis.links.recommendations.map(rec => ({ category: 'links', issue: rec })),
      ...seoAnalysis.images.recommendations.map(rec => ({ category: 'images', issue: rec })),
      ...seoAnalysis.technical.recommendations.map(rec => ({ category: 'technical', issue: rec }))
    ];
    
    const suggestions = {
      url,
      score: scoreData,
      interpretation: scoreInterpretation,
      priorityIssues: scoreData.priority_issues,
      allRecommendations,
      topIssues: allRecommendations.slice(0, 5)
    };
    
    return {
      success: true,
      suggestions,
      summary: `Generated ${allRecommendations.length} SEO suggestions for ${url}. Overall score: ${scoreData.overall_score}/100 (${scoreData.grade}). Top priority issues: ${scoreData.priority_issues.slice(0, 3).map(p => p.issue).join(', ')}.`
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate suggestions',
      url
    };
  }
}

export async function auditHeadings(url: string) {
  try {
    const scrapedContent = await scrapeWebsite(url);
    const seoAnalysis = performSEOAnalysis(scrapedContent);
    
    const headingAudit = {
      url,
      headingStructure: seoAnalysis.headings,
      issues: seoAnalysis.headings.recommendations,
      h1Count: seoAnalysis.headings.h1_count,
      totalHeadings: seoAnalysis.headings.total_headings,
      hasValidHierarchy: seoAnalysis.headings.hierarchy_valid,
      score: seoAnalysis.headings.score
    };
    
    return {
      success: true,
      audit: headingAudit,
      summary: `Heading audit for ${url}: Found ${headingAudit.h1Count} H1 tags, ${headingAudit.totalHeadings} total headings. Score: ${headingAudit.score}/100. ${headingAudit.issues.length} issues identified.`
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to audit headings',
      url
    };
  }
}

export async function checkMetaTags(url: string) {
  try {
    const scrapedContent = await scrapeWebsite(url);
    const seoAnalysis = performSEOAnalysis(scrapedContent);
    
    const metaTagsAudit = {
      url,
      title: {
        analysis: seoAnalysis.title,
        content: scrapedContent.title,
        length: seoAnalysis.title.length,
        optimal: seoAnalysis.title.is_optimal,
        score: seoAnalysis.title.score
      },
      description: {
        analysis: seoAnalysis.meta_description,
        content: scrapedContent.seo_data.meta_description || '',
        length: seoAnalysis.meta_description.length,
        optimal: seoAnalysis.meta_description.is_optimal,
        score: seoAnalysis.meta_description.score
      },
      technical: {
        hasMetaTitle: seoAnalysis.technical.has_meta_title,
        hasMetaDescription: seoAnalysis.technical.has_meta_description,
        hasCanonical: seoAnalysis.technical.has_canonical,
        hasOgTags: seoAnalysis.technical.has_og_tags,
        hasTwitterCards: seoAnalysis.technical.has_twitter_cards,
        score: seoAnalysis.technical.score
      },
      issues: [
        ...seoAnalysis.title.recommendations.map(rec => ({ category: 'title', issue: rec })),
        ...seoAnalysis.meta_description.recommendations.map(rec => ({ category: 'meta_description', issue: rec })),
        ...seoAnalysis.technical.recommendations.map(rec => ({ category: 'technical', issue: rec }))
      ]
    };
    
    return {
      success: true,
      audit: metaTagsAudit,
      summary: `Meta tags audit for ${url}: Title ${metaTagsAudit.title.optimal ? 'optimal' : 'needs adjustment'} (${metaTagsAudit.title.length} chars, score: ${metaTagsAudit.title.score}/100), Description ${metaTagsAudit.description.optimal ? 'optimal' : 'needs adjustment'} (${metaTagsAudit.description.length} chars, score: ${metaTagsAudit.description.score}/100).`
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check meta tags',
      url
    };
  }
}

