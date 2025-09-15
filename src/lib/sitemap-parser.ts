import { XMLParser } from 'fast-xml-parser';

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

export interface SitemapIndex {
  sitemap: {
    loc: string;
    lastmod?: string;
  }[];
}

export interface ParsedSitemap {
  urls: SitemapUrl[];
  type: 'urlset' | 'sitemapindex';
}

/**
 * Detects if a URL contains ANY language/locale path segments
 * Returns true ONLY if the URL has no language prefix (default English content)
 */
export function isEnglishUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // ALL language and locale codes to exclude (we want ONLY default English - no prefixes)
    const allLanguageLocaleCodes = [
      // English locales (exclude all - we want only default English)
      '/en/', '/en-us/', '/en-gb/', '/en-au/', '/en-ca/', '/en-nz/', '/en-ie/', '/en-za/', '/en-in/',
      
      // Non-English languages
      '/ar/', '/fr/', '/de/', '/es/', '/it/', '/pt/', '/ru/', '/ja/', '/ko/',
      '/zh/', '/zh-cn/', '/zh-hans/', '/zh-hant/', '/hi/', '/th/', '/vi/',
      '/pl/', '/nl/', '/sv/', '/da/', '/no/', '/fi/', '/tr/', '/cs/', '/hu/',
      '/ro/', '/bg/', '/hr/', '/sk/', '/sl/', '/et/', '/lv/', '/lt/', '/mt/',
      '/el/', '/cy/', '/ga/', '/eu/', '/ca/', '/gl/', '/ast/', '/an/', '/oc/',
      '/co/', '/sc/', '/rm/', '/fur/', '/lld/', '/vec/', '/lij/', '/pms/',
      '/lmo/', '/eml/', '/rgn/', '/nap/', '/scn/', '/srd/', '/mg/', '/sw/',
      '/zu/', '/af/', '/xh/', '/st/', '/tn/', '/ts/', '/ss/', '/nr/', '/nd/',
      '/ve/', '/he/', '/ar-sa/', '/fa/', '/ur/', '/bn/', '/ta/', '/te/',
      '/kn/', '/ml/', '/gu/', '/pa/', '/or/', '/as/', '/mr/', '/ne/', '/si/',
      '/my/', '/km/', '/lo/', '/ka/', '/am/', '/ti/', '/so/', '/ha/', '/ig/',
      '/yo/', '/id/', '/ms/', '/tl/', '/ceb/', '/haw/', '/mi/', '/sm/', '/to/',
      
      // Specific locale variations
      '/pt-br/', '/pt-pt/', '/es-es/', '/es-mx/', '/es-ar/', '/es-co/', '/es-pe/',
      '/es-ve/', '/es-cl/', '/es-ec/', '/es-gt/', '/es-cu/', '/es-bo/',
      '/es-do/', '/es-hn/', '/es-py/', '/es-sv/', '/es-ni/', '/es-cr/',
      '/es-pa/', '/es-uy/', '/fr-ca/', '/fr-ch/', '/fr-be/', '/de-at/',
      '/de-ch/', '/it-ch/', '/nl-be/', '/zh-tw/', '/zh-hk/', '/ar-ae/',
      '/ar-sa/', '/ar-eg/', '/ar-ma/', '/fr-fr/', '/de-de/', '/it-it/',
      '/ru-ru/', '/ja-jp/', '/ko-kr/', '/hi-in/', '/th-th/', '/vi-vn/'
    ];
    
    // Check if pathname starts with any language/locale code
    const hasLanguagePrefix = allLanguageLocaleCodes.some(code => 
      pathname.startsWith(code)
    );
    
    // Return true ONLY if it's default English (no language prefix found)
    return !hasLanguagePrefix;
  } catch (error) {
    // If URL parsing fails, assume it's not valid and exclude it
    return false;
  }
}

/**
 * Fetches and parses a sitemap XML
 */
export async function fetchSitemap(sitemapUrl: string): Promise<string> {
  try {
    const response = await fetch(sitemapUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.text();
  } catch (error) {
    throw new Error(`Failed to fetch sitemap: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parses sitemap XML content
 */
export function parseSitemapXml(xmlContent: string): ParsedSitemap {
  const parser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true
  });
  
  try {
    const parsed = parser.parse(xmlContent);
    
    // Handle sitemap index
    if (parsed.sitemapindex) {
      const sitemaps = Array.isArray(parsed.sitemapindex.sitemap) 
        ? parsed.sitemapindex.sitemap 
        : [parsed.sitemapindex.sitemap];
        
      return {
        urls: sitemaps.map((sitemap: any) => ({
          loc: sitemap.loc,
          lastmod: sitemap.lastmod
        })),
        type: 'sitemapindex'
      };
    }
    
    // Handle regular sitemap
    if (parsed.urlset) {
      const urls = Array.isArray(parsed.urlset.url) 
        ? parsed.urlset.url 
        : [parsed.urlset.url];
        
      return {
        urls: urls.map((url: any) => ({
          loc: url.loc,
          lastmod: url.lastmod,
          changefreq: url.changefreq,
          priority: url.priority
        })),
        type: 'urlset'
      };
    }
    
    throw new Error('Invalid sitemap format');
  } catch (error) {
    throw new Error(`Failed to parse sitemap XML: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Filters URLs to include only English pages
 */
export function filterEnglishUrls(urls: SitemapUrl[]): SitemapUrl[] {
  return urls.filter(url => isEnglishUrl(url.loc));
}

/**
 * Main function to get English URLs from a sitemap
 */
export async function getEnglishUrlsFromSitemap(sitemapUrl: string): Promise<SitemapUrl[]> {
  try {
    const xmlContent = await fetchSitemap(sitemapUrl);
    const parsedSitemap = parseSitemapXml(xmlContent);
    
    if (parsedSitemap.type === 'sitemapindex') {
      // If it's a sitemap index, we need to fetch and parse each individual sitemap
      const allUrls: SitemapUrl[] = [];
      
      for (const indexEntry of parsedSitemap.urls) {
        try {
          const childSitemapContent = await fetchSitemap(indexEntry.loc);
          const childSitemap = parseSitemapXml(childSitemapContent);
          
          if (childSitemap.type === 'urlset') {
            const englishUrls = filterEnglishUrls(childSitemap.urls);
            allUrls.push(...englishUrls);
          }
        } catch (error) {
          console.warn(`Failed to process sitemap: ${indexEntry.loc}`, error);
          // Continue processing other sitemaps even if one fails
        }
      }
      
      return allUrls;
    } else {
      // Regular sitemap, filter directly
      return filterEnglishUrls(parsedSitemap.urls);
    }
  } catch (error) {
    throw new Error(`Failed to get English URLs from sitemap: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Batch URLs into smaller chunks for processing
 */
export function batchUrls(urls: SitemapUrl[], batchSize: number = 10): SitemapUrl[][] {
  const batches: SitemapUrl[][] = [];
  
  for (let i = 0; i < urls.length; i += batchSize) {
    batches.push(urls.slice(i, i + batchSize));
  }
  
  return batches;
}