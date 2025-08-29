import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PriorityIssue } from '@/lib/seo-scoring';
import { 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle, 
  Clock, 
  Zap, 
  Wrench, 
  Target,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  Copy,
  ExternalLink
} from 'lucide-react';
import { useState } from 'react';

interface RecommendationsListProps {
  issues: PriorityIssue[];
  showImplementation?: boolean;
}

interface RecommendationGroup {
  impact: 'high' | 'medium' | 'low';
  issues: PriorityIssue[];
}

const getImpactIcon = (impact: 'high' | 'medium' | 'low') => {
  switch (impact) {
    case 'high':
      return <ArrowUp className="w-4 h-4 text-red-500" />;
    case 'medium':
      return <ArrowRight className="w-4 h-4 text-orange-500" />;
    case 'low':
      return <ArrowDown className="w-4 h-4 text-green-500" />;
  }
};

const getEffortIcon = (effort: 'easy' | 'moderate' | 'difficult') => {
  switch (effort) {
    case 'easy':
      return <Zap className="w-4 h-4 text-green-500" />;
    case 'moderate':
      return <Clock className="w-4 h-4 text-orange-500" />;
    case 'difficult':
      return <Wrench className="w-4 h-4 text-red-500" />;
  }
};

const getImpactColor = (impact: 'high' | 'medium' | 'low') => {
  switch (impact) {
    case 'high':
      return 'border-red-200 bg-red-50';
    case 'medium':
      return 'border-orange-200 bg-orange-50';
    case 'low':
      return 'border-green-200 bg-green-50';
  }
};

const getEffortColor = (effort: 'easy' | 'moderate' | 'difficult') => {
  switch (effort) {
    case 'easy':
      return 'bg-green-100 text-green-800';
    case 'moderate':
      return 'bg-orange-100 text-orange-800';
    case 'difficult':
      return 'bg-red-100 text-red-800';
  }
};

// Implementation guides for common SEO issues
const implementationGuides: { [key: string]: string } = {
  'title': `<!-- Add this in your HTML head section -->
<title>Your Page Title (30-60 characters)</title>`,
  'meta-description': `<!-- Add this in your HTML head section -->
<meta name="description" content="Your page description (150-160 characters)">`,
  'canonical': `<!-- Add this in your HTML head section -->
<link rel="canonical" href="https://yoursite.com/page">`,
  'h1': `<!-- Ensure you have exactly one H1 tag per page -->
<h1>Your Main Page Heading</h1>`,
  'headings': `<!-- Use proper heading hierarchy -->
<h1>Main Title</h1>
<h2>Section Title</h2>
<h3>Subsection Title</h3>`,
  'alt-text': `<!-- Add alt text to all images -->
<img src="image.jpg" alt="Descriptive text about the image">`,
  'internal-links': `<!-- Add relevant internal links -->
<a href="/related-page">Related Page Title</a>`,
  'schema': `<!-- Add JSON-LD structured data -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Your Article Title",
  "description": "Article description"
}
</script>`,
  'open-graph': `<!-- Add Open Graph meta tags -->
<meta property="og:title" content="Page Title">
<meta property="og:description" content="Page description">
<meta property="og:image" content="https://yoursite.com/image.jpg">`
};

