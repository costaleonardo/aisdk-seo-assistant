import { ScrapedContent, SEOData, Heading, LinkData, ImageData } from './scraper';

export interface SEOAnalysis {
  title: TitleAnalysis;
  meta_description: MetaDescriptionAnalysis;
  headings: HeadingAnalysis;
  keywords: KeywordAnalysis;
  links: LinkAnalysis;
  images: ImageAnalysis;
  technical: TechnicalAnalysis;
}

export interface TitleAnalysis {
  length: number;
  is_optimal: boolean;
  has_keywords: boolean;
  score: number;
  recommendations: string[];
}

export interface MetaDescriptionAnalysis {
  length: number;
  is_optimal: boolean;
  has_keywords: boolean;
  score: number;
  recommendations: string[];
}

export interface HeadingAnalysis {
  h1_count: number;
  has_single_h1: boolean;
  hierarchy_valid: boolean;
  total_headings: number;
  score: number;
  recommendations: string[];
}

export interface KeywordAnalysis {
  density: { [keyword: string]: number };
  primary_keyword?: string;
  keyword_count: { [keyword: string]: number };
  score: number;
  recommendations: string[];
}

export interface LinkAnalysis {
  internal_count: number;
  external_count: number;
  total_count: number;
  ratio: number;
  score: number;
  recommendations: string[];
}

export interface ImageAnalysis {
  total_count: number;
  images_with_alt: number;
  images_without_alt: number;
  alt_text_percentage: number;
  score: number;
  recommendations: string[];
}

export interface TechnicalAnalysis {
  has_meta_title: boolean;
  has_meta_description: boolean;
  has_canonical: boolean;
  has_og_tags: boolean;
  has_twitter_cards: boolean;
  has_schema: boolean;
  score: number;
  recommendations: string[];
}

export interface ComparisonResult {
  url1: string;
  url2: string;
  title_comparison: {
    url1_score: number;
    url2_score: number;
    winner: 'url1' | 'url2' | 'tie';
  };
  meta_description_comparison: {
    url1_score: number;
    url2_score: number;
    winner: 'url1' | 'url2' | 'tie';
  };
  headings_comparison: {
    url1_score: number;
    url2_score: number;
    winner: 'url1' | 'url2' | 'tie';
  };
  overall_winner: 'url1' | 'url2' | 'tie';
}

export function analyzeTitleTag(title: string, content: string): TitleAnalysis {
  const length = title.length;
  const isOptimal = length >= 30 && length <= 60;
  
  // Simple keyword detection - look for common words in content
  const contentWords = content.toLowerCase().split(/\s+/).filter(word => word.length > 4);
  const wordFreq: { [key: string]: number } = {};
  contentWords.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });
  
  const topWords = Object.entries(wordFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
  
  const hasKeywords = topWords.some(word => 
    title.toLowerCase().includes(word)
  );
  
  let score = 0;
  if (isOptimal) score += 50;
  if (hasKeywords) score += 30;
  if (length > 0) score += 20;
  
  const recommendations = [];
  if (length < 30) recommendations.push('Title is too short. Aim for 30-60 characters.');
  if (length > 60) recommendations.push('Title is too long. Keep it under 60 characters.');
  if (!hasKeywords) recommendations.push('Include relevant keywords in your title.');
  if (length === 0) recommendations.push('Missing title tag.');
  
  return {
    length,
    is_optimal: isOptimal,
    has_keywords: hasKeywords,
    score: Math.min(score, 100),
    recommendations
  };
}

