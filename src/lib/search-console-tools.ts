import { z } from 'zod';
import { GoogleSearchConsoleService } from './google-search-console';

// Zod schemas for Search Console AI tools
export const getTopPerformingContentSchema = z.object({
  contentType: z.enum(['all', 'insights', 'services', 'pages']).optional().describe('Type of content to analyze - defaults to "all"'),
  limit: z.number().optional().describe('Number of results to return (default: 10)')
});

export const getKeywordPerformanceSchema = z.object({
  timeframe: z.enum(['recent', 'all-time', 'both']).optional().describe('Time period to analyze - defaults to "both"'),
  limit: z.number().optional().describe('Number of keywords to return (default: 20)')
});

export const getContentTypeAnalysisSchema = z.object({
  contentPaths: z.array(z.string()).optional().describe('Specific content paths to analyze (e.g., ["insights", "services"]) - defaults to common types')
});

export const getSEOOpportunitiesSchema = z.object({
  opportunityType: z.enum(['striking-distance', 'high-impressions-low-clicks', 'content-gaps']).optional().describe('Type of opportunities to identify - defaults to "striking-distance"')
});

export const getSearchConsoleInsightsSchema = z.object({
  includeRecommendations: z.boolean().optional().describe('Whether to include actionable SEO recommendations - defaults to true')
});

export const getURLMetricsSchema = z.object({
  url: z.string().url().describe('The specific URL to get Search Console metrics for'),
  timeframe: z.enum(['recent', 'all-time', 'both']).optional().describe('Time period to analyze - defaults to "both"')
});

// AI Tool implementations
export class SearchConsoleTools {
  private service: GoogleSearchConsoleService;

  constructor() {
    this.service = new GoogleSearchConsoleService();
  }

  async getTopPerformingContent(params: {
    contentType?: 'all' | 'insights' | 'services' | 'pages';
    limit?: number;
  }) {
    const { contentType = 'all', limit = 10 } = params;

    try {
      let results;
      
      switch (contentType) {
        case 'insights':
          results = await this.service.getAllTimeInsightsPosts(limit);
          break;
        case 'services':
          results = await this.service.getAllTimeContentTypePerformance('services', limit);
          break;
        case 'pages':
          results = await this.service.getAllTimeTopPages(limit);
          break;
        default:
          // Get all content types and merge
          const [insights, services, allPages] = await Promise.all([
            this.service.getAllTimeInsightsPosts(Math.ceil(limit / 3)),
            this.service.getAllTimeContentTypePerformance('services', Math.ceil(limit / 3)),
            this.service.getAllTimeTopPages(Math.ceil(limit / 3))
          ]);
          
          results = [...insights, ...services, ...allPages]
            .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
            .slice(0, limit);
      }

      const totalClicks = results.reduce((sum, item) => sum + (item.clicks || 0), 0);
      
      return {
        success: true,
        contentType,
        totalResults: results.length,
        totalClicks,
        dateRange: '16 months (Search Console maximum)',
        topContent: results.map((item, index) => ({
          rank: index + 1,
          url: item.keys?.[0] || 'N/A',
          clicks: item.clicks || 0,
          impressions: item.impressions || 0,
          ctr: ((item.ctr || 0) * 100).toFixed(2) + '%',
          position: (item.position || 0).toFixed(1),
          extractedTitle: this.extractTitleFromUrl(item.keys?.[0] || ''),
          performance: this.getPerformanceLabel(item.clicks || 0, totalClicks)
        }))
      };
    } catch (error: any) {
      return {
        success: false,
        error: 'Failed to fetch top performing content',
        message: error.message
      };
    }
  }

