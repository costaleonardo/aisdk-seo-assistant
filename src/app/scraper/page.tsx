'use client';

import ScrapeForm from '@/components/scrape-form';
import { Globe, Database, Search, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Link from 'next/link';

export default function ScraperPage() {
  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Globe className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Web Scraper</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Add websites to your knowledge base by scraping their content. The scraped data will be processed, 
            chunked, and stored with vector embeddings for AI-powered analysis.
          </p>
        </div>

        {/* Main Scraper Form */}
        <div className="mb-8">
          <Card className="shadow-lg border-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-gray-800">Add Website Content</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrapeForm />
            </CardContent>
          </Card>
        </div>

        {/* How it works */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Globe className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">1. Web Scraping</h3>
              <p className="text-sm text-gray-600">
                Extract content from any website URL, including text, metadata, headings, and SEO elements
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Database className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">2. Content Processing</h3>
              <p className="text-sm text-gray-600">
                Break content into chunks and generate vector embeddings using OpenAI&apos;s advanced models
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">3. AI Analysis</h3>
              <p className="text-sm text-gray-600">
                Use the scraped content for intelligent SEO analysis and recommendations via chat
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border border-gray-200">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                <Globe className="w-5 h-5 mr-2 text-blue-600" />
                Advanced Scraping
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Smart content extraction from any website</li>
                <li>• SEO metadata collection (title, description, etc.)</li>
                <li>• Link and image analysis</li>
                <li>• Heading structure detection</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                <Database className="w-5 h-5 mr-2 text-purple-600" />
                Vector Storage
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Intelligent content chunking</li>
                <li>• Vector embeddings with OpenAI</li>
                <li>• PostgreSQL with pgvector storage</li>
                <li>• Efficient similarity search</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Next Steps */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <ArrowRight className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Ready to Analyze?</h3>
                <p className="text-gray-600 mb-4">
                  Once you&apos;ve added websites to your knowledge base, head over to the Chat interface to start getting 
                  AI-powered SEO insights and recommendations.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Start Chatting
                  </Link>
                  <a
                    href="/seo-analysis"
                    className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    SEO Dashboard
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}