export function analyzeMetaDescription(description?: string, content?: string): MetaDescriptionAnalysis {
  if (!description) {
    return {
      length: 0,
      is_optimal: false,
      has_keywords: false,
      score: 0,
      recommendations: ['Missing meta description. Add a compelling 150-160 character description.']
    };
  }
  
  const length = description.length;
  const isOptimal = length >= 150 && length <= 160;
  
  let hasKeywords = false;
  if (content) {
    const contentWords = content.toLowerCase().split(/\s+/).filter(word => word.length > 4);
    const wordFreq: { [key: string]: number } = {};
    contentWords.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    const topWords = Object.entries(wordFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
    
    hasKeywords = topWords.some(word => 
      description.toLowerCase().includes(word)
    );
  }
  
  let score = 0;
  if (isOptimal) score += 50;
  if (hasKeywords) score += 30;
  if (length > 0 && length <= 160) score += 20;
  
  const recommendations = [];
  if (length < 150) recommendations.push('Meta description is too short. Aim for 150-160 characters.');
  if (length > 160) recommendations.push('Meta description is too long. Keep it under 160 characters.');
  if (!hasKeywords) recommendations.push('Include relevant keywords in your meta description.');
  
  return {
    length,
    is_optimal: isOptimal,
    has_keywords: hasKeywords,
    score: Math.min(score, 100),
    recommendations
  };
}

export function analyzeHeadingStructure(headings: Heading[]): HeadingAnalysis {
  const h1Count = headings.filter(h => h.level === 1).length;
  const hasSingleH1 = h1Count === 1;
  
  // Check hierarchy - each level should come after its parent level
  let hierarchyValid = true;
  for (let i = 1; i < headings.length; i++) {
    const current = headings[i];
    const previous = headings[i - 1];
    
    // If we jump more than one level (e.g., H2 to H4), it's invalid
    if (current.level - previous.level > 1) {
      hierarchyValid = false;
      break;
    }
  }
  
  let score = 0;
  if (hasSingleH1) score += 40;
  if (hierarchyValid) score += 30;
  if (headings.length > 0) score += 30;
  
  const recommendations = [];
  if (h1Count === 0) recommendations.push('Missing H1 tag. Add a single H1 for your main heading.');
  if (h1Count > 1) recommendations.push('Multiple H1 tags found. Use only one H1 per page.');
  if (!hierarchyValid) recommendations.push('Heading hierarchy is not logical. Ensure proper nesting (H1 → H2 → H3, etc.).');
  if (headings.length === 0) recommendations.push('No headings found. Use headings to structure your content.');
  
  return {
    h1_count: h1Count,
    has_single_h1: hasSingleH1,
    hierarchy_valid: hierarchyValid,
    total_headings: headings.length,
    score: Math.min(score, 100),
    recommendations
  };
}

export function analyzeKeywordDensity(content: string): KeywordAnalysis {
  const words = content.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3);
  
  const totalWords = words.length;
  const wordCount: { [key: string]: number } = {};
  
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  const density: { [key: string]: number } = {};
  Object.entries(wordCount).forEach(([word, count]) => {
    density[word] = (count / totalWords) * 100;
  });
  
  // Find primary keyword (most frequent with reasonable density)
  const candidates = Object.entries(density)
    .filter(([, density]) => density >= 1 && density <= 3)
    .sort(([, a], [, b]) => b - a);
  
  const primaryKeyword = candidates.length > 0 ? candidates[0][0] : undefined;
  
  let score = 60; // Base score
  if (primaryKeyword) {
    const primaryDensity = density[primaryKeyword];
    if (primaryDensity >= 1 && primaryDensity <= 2.5) {
      score += 40; // Optimal keyword density
    }
  }
  
  const recommendations = [];
  if (!primaryKeyword) {
    recommendations.push('No clear primary keyword identified. Focus your content on a main topic.');
  } else {
    const primaryDensity = density[primaryKeyword];
    if (primaryDensity > 3) {
      recommendations.push(`Keyword "${primaryKeyword}" density is too high (${primaryDensity.toFixed(1)}%). Aim for 1-2.5%.`);
    }
    if (primaryDensity < 1) {
      recommendations.push(`Keyword "${primaryKeyword}" density is too low (${primaryDensity.toFixed(1)}%). Consider using it more naturally.`);
    }
  }
  
  return {
    density,
    primary_keyword: primaryKeyword,
    keyword_count: wordCount,
    score: Math.min(score, 100),
    recommendations
  };
}

