import { google } from 'googleapis';
import { searchconsole_v1 } from 'googleapis/build/src/apis/searchconsole/v1';

export interface SearchAnalyticsRow {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
}

export interface SearchAnalyticsResponse {
  rows?: SearchAnalyticsRow[];
  responseAggregationType?: string;
}

export interface SearchAnalyticsParams {
  startDate: string;
  endDate: string;
  dimensions?: string[];
  rowLimit?: number;
  dimensionFilterGroups?: any[];
  dataState?: 'final' | 'all';
  aggregationType?: 'auto' | 'byPage' | 'byProperty';
}

export class GoogleSearchConsoleService {
  private client: searchconsole_v1.Searchconsole;
  
  constructor() {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });

    this.client = google.searchconsole({
      version: 'v1',
      auth,
    });
  }

  async testConnection(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const siteUrl = process.env.SEARCH_CONSOLE_SITE_URL;
      
      if (!siteUrl) {
        return { 
          success: false, 
          message: 'SEARCH_CONSOLE_SITE_URL not configured' 
        };
      }

      const response = await this.client.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          dimensions: ['query'],
          rowLimit: 5,
        },
      });

      return {
        success: true,
        message: 'Successfully connected to Google Search Console',
        data: {
          siteUrl,
          rowCount: response.data.rows?.length || 0,
          sampleData: response.data.rows?.slice(0, 3),
        },
      };
    } catch (error: any) {
      console.error('Search Console connection test failed:', error);
      
      let message = 'Failed to connect to Google Search Console';
      
      if (error.code === 403) {
        message = 'Permission denied. Please ensure the service account has access to the Search Console property.';
      } else if (error.code === 401) {
        message = 'Authentication failed. Please check your service account credentials.';
      } else if (error.message) {
        message = error.message;
      }
      
      return {
        success: false,
        message,
        data: { error: error.code, details: error.message },
      };
    }
  }

  async getSearchAnalytics(params: SearchAnalyticsParams): Promise<SearchAnalyticsResponse> {
    const siteUrl = process.env.SEARCH_CONSOLE_SITE_URL;
    
    if (!siteUrl) {
      throw new Error('SEARCH_CONSOLE_SITE_URL not configured');
    }
    
    const requestBody: any = {
      startDate: params.startDate,
      endDate: params.endDate,
      dimensions: params.dimensions || ['query'],
      rowLimit: params.rowLimit || 1000,
    };

    if (params.dimensionFilterGroups) {
      requestBody.dimensionFilterGroups = params.dimensionFilterGroups;
    }

    if (params.dataState) {
      requestBody.dataState = params.dataState;
    }

    if (params.aggregationType) {
      requestBody.aggregationType = params.aggregationType;
    }

    const response = await this.client.searchanalytics.query({
      siteUrl,
      requestBody,
    });

    return response.data as SearchAnalyticsResponse;
  }

  async getKeywordPerformance(days: number = 28): Promise<SearchAnalyticsResponse> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    return this.getSearchAnalytics({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      dimensions: ['query', 'page'],
      rowLimit: 5000,
    });
  }

  async getStrikingDistanceKeywords(): Promise<SearchAnalyticsRow[]> {
    const data = await this.getKeywordPerformance();
    
    return (data.rows || [])
      .filter(row => {
        const position = row.position || 0;
        return position > 10 && position <= 20;
      })
      .sort((a, b) => (a.position || 0) - (b.position || 0));
  }

  async getTopPages(limit: number = 10): Promise<SearchAnalyticsRow[]> {
    const data = await this.getSearchAnalytics({
      startDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      dimensions: ['page'],
      rowLimit: limit,
    });

    return (data.rows || []).sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
  }

  async getTopQueries(limit: number = 20): Promise<SearchAnalyticsRow[]> {
    const data = await this.getSearchAnalytics({
      startDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      dimensions: ['query'],
      rowLimit: limit,
    });

    return (data.rows || []).sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
  }

  // New method: Get aggregated top queries (sums clicks across all pages per query)
  async getAggregatedTopQueries(params: {
    limit?: number;
    days?: number;
    dataState?: 'final' | 'all';
  } = {}): Promise<SearchAnalyticsRow[]> {
    const { limit = 50, days = 28, dataState = 'all' } = params;
    
    const data = await this.getSearchAnalytics({
      startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      dimensions: ['query'],
      rowLimit: limit * 2, // Get more rows to ensure we have enough data
      dataState,
      aggregationType: 'byProperty', // Aggregate by entire property
    });

    return (data.rows || [])
      .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
      .slice(0, limit);
  }

  // Debug method: Compare different query approaches
  async compareQueryMethods(query: string): Promise<{
    detailed: SearchAnalyticsRow[];
    aggregated: SearchAnalyticsRow[];
    queryWithPage: SearchAnalyticsRow[];
  }> {
    const days = 28;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = new Date().toISOString().split('T')[0];

    const [detailed, aggregated, queryWithPage] = await Promise.all([
      // Original method with ['query', 'page']
      this.getSearchAnalytics({
        startDate,
        endDate,
        dimensions: ['query', 'page'],
        rowLimit: 1000,
        dimensionFilterGroups: [{
          filters: [{
            dimension: 'query',
            expression: query,
            operator: 'equals'
          }]
        }]
      }),
      // Aggregated method with ['query'] only
      this.getSearchAnalytics({
        startDate,
        endDate,
        dimensions: ['query'],
        rowLimit: 100,
        dataState: 'all',
        aggregationType: 'byProperty',
        dimensionFilterGroups: [{
          filters: [{
            dimension: 'query',
            expression: query,
            operator: 'equals'
          }]
        }]
      }),
      // Query with page dimension but no aggregation
      this.getSearchAnalytics({
        startDate,
        endDate,
        dimensions: ['query', 'page'],
        rowLimit: 1000,
        dataState: 'all',
        dimensionFilterGroups: [{
          filters: [{
            dimension: 'query',
            expression: query,
            operator: 'equals'
          }]
        }]
      })
    ]);

    return {
      detailed: detailed.rows || [],
      aggregated: aggregated.rows || [],
      queryWithPage: queryWithPage.rows || []
    };
  }

  // ALL-TIME / LIFETIME PERFORMANCE METHODS (16 months max)

  // Get maximum date range (16 months back - Google's limit)
  private getMaximumDateRange(): { startDate: string; endDate: string } {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - 16); // 16 months back (Google's limit)
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  }

  // Get all-time top queries (lifetime performance)
  async getAllTimeTopQueries(limit: number = 50): Promise<SearchAnalyticsRow[]> {
    const { startDate, endDate } = this.getMaximumDateRange();
    
    const data = await this.getSearchAnalytics({
      startDate,
      endDate,
      dimensions: ['query'],
      rowLimit: limit * 2, // Get more to ensure we have enough after filtering
      dataState: 'all',
      aggregationType: 'byProperty',
    });

    return (data.rows || [])
      .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
      .slice(0, limit);
  }

  // Get all-time top pages (lifetime performance)
  async getAllTimeTopPages(limit: number = 50): Promise<SearchAnalyticsRow[]> {
    const { startDate, endDate } = this.getMaximumDateRange();
    
    const data = await this.getSearchAnalytics({
      startDate,
      endDate,
      dimensions: ['page'],
      rowLimit: limit * 2,
      dataState: 'all',
      // Don't use byProperty for page dimensions - use default 'auto'
    });

    return (data.rows || [])
      .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
      .slice(0, limit);
  }

  // Get all-time insights posts performance (filtered by /insights/ path)
  async getAllTimeInsightsPosts(limit: number = 20): Promise<SearchAnalyticsRow[]> {
    const { startDate, endDate } = this.getMaximumDateRange();
    
    const data = await this.getSearchAnalytics({
      startDate,
      endDate,
      dimensions: ['page'],
      rowLimit: 1000, // Get more rows to filter for insights
      dataState: 'all',
      // Use default aggregation for filtered queries
      dimensionFilterGroups: [{
        filters: [{
          dimension: 'page',
          expression: 'insights',
          operator: 'contains'
        }]
      }]
    });

    return (data.rows || [])
      .filter(row => {
        const url = row.keys?.[0] || '';
        return url.includes('/insights/') || url.includes('/insight/');
      })
      .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
      .slice(0, limit);
  }

  // Get all-time performance for specific content type (e.g., blog posts, services, etc.)
  async getAllTimeContentTypePerformance(
    contentPath: string, 
    limit: number = 20
  ): Promise<SearchAnalyticsRow[]> {
    const { startDate, endDate } = this.getMaximumDateRange();
    
    const data = await this.getSearchAnalytics({
      startDate,
      endDate,
      dimensions: ['page'],
      rowLimit: 1000,
      dataState: 'all',
      // Use default aggregation for filtered queries
      dimensionFilterGroups: [{
        filters: [{
          dimension: 'page',
          expression: contentPath,
          operator: 'contains'
        }]
      }]
    });

    return (data.rows || [])
      .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
      .slice(0, limit);
  }

  // Get lifetime totals summary
  async getLifetimePerformanceSummary(): Promise<{
    totalClicks: number;
    totalImpressions: number;
    averageCTR: number;
    averagePosition: number;
    dateRange: string;
    topQuery: SearchAnalyticsRow | null;
    topPage: SearchAnalyticsRow | null;
  }> {
    const { startDate, endDate } = this.getMaximumDateRange();
    
    const [allQueries, allPages] = await Promise.all([
      this.getAllTimeTopQueries(1),
      this.getAllTimeTopPages(1)
    ]);

    // Get overall site performance
    const siteData = await this.getSearchAnalytics({
      startDate,
      endDate,
      dimensions: [], // No dimensions = site-wide totals
      rowLimit: 1,
      dataState: 'all',
      aggregationType: 'byProperty',
    });

    const siteTotals = siteData.rows?.[0];
    
    return {
      totalClicks: siteTotals?.clicks || 0,
      totalImpressions: siteTotals?.impressions || 0,
      averageCTR: siteTotals?.ctr || 0,
      averagePosition: siteTotals?.position || 0,
      dateRange: `${startDate} to ${endDate}`,
      topQuery: allQueries[0] || null,
      topPage: allPages[0] || null,
    };
  }

  // Method to get query parameters for debugging
  getDebugInfo(params: SearchAnalyticsParams): any {
    const requestBody: any = {
      startDate: params.startDate,
      endDate: params.endDate,
      dimensions: params.dimensions || ['query'],
      rowLimit: params.rowLimit || 1000,
    };

    if (params.dimensionFilterGroups) {
      requestBody.dimensionFilterGroups = params.dimensionFilterGroups;
    }

    if (params.dataState) {
      requestBody.dataState = params.dataState;
    }

    if (params.aggregationType) {
      requestBody.aggregationType = params.aggregationType;
    }

    return {
      siteUrl: process.env.SEARCH_CONSOLE_SITE_URL,
      requestBody
    };
  }

  // Get metrics for a specific URL
  async getMetricsForURL(url: string, days: number = 28): Promise<{
    url: string;
    recentMetrics: SearchAnalyticsRow | null;
    allTimeMetrics: SearchAnalyticsRow | null;
    topQueries: SearchAnalyticsRow[];
    allTimeTopQueries: SearchAnalyticsRow[];
  }> {
    // Get recent metrics (default 28 days)
    const recentEndDate = new Date();
    const recentStartDate = new Date();
    recentStartDate.setDate(recentEndDate.getDate() - days);
    
    // Get all-time metrics (16 months max)
    const { startDate: allTimeStartDate, endDate: allTimeEndDate } = this.getMaximumDateRange();
    
    const [recentData, allTimeData, recentQueries, allTimeQueries] = await Promise.all([
      // Recent page-level metrics
      this.getSearchAnalytics({
        startDate: recentStartDate.toISOString().split('T')[0],
        endDate: recentEndDate.toISOString().split('T')[0],
        dimensions: ['page'],
        rowLimit: 1,
        dimensionFilterGroups: [{
          filters: [{
            dimension: 'page',
            expression: url,
            operator: 'equals'
          }]
        }],
        dataState: 'all',
        aggregationType: 'byPage'
      }),
      
      // All-time page-level metrics
      this.getSearchAnalytics({
        startDate: allTimeStartDate,
        endDate: allTimeEndDate,
        dimensions: ['page'],
        rowLimit: 1,
        dimensionFilterGroups: [{
          filters: [{
            dimension: 'page',
            expression: url,
            operator: 'equals'
          }]
        }],
        dataState: 'all',
        aggregationType: 'byPage'
      }),
      
      // Recent queries for this page
      this.getSearchAnalytics({
        startDate: recentStartDate.toISOString().split('T')[0],
        endDate: recentEndDate.toISOString().split('T')[0],
        dimensions: ['query'],
        rowLimit: 20,
        dimensionFilterGroups: [{
          filters: [{
            dimension: 'page',
            expression: url,
            operator: 'equals'
          }]
        }],
        dataState: 'all'
      }),
      
      // All-time queries for this page
      this.getSearchAnalytics({
        startDate: allTimeStartDate,
        endDate: allTimeEndDate,
        dimensions: ['query'],
        rowLimit: 30,
        dimensionFilterGroups: [{
          filters: [{
            dimension: 'page',
            expression: url,
            operator: 'equals'
          }]
        }],
        dataState: 'all'
      })
    ]);
    
    // Sort queries by clicks
    const sortedRecentQueries = (recentQueries.rows || [])
      .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
      .slice(0, 10);
      
    const sortedAllTimeQueries = (allTimeQueries.rows || [])
      .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
      .slice(0, 15);
    
    return {
      url,
      recentMetrics: recentData.rows?.[0] || null,
      allTimeMetrics: allTimeData.rows?.[0] || null,
      topQueries: sortedRecentQueries,
      allTimeTopQueries: sortedAllTimeQueries
    };
  }
}