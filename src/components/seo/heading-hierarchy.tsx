import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heading } from '@/lib/scraper';
import { HeadingAnalysis } from '@/lib/seo-analyzer';
import { Hash, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface HeadingHierarchyProps {
  headings: Heading[];
  analysis: HeadingAnalysis;
}

interface HeadingNode {
  heading: Heading;
  children: HeadingNode[];
  level: number;
  hasIssue?: boolean;
  issueType?: 'missing-h1' | 'multiple-h1' | 'skipped-level' | 'long-text';
}

const getHeadingIcon = (level: number, hasIssue?: boolean) => {
  const baseClasses = "w-4 h-4 mr-2";
  const color = hasIssue ? "text-red-500" : 
               level === 1 ? "text-blue-600" : 
               level === 2 ? "text-green-600" : 
               level === 3 ? "text-purple-600" :
               level === 4 ? "text-orange-600" :
               level === 5 ? "text-pink-600" : "text-gray-600";
  
  return <Hash className={`${baseClasses} ${color}`} />;
};

const buildHierarchy = (headings: Heading[]): HeadingNode[] => {
  const nodes: HeadingNode[] = [];
  const stack: HeadingNode[] = [];

  headings.forEach((heading, index) => {
    const level = parseInt(heading.level.toString().substring(1)); // Remove 'h' from 'h1', 'h2', etc.
    
    // Check for issues
    let hasIssue = false;
    let issueType: HeadingNode['issueType'];
    
    // Check for long text
    if (heading.text.length > 60) {
      hasIssue = true;
      issueType = 'long-text';
    }
    
    const node: HeadingNode = {
      heading,
      children: [],
      level,
      hasIssue,
      issueType
    };

    // Build hierarchy
    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    if (stack.length === 0) {
      nodes.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }

    stack.push(node);
  });

  return nodes;
};

const renderNode = (node: HeadingNode, depth: number = 0): React.JSX.Element => {
  const indent = depth * 20;
  const textColor = node.hasIssue ? 'text-red-700' : 'text-gray-700';
  const bgColor = node.hasIssue ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200';

  return (
    <div key={`${node.heading.level}-${node.heading.text.substring(0, 20)}`} className="space-y-2">
      <div 
        className={`p-3 rounded-lg border ${bgColor} flex items-start`}
        style={{ marginLeft: `${indent}px` }}
      >
        <div className="flex items-center flex-1">
          {getHeadingIcon(node.level, node.hasIssue)}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className={`font-medium text-sm ${textColor}`}>
                {node.heading.level.toString().toUpperCase()}
              </span>
              {node.hasIssue && (
                <div className="flex items-center text-red-500">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  <span className="text-xs">
                    {node.issueType === 'long-text' ? 'Too long' : 'Issue'}
                  </span>
                </div>
              )}
            </div>
            <p className={`mt-1 text-sm ${textColor} line-clamp-2`}>
              {node.heading.text}
            </p>
            <div className="mt-2 text-xs text-gray-500">
              Length: {node.heading.text.length} characters
            </div>
          </div>
        </div>
      </div>
      
      {node.children.map(child => renderNode(child, depth + 1))}
    </div>
  );
};

export default function HeadingHierarchy({ headings, analysis }: HeadingHierarchyProps) {
  const hierarchyNodes = buildHierarchy(headings);
  
  const h1Count = headings.filter(h => h.level.toString() === 'h1').length;
  const hasMultipleH1 = h1Count > 1;
  const hasNoH1 = h1Count === 0;

  // Calculate level distribution
  const levelDistribution = headings.reduce((acc, heading) => {
    const level = heading.level;
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Analysis Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Hash className="w-5 h-5 mr-2 text-blue-600" />
            Heading Structure Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{analysis.total_headings}</div>
              <div className="text-sm text-gray-600">Total Headings</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{analysis.h1_count}</div>
              <div className="text-sm text-gray-600">H1 Tags</div>
            </div>
            <div className="text-center p-3 rounded-lg flex flex-col items-center">
              {analysis.has_single_h1 ? (
                <>
                  <CheckCircle className="w-8 h-8 text-green-500 mb-1" />
                  <div className="text-sm text-green-700 font-medium">Single H1</div>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-8 h-8 text-red-500 mb-1" />
                  <div className="text-sm text-red-700 font-medium">H1 Issue</div>
                </>
              )}
            </div>
            <div className="text-center p-3 rounded-lg flex flex-col items-center">
              {analysis.hierarchy_valid ? (
                <>
                  <CheckCircle className="w-8 h-8 text-green-500 mb-1" />
                  <div className="text-sm text-green-700 font-medium">Valid Hierarchy</div>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-8 h-8 text-orange-500 mb-1" />
                  <div className="text-sm text-orange-700 font-medium">Hierarchy Issues</div>
                </>
              )}
            </div>
          </div>

          {/* Level Distribution */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Level Distribution</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(levelDistribution).map(([level, count]) => (
                <div key={level} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  {level.toUpperCase()}: {count}
                </div>
              ))}
            </div>
          </div>

          {/* Issues */}
          {(hasMultipleH1 || hasNoH1 || !analysis.hierarchy_valid) && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
                <h4 className="font-medium text-orange-800">Heading Structure Issues</h4>
              </div>
              <div className="space-y-2 text-sm text-orange-700">
                {hasNoH1 && (
                  <div className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>No H1 tag found. Every page should have exactly one H1 tag.</span>
                  </div>
                )}
                {hasMultipleH1 && (
                  <div className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Multiple H1 tags found ({h1Count}). Use only one H1 per page.</span>
                  </div>
                )}
                {!analysis.hierarchy_valid && (
                  <div className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Heading hierarchy is not properly structured. Avoid skipping heading levels.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Heading Hierarchy Tree */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Hash className="w-5 h-5 mr-2 text-purple-600" />
            Heading Hierarchy
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hierarchyNodes.length > 0 ? (
            <div className="space-y-2">
              {hierarchyNodes.map(node => renderNode(node))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Hash className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No headings found on this page</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-800">
              <Info className="w-5 h-5 mr-2" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start p-3 bg-white rounded-lg border border-blue-200">
                  <CheckCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-700">{recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}