export default function RecommendationsList({ issues, showImplementation = false }: RecommendationsListProps) {
  const [completedIssues, setCompletedIssues] = useState<Set<number>>(new Set());
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Group issues by impact
  const groupedIssues: RecommendationGroup[] = [
    { impact: 'high' as const, issues: issues.filter(issue => issue.impact === 'high') },
    { impact: 'medium' as const, issues: issues.filter(issue => issue.impact === 'medium') },
    { impact: 'low' as const, issues: issues.filter(issue => issue.impact === 'low') }
  ].filter(group => group.issues.length > 0);

  const handleToggleComplete = (index: number) => {
    const newCompleted = new Set(completedIssues);
    if (newCompleted.has(index)) {
      newCompleted.delete(index);
    } else {
      newCompleted.add(index);
    }
    setCompletedIssues(newCompleted);
  };

  const copyToClipboard = (code: string, type: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(type);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  const getImplementationCode = (category: string, issue: string): string => {
    const lowerCategory = category.toLowerCase();
    if (issue.toLowerCase().includes('title')) return implementationGuides['title'];
    if (issue.toLowerCase().includes('meta description')) return implementationGuides['meta-description'];
    if (issue.toLowerCase().includes('canonical')) return implementationGuides['canonical'];
    if (issue.toLowerCase().includes('h1')) return implementationGuides['h1'];
    if (issue.toLowerCase().includes('heading')) return implementationGuides['headings'];
    if (issue.toLowerCase().includes('alt')) return implementationGuides['alt-text'];
    if (issue.toLowerCase().includes('internal link')) return implementationGuides['internal-links'];
    if (issue.toLowerCase().includes('schema')) return implementationGuides['schema'];
    if (issue.toLowerCase().includes('open graph') || issue.toLowerCase().includes('og:')) return implementationGuides['open-graph'];
    
    return implementationGuides[lowerCategory] || `<!-- Implementation guide for ${category} -->`;
  };

  const completedCount = completedIssues.size;
  const totalCount = issues.length;
  const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Target className="w-5 h-5 mr-2 text-blue-600" />
              SEO Action Items
            </span>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {completedCount} of {totalCount} completed
              </div>
              <div className="text-sm font-medium text-blue-600">
                {Math.round(completionPercentage)}%
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="text-lg font-bold text-red-600">
                  {groupedIssues.find(g => g.impact === 'high')?.issues.length || 0}
                </div>
                <div className="text-xs text-red-700">High Impact</div>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="text-lg font-bold text-orange-600">
                  {groupedIssues.find(g => g.impact === 'medium')?.issues.length || 0}
                </div>
                <div className="text-xs text-orange-700">Medium Impact</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">
                  {groupedIssues.find(g => g.impact === 'low')?.issues.length || 0}
                </div>
                <div className="text-xs text-green-700">Low Impact</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations by Priority */}
      {groupedIssues.map((group, groupIndex) => (
        <Card key={group.impact} className={getImpactColor(group.impact)}>
          <CardHeader>
            <CardTitle className={`flex items-center text-${group.impact === 'high' ? 'red' : group.impact === 'medium' ? 'orange' : 'green'}-800`}>
              {getImpactIcon(group.impact)}
              <span className="ml-2 capitalize">{group.impact} Impact Issues</span>
              <span className="ml-2 text-sm font-normal">({group.issues.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {group.issues.map((issue, issueIndex) => {
                const globalIndex = groupIndex * 100 + issueIndex; // Unique index
                const isCompleted = completedIssues.has(globalIndex);
                const isExpanded = expandedIssue === globalIndex;
                const implementationCode = getImplementationCode(issue.category, issue.issue);

                return (
                  <div 
                    key={globalIndex}
                    className={`p-4 bg-white rounded-lg border ${isCompleted ? 'border-green-300 bg-green-50' : 'border-gray-200'} transition-all`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <button
                          onClick={() => handleToggleComplete(globalIndex)}
                          className={`mt-1 p-1 rounded-full ${isCompleted ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${isCompleted ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                                {issue.category}
                              </span>
                              <div className="flex items-center space-x-1">
                                {getEffortIcon(issue.fix_effort)}
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEffortColor(issue.fix_effort)}`}>
                                  {issue.fix_effort}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500">
                                +{issue.score_impact} points
                              </div>
                            </div>
                          </div>
                          
                          <p className={`text-sm mb-2 ${isCompleted ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                            {issue.issue}
                          </p>
                          
                          {showImplementation && (
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setExpandedIssue(isExpanded ? null : globalIndex)}
                                className="text-xs"
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                {isExpanded ? 'Hide' : 'Show'} Implementation
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Implementation Code */}
                    {showImplementation && isExpanded && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-sm font-medium text-gray-700">Implementation Guide</h5>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(implementationCode, `${issue.category}-${globalIndex}`)}
                            className="text-xs"
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            {copiedCode === `${issue.category}-${globalIndex}` ? 'Copied!' : 'Copy'}
                          </Button>
                        </div>
                        <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                          <pre className="text-sm text-green-400 whitespace-pre-wrap">
                            <code>{implementationCode}</code>
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Empty State */}
      {issues.length === 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="text-center py-12">
            <CheckCircle className="w-16 h-16 mx-auto text-green-400 mb-4" />
            <h3 className="text-lg font-medium text-green-800 mb-2">All Good!</h3>
            <p className="text-green-700">
              No SEO issues found. Your page is well optimized according to our analysis.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Completion Message */}
      {completedCount > 0 && completedCount === totalCount && totalCount > 0 && (
        <Card className="border-green-300 bg-green-100">
          <CardContent className="text-center py-6">
            <CheckCircle className="w-12 h-12 mx-auto text-green-600 mb-3" />
            <h3 className="text-lg font-medium text-green-800 mb-2">Congratulations! 🎉</h3>
            <p className="text-green-700">
              You&apos;ve addressed all the SEO recommendations. Your page should perform much better in search results!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}