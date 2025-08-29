import * as cheerio from 'cheerio';

// Content analysis helper functions
export function analyzeContentQuality(content: string, title: string, headings: Heading[]): ContentQualityMetrics {
  // Basic text analysis
  const words = content.toLowerCase().match(/\b\w+\b/g) || [];
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  const word_count = words.length;
  const sentence_count = sentences.length;
  const paragraph_count = Math.max(paragraphs.length, 1);
  
  const average_sentence_length = sentence_count > 0 ? word_count / sentence_count : 0;
  const average_words_per_paragraph = paragraph_count > 0 ? word_count / paragraph_count : 0;
  
  // Readability score (simplified Flesch Reading Ease)
  const avgWordsPerSentence = average_sentence_length;
  const avgSyllablesPerWord = estimateAverageSyllables(words);
  const readability_score = Math.max(0, Math.min(100, 
    206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord)
  ));
  
  // Reading time (average 200 words per minute)
  const reading_time_minutes = Math.ceil(word_count / 200);
  
  // Extract topic keywords
  const topic_keywords = extractTopicKeywords(content, title, headings);
  
  // Extract semantic keywords
  const semantic_keywords = extractSemanticKeywords(content, topic_keywords);
  
  // Content depth score (based on word count, headings, and topic coverage)
  const content_depth_score = calculateContentDepthScore(
    word_count, 
    headings.length, 
    topic_keywords.length,
    semantic_keywords.length
  );
  
  // Determine content type
  const content_type = determineContentType(content, title, headings);
  
  return {
    word_count,
    sentence_count,
    paragraph_count,
    average_sentence_length: Math.round(average_sentence_length * 100) / 100,
    average_words_per_paragraph: Math.round(average_words_per_paragraph * 100) / 100,
    readability_score: Math.round(readability_score * 100) / 100,
    reading_time_minutes,
    content_depth_score,
    topic_keywords,
    semantic_keywords,
    content_type
  };
}

function estimateAverageSyllables(words: string[]): number {
  if (words.length === 0) return 0;
  
  let totalSyllables = 0;
  words.forEach(word => {
    // Simple syllable estimation
    let syllables = word.toLowerCase().match(/[aeiouy]+/g)?.length || 1;
    if (word.endsWith('e')) syllables--;
    if (syllables === 0) syllables = 1;
    totalSyllables += syllables;
  });
  
  return totalSyllables / words.length;
}

