'use client';

import { useState } from 'react';
import { Globe, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

interface ScrapingResult {
  url: string;
  success: boolean;
  document_id?: string;
  chunks_created?: number;
  title?: string;
  error?: string;
}

interface SitemapResult {
  total_urls: number;
  processed: number;
  successful: number;
  failed: number;
  skipped: number;
  total_batches: number;
  results: ScrapingResult[];
  summary: {
    success_rate: number;
    processing_time_estimate: string;
    english_urls_found: number;
    urls_processed: number;
    existing_urls_skipped: number;
    skip_existing_enabled: boolean;
  };
  error?: string;
}

export default function SitemapScrapeForm() {
  const [sitemapUrl, setSitemapUrl] = useState('');
  const [maxUrls, setMaxUrls] = useState(50);
  const [batchSize, setBatchSize] = useState(5);
  const [skipExisting, setSkipExisting] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SitemapResult | null>(null);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sitemapUrl.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/scrape-sitemap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sitemap_url: sitemapUrl.trim(),
          max_urls: maxUrls,
          batch_size: batchSize,
          skip_existing: skipExisting
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process sitemap');
      }

      setResult(data);
      setSitemapUrl(''); // Clear input on success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while processing sitemap');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="sitemap-url" className="block text-sm font-medium text-gray-700 mb-2">
            Sitemap URL
          </label>
          <input
            id="sitemap-url"
            type="url"
            value={sitemapUrl}
            onChange={(e) => setSitemapUrl(e.target.value)}
            placeholder="https://example.com/sitemap.xml"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            required
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Only English pages will be processed (excludes URLs with language paths like /fr/, /de/, etc.)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="max-urls" className="block text-sm font-medium text-gray-700 mb-2">
              Max URLs to Process
            </label>
            <input
              id="max-urls"
              type="number"
              min="1"
              max="2000"
              value={maxUrls}
              onChange={(e) => setMaxUrls(parseInt(e.target.value) || 50)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="batch-size" className="block text-sm font-medium text-gray-700 mb-2">
              Batch Size
            </label>
            <input
              id="batch-size"
              type="number"
              min="1"
              max="20"
              value={batchSize}
              onChange={(e) => setBatchSize(parseInt(e.target.value) || 5)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              disabled={loading}
            />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <input
            id="skip-existing"
            type="checkbox"
            checked={skipExisting}
            onChange={(e) => setSkipExisting(e.target.checked)}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            disabled={loading}
          />
          <label htmlFor="skip-existing" className="text-sm font-medium text-gray-700">
            Skip URLs that are already scraped (recommended)
          </label>
        </div>

        <button
          type="submit"
          disabled={loading || !sitemapUrl.trim()}
          className="w-full p-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing Sitemap...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <Globe className="w-4 h-4 mr-2" />
              Process Sitemap
            </span>
          )}
        </button>
      </form>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          <div className="flex">
            <XCircle className="flex-shrink-0 h-5 w-5 text-red-400 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {result && !result.error && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg">
            <div className="flex">
              <CheckCircle className="flex-shrink-0 h-5 w-5 text-blue-400 mr-2" />
              <div className="space-y-1">
                <p className="font-medium">✅ Sitemap processing completed!</p>
                <div className="text-sm space-y-1">
                  <p>Found {result.summary.english_urls_found} English URLs, processed {result.summary.urls_processed}</p>
                  <p>Success rate: {result.summary.success_rate}% ({result.successful}/{result.total_urls})</p>
                  {result.skipped > 0 && (
                    <p>Skipped: {result.skipped} URLs (already in database)</p>
                  )}
                  <p>Failed: {result.failed} URLs</p>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Stats */}
          <div className={`grid gap-4 ${result.skipped > 0 ? 'grid-cols-2 md:grid-cols-5' : 'grid-cols-2 md:grid-cols-4'}`}>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{result.successful}</div>
              <div className="text-sm text-green-600">Successful</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{result.failed}</div>
              <div className="text-sm text-red-600">Failed</div>
            </div>
            {result.skipped > 0 && (
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{result.skipped}</div>
                <div className="text-sm text-yellow-600">Skipped</div>
              </div>
            )}
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{result.total_urls}</div>
              <div className="text-sm text-blue-600">Total Processed</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{result.total_batches}</div>
              <div className="text-sm text-purple-600">Batches</div>
            </div>
          </div>

          {/* Results Details */}
          {result.results && result.results.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-800">Processing Results:</h4>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {result.results.map((item, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border text-sm ${
                      item.success
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-red-50 border-red-200 text-red-700'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {item.success ? (
                        <CheckCircle className="flex-shrink-0 h-4 w-4 mt-0.5" />
                      ) : (
                        <XCircle className="flex-shrink-0 h-4 w-4 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="truncate">
                          <span className="font-medium">{item.title || 'No title'}</span>
                        </div>
                        <div className="truncate text-xs opacity-75">{item.url}</div>
                        {item.success ? (
                          <div className="text-xs">
                            Created {item.chunks_created} chunks
                          </div>
                        ) : (
                          <div className="text-xs">
                            Error: {item.error}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Help text */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex">
          <AlertCircle className="flex-shrink-0 h-5 w-5 text-yellow-400 mr-2" />
          <div className="text-sm text-yellow-700">
            <p className="font-medium mb-1">Tips for sitemap scraping:</p>
            <ul className="space-y-1 text-xs">
              <li>• Keep &quot;Skip existing URLs&quot; checked to avoid re-processing already scraped content</li>
              <li>• Use smaller batch sizes (3-5) for large sitemaps to avoid overwhelming the target server</li>
              <li>• Start with a lower max URLs limit to test before processing large amounts</li>
              <li>• Processing time depends on batch size and number of URLs</li>
              <li>• Failed URLs are typically due to access restrictions or invalid content</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}