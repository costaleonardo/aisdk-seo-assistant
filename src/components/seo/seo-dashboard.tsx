import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SEOAnalysis } from '@/lib/seo-analyzer';
import { SEOScore } from '@/lib/seo-scoring';
import { Heading, LinkData, ImageData } from '@/lib/scraper';
import SEOScoreCard from './seo-score-card';
import HeadingHierarchy from './heading-hierarchy';
import MetaTagsTable from './meta-tags-table';
import LinkAnalysis from './link-analysis';
import ImageOptimization from './image-optimization';
import RecommendationsList from './recommendations-list';
import { 
  BarChart3, 
  Hash, 
  Tags, 
  Link, 
  Image, 
  CheckSquare, 
  Download,
  RefreshCw,
  Globe
} from 'lucide-react';

interface SEODashboardProps {
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
  onRefresh?: () => void;
  loading?: boolean;
}

type TabType = 'overview' | 'headings' | 'meta' | 'links' | 'images' | 'recommendations';

interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeCount?: number;
}

export default function SEODashboard({ 
  url, 
  analysis, 
  score, 
  rawData, 
  onRefresh, 
  loading = false 
}: SEODashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Calculate badge counts for tabs
  const highPriorityIssues = score.priority_issues.filter(issue => issue.impact === 'high').length;
  const totalIssues = score.priority_issues.length;
  const headingIssues = !analysis.headings.has_single_h1 || !analysis.headings.hierarchy_valid ? 1 : 0;
  const metaIssues = (!analysis.title.is_optimal ? 1 : 0) + 
                    (!analysis.meta_description.is_optimal ? 1 : 0) + 
                    (!analysis.technical.has_canonical ? 1 : 0);
  const linkIssues = analysis.links.score < 80 ? 1 : 0;
  const imageIssues = analysis.images.score < 80 ? 1 : 0;

  const tabs: TabConfig[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'headings', label: 'Headings', icon: Hash, badgeCount: headingIssues },
    { id: 'meta', label: 'Meta Tags', icon: Tags, badgeCount: metaIssues },
    { id: 'links', label: 'Links', icon: Link, badgeCount: linkIssues },
    { id: 'images', label: 'Images', icon: Image, badgeCount: imageIssues },
    { id: 'recommendations', label: 'Action Items', icon: CheckSquare, badgeCount: totalIssues }
  ];

  const handleExportReport = () => {
    const reportData = {
      url,
      timestamp: new Date().toISOString(),
      analysis,
      score,
      rawData
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `seo-report-${new URL(url).hostname}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <SEOScoreCard seoScore={score} />;
      case 'headings':
        return (
          <HeadingHierarchy 
            headings={rawData?.headings || []} 
            analysis={analysis.headings} 
          />
        );
      case 'meta':
        return (
          <MetaTagsTable 
            titleAnalysis={analysis.title}
            metaAnalysis={analysis.meta_description}
            technicalAnalysis={analysis.technical}
            rawData={rawData}
          />
        );
      case 'links':
        return (
          <LinkAnalysis 
            analysis={analysis.links}
            links={rawData?.links}
          />
        );
      case 'images':
        return (
          <ImageOptimization 
            analysis={analysis.images}
            images={rawData?.images}
          />
        );
      case 'recommendations':
        return (
          <RecommendationsList 
            issues={score.priority_issues} 
            showImplementation={true}
          />
        );
      default:
        return <SEOScoreCard seoScore={score} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Globe className="w-6 h-6 mr-3 text-blue-600" />
              <div>
                <h2 className="text-lg font-semibold">SEO Analysis Dashboard</h2>
                <p className="text-sm text-gray-600 mt-1 truncate max-w-md" title={url}>
                  {url}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  disabled={loading}
                  className="flex items-center"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Refreshing...' : 'Refresh'}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportReport}
                className="flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{Math.round(score.overall_score)}</div>
              <div className="text-sm text-blue-700">Overall Score</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{score.grade}</div>
              <div className="text-sm text-green-700">SEO Grade</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{highPriorityIssues}</div>
              <div className="text-sm text-orange-700">High Priority</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{totalIssues}</div>
              <div className="text-sm text-purple-700">Total Issues</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <Card>
        <CardContent className="p-0">
          <nav className="flex space-x-0 border-b border-gray-200 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                  {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
                    <span className="ml-2 px-2 py-1 text-xs font-medium bg-red-100 text-red-600 rounded-full">
                      {tab.badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </CardContent>
      </Card>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {renderTabContent()}
      </div>
    </div>
  );
}