  async getKeywordPerformance(params: {
    timeframe?: 'recent' | 'all-time' | 'both';
    limit?: number;
  }) {
    const { timeframe = 'both', limit = 20 } = params;

    try {
      let allTimeData: any = undefined;
      let recentData: any = undefined;

      if (timeframe === 'all-time' || timeframe === 'both') {
        allTimeData = await this.service.getAllTimeTopQueries(limit);
      }

      if (timeframe === 'recent' || timeframe === 'both') {
        recentData = await this.service.getAggregatedTopQueries({ limit });
      }

      const analysis = {
        success: true,
        timeframe,
        totalQueries: timeframe === 'both' ? 
          Math.max(allTimeData?.length || 0, recentData?.length || 0) :
          (allTimeData?.length || recentData?.length || 0)
      } as any;

      if (allTimeData) {
        const allTimeTotal = allTimeData.reduce((sum: number, item: any) => sum + (item.clicks || 0), 0);
        analysis.allTimePerformance = {
          totalClicks: allTimeTotal,
          dateRange: '16 months',
          topKeywords: allTimeData.slice(0, limit).map((item: any, index: number) => ({
            rank: index + 1,
            keyword: item.keys?.[0] || 'N/A',
            clicks: item.clicks || 0,
            impressions: item.impressions || 0,
            ctr: ((item.ctr || 0) * 100).toFixed(2) + '%',
            position: (item.position || 0).toFixed(1),
            marketShare: ((item.clicks || 0) / allTimeTotal * 100).toFixed(1) + '%'
          }))
        };
      }

      if (recentData) {
        const recentTotal = recentData.reduce((sum: number, item: any) => sum + (item.clicks || 0), 0);
        analysis.recentPerformance = {
          totalClicks: recentTotal,
          dateRange: '28 days',
          topKeywords: recentData.slice(0, limit).map((item: any, index: number) => ({
            rank: index + 1,
            keyword: item.keys?.[0] || 'N/A',
            clicks: item.clicks || 0,
            impressions: item.impressions || 0,
            ctr: ((item.ctr || 0) * 100).toFixed(2) + '%',
            position: (item.position || 0).toFixed(1),
            marketShare: ((item.clicks || 0) / recentTotal * 100).toFixed(1) + '%'
          }))
        };
      }

      // Add insights for both timeframes
      if (timeframe === 'both' && allTimeData && recentData) {
        analysis.insights = this.generateKeywordInsights(allTimeData, recentData);
      }

      return analysis;
    } catch (error: any) {
      return {
        success: false,
        error: 'Failed to fetch keyword performance',
        message: error.message
      };
    }
  }

