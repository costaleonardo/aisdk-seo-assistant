import * as cheerio from 'cheerio';

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
    
    return {
      title: title.trim(),
      content: cleanedContent,
      url,
      seo_data: seoData,
      meta_tags: metaTags,
      headings,
      links,
      images
    };
  } catch (error) {
    throw new Error(`Failed to scrape website: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}