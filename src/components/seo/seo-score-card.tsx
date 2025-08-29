import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CategoryScores, SEOGrade, SEOScore } from '@/lib/seo-scoring';
import { Award, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

interface SEOScoreCardProps {
  seoScore: SEOScore;
}

interface CategoryData {
  name: string;
  score: number;
  color: string;
  icon: string;
}

const SCORE_COLORS = {
  excellent: '#10b981', // green-500
  good: '#22c55e',      // green-400
  fair: '#f59e0b',      // amber-500
  poor: '#ef4444',      // red-500
  bad: '#dc2626'        // red-600
};

const getScoreColor = (score: number): string => {
  if (score >= 90) return SCORE_COLORS.excellent;
  if (score >= 80) return SCORE_COLORS.good;
  if (score >= 60) return SCORE_COLORS.fair;
  if (score >= 40) return SCORE_COLORS.poor;
  return SCORE_COLORS.bad;
};

const getGradeColor = (grade: SEOGrade): string => {
  switch (grade) {
    case 'A+':
    case 'A': return 'text-green-600 bg-green-100';
    case 'B+':
    case 'B': return 'text-blue-600 bg-blue-100';
    case 'C+':
    case 'C': return 'text-yellow-600 bg-yellow-100';
    case 'D': return 'text-orange-600 bg-orange-100';
    case 'F': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

const formatCategoryName = (key: string): string => {
  const names: { [key: string]: string } = {
    content: 'Content',
    technical: 'Technical',
    meta: 'Meta Tags',
    structure: 'Structure',
    links: 'Links',
    images: 'Images'
  };
  return names[key] || key;
};

export default function SEOScoreCard({ seoScore }: SEOScoreCardProps) {
  const { overall_score, category_scores, grade, priority_issues } = seoScore;
  
  // Prepare data for charts
  const categoryData: CategoryData[] = Object.entries(category_scores).map(([key, score]) => ({
    name: formatCategoryName(key),
    score: Math.round(score),
    color: getScoreColor(score),
    icon: key
  }));

  const pieData = categoryData.map(item => ({
    name: item.name,
    value: item.score,
    fill: item.color
  }));

  const highPriorityIssues = priority_issues.filter(issue => issue.impact === 'high').slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Overall Score Display */}
      <Card className="relative overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Award className="w-5 h-5 mr-2 text-blue-600" />
              Overall SEO Score
            </span>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(grade)}`}>
              Grade: {grade}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-32 h-32">
              {/* Progress Circle */}
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke={getScoreColor(overall_score)}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(overall_score / 100) * 314.16} 314.16`}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold" style={{ color: getScoreColor(overall_score) }}>
                  {Math.round(overall_score)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              {overall_score >= 80 ? 'Excellent SEO performance!' :
               overall_score >= 60 ? 'Good SEO, room for improvement' :
               overall_score >= 40 ? 'Fair SEO, needs attention' :
               'Poor SEO, requires significant improvements'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Category Scores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
            Category Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip 
                    formatter={(value) => [`${value}/100`, 'Score']}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}/100`, 'Score']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category List */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
            {categoryData.map((category) => (
              <div key={category.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">{category.name}</span>
                <div className="flex items-center">
                  <span className="text-sm font-bold mr-2" style={{ color: category.color }}>
                    {category.score}
                  </span>
                  {category.score >= 80 ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* High Priority Issues */}
      {highPriorityIssues.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <AlertCircle className="w-5 h-5 mr-2" />
              High Priority Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {highPriorityIssues.map((issue, index) => (
                <div key={index} className="flex items-start p-3 bg-white rounded-lg border border-orange-200">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {issue.category}
                      </span>
                      <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                        -{issue.score_impact} points
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{issue.issue}</p>
                    <div className="flex items-center mt-2 space-x-4">
                      <span className="text-xs text-gray-500">
                        Impact: <span className="font-medium capitalize">{issue.impact}</span>
                      </span>
                      <span className="text-xs text-gray-500">
                        Effort: <span className="font-medium capitalize">{issue.fix_effort}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}