  async getContentTypeAnalysis(params: {
    contentPaths?: string[];
  }) {
    const { contentPaths = ['insights', 'services', 'what-we-do', 'about'] } = params;

    try {
      const analysisPromises = contentPaths.map(async (path) => {
        const data = await this.service.getAllTimeContentTypePerformance(path, 50);
        const totalClicks = data.reduce((sum, item) => sum + (item.clicks || 0), 0);
        const totalImpressions = data.reduce((sum, item) => sum + (item.impressions || 0), 0);
        const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) : 0;
        
        return {
          contentType: path,
          totalPages: data.length,
          totalClicks,
          totalImpressions,
          avgCTR: (avgCTR * 100).toFixed(2) + '%',
          topPage: data[0] ? {
            url: data[0].keys?.[0],
            clicks: data[0].clicks || 0,
            title: this.extractTitleFromUrl(data[0].keys?.[0] || '')
          } : null,
          performance: data.length > 0 ? 'good' : 'low'
        };
      });

      const results = await Promise.all(analysisPromises);
      const totalSiteClicks = results.reduce((sum, result) => sum + result.totalClicks, 0);

      return {
        success: true,
        dateRange: '16 months (Search Console maximum)',
        totalContentTypes: contentPaths.length,
        totalSiteClicks,
        contentAnalysis: results
          .sort((a, b) => b.totalClicks - a.totalClicks)
          .map((result, index) => ({
            ...result,
            rank: index + 1,
            siteShare: totalSiteClicks > 0 ? 
              ((result.totalClicks / totalSiteClicks) * 100).toFixed(1) + '%' : '0%'
          })),
        insights: this.generateContentTypeInsights(results)
      };
    } catch (error: any) {
      return {
        success: false,
        error: 'Failed to analyze content types',
        message: error.message
      };
    }
  }

  async getSEOOpportunities(params: {
    opportunityType?: 'striking-distance' | 'high-impressions-low-clicks' | 'content-gaps';
  }) {
    const { opportunityType = 'striking-distance' } = params;

    try {
      let opportunities;

      switch (opportunityType) {
        case 'striking-distance':
          const strikingKeywords = await this.service.getStrikingDistanceKeywords();
          opportunities = {
            type: 'Striking Distance Keywords (Positions 11-20)',
            description: 'Keywords ranking just outside the first page that could be improved with focused optimization',
            totalOpportunities: strikingKeywords.length,
            items: strikingKeywords.slice(0, 20).map((item, index) => ({
              rank: index + 1,
              keyword: item.keys?.[0] || 'N/A',
              page: item.keys?.[1] || 'N/A',
              currentPosition: (item.position || 0).toFixed(1),
              impressions: item.impressions || 0,
              potentialClicks: Math.round((item.impressions || 0) * 0.15), // Estimated first page CTR
              actionRequired: 'Content optimization, internal linking, technical SEO'
            }))
          };
          break;

        case 'high-impressions-low-clicks':
          const allQueries = await this.service.getAllTimeTopQueries(100);
          const lowCtrKeywords = allQueries
            .filter(item => (item.impressions || 0) > 1000 && (item.ctr || 0) < 0.05)
            .sort((a, b) => (b.impressions || 0) - (a.impressions || 0));

          opportunities = {
            type: 'High Impressions, Low CTR',
            description: 'Keywords with high visibility but low click-through rates, indicating title/meta description optimization opportunities',
            totalOpportunities: lowCtrKeywords.length,
            items: lowCtrKeywords.slice(0, 20).map((item, index) => ({
              rank: index + 1,
              keyword: item.keys?.[0] || 'N/A',
              impressions: item.impressions || 0,
              clicks: item.clicks || 0,
              currentCTR: ((item.ctr || 0) * 100).toFixed(2) + '%',
              position: (item.position || 0).toFixed(1),
              potentialClicks: Math.round((item.impressions || 0) * 0.15), // Target CTR
              actionRequired: 'Improve title tags, meta descriptions, and featured snippets'
            }))
          };
          break;

        default:
          return {
            success: false,
            error: 'Invalid opportunity type specified'
          };
      }

      return {
        success: true,
        opportunityType,
        dateRange: '16 months (Search Console maximum)',
        ...opportunities,
        recommendations: this.generateSEORecommendations(opportunityType, opportunities.items)
      };
    } catch (error: any) {
      return {
        success: false,
        error: 'Failed to identify SEO opportunities',
        message: error.message
      };
    }
  }

  async getSearchConsoleInsights(params: {
    includeRecommendations?: boolean;
  }) {
    const { includeRecommendations = true } = params;

    try {
      const summary = await this.service.getLifetimePerformanceSummary();
      const topQueries = await this.service.getAllTimeTopQueries(10);
      const topPages = await this.service.getAllTimeTopPages(10);
      const insightsContent = await this.service.getAllTimeInsightsPosts(5);
      const opportunities = await this.service.getStrikingDistanceKeywords();

      const insights = {
        success: true,
        generatedAt: new Date().toISOString(),
        dateRange: summary.dateRange,
        overallPerformance: {
          totalClicks: summary.totalClicks.toLocaleString(),
          totalImpressions: summary.totalImpressions.toLocaleString(),
          avgCTR: (summary.averageCTR * 100).toFixed(2) + '%',
          avgPosition: summary.averagePosition.toFixed(1),
          performance: summary.averageCTR > 0.06 ? 'above-average' : 'needs-improvement'
        },
        topPerformers: {
          bestKeyword: {
            keyword: summary.topQuery?.keys?.[0],
            clicks: summary.topQuery?.clicks?.toLocaleString(),
            dominance: summary.topQuery?.clicks && summary.totalClicks ? 
              ((summary.topQuery.clicks / summary.totalClicks) * 100).toFixed(1) + '% of total traffic' : 'N/A'
          },
          bestPage: {
            url: summary.topPage?.keys?.[0],
            clicks: summary.topPage?.clicks?.toLocaleString(),
            title: this.extractTitleFromUrl(summary.topPage?.keys?.[0] || '')
          },
          bestInsightsContent: insightsContent[0] ? {
            title: this.extractTitleFromUrl(insightsContent[0].keys?.[0] || ''),
            clicks: insightsContent[0].clicks?.toLocaleString(),
            url: insightsContent[0].keys?.[0]
          } : null
        },
        keyFindings: this.generateKeyFindings(summary, topQueries, topPages, insightsContent),
        opportunities: {
          strikingDistanceCount: opportunities.length,
          quickWins: opportunities.slice(0, 5).map(item => ({
            keyword: item.keys?.[0],
            position: (item.position || 0).toFixed(1),
            impressions: item.impressions
          }))
        }
      } as any;

      if (includeRecommendations) {
        insights.recommendations = this.generateComprehensiveRecommendations(
          summary, topQueries, opportunities
        );
      }

      return insights;
    } catch (error: any) {
      return {
        success: false,
        error: 'Failed to generate Search Console insights',
        message: error.message
      };
    }
  }

  // Helper methods
  private extractTitleFromUrl(url: string): string {
    const urlParts = url.split('/');
    const slug = urlParts[urlParts.length - 2] || urlParts[urlParts.length - 1] || '';
    return slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  private getPerformanceLabel(clicks: number, total: number): string {
    const percentage = (clicks / total) * 100;
    if (percentage > 10) return 'excellent';
    if (percentage > 5) return 'good';
    if (percentage > 1) return 'moderate';
    return 'low';
  }

  private generateKeywordInsights(allTime: any[], recent: any[]) {
    return [
      `Top keyword "${allTime[0]?.keys?.[0]}" accounts for ${((allTime[0]?.clicks || 0) / allTime.reduce((sum, item) => sum + (item.clicks || 0), 0) * 100).toFixed(1)}% of total traffic`,
      `Recent performance shows ${recent.length} active keywords generating traffic`,
      `Brand terms dominate with "${allTime[0]?.keys?.[0]}" leading performance`
    ];
  }

  private generateContentTypeInsights(results: any[]) {
    const topPerformer = results[0];
    return [
      `${topPerformer.contentType} content performs best with ${topPerformer.totalClicks.toLocaleString()} clicks`,
      `Total of ${results.reduce((sum, r) => sum + r.totalPages, 0)} pages analyzed across content types`,
      `Content optimization opportunities exist in lower-performing sections`
    ];
  }

  private generateSEORecommendations(type: string, items: any[]) {
    if (type === 'striking-distance') {
      return [
        'Focus on the top 5 striking distance keywords for quick wins',
        'Improve internal linking to pages ranking positions 11-20',
        'Optimize content depth and relevance for target keywords',
        'Consider creating supporting content to strengthen topic authority'
      ];
    }
    return ['Optimize based on opportunity type'];
  }

  private generateKeyFindings(summary: any, topQueries: any[], topPages: any[], insights: any[]) {
    return [
      `Homepage generates ${((summary.topPage?.clicks || 0) / summary.totalClicks * 100).toFixed(1)}% of total organic traffic`,
      `Brand keyword "${topQueries[0]?.keys?.[0]}" dominates search performance`,
      `Top Insights content: "${this.extractTitleFromUrl(insights[0]?.keys?.[0] || '')}" with ${insights[0]?.clicks?.toLocaleString() || 0} clicks`,
      `Average site position of ${summary.averagePosition.toFixed(1)} indicates room for improvement`
    ];
  }

  private generateComprehensiveRecommendations(summary: any, topQueries: any[], opportunities: any[]) {
    return [
      'Improve average position through content optimization and technical SEO',
      'Leverage strong brand presence to boost non-brand keyword performance',
      'Focus on striking distance keywords for immediate ranking improvements',
      'Expand content marketing based on top-performing Insights posts',
      'Improve site-wide CTR through better title tags and meta descriptions'
    ];
  }

  async getURLMetrics(params: {
    url: string;
    timeframe?: 'recent' | 'all-time' | 'both';
  }) {
    const { url, timeframe = 'both' } = params;

    try {
      // Get metrics from Search Console for the specific URL
      const urlData = await this.service.getMetricsForURL(url, 28);
      
      // Prepare response based on timeframe preference
      let response: any = {
        success: true,
        url,
        hasData: false,
        message: ''
      };

      // Check if we have any data for this URL
      const hasRecentData = urlData.recentMetrics !== null;
      const hasAllTimeData = urlData.allTimeMetrics !== null;
      
      if (!hasRecentData && !hasAllTimeData) {
        return {
          success: true,
          url,
          hasData: false,
          message: `No Search Console data found for ${url}. This could mean the page hasn't received organic traffic, is very new, or isn't indexed.`,
          suggestions: [
            'Verify the page is indexed in Google',
            'Check if the URL is correct and matches exactly what appears in Search Console',
            'If the page is new, wait a few days for data to appear',
            'Consider running the analyzeURL tool for on-page SEO analysis instead'
          ]
        };
      }

      response.hasData = true;

      // Include metrics based on timeframe
      if (timeframe === 'recent' || timeframe === 'both') {
        response.recentMetrics = hasRecentData ? {
          period: 'Last 28 days',
          clicks: urlData.recentMetrics?.clicks || 0,
          impressions: urlData.recentMetrics?.impressions || 0,
          ctr: ((urlData.recentMetrics?.ctr || 0) * 100).toFixed(2) + '%',
          avgPosition: (urlData.recentMetrics?.position || 0).toFixed(1)
        } : null;
      }

      if (timeframe === 'all-time' || timeframe === 'both') {
        response.allTimeMetrics = hasAllTimeData ? {
          period: '16 months (Search Console maximum)',
          clicks: urlData.allTimeMetrics?.clicks || 0,
          impressions: urlData.allTimeMetrics?.impressions || 0,
          ctr: ((urlData.allTimeMetrics?.ctr || 0) * 100).toFixed(2) + '%',
          avgPosition: (urlData.allTimeMetrics?.position || 0).toFixed(1)
        } : null;
      }

      // Add top queries if available
      if (urlData.topQueries.length > 0) {
        response.topQueriesRecent = urlData.topQueries.slice(0, 5).map((q, idx) => ({
          rank: idx + 1,
          query: q.keys?.[0] || 'N/A',
          clicks: q.clicks || 0,
          impressions: q.impressions || 0,
          ctr: ((q.ctr || 0) * 100).toFixed(2) + '%',
          position: (q.position || 0).toFixed(1)
        }));
      }

      if (urlData.allTimeTopQueries.length > 0 && (timeframe === 'all-time' || timeframe === 'both')) {
        response.topQueriesAllTime = urlData.allTimeTopQueries.slice(0, 10).map((q, idx) => ({
          rank: idx + 1,
          query: q.keys?.[0] || 'N/A',
          clicks: q.clicks || 0,
          impressions: q.impressions || 0,
          ctr: ((q.ctr || 0) * 100).toFixed(2) + '%',
          position: (q.position || 0).toFixed(1)
        }));
      }

      // Generate performance analysis
      const analysis = this.analyzeURLPerformance(urlData);
      response.analysis = analysis;

      // Generate recommendations
      response.recommendations = this.generateURLRecommendations(urlData);

      return response;
    } catch (error: any) {
      return {
        success: false,
        error: 'Failed to fetch URL metrics from Search Console',
        message: error.message,
        url
      };
    }
  }

  private analyzeURLPerformance(urlData: any): string {
    const recentClicks = urlData.recentMetrics?.clicks || 0;
    const allTimeClicks = urlData.allTimeMetrics?.clicks || 0;
    const recentCTR = urlData.recentMetrics?.ctr || 0;
    const recentPosition = urlData.recentMetrics?.position || 0;
    
    let analysis = [];
    
    // Traffic analysis
    if (allTimeClicks > 1000) {
      analysis.push('High-traffic page with strong historical performance');
    } else if (allTimeClicks > 100) {
      analysis.push('Moderate traffic page with steady performance');
    } else if (allTimeClicks > 0) {
      analysis.push('Low-traffic page with optimization potential');
    }
    
    // CTR analysis
    if (recentCTR > 0.05) {
      analysis.push('Strong CTR indicates compelling title/description');
    } else if (recentCTR > 0.02) {
      analysis.push('Average CTR - consider improving meta tags');
    } else if (recentCTR > 0) {
      analysis.push('Low CTR - title and description need optimization');
    }
    
    // Position analysis
    if (recentPosition > 0 && recentPosition <= 10) {
      analysis.push('First page rankings for key queries');
    } else if (recentPosition > 10 && recentPosition <= 20) {
      analysis.push('Second page rankings - striking distance opportunity');
    } else if (recentPosition > 20) {
      analysis.push('Lower rankings - needs significant SEO improvement');
    }
    
    return analysis.join('. ');
  }

  private generateURLRecommendations(urlData: any): string[] {
    const recommendations = [];
    const recentCTR = urlData.recentMetrics?.ctr || 0;
    const recentPosition = urlData.recentMetrics?.position || 0;
    const topQueries = urlData.topQueries || [];
    
    // CTR-based recommendations
    if (recentCTR < 0.02) {
      recommendations.push('Optimize meta title and description to improve CTR');
    }
    
    // Position-based recommendations
    if (recentPosition > 10 && recentPosition <= 20) {
      recommendations.push('Focus on on-page optimization to move from page 2 to page 1');
      recommendations.push('Build internal links to this page from high-authority pages');
    }
    
    if (recentPosition > 20) {
      recommendations.push('Conduct comprehensive content update to improve relevance');
      recommendations.push('Analyze competitor content ranking for target keywords');
    }
    
    // Query-based recommendations
    if (topQueries.length > 0) {
      const lowCTRQueries = topQueries.filter((q: any) => (q.ctr || 0) < 0.02);
      if (lowCTRQueries.length > 0) {
        recommendations.push(`Optimize for queries with low CTR: ${lowCTRQueries.slice(0, 3).map((q: any) => q.keys?.[0]).join(', ')}`);
      }
    }
    
    // General recommendations
    if (urlData.recentMetrics?.clicks === 0 && urlData.recentMetrics?.impressions > 0) {
      recommendations.push('Page gets impressions but no clicks - urgent meta tag optimization needed');
    }
    
    return recommendations.slice(0, 5); // Return top 5 recommendations
  }
}