function extractTopicKeywords(content: string, title: string, headings: Heading[]): string[] {
  // Combine title and headings for topic analysis
  const topicText = [title, ...headings.map(h => h.text)].join(' ').toLowerCase();
  const contentText = content.toLowerCase();
  
  // Extract meaningful words (3+ characters, not common stop words)
  const stopWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just', 'don', 'should', 'now']);
  
  const words = topicText.match(/\b\w{3,}\b/g) || [];
  const wordFreq: { [key: string]: number } = {};
  
  words.forEach(word => {
    if (!stopWords.has(word)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });
  
  // Get top keywords that appear in content
  return Object.entries(wordFreq)
    .filter(([word]) => contentText.includes(word))
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
}

function extractSemanticKeywords(content: string, topicKeywords: string[]): string[] {
  const contentWords = content.toLowerCase().match(/\b\w{4,}\b/g) || [];
  const wordFreq: { [key: string]: number } = {};
  
  // Common business and technology semantic keywords for Concentrix context
  const semanticPatterns = [
    'digital', 'technology', 'transformation', 'automation', 'artificial', 'intelligence',
    'customer', 'experience', 'service', 'support', 'solution', 'platform',
    'cloud', 'data', 'analytics', 'insights', 'optimization', 'efficiency',
    'business', 'process', 'management', 'strategy', 'innovation', 'growth',
    'enterprise', 'scalable', 'integration', 'workflow', 'performance'
  ];
  
  contentWords.forEach(word => {
    if (semanticPatterns.includes(word) && !topicKeywords.includes(word)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });
  
  return Object.entries(wordFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([word]) => word);
}

function calculateContentDepthScore(wordCount: number, headingCount: number, topicKeywordCount: number, semanticKeywordCount: number): number {
  let score = 0;
  
  // Word count scoring (0-30 points)
  if (wordCount >= 2000) score += 30;
  else if (wordCount >= 1000) score += 25;
  else if (wordCount >= 500) score += 20;
  else if (wordCount >= 300) score += 15;
  else if (wordCount >= 150) score += 10;
  else score += 5;
  
  // Heading structure scoring (0-25 points)
  if (headingCount >= 8) score += 25;
  else if (headingCount >= 5) score += 20;
  else if (headingCount >= 3) score += 15;
  else if (headingCount >= 1) score += 10;
  
  // Topic coverage scoring (0-25 points)
  if (topicKeywordCount >= 8) score += 25;
  else if (topicKeywordCount >= 5) score += 20;
  else if (topicKeywordCount >= 3) score += 15;
  else if (topicKeywordCount >= 1) score += 10;
  
  // Semantic richness scoring (0-20 points)
  if (semanticKeywordCount >= 6) score += 20;
  else if (semanticKeywordCount >= 4) score += 15;
  else if (semanticKeywordCount >= 2) score += 10;
  else if (semanticKeywordCount >= 1) score += 5;
  
  return Math.min(score, 100);
}

function determineContentType(content: string, title: string, headings: Heading[]): 'informational' | 'commercial' | 'navigational' | 'mixed' {
  const allText = [title, ...headings.map(h => h.text), content].join(' ').toLowerCase();
  
  // Commercial indicators
  const commercialKeywords = ['buy', 'purchase', 'price', 'cost', 'sale', 'discount', 'offer', 'deal', 'product', 'service', 'pricing', 'quote', 'contact', 'demo', 'trial'];
  const commercialCount = commercialKeywords.filter(keyword => allText.includes(keyword)).length;
  
  // Informational indicators
  const informationalKeywords = ['how', 'what', 'why', 'when', 'where', 'guide', 'tutorial', 'learn', 'understand', 'explain', 'definition', 'overview', 'introduction'];
  const informationalCount = informationalKeywords.filter(keyword => allText.includes(keyword)).length;
  
  // Navigational indicators
  const navigationalKeywords = ['home', 'about', 'contact', 'careers', 'team', 'company', 'location', 'address', 'phone', 'email'];
  const navigationalCount = navigationalKeywords.filter(keyword => allText.includes(keyword)).length;
  
  const maxCount = Math.max(commercialCount, informationalCount, navigationalCount);
  
  if (maxCount === 0) return 'informational'; // Default
  
  const scores = { commercial: commercialCount, informational: informationalCount, navigational: navigationalCount };
  const tied = Object.values(scores).filter(score => score === maxCount).length > 1;
  
  if (tied) return 'mixed';
  
  if (commercialCount === maxCount) return 'commercial';
  if (navigationalCount === maxCount) return 'navigational';
  return 'informational';
}

export interface MetaTag {
  name?: string;
  property?: string;
  content?: string;
}

export interface Heading {
  level: number;
  text: string;
  order: number;
}

export interface LinkData {
  url: string;
  anchor_text: string;
  is_internal: boolean;
}

export interface ImageData {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface ContentQualityMetrics {
  word_count: number;
  sentence_count: number;
  paragraph_count: number;
  average_sentence_length: number;
  average_words_per_paragraph: number;
  readability_score: number;
  reading_time_minutes: number;
  content_depth_score: number;
  topic_keywords: string[];
  semantic_keywords: string[];
  content_type: 'informational' | 'commercial' | 'navigational' | 'mixed';
}

export interface SEOData {
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  meta_robots?: string;
  canonical_url?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  og_type?: string;
  twitter_title?: string;
  twitter_description?: string;
  twitter_image?: string;
  twitter_card?: string;
  schema_markup: string[];
}

export interface ScrapedContent {
  title: string;
  content: string;
  url: string;
  seo_data: SEOData;
  content_quality: ContentQualityMetrics;
  meta_tags: MetaTag[];
  headings: Heading[];
  links: LinkData[];
  images: ImageData[];
}

export async function scrapeWebsite(url: string): Promise<ScrapedContent> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Extract title - try multiple selectors
    const title = $('title').text() || 
                  $('h1').first().text() || 
                  $('meta[property="og:title"]').attr('content') || 
                  'Untitled';
    
    // Extract SEO Data
    const seoData: SEOData = {
      meta_title: $('meta[name="title"]').attr('content') || $('title').text(),
      meta_description: $('meta[name="description"]').attr('content'),
      meta_keywords: $('meta[name="keywords"]').attr('content'),
      meta_robots: $('meta[name="robots"]').attr('content'),
      canonical_url: $('link[rel="canonical"]').attr('href'),
      og_title: $('meta[property="og:title"]').attr('content'),
      og_description: $('meta[property="og:description"]').attr('content'),
      og_image: $('meta[property="og:image"]').attr('content'),
      og_type: $('meta[property="og:type"]').attr('content'),
      twitter_title: $('meta[name="twitter:title"]').attr('content'),
      twitter_description: $('meta[name="twitter:description"]').attr('content'),
      twitter_image: $('meta[name="twitter:image"]').attr('content'),
      twitter_card: $('meta[name="twitter:card"]').attr('content'),
      schema_markup: []
    };

    // Extract Schema markup (JSON-LD)
    $('script[type="application/ld+json"]').each((_, element) => {
      const jsonText = $(element).html();
      if (jsonText) {
        try {
          JSON.parse(jsonText); // Validate JSON
          seoData.schema_markup.push(jsonText.trim());
        } catch (e) {
          // Skip invalid JSON
        }
      }
    });

    // Extract all meta tags
    const metaTags: MetaTag[] = [];
    $('meta').each((_, element) => {
      const $meta = $(element);
      const name = $meta.attr('name');
      const property = $meta.attr('property');
      const content = $meta.attr('content');
      
      if ((name || property) && content) {
        metaTags.push({ name, property, content });
      }
    });

    // Extract headings with hierarchy
    const headings: Heading[] = [];
    let headingOrder = 0;
    $('h1, h2, h3, h4, h5, h6').each((_, element) => {
      const $heading = $(element);
      const text = $heading.text().trim();
      const tagName = element.tagName.toLowerCase();
      const level = parseInt(tagName.charAt(1));
      
      if (text) {
        headings.push({
          level,
          text,
          order: headingOrder++
        });
      }
    });

    // Extract links
    const links: LinkData[] = [];
    const baseUrlObj = new URL(url);
    $('a[href]').each((_, element) => {
      const $link = $(element);
      const href = $link.attr('href');
      const anchorText = $link.text().trim();
      
      if (href && anchorText) {
        try {
          const linkUrl = new URL(href, url);
          const isInternal = linkUrl.hostname === baseUrlObj.hostname;
          
          links.push({
            url: linkUrl.href,
            anchor_text: anchorText,
            is_internal: isInternal
          });
        } catch (e) {
          // Skip invalid URLs
        }
      }
    });

    // Extract images
    const images: ImageData[] = [];
    $('img[src]').each((_, element) => {
      const $img = $(element);
      const src = $img.attr('src');
      const alt = $img.attr('alt') || '';
      const width = $img.attr('width') ? parseInt($img.attr('width')!) : undefined;
      const height = $img.attr('height') ? parseInt($img.attr('height')!) : undefined;
      
      if (src) {
        try {
          const imageUrl = new URL(src, url);
          images.push({
            src: imageUrl.href,
            alt,
            width,
            height
          });
        } catch (e) {
          // Skip invalid image URLs
        }
      }
    });

    // Extract main content - prioritize article content
    let content = '';
    
    // Create a copy for content extraction without removing SEO elements
    const $contentExtraction = cheerio.load(html);
    $contentExtraction('script, style, nav, footer, header, aside, .nav, .footer, .header, .sidebar').remove();
    
    const articleContent = $contentExtraction('article, main, .content, #content, .post, .entry');
    
    if (articleContent.length > 0) {
      content = articleContent.first().text();
    } else {
      content = $contentExtraction('body').text();
    }
    
    // Clean up whitespace and normalize text
    const cleanedContent = content
      .replace(/\s+/g, ' ')  // Replace multiple whitespace with single space
      .replace(/\n+/g, ' ')  // Replace newlines with space
      .trim();
    
    if (!cleanedContent) {
      throw new Error('No content found on the page');
    }
    
    // Analyze content quality metrics
    const contentQuality = analyzeContentQuality(cleanedContent, title.trim(), headings);
    
    return {
      title: title.trim(),
      content: cleanedContent,
      url,
      seo_data: seoData,
      content_quality: contentQuality,
      meta_tags: metaTags,
      headings,
      links,
      images
    };
  } catch (error) {
    throw new Error(`Failed to scrape website: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}