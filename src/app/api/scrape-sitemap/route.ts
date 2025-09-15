import { NextRequest, NextResponse } from 'next/server';
import { getEnglishUrlsFromSitemap, batchUrls, SitemapUrl } from '@/lib/sitemap-parser';
import { scrapeWebsite } from '@/lib/scraper';
import { chunkContent } from '@/lib/chunking';
import { storeDocument, checkExistingUrls } from '@/lib/vector-store';

interface ScrapingResult {
  url: string;
  success: boolean;
  document_id?: string;
  chunks_created?: number;
  title?: string;
  error?: string;
}

interface BatchProgress {
  total_urls: number;
  processed: number;
  successful: number;
  failed: number;
  skipped: number;
  current_batch: number;
  total_batches: number;
  results: ScrapingResult[];
}

export async function POST(request: NextRequest) {
  try {
    const { sitemap_url, batch_size = 5, max_urls = 100, skip_existing = true } = await request.json();
    
    if (!sitemap_url || typeof sitemap_url !== 'string') {
      return NextResponse.json(
        { error: 'Valid sitemap URL is required' },
        { status: 400 }
      );
    }

    // Validate sitemap URL format
    try {
      new URL(sitemap_url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid sitemap URL format' },
        { status: 400 }
      );
    }

    console.log(`Starting sitemap processing: ${sitemap_url}`);
    
    // Get English URLs from sitemap
    let englishUrls: SitemapUrl[];
    try {
      englishUrls = await getEnglishUrlsFromSitemap(sitemap_url);
    } catch (error) {
      console.error('Sitemap parsing error:', error);
      return NextResponse.json(
        { 
          error: 'Failed to parse sitemap',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        },
        { status: 500 }
      );
    }

    if (englishUrls.length === 0) {
      return NextResponse.json({
        total_urls: 0,
        processed: 0,
        successful: 0,
        failed: 0,
        skipped: 0,
        results: [],
        message: 'No English URLs found in sitemap'
      });
    }

    // Limit URLs if specified
    const limitedUrls = englishUrls.slice(0, max_urls);
    
    // Check for existing URLs if skip_existing is enabled
    let urlsToProcess = limitedUrls;
    let skippedCount = 0;
    
    if (skip_existing) {
      console.log('Checking for existing URLs in database...');
      const allUrls = limitedUrls.map(url => url.loc);
      const { existing, new: newUrls } = await checkExistingUrls(allUrls);
      
      urlsToProcess = limitedUrls.filter(url => newUrls.includes(url.loc));
      skippedCount = existing.length;
      
      console.log(`Found ${existing.length} existing URLs, ${newUrls.length} new URLs to process`);
      
      if (existing.length > 0) {
        console.log('Skipping existing URLs:', existing.slice(0, 5), existing.length > 5 ? `... and ${existing.length - 5} more` : '');
      }
    }
    
    if (urlsToProcess.length === 0) {
      return NextResponse.json({
        total_urls: limitedUrls.length,
        processed: 0,
        successful: 0,
        failed: 0,
        skipped: skippedCount,
        results: [],
        message: skip_existing ? 'All URLs already exist in database' : 'No URLs to process',
        summary: {
          success_rate: 0,
          processing_time_estimate: '0 batches processed',
          english_urls_found: englishUrls.length,
          urls_processed: 0,
          existing_urls_skipped: skippedCount
        }
      });
    }
    
    const batches = batchUrls(urlsToProcess, batch_size);
    
    console.log(`Found ${englishUrls.length} English URLs, processing ${urlsToProcess.length} URLs in ${batches.length} batches${skip_existing && skippedCount > 0 ? `, skipping ${skippedCount} existing URLs` : ''}`);

    const progress: BatchProgress = {
      total_urls: urlsToProcess.length,
      processed: 0,
      successful: 0,
      failed: 0,
      skipped: skippedCount,
      current_batch: 0,
      total_batches: batches.length,
      results: []
    };

    // Process batches sequentially to avoid overwhelming the target server
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      progress.current_batch = batchIndex + 1;
      
      console.log(`Processing batch ${progress.current_batch}/${progress.total_batches} with ${batch.length} URLs`);

      // Process URLs in current batch in parallel
      const batchPromises = batch.map(async (sitemapUrl): Promise<ScrapingResult> => {
        try {
          // Scrape the website
          const scrapedContent = await scrapeWebsite(sitemapUrl.loc);
          
          // Chunk the content
          const chunks = chunkContent(scrapedContent.content, {
            maxLength: 500,
            overlap: 50
          });
          
          // Store document and chunks with embeddings
          const document = await storeDocument(scrapedContent, chunks);
          
          return {
            url: sitemapUrl.loc,
            success: true,
            document_id: document.id.toString(),
            chunks_created: chunks.length,
            title: scrapedContent.title
          };
        } catch (error) {
          console.error(`Failed to scrape ${sitemapUrl.loc}:`, error);
          return {
            url: sitemapUrl.loc,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      });

      // Wait for current batch to complete
      const batchResults = await Promise.all(batchPromises);
      
      // Update progress
      progress.results.push(...batchResults);
      progress.processed += batchResults.length;
      progress.successful += batchResults.filter(r => r.success).length;
      progress.failed += batchResults.filter(r => !r.success).length;

      console.log(`Batch ${progress.current_batch} completed. Success: ${batchResults.filter(r => r.success).length}, Failed: ${batchResults.filter(r => !r.success).length}`);

      // Add delay between batches to be respectful to the target server
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      }
    }

    console.log(`Sitemap processing completed. Total: ${progress.total_urls}, Successful: ${progress.successful}, Failed: ${progress.failed}${progress.skipped > 0 ? `, Skipped: ${progress.skipped}` : ''}`);

    return NextResponse.json({
      total_urls: progress.total_urls,
      processed: progress.processed,
      successful: progress.successful,
      failed: progress.failed,
      skipped: progress.skipped,
      total_batches: progress.total_batches,
      results: progress.results,
      summary: {
        success_rate: progress.total_urls > 0 ? Math.round((progress.successful / progress.total_urls) * 100) : 0,
        processing_time_estimate: `${progress.total_batches} batches processed`,
        english_urls_found: englishUrls.length,
        urls_processed: urlsToProcess.length,
        existing_urls_skipped: progress.skipped,
        skip_existing_enabled: skip_existing
      }
    });
    
  } catch (error) {
    console.error('Sitemap scraping error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        error: 'Failed to process sitemap',
        message: errorMessage
      },
      { status: 500 }
    );
  }
}