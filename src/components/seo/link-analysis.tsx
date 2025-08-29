import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LinkAnalysis as LinkAnalysisType } from '@/lib/seo-analyzer';
import { LinkData } from '@/lib/scraper';
import { Link, ExternalLink, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface LinkAnalysisProps {
  analysis: LinkAnalysisType;
  links?: LinkData[];
}

interface LinkCategoryData {
  name: string;
  value: number;
  color: string;
}

const COLORS = {
  internal: '#3b82f6', // blue-500
  external: '#10b981'  // green-500
};

export default function LinkAnalysis({ analysis, links = [] }: LinkAnalysisProps) {
  // Prepare data for charts
  const linkData: LinkCategoryData[] = [
    {
      name: 'Internal Links',
      value: analysis.internal_count,
      color: COLORS.internal
    },
    {
      name: 'External Links',
      value: analysis.external_count,
      color: COLORS.external
    }
  ];

  // Analyze link quality
  const emptyAnchorLinks = links.filter(link => !link.anchor_text || link.anchor_text.trim() === '').length;
  const longAnchorLinks = links.filter(link => link.anchor_text && link.anchor_text.length > 60).length;
  const exactMatchLinks = links.filter(link => 
    link.anchor_text && (
      link.anchor_text.toLowerCase().includes('click here') ||
      link.anchor_text.toLowerCase().includes('read more') ||
      link.anchor_text.toLowerCase().includes('here')
    )
  ).length;

  // Get link quality score
  const getQualityScore = () => {
    const totalLinks = analysis.total_count;
    if (totalLinks === 0) return 0;
    
    const qualityIssues = emptyAnchorLinks + exactMatchLinks;
    const qualityScore = Math.max(0, 100 - ((qualityIssues / totalLinks) * 100));
    return Math.round(qualityScore);
  };

  const qualityScore = getQualityScore();

  // Categorize external links by domain
  const externalDomains = links
    .filter(link => !link.is_internal)
    .reduce((acc, link) => {
      try {
        const domain = new URL(link.url).hostname;
        acc[domain] = (acc[domain] || 0) + 1;
        return acc;
      } catch {
        return acc;
      }
    }, {} as Record<string, number>);

  const topExternalDomains = Object.entries(externalDomains)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Link Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Link className="w-5 h-5 mr-2 text-blue-600" />
            Link Analysis Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{analysis.total_count}</div>
              <div className="text-sm text-gray-600">Total Links</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{analysis.internal_count}</div>
              <div className="text-sm text-blue-700">Internal Links</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{analysis.external_count}</div>
              <div className="text-sm text-green-700">External Links</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {analysis.total_count > 0 ? Math.round(analysis.ratio * 100) : 0}%
              </div>
              <div className="text-sm text-purple-700">Internal Ratio</div>
            </div>
          </div>

          {/* Link Distribution Chart */}
          {analysis.total_count > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64">
                <h4 className="text-sm font-medium text-gray-700 mb-4">Link Distribution</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={linkData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {linkData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}`, 'Links']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700">Link Quality Metrics</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Quality Score</span>
                    <div className="flex items-center">
                      <span className="text-lg font-bold mr-2" 
                            style={{ color: qualityScore >= 80 ? COLORS.internal : qualityScore >= 60 ? '#f59e0b' : '#ef4444' }}>
                        {qualityScore}
                      </span>
                      {qualityScore >= 80 ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Empty Anchor Text</span>
                    <span className={`text-sm font-medium ${emptyAnchorLinks > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {emptyAnchorLinks}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Generic Anchors</span>
                    <span className={`text-sm font-medium ${exactMatchLinks > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {exactMatchLinks}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Long Anchor Text</span>
                    <span className={`text-sm font-medium ${longAnchorLinks > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      {longAnchorLinks}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* External Domains */}
      {topExternalDomains.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ExternalLink className="w-5 h-5 mr-2 text-green-600" />
              Top External Domains
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topExternalDomains.map(([domain, count], index) => (
                <div key={domain} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3`}
                         style={{ backgroundColor: `hsl(${index * 60}, 60%, 50%)` }}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{domain}</div>
                      <div className="text-sm text-gray-500">{count} link{count !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Link Analysis Results */}
      <Card className={`${analysis.score >= 80 ? 'border-green-200 bg-green-50' : analysis.score >= 60 ? 'border-yellow-200 bg-yellow-50' : 'border-red-200 bg-red-50'}`}>
        <CardHeader>
          <CardTitle className="flex items-center">
            {analysis.score >= 80 ? (
              <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
            )}
            <span className={analysis.score >= 80 ? 'text-green-800' : analysis.score >= 60 ? 'text-yellow-800' : 'text-red-800'}>
              Link Analysis Results
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${analysis.score >= 80 ? 'text-green-700' : analysis.score >= 60 ? 'text-yellow-700' : 'text-red-700'}`}>
                Link Score: {Math.round(analysis.score)}/100
              </span>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${analysis.score >= 80 ? 'bg-green-100 text-green-800' : analysis.score >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                {analysis.score >= 80 ? 'Good' : analysis.score >= 60 ? 'Fair' : 'Poor'}
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {analysis.recommendations.length > 0 && (
            <div className="space-y-2">
              <h4 className={`text-sm font-medium ${analysis.score >= 80 ? 'text-green-800' : analysis.score >= 60 ? 'text-yellow-800' : 'text-red-800'}`}>
                Recommendations
              </h4>
              {analysis.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start p-3 bg-white rounded-lg border border-gray-200">
                  <Info className={`w-4 h-4 mr-2 mt-0.5 flex-shrink-0 ${analysis.score >= 80 ? 'text-green-600' : analysis.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`} />
                  <p className={`text-sm ${analysis.score >= 80 ? 'text-green-700' : analysis.score >= 60 ? 'text-yellow-700' : 'text-red-700'}`}>
                    {recommendation}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* No Links State */}
      {analysis.total_count === 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="text-center py-12">
            <Link className="w-16 h-16 mx-auto text-orange-300 mb-4" />
            <h3 className="text-lg font-medium text-orange-800 mb-2">No Links Found</h3>
            <p className="text-orange-700">
              This page doesn&apos;t contain any links. Consider adding relevant internal and external links to improve user experience and SEO.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}