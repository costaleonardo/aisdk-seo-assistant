'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MainLayout from '@/components/main-layout';

interface TestResult {
  success: boolean;
  message: string;
  data?: any;
}

interface KeywordData {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
}

export default function SearchConsoleTestPage() {
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [strikingDistance, setStrikingDistance] = useState<KeywordData[]>([]);
  const [topQueries, setTopQueries] = useState<KeywordData[]>([]);
  const [topPages, setTopPages] = useState<KeywordData[]>([]);
  const [aggregatedQueries, setAggregatedQueries] = useState<KeywordData[]>([]);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [debugData, setDebugData] = useState<any>(null);
  const [allTimeQueries, setAllTimeQueries] = useState<KeywordData[]>([]);
  const [allTimePages, setAllTimePages] = useState<KeywordData[]>([]);
  const [insightsPosts, setInsightsPosts] = useState<any[]>([]);
  const [lifetimeSummary, setLifetimeSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTest, setActiveTest] = useState<string>('');
  const [compareQuery, setCompareQuery] = useState('concentrix');
  const [contentPath, setContentPath] = useState('insights');

  const testConnection = async () => {
    setLoading(true);
    setActiveTest('connection');
    try {
      const response = await fetch('/api/search-console/test');
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Failed to test connection',
        data: { error: String(error) }
      });
    } finally {
      setLoading(false);
      setActiveTest('');
    }
  };

  const fetchKeywords = async () => {
    setLoading(true);
    setActiveTest('keywords');
    try {
      const response = await fetch('/api/search-console/keywords?days=7');
      const data = await response.json();
      if (data.success) {
        setKeywords(data.data.slice(0, 10));
      }
    } catch (error) {
      console.error('Failed to fetch keywords:', error);
    } finally {
      setLoading(false);
      setActiveTest('');
    }
  };

  const fetchStrikingDistance = async () => {
    setLoading(true);
    setActiveTest('striking');
    try {
      const response = await fetch('/api/search-console/striking-distance');
      const data = await response.json();
      if (data.success) {
        setStrikingDistance(data.data.slice(0, 10));
      }
    } catch (error) {
      console.error('Failed to fetch striking distance keywords:', error);
    } finally {
      setLoading(false);
      setActiveTest('');
    }
  };

  const fetchTopQueries = async () => {
    setLoading(true);
    setActiveTest('queries');
    try {
      const response = await fetch('/api/search-console/top-queries?limit=10');
      const data = await response.json();
      if (data.success) {
        setTopQueries(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch top queries:', error);
    } finally {
      setLoading(false);
      setActiveTest('');
    }
  };

  const fetchTopPages = async () => {
    setLoading(true);
    setActiveTest('pages');
    try {
      const response = await fetch('/api/search-console/top-pages?limit=5');
      const data = await response.json();
      if (data.success) {
        setTopPages(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch top pages:', error);
    } finally {
      setLoading(false);
      setActiveTest('');
    }
  };

  const fetchAggregatedQueries = async () => {
    setLoading(true);
    setActiveTest('aggregated');
    try {
      const response = await fetch('/api/search-console/aggregated-queries?limit=20&days=28&dataState=all');
      const data = await response.json();
      if (data.success) {
        setAggregatedQueries(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch aggregated queries:', error);
    } finally {
      setLoading(false);
      setActiveTest('');
    }
  };

  const compareQueryMethods = async () => {
    setLoading(true);
    setActiveTest('compare');
    try {
      const response = await fetch(`/api/search-console/compare?query=${encodeURIComponent(compareQuery)}`);
      const data = await response.json();
      if (data.success) {
        setComparisonData(data);
      }
    } catch (error) {
      console.error('Failed to compare query methods:', error);
    } finally {
      setLoading(false);
      setActiveTest('');
    }
  };

  const fetchDebugData = async () => {
    setLoading(true);
    setActiveTest('debug');
    try {
      const response = await fetch('/api/search-console/debug?days=28&limit=10&dataState=all&aggregationType=byProperty');
      const data = await response.json();
      if (data.success) {
        setDebugData(data);
      }
    } catch (error) {
      console.error('Failed to fetch debug data:', error);
    } finally {
      setLoading(false);
      setActiveTest('');
    }
  };

  // ALL-TIME DATA FETCHERS
  const fetchAllTimeQueries = async () => {
    setLoading(true);
    setActiveTest('all-time-queries');
    try {
      const response = await fetch('/api/search-console/all-time-queries?limit=20');
      const data = await response.json();
      if (data.success) {
        setAllTimeQueries(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch all-time queries:', error);
    } finally {
      setLoading(false);
      setActiveTest('');
    }
  };

  const fetchAllTimePages = async () => {
    setLoading(true);
    setActiveTest('all-time-pages');
    try {
      const response = await fetch('/api/search-console/all-time-pages?limit=15');
      const data = await response.json();
      if (data.success) {
        setAllTimePages(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch all-time pages:', error);
    } finally {
      setLoading(false);
      setActiveTest('');
    }
  };

  const fetchInsightsPosts = async () => {
    setLoading(true);
    setActiveTest('insights-posts');
    try {
      const response = await fetch('/api/search-console/insights-posts?limit=10');
      const data = await response.json();
      if (data.success) {
        setInsightsPosts(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch insights posts:', error);
    } finally {
      setLoading(false);
      setActiveTest('');
    }
  };

  const fetchLifetimeSummary = async () => {
    setLoading(true);
    setActiveTest('lifetime-summary');
    try {
      const response = await fetch('/api/search-console/lifetime-summary');
      const data = await response.json();
      if (data.success) {
        setLifetimeSummary(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch lifetime summary:', error);
    } finally {
      setLoading(false);
      setActiveTest('');
    }
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold mb-6">Google Search Console Test</h1>
        
        {/* Lifetime Performance Summary */}
        <Card className="border-2 border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ⭐ Lifetime Performance Summary
              <span className="text-sm font-normal text-yellow-700">(16 MONTHS MAX)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded">
              <p className="text-sm text-yellow-800">
                <strong>Perfect for SEO specialist queries:</strong> "What gets the most SEO traffic overall?"
              </p>
            </div>
            <button
              onClick={fetchLifetimeSummary}
              disabled={loading}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 mb-4"
            >
              {loading && activeTest === 'lifetime-summary' ? 'Loading...' : 'Get Lifetime Summary'}
            </button>
            
            {lifetimeSummary && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded border">
                  <h4 className="font-medium mb-2">Overall Site Performance</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Total Clicks:</span>
                      <span className="font-semibold text-green-600">{lifetimeSummary.totalClicks?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Impressions:</span>
                      <span className="font-semibold">{lifetimeSummary.totalImpressions?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average CTR:</span>
                      <span>{(lifetimeSummary.averageCTR * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Position:</span>
                      <span>{lifetimeSummary.averagePosition?.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded border">
                  <h4 className="font-medium mb-2">Top Performers</h4>
                  <div className="space-y-2 text-sm">
                    {lifetimeSummary.topQuery && (
                      <div>
                        <p className="font-medium">Top Query:</p>
                        <p className="text-green-600">{lifetimeSummary.topQuery.keys?.[0]} ({lifetimeSummary.topQuery.clicks} clicks)</p>
                      </div>
                    )}
                    {lifetimeSummary.topPage && (
                      <div>
                        <p className="font-medium">Top Page:</p>
                        <p className="text-blue-600 text-xs truncate">{lifetimeSummary.topPage.keys?.[0]}</p>
                        <p className="text-green-600">{lifetimeSummary.topPage.clicks} clicks</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Connection Test */}
        <Card>
          <CardHeader>
            <CardTitle>Connection Test</CardTitle>
          </CardHeader>
          <CardContent>
            <button
              onClick={testConnection}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading && activeTest === 'connection' ? 'Testing...' : 'Test Connection'}
            </button>
            
            {testResult && (
              <div className={`mt-4 p-4 rounded ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <p className={`font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {testResult.message}
                </p>
                {testResult.data && (
                  <div className="mt-2 text-sm">
                    <p>Site URL: {testResult.data.siteUrl}</p>
                    {testResult.data.rowCount !== undefined && (
                      <p>Sample data rows: {testResult.data.rowCount}</p>
                    )}
                    {testResult.data.sampleData && testResult.data.sampleData.length > 0 && (
                      <div className="mt-2">
                        <p className="font-medium">Sample Keywords:</p>
                        <ul className="list-disc list-inside">
                          {testResult.data.sampleData.map((item: any, i: number) => (
                            <li key={i}>{item.keys?.[0] || 'N/A'} - Clicks: {item.clicks || 0}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {testResult.data.error && (
                      <p className="text-red-600">Error: {testResult.data.error} - {testResult.data.details}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Queries */}
        <Card>
          <CardHeader>
            <CardTitle>Top Search Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <button
              onClick={fetchTopQueries}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 mb-4"
            >
              {loading && activeTest === 'queries' ? 'Loading...' : 'Fetch Top Queries'}
            </button>
            
            {topQueries.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Query</th>
                      <th className="text-right py-2">Clicks</th>
                      <th className="text-right py-2">Impressions</th>
                      <th className="text-right py-2">CTR</th>
                      <th className="text-right py-2">Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topQueries.map((item, i) => (
                      <tr key={i} className="border-b">
                        <td className="py-2">{item.keys?.[0] || 'N/A'}</td>
                        <td className="text-right">{item.clicks || 0}</td>
                        <td className="text-right">{item.impressions || 0}</td>
                        <td className="text-right">{((item.ctr || 0) * 100).toFixed(2)}%</td>
                        <td className="text-right">{(item.position || 0).toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Striking Distance Keywords */}
        <Card>
          <CardHeader>
            <CardTitle>Striking Distance Keywords (Position 11-20)</CardTitle>
          </CardHeader>
          <CardContent>
            <button
              onClick={fetchStrikingDistance}
              disabled={loading}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 mb-4"
            >
              {loading && activeTest === 'striking' ? 'Loading...' : 'Fetch Striking Distance'}
            </button>
            
            {strikingDistance.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Query</th>
                      <th className="text-left py-2">Page</th>
                      <th className="text-right py-2">Position</th>
                      <th className="text-right py-2">Impressions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {strikingDistance.map((item, i) => (
                      <tr key={i} className="border-b">
                        <td className="py-2">{item.keys?.[0] || 'N/A'}</td>
                        <td className="py-2 text-sm max-w-xs truncate">{item.keys?.[1] || 'N/A'}</td>
                        <td className="text-right text-orange-600 font-medium">
                          {(item.position || 0).toFixed(1)}
                        </td>
                        <td className="text-right">{item.impressions || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <button
              onClick={fetchTopPages}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 mb-4"
            >
              {loading && activeTest === 'pages' ? 'Loading...' : 'Fetch Top Pages'}
            </button>
            
            {topPages.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Page URL</th>
                      <th className="text-right py-2">Clicks</th>
                      <th className="text-right py-2">Impressions</th>
                      <th className="text-right py-2">CTR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPages.map((item, i) => (
                      <tr key={i} className="border-b">
                        <td className="py-2 text-sm max-w-md truncate">{item.keys?.[0] || 'N/A'}</td>
                        <td className="text-right">{item.clicks || 0}</td>
                        <td className="text-right">{item.impressions || 0}</td>
                        <td className="text-right">{((item.ctr || 0) * 100).toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Aggregated Top Queries (NEW - More Accurate) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔥 Aggregated Top Queries (More Accurate)
              <span className="text-sm font-normal text-green-600">(NEW METHOD)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800">
                This method uses proper aggregation settings to match Search Console web interface data more closely.
              </p>
            </div>
            <button
              onClick={fetchAggregatedQueries}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 mb-4"
            >
              {loading && activeTest === 'aggregated' ? 'Loading...' : 'Fetch Aggregated Queries'}
            </button>
            
            {aggregatedQueries.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Query</th>
                      <th className="text-right py-2">Clicks</th>
                      <th className="text-right py-2">Impressions</th>
                      <th className="text-right py-2">CTR</th>
                      <th className="text-right py-2">Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aggregatedQueries.map((item, i) => (
                      <tr key={i} className="border-b">
                        <td className="py-2 font-medium">{item.keys?.[0] || 'N/A'}</td>
                        <td className="text-right font-semibold text-green-600">{item.clicks || 0}</td>
                        <td className="text-right">{item.impressions || 0}</td>
                        <td className="text-right">{((item.ctr || 0) * 100).toFixed(2)}%</td>
                        <td className="text-right">{(item.position || 0).toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Query Comparison Tool */}
        <Card>
          <CardHeader>
            <CardTitle>🔍 Query Method Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                Compare different API query methods for the same keyword to understand data variations.
              </p>
            </div>
            <div className="flex gap-4 mb-4">
              <input
                type="text"
                value={compareQuery}
                onChange={(e) => setCompareQuery(e.target.value)}
                placeholder="Enter query to compare (e.g., concentrix)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={compareQueryMethods}
                disabled={loading || !compareQuery}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading && activeTest === 'compare' ? 'Comparing...' : 'Compare Methods'}
              </button>
            </div>
            
            {comparisonData && (
              <div className="space-y-4">
                <h4 className="font-medium">Results for: "{comparisonData.query}"</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(comparisonData.data).map(([method, data]: [string, any]) => (
                    <div key={method} className="border rounded p-3">
                      <h5 className="font-medium text-sm mb-2">{data.method}</h5>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>Total Clicks:</span>
                          <span className="font-semibold text-blue-600">{data.totalClicks}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Rows:</span>
                          <span>{data.rowCount}</span>
                        </div>
                        {data.rows.length > 0 && (
                          <div className="mt-2 text-xs">
                            <div>Sample: {data.rows[0].keys?.[0] || 'N/A'}</div>
                            <div>Clicks: {data.rows[0].clicks || 0}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* All-Time Top Queries */}
        <Card className="border-2 border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              👑 All-Time Top Queries (LIFETIME TOTALS)
              <span className="text-sm font-normal text-purple-700">(16 MONTHS)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-3 bg-purple-100 border border-purple-300 rounded">
              <p className="text-sm text-purple-800">
                <strong>SEO Specialist Query:</strong> "What keywords drive the most traffic overall?"
              </p>
            </div>
            <button
              onClick={fetchAllTimeQueries}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 mb-4"
            >
              {loading && activeTest === 'all-time-queries' ? 'Loading...' : 'Get All-Time Top Queries'}
            </button>
            
            {allTimeQueries.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Query</th>
                      <th className="text-right py-2">Total Clicks</th>
                      <th className="text-right py-2">Total Impressions</th>
                      <th className="text-right py-2">CTR</th>
                      <th className="text-right py-2">Avg Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allTimeQueries.map((item, i) => (
                      <tr key={i} className="border-b">
                        <td className="py-2 font-medium">{item.keys?.[0] || 'N/A'}</td>
                        <td className="text-right font-bold text-purple-600">{(item.clicks || 0).toLocaleString()}</td>
                        <td className="text-right">{(item.impressions || 0).toLocaleString()}</td>
                        <td className="text-right">{((item.ctr || 0) * 100).toFixed(2)}%</td>
                        <td className="text-right">{(item.position || 0).toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* All-Time Top Pages */}
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📄 All-Time Top Pages (LIFETIME TOTALS)
              <span className="text-sm font-normal text-blue-700">(16 MONTHS)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded">
              <p className="text-sm text-blue-800">
                <strong>SEO Specialist Query:</strong> "Which pages get the most organic traffic overall?"
              </p>
            </div>
            <button
              onClick={fetchAllTimePages}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 mb-4"
            >
              {loading && activeTest === 'all-time-pages' ? 'Loading...' : 'Get All-Time Top Pages'}
            </button>
            
            {allTimePages.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Page URL</th>
                      <th className="text-right py-2">Total Clicks</th>
                      <th className="text-right py-2">Total Impressions</th>
                      <th className="text-right py-2">CTR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allTimePages.map((item, i) => (
                      <tr key={i} className="border-b">
                        <td className="py-2 text-sm max-w-md truncate">{item.keys?.[0] || 'N/A'}</td>
                        <td className="text-right font-bold text-blue-600">{(item.clicks || 0).toLocaleString()}</td>
                        <td className="text-right">{(item.impressions || 0).toLocaleString()}</td>
                        <td className="text-right">{((item.ctr || 0) * 100).toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Insights Posts */}
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📝 Top Insights Posts (LIFETIME TOTALS)
              <span className="text-sm font-normal text-green-700">(16 MONTHS)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded">
              <p className="text-sm text-green-800">
                <strong>SEO Specialist Query:</strong> "Which Insights posts get the most SEO traffic?"
              </p>
            </div>
            <button
              onClick={fetchInsightsPosts}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 mb-4"
            >
              {loading && activeTest === 'insights-posts' ? 'Loading...' : 'Get Top Insights Posts'}
            </button>
            
            {insightsPosts.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Post Title (Extracted)</th>
                      <th className="text-left py-2">URL</th>
                      <th className="text-right py-2">Total Clicks</th>
                      <th className="text-right py-2">CTR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insightsPosts.map((item, i) => (
                      <tr key={i} className="border-b">
                        <td className="py-2 font-medium text-sm">{item.extractedTitle}</td>
                        <td className="py-2 text-xs max-w-xs truncate text-gray-600">{item.keys?.[0]}</td>
                        <td className="text-right font-bold text-green-600">{(item.clicks || 0).toLocaleString()}</td>
                        <td className="text-right">{((item.ctr || 0) * 100).toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Debug Information */}
        <Card>
          <CardHeader>
            <CardTitle>🛠️ Debug API Parameters</CardTitle>
          </CardHeader>
          <CardContent>
            <button
              onClick={fetchDebugData}
              disabled={loading}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 mb-4"
            >
              {loading && activeTest === 'debug' ? 'Loading...' : 'Fetch Debug Info'}
            </button>
            
            {debugData && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-medium mb-2">Request Parameters:</h4>
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(debugData.debugInfo.requestBody, null, 2)}
                  </pre>
                </div>
                <div className="bg-blue-50 p-4 rounded">
                  <h4 className="font-medium mb-2">Response Info:</h4>
                  <div className="text-sm space-y-1">
                    <div>Response Aggregation Type: {debugData.data.responseAggregationType}</div>
                    <div>Total Rows: {debugData.data.totalRows}</div>
                    <div>Date Range: {debugData.requestParams.dateRange}</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Keywords */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Keywords (Last 7 Days) - Original Method</CardTitle>
          </CardHeader>
          <CardContent>
            <button
              onClick={fetchKeywords}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 mb-4"
            >
              {loading && activeTest === 'keywords' ? 'Loading...' : 'Fetch Keywords'}
            </button>
            
            {keywords.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Query</th>
                      <th className="text-left py-2">Page</th>
                      <th className="text-right py-2">Clicks</th>
                      <th className="text-right py-2">Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keywords.map((item, i) => (
                      <tr key={i} className="border-b">
                        <td className="py-2">{item.keys?.[0] || 'N/A'}</td>
                        <td className="py-2 text-sm max-w-xs truncate">{item.keys?.[1] || 'N/A'}</td>
                        <td className="text-right">{item.clicks || 0}</td>
                        <td className="text-right">{(item.position || 0).toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}