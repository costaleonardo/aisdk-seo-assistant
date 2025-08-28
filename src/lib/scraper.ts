import * as cheerio from 'cheerio';

export interface ScrapedContent {
  title: string;
  content: string;
  url: string;
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
    
    // Remove unwanted elements
    $('script, style, nav, footer, header, aside, .nav, .footer, .header, .sidebar').remove();
    
    // Extract title - try multiple selectors
    const title = $('title').text() || 
                  $('h1').first().text() || 
                  $('meta[property="og:title"]').attr('content') || 
                  'Untitled';
    
    // Extract main content - prioritize article content
    let content = '';
    const articleContent = $('article, main, .content, #content, .post, .entry');
    
    if (articleContent.length > 0) {
      content = articleContent.first().text();
    } else {
      content = $('body').text();
    }
    
    // Clean up whitespace and normalize text
    const cleanedContent = content
      .replace(/\s+/g, ' ')  // Replace multiple whitespace with single space
      .replace(/\n+/g, ' ')  // Replace newlines with space
      .trim();
    
    if (!cleanedContent) {
      throw new Error('No content found on the page');
    }
    
    return {
      title: title.trim(),
      content: cleanedContent,
      url
    };
  } catch (error) {
    throw new Error(`Failed to scrape website: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}