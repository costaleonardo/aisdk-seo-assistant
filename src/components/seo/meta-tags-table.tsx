import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TitleAnalysis, MetaDescriptionAnalysis, TechnicalAnalysis } from '@/lib/seo-analyzer';
import { Tags, CheckCircle, AlertCircle, XCircle, Info, ExternalLink } from 'lucide-react';

interface MetaTagsTableProps {
  titleAnalysis: TitleAnalysis;
  metaAnalysis: MetaDescriptionAnalysis;
  technicalAnalysis: TechnicalAnalysis;
  rawData?: {
    title?: string;
    metaDescription?: string;
    canonical?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    twitterCard?: string;
  };
}

interface MetaTagInfo {
  name: string;
  value?: string;
  status: 'good' | 'warning' | 'error' | 'missing';
  message: string;
  recommendation?: string;
  optimal?: string;
}

const getStatusIcon = (status: MetaTagInfo['status']) => {
  switch (status) {
    case 'good':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'warning':
      return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    case 'error':
      return <XCircle className="w-4 h-4 text-red-500" />;
    case 'missing':
      return <XCircle className="w-4 h-4 text-red-500" />;
  }
};

const getStatusBadge = (status: MetaTagInfo['status']) => {
  const badges = {
    good: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    missing: 'bg-red-100 text-red-800'
  };
  
  const labels = {
    good: 'Good',
    warning: 'Warning',
    error: 'Error',
    missing: 'Missing'
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status]}`}>
      {labels[status]}
    </span>
  );
};

export default function MetaTagsTable({ 
  titleAnalysis, 
  metaAnalysis, 
  technicalAnalysis, 
  rawData 
}: MetaTagsTableProps) {
  
  const metaTags: MetaTagInfo[] = [
    {
      name: 'Title Tag',
      value: rawData?.title,
      status: titleAnalysis.is_optimal ? 'good' : titleAnalysis.length === 0 ? 'missing' : 'warning',
      message: titleAnalysis.length === 0 
        ? 'No title tag found' 
        : titleAnalysis.is_optimal 
          ? `Optimal length (${titleAnalysis.length} characters)`
          : `${titleAnalysis.length} characters (optimal: 30-60)`,
      recommendation: titleAnalysis.recommendations[0],
      optimal: '30-60 characters, include primary keyword'
    },
    {
      name: 'Meta Description',
      value: rawData?.metaDescription,
      status: metaAnalysis.is_optimal ? 'good' : metaAnalysis.length === 0 ? 'missing' : 'warning',
      message: metaAnalysis.length === 0 
        ? 'No meta description found' 
        : metaAnalysis.is_optimal 
          ? `Optimal length (${metaAnalysis.length} characters)`
          : `${metaAnalysis.length} characters (optimal: 150-160)`,
      recommendation: metaAnalysis.recommendations[0],
      optimal: '150-160 characters, compelling summary with keywords'
    },
    {
      name: 'Canonical URL',
      value: rawData?.canonical,
      status: technicalAnalysis.has_canonical ? 'good' : 'missing',
      message: technicalAnalysis.has_canonical 
        ? 'Canonical URL is set' 
        : 'No canonical URL specified',
      recommendation: !technicalAnalysis.has_canonical 
        ? 'Add canonical URL to prevent duplicate content issues' 
        : undefined,
      optimal: 'Should point to the preferred version of the page'
    },
    {
      name: 'Open Graph Title',
      value: rawData?.ogTitle,
      status: technicalAnalysis.has_og_tags ? 'good' : 'missing',
      message: technicalAnalysis.has_og_tags 
        ? 'Open Graph tags present' 
        : 'No Open Graph tags found',
      recommendation: !technicalAnalysis.has_og_tags 
        ? 'Add Open Graph tags for better social media sharing' 
        : undefined,
      optimal: 'Should be engaging and different from title tag'
    },
    {
      name: 'Open Graph Description',
      value: rawData?.ogDescription,
      status: rawData?.ogDescription ? 'good' : 'missing',
      message: rawData?.ogDescription 
        ? 'OG description is set' 
        : 'No OG description found',
      recommendation: !rawData?.ogDescription 
        ? 'Add OG description for social media previews' 
        : undefined,
      optimal: 'Should be compelling and under 300 characters'
    },
    {
      name: 'Open Graph Image',
      value: rawData?.ogImage,
      status: rawData?.ogImage ? 'good' : 'warning',
      message: rawData?.ogImage 
        ? 'OG image is set' 
        : 'No OG image specified',
      recommendation: !rawData?.ogImage 
        ? 'Add OG image for better social media appearance' 
        : undefined,
      optimal: '1200x630px, under 1MB, relevant to content'
    },
    {
      name: 'Twitter Card',
      value: rawData?.twitterCard,
      status: technicalAnalysis.has_twitter_cards ? 'good' : 'warning',
      message: technicalAnalysis.has_twitter_cards 
        ? 'Twitter Cards configured' 
        : 'No Twitter Card meta tags',
      recommendation: !technicalAnalysis.has_twitter_cards 
        ? 'Add Twitter Card meta tags for better Twitter sharing' 
        : undefined,
      optimal: 'Use summary_large_image or summary card type'
    }
  ];

  const goodCount = metaTags.filter(tag => tag.status === 'good').length;
  const warningCount = metaTags.filter(tag => tag.status === 'warning').length;
  const errorCount = metaTags.filter(tag => tag.status === 'error' || tag.status === 'missing').length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Tags className="w-5 h-5 mr-2 text-blue-600" />
              Meta Tags Overview
            </span>
            <div className="flex items-center space-x-2">
              <span className="flex items-center text-sm text-green-600">
                <CheckCircle className="w-4 h-4 mr-1" />
                {goodCount}
              </span>
              <span className="flex items-center text-sm text-yellow-600">
                <AlertCircle className="w-4 h-4 mr-1" />
                {warningCount}
              </span>
              <span className="flex items-center text-sm text-red-600">
                <XCircle className="w-4 h-4 mr-1" />
                {errorCount}
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{goodCount}</div>
              <div className="text-sm text-green-700">Optimized</div>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
              <div className="text-sm text-yellow-700">Needs Attention</div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{errorCount}</div>
              <div className="text-sm text-red-700">Critical Issues</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meta Tags Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Tags className="w-5 h-5 mr-2 text-purple-600" />
            Meta Tag Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Meta Tag</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Current Value</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Analysis</th>
                </tr>
              </thead>
              <tbody>
                {metaTags.map((tag, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="font-medium text-gray-900">{tag.name}</div>
                      <div className="text-sm text-gray-500">{tag.optimal}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(tag.status)}
                        {getStatusBadge(tag.status)}
                      </div>
                    </td>
                    <td className="py-4 px-4 max-w-xs">
                      {tag.value ? (
                        <div className="truncate text-sm text-gray-700" title={tag.value}>
                          {tag.value}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">Not set</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-700">{tag.message}</div>
                      {tag.recommendation && (
                        <div className="mt-1 text-sm text-blue-600 flex items-start">
                          <Info className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                          <span>{tag.recommendation}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Schema Markup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ExternalLink className="w-5 h-5 mr-2 text-green-600" />
            Structured Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center">
              {getStatusIcon(technicalAnalysis.has_schema ? 'good' : 'missing')}
              <div className="ml-3">
                <div className="font-medium text-gray-900">Schema Markup</div>
                <div className="text-sm text-gray-500">
                  {technicalAnalysis.has_schema 
                    ? 'Structured data detected on page'
                    : 'No structured data found'
                  }
                </div>
              </div>
            </div>
            {getStatusBadge(technicalAnalysis.has_schema ? 'good' : 'warning')}
          </div>
          
          {!technicalAnalysis.has_schema && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-blue-800">Recommendation</div>
                  <div className="text-sm text-blue-700 mt-1">
                    Consider adding structured data (Schema.org) to help search engines better understand your content. 
                    Common schemas include Article, Product, Organization, and LocalBusiness.
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}