export function analyzeLinkStructure(links: LinkData[]): LinkAnalysis {
  const internalCount = links.filter(link => link.is_internal).length;
  const externalCount = links.filter(link => !link.is_internal).length;
  const totalCount = links.length;
  const ratio = totalCount > 0 ? internalCount / totalCount : 0;
  
  let score = 0;
  if (internalCount >= 3) score += 30; // Good internal linking
  if (externalCount >= 1 && externalCount <= 5) score += 20; // Some external links
  if (ratio >= 0.7) score += 30; // Good internal/external ratio
  if (totalCount >= 5) score += 20; // Sufficient linking
  
  const recommendations = [];
  if (internalCount < 3) recommendations.push('Add more internal links to improve site navigation and SEO.');
  if (externalCount === 0) recommendations.push('Consider adding relevant external links to authoritative sources.');
  if (externalCount > 10) recommendations.push('Too many external links may dilute page authority.');
  if (totalCount === 0) recommendations.push('No links found. Add both internal and external links to improve SEO.');
  
  return {
    internal_count: internalCount,
    external_count: externalCount,
    total_count: totalCount,
    ratio,
    score: Math.min(score, 100),
    recommendations
  };
}

export function analyzeImageOptimization(images: ImageData[]): ImageAnalysis {
  const totalCount = images.length;
  const imagesWithAlt = images.filter(img => img.alt && img.alt.trim().length > 0).length;
  const imagesWithoutAlt = totalCount - imagesWithAlt;
  const altTextPercentage = totalCount > 0 ? (imagesWithAlt / totalCount) * 100 : 0;
  
  let score = 0;
  if (altTextPercentage === 100) score += 50;
  else if (altTextPercentage >= 80) score += 40;
  else if (altTextPercentage >= 60) score += 30;
  else if (altTextPercentage >= 40) score += 20;
  else if (altTextPercentage >= 20) score += 10;
  
  if (totalCount > 0) score += 20; // Has images
  if (totalCount <= 20) score += 30; // Not too many images
  
  const recommendations = [];
  if (imagesWithoutAlt > 0) {
    recommendations.push(`${imagesWithoutAlt} images are missing alt text. Add descriptive alt text for accessibility and SEO.`);
  }
  if (totalCount === 0) {
    recommendations.push('No images found. Consider adding relevant images to enhance content.');
  }
  if (totalCount > 20) {
    recommendations.push('Many images detected. Ensure they are optimized for web performance.');
  }
  
  return {
    total_count: totalCount,
    images_with_alt: imagesWithAlt,
    images_without_alt: imagesWithoutAlt,
    alt_text_percentage: altTextPercentage,
    score: Math.min(score, 100),
    recommendations
  };
}

export function analyzeTechnicalSEO(seoData: SEOData): TechnicalAnalysis {
  const hasMetaTitle = !!(seoData.meta_title?.trim());
  const hasMetaDescription = !!(seoData.meta_description?.trim());
  const hasCanonical = !!(seoData.canonical_url?.trim());
  const hasOgTags = !!(seoData.og_title || seoData.og_description);
  const hasTwitterCards = !!(seoData.twitter_title || seoData.twitter_description);
  const hasSchema = seoData.schema_markup.length > 0;
  
  let score = 0;
  if (hasMetaTitle) score += 20;
  if (hasMetaDescription) score += 20;
  if (hasCanonical) score += 15;
  if (hasOgTags) score += 15;
  if (hasTwitterCards) score += 15;
  if (hasSchema) score += 15;
  
  const recommendations = [];
  if (!hasMetaTitle) recommendations.push('Missing meta title tag.');
  if (!hasMetaDescription) recommendations.push('Missing meta description tag.');
  if (!hasCanonical) recommendations.push('Missing canonical URL to prevent duplicate content issues.');
  if (!hasOgTags) recommendations.push('Missing Open Graph tags for better social media sharing.');
  if (!hasTwitterCards) recommendations.push('Missing Twitter Card tags for better Twitter sharing.');
  if (!hasSchema) recommendations.push('Consider adding structured data (Schema.org) for enhanced search results.');
  
  return {
    has_meta_title: hasMetaTitle,
    has_meta_description: hasMetaDescription,
    has_canonical: hasCanonical,
    has_og_tags: hasOgTags,
    has_twitter_cards: hasTwitterCards,
    has_schema: hasSchema,
    score: Math.min(score, 100),
    recommendations
  };
}

