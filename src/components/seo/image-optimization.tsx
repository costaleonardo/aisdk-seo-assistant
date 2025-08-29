import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageAnalysis } from '@/lib/seo-analyzer';
import { ImageData } from '@/lib/scraper';
import { Image as ImageIcon, CheckCircle, XCircle, AlertTriangle, Info, FileImage } from 'lucide-react';

interface ImageOptimizationProps {
  analysis: ImageAnalysis;
  images?: ImageData[];
}

interface ImageStatusData {
  name: string;
  value: number;
  color: string;
}

const COLORS = {
  withAlt: '#10b981',    // green-500
  withoutAlt: '#ef4444', // red-500
  good: '#22c55e',       // green-400
  warning: '#f59e0b',    // amber-500
  error: '#dc2626'       // red-600
};

export default function ImageOptimization({ analysis, images = [] }: ImageOptimizationProps) {
  // Prepare data for charts
  const altTextData: ImageStatusData[] = [
    {
      name: 'With Alt Text',
      value: analysis.images_with_alt,
      color: COLORS.withAlt
    },
    {
      name: 'Without Alt Text',
      value: analysis.images_without_alt,
      color: COLORS.withoutAlt
    }
  ];

  // Analyze image issues
  const imageIssues = images.map(img => {
    const issues = [];
    
    if (!img.alt || img.alt.trim() === '') {
      issues.push({ type: 'missing-alt', severity: 'error', message: 'Missing alt text' });
    } else if (img.alt.length > 125) {
      issues.push({ type: 'long-alt', severity: 'warning', message: 'Alt text too long (over 125 chars)' });
    } else if (img.alt.length < 5) {
      issues.push({ type: 'short-alt', severity: 'warning', message: 'Alt text too short' });
    }

    // Check for generic alt text
    const genericTerms = ['image', 'picture', 'photo', 'img', 'graphic'];
    if (img.alt && genericTerms.some(term => 
      img.alt.toLowerCase().includes(term) && img.alt.toLowerCase().trim() === term
    )) {
      issues.push({ type: 'generic-alt', severity: 'warning', message: 'Generic alt text' });
    }

    return { ...img, issues };
  });

  const imagesWithIssues = imageIssues.filter(img => img.issues.length > 0);
  const criticalIssues = imageIssues.filter(img => 
    img.issues.some(issue => issue.severity === 'error')
  ).length;
  const warningIssues = imageIssues.filter(img => 
    img.issues.some(issue => issue.severity === 'warning') && 
    !img.issues.some(issue => issue.severity === 'error')
  ).length;

  // Image size analysis (if available)
  const imageSizeData = images
    .filter(img => img.width && img.height)
    .map(img => ({
      url: img.src.split('/').pop() || 'Unknown',
      size: (img.width || 0) * (img.height || 0),
      width: img.width || 0,
      height: img.height || 0,
      hasAlt: !!(img.alt && img.alt.trim())
    }))
    .sort((a, b) => b.size - a.size)
    .slice(0, 10);

  const getScoreColor = (score: number): string => {
    if (score >= 80) return COLORS.good;
    if (score >= 60) return COLORS.warning;
    return COLORS.error;
  };

  return (
    <div className="space-y-6">
      {/* Image Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ImageIcon className="w-5 h-5 mr-2 text-blue-600" />
            Image Optimization Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{analysis.total_count}</div>
              <div className="text-sm text-gray-600">Total Images</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{analysis.images_with_alt}</div>
              <div className="text-sm text-green-700">With Alt Text</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{analysis.images_without_alt}</div>
              <div className="text-sm text-red-700">Without Alt Text</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(analysis.alt_text_percentage)}%
              </div>
              <div className="text-sm text-blue-700">Alt Text Coverage</div>
            </div>
          </div>

          {/* Alt Text Distribution */}
          {analysis.total_count > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64">
                <h4 className="text-sm font-medium text-gray-700 mb-4">Alt Text Coverage</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={altTextData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {altTextData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}`, 'Images']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700">Image Quality Metrics</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Optimization Score</span>
                    <div className="flex items-center">
                      <span className="text-lg font-bold mr-2" 
                            style={{ color: getScoreColor(analysis.score) }}>
                        {Math.round(analysis.score)}
                      </span>
                      {analysis.score >= 80 ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Critical Issues</span>
                    <span className={`text-sm font-medium ${criticalIssues > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {criticalIssues}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Warning Issues</span>
                    <span className={`text-sm font-medium ${warningIssues > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      {warningIssues}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Images with Issues</span>
                    <span className={`text-sm font-medium ${imagesWithIssues.length > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      {imagesWithIssues.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Size Analysis */}
      {imageSizeData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileImage className="w-5 h-5 mr-2 text-purple-600" />
              Image Sizes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={imageSizeData.slice(0, 8)} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="url" 
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                    label={{ value: 'Size (pixels)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value) => [`${Math.round(Number(value) / 1000)}k pixels`, 'Size']}
                    labelFormatter={(label) => `Image: ${label}`}
                  />
                  <Bar dataKey="size" radius={[4, 4, 0, 0]}>
                    {imageSizeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.hasAlt ? COLORS.good : COLORS.error} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-gray-600">
              Green bars indicate images with alt text, red bars indicate missing alt text.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Image Issues */}
      {imagesWithIssues.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Images with Issues ({imagesWithIssues.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {imagesWithIssues.slice(0, 10).map((img, index) => (
                <div key={index} className="p-4 bg-white rounded-lg border border-orange-200">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {img.issues.some(issue => issue.severity === 'error') ? (
                        <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 truncate" title={img.src}>
                        {img.src.split('/').pop() || img.src}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {img.width && img.height ? `${img.width}×${img.height}` : 'Dimensions unknown'}
                      </div>
                      <div className="mt-2 space-y-1">
                        {img.issues.map((issue, issueIndex) => (
                          <div key={issueIndex} className={`text-xs px-2 py-1 rounded-full ${
                            issue.severity === 'error' 
                              ? 'bg-red-100 text-red-700' 
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {issue.message}
                          </div>
                        ))}
                      </div>
                      {img.alt && (
                        <div className="mt-2 text-xs text-gray-600">
                          <span className="font-medium">Alt text:</span> {img.alt}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {imagesWithIssues.length > 10 && (
                <div className="text-center text-sm text-gray-500 py-2">
                  ... and {imagesWithIssues.length - 10} more images with issues
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card className={`${analysis.score >= 80 ? 'border-green-200 bg-green-50' : analysis.score >= 60 ? 'border-yellow-200 bg-yellow-50' : 'border-red-200 bg-red-50'}`}>
        <CardHeader>
          <CardTitle className="flex items-center">
            {analysis.score >= 80 ? (
              <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
            ) : (
              <Info className="w-5 h-5 mr-2 text-blue-600" />
            )}
            <span className={analysis.score >= 80 ? 'text-green-800' : analysis.score >= 60 ? 'text-yellow-800' : 'text-red-800'}>
              Image Optimization Results
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${analysis.score >= 80 ? 'text-green-700' : analysis.score >= 60 ? 'text-yellow-700' : 'text-red-700'}`}>
                Image Score: {Math.round(analysis.score)}/100
              </span>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${analysis.score >= 80 ? 'bg-green-100 text-green-800' : analysis.score >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                {analysis.score >= 80 ? 'Good' : analysis.score >= 60 ? 'Fair' : 'Poor'}
              </div>
            </div>
          </div>

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

      {/* No Images State */}
      {analysis.total_count === 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="text-center py-12">
            <ImageIcon className="w-16 h-16 mx-auto text-blue-300 mb-4" />
            <h3 className="text-lg font-medium text-blue-800 mb-2">No Images Found</h3>
            <p className="text-blue-700">
              This page doesn&apos;t contain any images. Consider adding relevant images with proper alt text to enhance user experience and SEO.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}