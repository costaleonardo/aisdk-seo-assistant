'use client';

import ScrapeForm from '@/components/scrape-form';
import ChatInterface from '@/components/chat-interface';
import SEODashboard from '@/components/seo/seo-dashboard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SEOAnalysis } from '@/lib/seo-analyzer';
import { SEOScore } from '@/lib/seo-scoring';
import { Heading, LinkData, ImageData } from '@/lib/scraper';
import { BarChart3, MessageCircle, Globe, Plus } from 'lucide-react';

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

export default function Home() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [activeView, setActiveView] = useState<'tools' | 'dashboard'>('tools');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSEOAnalysis = async (url: string) => {
    if (!url) return;
    
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/seo/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze URL');
      }
      
      const data = await response.json();
      setDashboardData({
        url,
        analysis: data.analysis,
        score: data.score,
        rawData: data.rawData
      });
      setActiveView('dashboard');
    } catch (error) {
      console.error('SEO Analysis error:', error);
      // You could add error state handling here
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBackToTools = () => {
    setActiveView('tools');
  };
  
  if (activeView === 'dashboard' && dashboardData) {
    return (
      <main className="container mx-auto p-4 max-w-7xl">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={handleBackToTools}
            className="mb-4"
          >
            ← Back to Tools
          </Button>
        </div>
        <SEODashboard
          url={dashboardData.url}
          analysis={dashboardData.analysis}
          score={dashboardData.score}
          rawData={dashboardData.rawData}
          onRefresh={() => handleSEOAnalysis(dashboardData.url)}
          loading={isAnalyzing}
        />
      </main>
    );
  }

  return (
    <main className="container mx-auto p-4 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">SEO Assistant</h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Analyze websites for SEO performance, get AI-powered insights, and receive actionable recommendations to improve your search rankings
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="w-6 h-6 mr-2 text-blue-600" />
              1. Add Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Enter a website URL to scrape and add its content to the knowledge base for AI analysis.
            </p>
            <ScrapeForm />
          </CardContent>
        </Card>
        
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageCircle className="w-6 h-6 mr-2 text-green-600" />
              2. AI Chat Assistant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Chat with our AI SEO expert to get insights, analysis, and recommendations about your website content.
            </p>
            <ChatInterface />
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 text-center">
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">How it works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="flex items-center justify-center">
              <div className="bg-blue-100 rounded-full p-2 mr-2">
                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm2 2a1 1 0 000 2h8a1 1 0 100-2H5z" clipRule="evenodd" />
                </svg>
              </div>
              <span>Scrape & chunk website content</span>
            </div>
            <div className="flex items-center justify-center">
              <div className="bg-purple-100 rounded-full p-2 mr-2">
                <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" />
                </svg>
              </div>
              <span>Generate vector embeddings</span>
            </div>
            <div className="flex items-center justify-center">
              <div className="bg-green-100 rounded-full p-2 mr-2">
                <MessageCircle className="w-4 h-4 text-green-600" />
              </div>
              <span>AI-powered SEO insights</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}