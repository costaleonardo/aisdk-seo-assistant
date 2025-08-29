'use client';

import SEODashboard from '@/components/seo/seo-dashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart3, Search, TrendingUp, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { SEOAnalysis } from '@/lib/seo-analyzer';
import { SEOScore } from '@/lib/seo-scoring';
import { Heading, LinkData, ImageData } from '@/lib/scraper';

interface DashboardData {
  url: string;
  analysis: SEOAnalysis;
  score: SEOScore;
  rawData?: {
    title?: string;
    metaDescription?: string;
    canonical?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    twitterCard?: string;
    headings?: Heading[];
    links?: LinkData[];
    images?: ImageData[];
  };
}

export default function SEOAnalysisPage() {
  const [url, setUrl] = useState('');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSEOAnalysis = async (analysisUrl: string = url) => {
    if (!analysisUrl.trim()) return;
    
    setIsAnalyzing(true);
    setError('');
    
    try {
      const response = await fetch('/api/seo/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: analysisUrl }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze URL');
      }
      
      const data = await response.json();
      setDashboardData({
        url: analysisUrl,
        analysis: data.analysis,
        score: data.score,
        rawData: data.rawData
      });
    } catch (err) {
      console.error('SEO Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze URL');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSEOAnalysis();
  };

  if (dashboardData) {
    return (
      <div className="h-full bg-gray-50 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          {/* Back Button */}
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => setDashboardData(null)}
              className="mb-4"
            >
              ← Back to Analysis
            </Button>
          </div>
          
          {/* SEO Dashboard */}
          <SEODashboard
            url={dashboardData.url}
            analysis={dashboardData.analysis}
            score={dashboardData.score}
            rawData={dashboardData.rawData}
            onRefresh={() => handleSEOAnalysis(dashboardData.url)}
            loading={isAnalyzing}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center shadow-lg">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">SEO Analysis</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Get comprehensive SEO analysis for any website. Analyze page performance, 
            discover optimization opportunities, and get actionable recommendations.
          </p>
        </div>

        {/* Analysis Form */}
        <div className="mb-8">
          <Card className="shadow-lg border-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-gray-800 flex items-center">
                <Search className="w-6 h-6 mr-2 text-green-600" />
                Analyze Website
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/page-to-analyze"
                    className="text-lg py-3"
                    required
                    disabled={isAnalyzing}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isAnalyzing || !url.trim()}
                  className="w-full py-3 text-lg bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin h-5 w-5 mr-3 border-2 border-white border-t-transparent rounded-full"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="w-5 h-5 mr-2" />
                      Analyze SEO Performance
                    </>
                  )}
                </Button>
              </form>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
                  <span className="text-red-700">{error}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="border border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-800">SEO Score</h3>
              </div>
              <p className="text-sm text-gray-600">
                Get an overall SEO performance score with detailed breakdowns by category
              </p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <Search className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-800">Technical Analysis</h3>
              </div>
              <p className="text-sm text-gray-600">
                Deep dive into technical SEO elements like meta tags, headings, and structure
              </p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-800">Recommendations</h3>
              </div>
              <p className="text-sm text-gray-600">
                Receive prioritized, actionable recommendations to improve your SEO performance
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Analysis Categories */}
        <Card className="shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle className="text-xl text-gray-800">What We Analyze</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">On-Page Elements</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Title tags and meta descriptions</li>
                  <li>• Heading hierarchy (H1-H6)</li>
                  <li>• Content optimization</li>
                  <li>• Keyword density analysis</li>
                  <li>• Image optimization</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Technical SEO</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Page speed and performance</li>
                  <li>• Mobile-friendliness</li>
                  <li>• Schema markup detection</li>
                  <li>• Internal/external link analysis</li>
                  <li>• Social media meta tags</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="mt-8 text-center">
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardContent className="pt-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Need More Help?</h3>
              <p className="text-gray-600 mb-4 max-w-2xl mx-auto">
                After running an SEO analysis, chat with our AI assistant for personalized insights and 
                step-by-step guidance on implementing improvements.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <a
                  href="/"
                  className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Chat with AI Assistant
                </a>
                <a
                  href="/scraper"
                  className="inline-flex items-center px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Add More Content
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}