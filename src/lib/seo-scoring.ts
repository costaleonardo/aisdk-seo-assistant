import { SEOAnalysis } from './seo-analyzer';

export interface SEOScore {
  overall_score: number;
  category_scores: CategoryScores;
  grade: SEOGrade;
  priority_issues: PriorityIssue[];
}

export interface CategoryScores {
  content: number;
  technical: number;
  meta: number;
  structure: number;
  links: number;
  images: number;
}

export type SEOGrade = 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';

export interface PriorityIssue {
  category: string;
  issue: string;
  impact: 'high' | 'medium' | 'low';
  fix_effort: 'easy' | 'moderate' | 'difficult';
  score_impact: number;
}

export interface WeightConfig {
  content: number;
  technical: number;
  meta: number;
  structure: number;
  links: number;
  images: number;
}

// Default weights for scoring algorithm
const DEFAULT_WEIGHTS: WeightConfig = {
  content: 0.25,    // Keywords and content quality
  technical: 0.20,  // Technical SEO factors
  meta: 0.20,       // Title and meta description
  structure: 0.15,  // Heading structure
  links: 0.10,      // Link analysis
  images: 0.10      // Image optimization
};

export function calculateSEOScore(
  analysis: SEOAnalysis, 
  weights: WeightConfig = DEFAULT_WEIGHTS
): SEOScore {
  // Calculate category scores
  const categoryScores: CategoryScores = {
    content: analysis.keywords.score,
    technical: analysis.technical.score,
    meta: (analysis.title.score + analysis.meta_description.score) / 2,
    structure: analysis.headings.score,
    links: analysis.links.score,
    images: analysis.images.score
  };

  // Calculate weighted overall score
  const overallScore = Math.round(
    (categoryScores.content * weights.content) +
    (categoryScores.technical * weights.technical) +
    (categoryScores.meta * weights.meta) +
    (categoryScores.structure * weights.structure) +
    (categoryScores.links * weights.links) +
    (categoryScores.images * weights.images)
  );

  // Determine grade
  const grade = getGradeFromScore(overallScore);

  // Identify priority issues
  const priorityIssues = identifyPriorityIssues(analysis, categoryScores);

  return {
    overall_score: overallScore,
    category_scores: categoryScores,
    grade,
    priority_issues: priorityIssues
  };
}