export function performSEOAnalysis(data: ScrapedContent): SEOAnalysis {
  return {
    title: analyzeTitleTag(data.title, data.content),
    meta_description: analyzeMetaDescription(data.seo_data.meta_description, data.content),
    headings: analyzeHeadingStructure(data.headings),
    keywords: analyzeKeywordDensity(data.content),
    links: analyzeLinkStructure(data.links),
    images: analyzeImageOptimization(data.images),
    technical: analyzeTechnicalSEO(data.seo_data)
  };
}

export function compareSEOAnalysis(analysis1: SEOAnalysis, analysis2: SEOAnalysis, url1: string, url2: string): ComparisonResult {
  return {
    url1,
    url2,
    title_comparison: {
      url1_score: analysis1.title.score,
      url2_score: analysis2.title.score,
      winner: analysis1.title.score > analysis2.title.score ? 'url1' : 
              analysis2.title.score > analysis1.title.score ? 'url2' : 'tie'
    },
    meta_description_comparison: {
      url1_score: analysis1.meta_description.score,
      url2_score: analysis2.meta_description.score,
      winner: analysis1.meta_description.score > analysis2.meta_description.score ? 'url1' : 
              analysis2.meta_description.score > analysis1.meta_description.score ? 'url2' : 'tie'
    },
    headings_comparison: {
      url1_score: analysis1.headings.score,
      url2_score: analysis2.headings.score,
      winner: analysis1.headings.score > analysis2.headings.score ? 'url1' : 
              analysis2.headings.score > analysis1.headings.score ? 'url2' : 'tie'
    },
    overall_winner: (() => {
      const url1Total = analysis1.title.score + analysis1.meta_description.score + 
                       analysis1.headings.score + analysis1.keywords.score + 
                       analysis1.links.score + analysis1.images.score + 
                       analysis1.technical.score;
      const url2Total = analysis2.title.score + analysis2.meta_description.score + 
                       analysis2.headings.score + analysis2.keywords.score + 
                       analysis2.links.score + analysis2.images.score + 
                       analysis2.technical.score;
      
      return url1Total > url2Total ? 'url1' : url2Total > url1Total ? 'url2' : 'tie';
    })()
  };
}

export function generateSEOSuggestions(analysis: SEOAnalysis): string[] {
  const allRecommendations: string[] = [];
  
  // Collect all recommendations with priority scoring
  const recommendations = [
    ...analysis.title.recommendations.map(r => ({ text: r, priority: analysis.title.score < 50 ? 3 : 2 })),
    ...analysis.meta_description.recommendations.map(r => ({ text: r, priority: analysis.meta_description.score < 50 ? 3 : 2 })),
    ...analysis.headings.recommendations.map(r => ({ text: r, priority: analysis.headings.score < 50 ? 3 : 2 })),
    ...analysis.keywords.recommendations.map(r => ({ text: r, priority: analysis.keywords.score < 50 ? 2 : 1 })),
    ...analysis.links.recommendations.map(r => ({ text: r, priority: analysis.links.score < 50 ? 2 : 1 })),
    ...analysis.images.recommendations.map(r => ({ text: r, priority: analysis.images.score < 50 ? 2 : 1 })),
    ...analysis.technical.recommendations.map(r => ({ text: r, priority: analysis.technical.score < 50 ? 3 : 2 }))
  ];
  
  // Sort by priority (higher priority first) and return unique recommendations
  return recommendations
    .sort((a, b) => b.priority - a.priority)
    .map(r => r.text)
    .filter((text, index, array) => array.indexOf(text) === index)
    .slice(0, 10); // Limit to top 10 recommendations
}