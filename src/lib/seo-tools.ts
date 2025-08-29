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

export const analyzeContentQualitySchema = z.object({
  url: z.string().url().describe('The URL to analyze content quality metrics for')
});

export const checkReadabilitySchema = z.object({
  url: z.string().url().describe('The URL to check content readability and accessibility for')
});

export const analyzeContentDepthSchema = z.object({
  url: z.string().url().describe('The URL to analyze content depth and comprehensiveness for')
});

export const compareContentQualitySchema = z.object({
  url1: z.string().url().describe('The first URL to compare content quality'),
  url2: z.string().url().describe('The second URL to compare content quality')
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
      contentQuality: scrapedContent.content_quality,
      summary: `SEO analysis completed for ${url}. Overall score: ${scoreData.overall_score}/100 (${scoreData.grade}). Content: ${scrapedContent.content_quality.word_count} words, ${scrapedContent.content_quality.readability_score}/100 readability, ${scrapedContent.content_quality.content_depth_score}/100 depth score. Content type: ${scrapedContent.content_quality.content_type}. Top priorities: ${scoreData.priority_issues.slice(0, 3).map(p => p.category).join(', ')}.`
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

export async function analyzeContentQuality(url: string) {
  try {
    const scrapedContent = await scrapeWebsite(url);
    const contentMetrics = scrapedContent.content_quality;
    
    // Analyze content quality with recommendations
    const qualityAssessment = {
      url,
      metrics: contentMetrics,
      readabilityLevel: getReadabilityLevel(contentMetrics.readability_score),
      contentDepthLevel: getContentDepthLevel(contentMetrics.content_depth_score),
      recommendations: generateContentQualityRecommendations(contentMetrics),
      strengths: identifyContentStrengths(contentMetrics),
      opportunities: identifyContentOpportunities(contentMetrics)
    };
    
    return {
      success: true,
      assessment: qualityAssessment,
      summary: `Content quality analysis for ${url}: ${contentMetrics.word_count} words (${contentMetrics.reading_time_minutes} min read), ${qualityAssessment.readabilityLevel} readability (${contentMetrics.readability_score}/100), ${qualityAssessment.contentDepthLevel} depth (${contentMetrics.content_depth_score}/100). Content type: ${contentMetrics.content_type}. ${contentMetrics.topic_keywords.length} topic keywords, ${contentMetrics.semantic_keywords.length} semantic keywords identified.`
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze content quality',
      url
    };
  }
}

export async function checkReadability(url: string) {
  try {
    const scrapedContent = await scrapeWebsite(url);
    const contentMetrics = scrapedContent.content_quality;
    
    const readabilityAudit = {
      url,
      readabilityScore: contentMetrics.readability_score,
      readabilityLevel: getReadabilityLevel(contentMetrics.readability_score),
      averageSentenceLength: contentMetrics.average_sentence_length,
      sentenceCount: contentMetrics.sentence_count,
      paragraphCount: contentMetrics.paragraph_count,
      averageWordsPerParagraph: contentMetrics.average_words_per_paragraph,
      readingTime: contentMetrics.reading_time_minutes,
      recommendations: generateReadabilityRecommendations(contentMetrics),
      targetAudience: determineTargetAudience(contentMetrics.readability_score)
    };
    
    return {
      success: true,
      audit: readabilityAudit,
      summary: `Readability analysis for ${url}: ${readabilityAudit.readabilityLevel} (${contentMetrics.readability_score}/100). Average ${contentMetrics.average_sentence_length} words/sentence, ${contentMetrics.average_words_per_paragraph} words/paragraph. ${contentMetrics.reading_time_minutes} minute read. Target audience: ${readabilityAudit.targetAudience}.`
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check readability',
      url
    };
  }
}

export async function analyzeContentDepth(url: string) {
  try {
    const scrapedContent = await scrapeWebsite(url);
    const contentMetrics = scrapedContent.content_quality;
    
    const depthAnalysis = {
      url,
      depthScore: contentMetrics.content_depth_score,
      depthLevel: getContentDepthLevel(contentMetrics.content_depth_score),
      wordCount: contentMetrics.word_count,
      topicKeywords: contentMetrics.topic_keywords,
      semanticKeywords: contentMetrics.semantic_keywords,
      contentComprehensiveness: assessContentComprehensiveness(contentMetrics),
      topicCoverage: assessTopicCoverage(contentMetrics),
      semanticRichness: assessSemanticRichness(contentMetrics),
      recommendations: generateDepthRecommendations(contentMetrics)
    };
    
    return {
      success: true,
      analysis: depthAnalysis,
      summary: `Content depth analysis for ${url}: ${depthAnalysis.depthLevel} (${contentMetrics.content_depth_score}/100). ${contentMetrics.word_count} words with ${contentMetrics.topic_keywords.length} topic keywords and ${contentMetrics.semantic_keywords.length} semantic keywords. Topic coverage: ${depthAnalysis.topicCoverage}, Semantic richness: ${depthAnalysis.semanticRichness}.`
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze content depth',
      url
    };
  }
}

export async function compareContentQuality(url1: string, url2: string) {
  try {
    const [scrapedContent1, scrapedContent2] = await Promise.all([
      scrapeWebsite(url1),
      scrapeWebsite(url2)
    ]);
    
    const metrics1 = scrapedContent1.content_quality;
    const metrics2 = scrapedContent2.content_quality;
    
    const comparison = {
      url1,
      url2,
      wordCount: compareMetric(metrics1.word_count, metrics2.word_count, 'higher'),
      readability: compareMetric(metrics1.readability_score, metrics2.readability_score, 'higher'),
      contentDepth: compareMetric(metrics1.content_depth_score, metrics2.content_depth_score, 'higher'),
      readingTime: compareMetric(metrics1.reading_time_minutes, metrics2.reading_time_minutes, 'lower'),
      topicKeywords: compareMetric(metrics1.topic_keywords.length, metrics2.topic_keywords.length, 'higher'),
      semanticKeywords: compareMetric(metrics1.semantic_keywords.length, metrics2.semantic_keywords.length, 'higher'),
      sentenceLength: compareMetric(metrics1.average_sentence_length, metrics2.average_sentence_length, 'optimal'),
      overallWinner: determineContentQualityWinner(metrics1, metrics2)
    };
    
    return {
      success: true,
      comparison,
      metrics: { url1: metrics1, url2: metrics2 },
      summary: `Content quality comparison: ${comparison.overallWinner === 'url1' ? url1 : url2} has better overall content quality. Word count: ${comparison.wordCount.winner}, Readability: ${comparison.readability.winner}, Content depth: ${comparison.contentDepth.winner}, Topic coverage: ${comparison.topicKeywords.winner}.`
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to compare content quality',
      url1,
      url2
    };
  }
}

// Helper functions for content quality analysis
export function getReadabilityLevel(score: number): string {
  if (score >= 90) return 'Very Easy';
  if (score >= 80) return 'Easy';
  if (score >= 70) return 'Fairly Easy';
  if (score >= 60) return 'Standard';
  if (score >= 50) return 'Fairly Difficult';
  if (score >= 30) return 'Difficult';
  return 'Very Difficult';
}

export function getContentDepthLevel(score: number): string {
  if (score >= 80) return 'Comprehensive';
  if (score >= 60) return 'Detailed';
  if (score >= 40) return 'Moderate';
  if (score >= 20) return 'Basic';
  return 'Minimal';
}

function generateContentQualityRecommendations(metrics: any): string[] {
  const recommendations = [];
  
  if (metrics.word_count < 300) {
    recommendations.push('Expand content - aim for at least 300 words for better SEO performance');
  }
  if (metrics.readability_score < 60) {
    recommendations.push('Improve readability by using shorter sentences and simpler words');
  }
  if (metrics.content_depth_score < 50) {
    recommendations.push('Enhance content depth with more topic coverage and semantic keywords');
  }
  if (metrics.topic_keywords.length < 3) {
    recommendations.push('Include more relevant topic keywords throughout the content');
  }
  if (metrics.semantic_keywords.length < 2) {
    recommendations.push('Add more business and industry-specific semantic keywords');
  }
  
  return recommendations;
}

function identifyContentStrengths(metrics: any): string[] {
  const strengths = [];
  
  if (metrics.word_count >= 1000) strengths.push('Comprehensive word count');
  if (metrics.readability_score >= 70) strengths.push('Good readability');
  if (metrics.content_depth_score >= 70) strengths.push('Strong content depth');
  if (metrics.topic_keywords.length >= 5) strengths.push('Rich topic keyword coverage');
  if (metrics.semantic_keywords.length >= 4) strengths.push('Good semantic keyword usage');
  
  return strengths;
}

function identifyContentOpportunities(metrics: any): string[] {
  const opportunities = [];
  
  if (metrics.word_count < 500) opportunities.push('Expand content length');
  if (metrics.average_sentence_length > 20) opportunities.push('Shorten sentences');
  if (metrics.content_depth_score < 60) opportunities.push('Increase content depth');
  if (metrics.topic_keywords.length < 5) opportunities.push('Add more topic keywords');
  
  return opportunities;
}

function generateReadabilityRecommendations(metrics: any): string[] {
  const recommendations = [];
  
  if (metrics.average_sentence_length > 20) {
    recommendations.push('Break up long sentences - aim for 15-20 words per sentence');
  }
  if (metrics.average_words_per_paragraph > 100) {
    recommendations.push('Create shorter paragraphs for better readability');
  }
  if (metrics.readability_score < 50) {
    recommendations.push('Simplify vocabulary and sentence structure');
  }
  
  return recommendations;
}

export function determineTargetAudience(readabilityScore: number): string {
  if (readabilityScore >= 90) return 'General audience (5th grade level)';
  if (readabilityScore >= 80) return 'General audience (6th grade level)';
  if (readabilityScore >= 70) return 'General audience (7th grade level)';
  if (readabilityScore >= 60) return 'High school level';
  if (readabilityScore >= 50) return 'College level';
  return 'Graduate level';
}

function assessContentComprehensiveness(metrics: any): string {
  const score = (metrics.word_count / 2000) * 40 + (metrics.topic_keywords.length / 10) * 35 + (metrics.semantic_keywords.length / 8) * 25;
  if (score >= 80) return 'Highly comprehensive';
  if (score >= 60) return 'Well-rounded';
  if (score >= 40) return 'Moderately comprehensive';
  return 'Needs expansion';
}

export function assessTopicCoverage(metrics: any): string {
  if (metrics.topic_keywords.length >= 8) return 'Excellent';
  if (metrics.topic_keywords.length >= 5) return 'Good';
  if (metrics.topic_keywords.length >= 3) return 'Fair';
  return 'Poor';
}

export function assessSemanticRichness(metrics: any): string {
  if (metrics.semantic_keywords.length >= 6) return 'Rich';
  if (metrics.semantic_keywords.length >= 4) return 'Good';
  if (metrics.semantic_keywords.length >= 2) return 'Moderate';
  return 'Limited';
}

function generateDepthRecommendations(metrics: any): string[] {
  const recommendations = [];
  
  if (metrics.content_depth_score < 70) {
    if (metrics.word_count < 1000) {
      recommendations.push('Expand content to at least 1000 words for better depth');
    }
    if (metrics.topic_keywords.length < 5) {
      recommendations.push('Include more relevant topic keywords and phrases');
    }
    if (metrics.semantic_keywords.length < 4) {
      recommendations.push('Add more industry-specific and semantic keywords');
    }
  }
  
  return recommendations;
}

function compareMetric(value1: number, value2: number, preferredDirection: 'higher' | 'lower' | 'optimal'): any {
  let winner;
  
  if (preferredDirection === 'higher') {
    winner = value1 > value2 ? 'url1' : value2 > value1 ? 'url2' : 'tie';
  } else if (preferredDirection === 'lower') {
    winner = value1 < value2 ? 'url1' : value2 < value1 ? 'url2' : 'tie';
  } else { // optimal (for sentence length, around 15-20 is ideal)
    const optimal = 17.5;
    const diff1 = Math.abs(value1 - optimal);
    const diff2 = Math.abs(value2 - optimal);
    winner = diff1 < diff2 ? 'url1' : diff2 < diff1 ? 'url2' : 'tie';
  }
  
  return {
    value1,
    value2,
    winner,
    difference: Math.abs(value1 - value2)
  };
}

function determineContentQualityWinner(metrics1: any, metrics2: any): 'url1' | 'url2' | 'tie' {
  let score1 = 0, score2 = 0;
  
  // Word count (20% weight)
  if (metrics1.word_count > metrics2.word_count) score1 += 20;
  else if (metrics2.word_count > metrics1.word_count) score2 += 20;
  
  // Readability (25% weight)
  if (metrics1.readability_score > metrics2.readability_score) score1 += 25;
  else if (metrics2.readability_score > metrics1.readability_score) score2 += 25;
  
  // Content depth (30% weight)
  if (metrics1.content_depth_score > metrics2.content_depth_score) score1 += 30;
  else if (metrics2.content_depth_score > metrics1.content_depth_score) score2 += 30;
  
  // Topic keywords (15% weight)
  if (metrics1.topic_keywords.length > metrics2.topic_keywords.length) score1 += 15;
  else if (metrics2.topic_keywords.length > metrics1.topic_keywords.length) score2 += 15;
  
  // Semantic keywords (10% weight)
  if (metrics1.semantic_keywords.length > metrics2.semantic_keywords.length) score1 += 10;
  else if (metrics2.semantic_keywords.length > metrics1.semantic_keywords.length) score2 += 10;
  
  return score1 > score2 ? 'url1' : score2 > score1 ? 'url2' : 'tie';
}