function getGradeFromScore(score: number): SEOGrade {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'B+';
  if (score >= 80) return 'B';
  if (score >= 75) return 'C+';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function identifyPriorityIssues(
  analysis: SEOAnalysis, 
  categoryScores: CategoryScores
): PriorityIssue[] {
  const issues: PriorityIssue[] = [];

  // Title issues (high impact)
  if (analysis.title.score < 50) {
    if (analysis.title.length === 0) {
      issues.push({
        category: 'Meta',
        issue: 'Missing title tag',
        impact: 'high',
        fix_effort: 'easy',
        score_impact: 20
      });
    } else if (analysis.title.length < 30 || analysis.title.length > 60) {
      issues.push({
        category: 'Meta',
        issue: 'Title length not optimized (should be 30-60 characters)',
        impact: 'high',
        fix_effort: 'easy',
        score_impact: 15
      });
    }
    if (!analysis.title.has_keywords) {
      issues.push({
        category: 'Meta',
        issue: 'Title missing target keywords',
        impact: 'high',
        fix_effort: 'moderate',
        score_impact: 15
      });
    }
  }

  // Meta description issues (high impact)
  if (analysis.meta_description.score < 50) {
    if (analysis.meta_description.length === 0) {
      issues.push({
        category: 'Meta',
        issue: 'Missing meta description',
        impact: 'high',
        fix_effort: 'easy',
        score_impact: 18
      });
    } else if (analysis.meta_description.length < 150 || analysis.meta_description.length > 160) {
      issues.push({
        category: 'Meta',
        issue: 'Meta description length not optimized (should be 150-160 characters)',
        impact: 'medium',
        fix_effort: 'easy',
        score_impact: 12
      });
    }
  }

  // Heading structure issues (medium-high impact)
  if (analysis.headings.score < 60) {
    if (analysis.headings.h1_count === 0) {
      issues.push({
        category: 'Structure',
        issue: 'Missing H1 tag',
        impact: 'high',
        fix_effort: 'easy',
        score_impact: 15
      });
    } else if (analysis.headings.h1_count > 1) {
      issues.push({
        category: 'Structure',
        issue: 'Multiple H1 tags found (should have only one)',
        impact: 'medium',
        fix_effort: 'easy',
        score_impact: 10
      });
    }
    if (!analysis.headings.hierarchy_valid) {
      issues.push({
        category: 'Structure',
        issue: 'Heading hierarchy is not logical',
        impact: 'medium',
        fix_effort: 'moderate',
        score_impact: 12
      });
    }
  }

  // Technical SEO issues (high impact)
  if (analysis.technical.score < 70) {
    if (!analysis.technical.has_meta_title) {
      issues.push({
        category: 'Technical',
        issue: 'Missing meta title tag',
        impact: 'high',
        fix_effort: 'easy',
        score_impact: 15
      });
    }
    if (!analysis.technical.has_canonical) {
      issues.push({
        category: 'Technical',
        issue: 'Missing canonical URL',
        impact: 'medium',
        fix_effort: 'easy',
        score_impact: 10
      });
    }
    if (!analysis.technical.has_og_tags) {
      issues.push({
        category: 'Technical',
        issue: 'Missing Open Graph tags for social sharing',
        impact: 'medium',
        fix_effort: 'moderate',
        score_impact: 8
      });
    }
    if (!analysis.technical.has_schema) {
      issues.push({
        category: 'Technical',
        issue: 'Missing structured data (Schema.org)',
        impact: 'medium',
        fix_effort: 'difficult',
        score_impact: 10
      });
    }
  }

  // Content/keyword issues (medium impact)
  if (analysis.keywords.score < 60) {
    if (!analysis.keywords.primary_keyword) {
      issues.push({
        category: 'Content',
        issue: 'No clear primary keyword identified',
        impact: 'medium',
        fix_effort: 'difficult',
        score_impact: 15
      });
    } else if (analysis.keywords.density[analysis.keywords.primary_keyword] > 3) {
      issues.push({
        category: 'Content',
        issue: 'Keyword density too high (over-optimization)',
        impact: 'medium',
        fix_effort: 'moderate',
        score_impact: 12
      });
    }
  }

  // Link issues (low-medium impact)
  if (analysis.links.score < 50) {
    if (analysis.links.internal_count < 3) {
      issues.push({
        category: 'Links',
        issue: 'Insufficient internal links',
        impact: 'low',
        fix_effort: 'moderate',
        score_impact: 8
      });
    }
    if (analysis.links.external_count === 0) {
      issues.push({
        category: 'Links',
        issue: 'No external links to authoritative sources',
        impact: 'low',
        fix_effort: 'moderate',
        score_impact: 6
      });
    }
  }

  // Image optimization issues (low impact)
  if (analysis.images.score < 60 && analysis.images.total_count > 0) {
    if (analysis.images.alt_text_percentage < 80) {
      issues.push({
        category: 'Images',
        issue: `${analysis.images.images_without_alt} images missing alt text`,
        impact: 'low',
        fix_effort: 'easy',
        score_impact: 8
      });
    }
  }

  // Sort by score impact (descending) and limit to top 8 issues
  return issues
    .sort((a, b) => b.score_impact - a.score_impact)
    .slice(0, 8);
}

export function getScoreInterpretation(score: SEOScore): string {
  const { overall_score, grade } = score;
  
  if (overall_score >= 90) {
    return "Excellent! Your page is well-optimized for search engines with strong technical SEO, content optimization, and meta data.";
  } else if (overall_score >= 80) {
    return "Good SEO foundation! Your page performs well but has room for improvement in some areas.";
  } else if (overall_score >= 70) {
    return "Fair SEO optimization. Several important areas need attention to improve search engine visibility.";
  } else if (overall_score >= 60) {
    return "Poor SEO optimization. Many critical issues need to be addressed to improve search rankings.";
  } else {
    return "Very poor SEO. Major optimization work is required across multiple areas to improve search engine performance.";
  }
}

export function getTopRecommendations(score: SEOScore): string[] {
  return score.priority_issues
    .filter(issue => issue.impact === 'high' || issue.score_impact >= 12)
    .map(issue => issue.issue)
    .slice(0, 5);
}

export function getCategoryInsights(categoryScores: CategoryScores): { [category: string]: string } {
  const insights: { [category: string]: string } = {};

  // Content insights
  if (categoryScores.content >= 80) {
    insights.content = "Content is well-optimized with good keyword usage.";
  } else if (categoryScores.content >= 60) {
    insights.content = "Content optimization needs improvement. Focus on keyword strategy.";
  } else {
    insights.content = "Content requires significant optimization. Consider keyword research and content restructuring.";
  }

  // Technical insights
  if (categoryScores.technical >= 80) {
    insights.technical = "Technical SEO is well-implemented.";
  } else if (categoryScores.technical >= 60) {
    insights.technical = "Some technical SEO elements are missing. Add structured data and improve meta tags.";
  } else {
    insights.technical = "Technical SEO needs major improvements. Focus on meta tags, canonical URLs, and structured data.";
  }

  // Meta insights
  if (categoryScores.meta >= 80) {
    insights.meta = "Title and meta description are well-optimized.";
  } else if (categoryScores.meta >= 60) {
    insights.meta = "Title or meta description needs optimization for length and keyword usage.";
  } else {
    insights.meta = "Critical meta elements are missing or poorly optimized. This significantly impacts search visibility.";
  }

  // Structure insights
  if (categoryScores.structure >= 80) {
    insights.structure = "Heading structure is logical and well-organized.";
  } else if (categoryScores.structure >= 60) {
    insights.structure = "Heading structure needs minor improvements for better hierarchy.";
  } else {
    insights.structure = "Heading structure is poor. Ensure single H1 and logical heading hierarchy.";
  }

  return insights;
}