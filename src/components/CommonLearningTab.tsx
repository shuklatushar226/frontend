import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  AcademicCapIcon,
  SparklesIcon,
  ArrowPathIcon,
  LightBulbIcon,
  ShieldCheckIcon,
  BeakerIcon,
  CodeBracketIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ClockIcon,
  CpuChipIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Types matching the backend
interface TechnicalPattern {
  pattern_name: string;
  description: string;
  frequency: number;
  examples: string[];
  impact: 'high' | 'medium' | 'low';
  category: string;
}

interface RLOptimization {
  optimization_type: string;
  description: string;
  implementation_approach: string;
  expected_benefits: string[];
  complexity: 'low' | 'medium' | 'high';
  priority: 'high' | 'medium' | 'low';
}

interface BestPractice {
  practice_name: string;
  description: string;
  implementation_guide: string;
  benefits: string[];
  adoption_rate: number;
  category: string;
}

interface PerformanceInsight {
  insight_type: string;
  description: string;
  performance_impact: string;
  implementation_effort: string;
  measurable_benefits: string[];
}

interface SecurityPattern {
  pattern_name: string;
  description: string;
  security_level: 'critical' | 'high' | 'medium' | 'low';
  implementation_steps: string[];
  common_vulnerabilities_prevented: string[];
}

interface TestingStrategy {
  strategy_name: string;
  description: string;
  test_types: string[];
  coverage_improvement: string;
  automation_potential: 'high' | 'medium' | 'low';
}

interface CommonLearning {
  insights: {
    technical_patterns: TechnicalPattern[];
    rl_optimizations: RLOptimization[];
    best_practices: BestPractice[];
    performance_insights: PerformanceInsight[];
    security_patterns: SecurityPattern[];
    testing_strategies: TestingStrategy[];
  };
  trends: {
    emerging_topics: string[];
    declining_issues: string[];
    hot_discussions: string[];
    pattern_evolution: { [key: string]: number };
  };
  recommendations: {
    immediate_actions: string[];
    long_term_improvements: string[];
    experimental_approaches: string[];
    priority_focus_areas: string[];
  };
  metadata: {
    analyzed_prs: number;
    total_comments: number;
    total_reviews: number;
    last_updated: string;
    confidence_score: number;
    analysis_timeframe: string;
  };
}

const CommonLearningTab: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('overview');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const queryClient = useQueryClient();

  // Fetch common learning data
  const { data: learning, isLoading, error, refetch } = useQuery<CommonLearning>({
    queryKey: ['common-learning'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/api/common-learning`);
      return response.data;
    },
    retry: false,
  });

  // Regenerate learning mutation
  const regenerateMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(`${API_BASE_URL}/api/common-learning/regenerate`);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['common-learning'], data);
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Helper function to get confidence color
  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-success-600 bg-success-50';
    if (score >= 0.6) return 'text-warning-600 bg-warning-50';
    return 'text-danger-600 bg-danger-50';
  };

  // Helper function to get confidence level
  const getConfidenceLevel = (score: number) => {
    if (score >= 0.8) return 'High';
    if (score >= 0.6) return 'Medium';
    return 'Low';
  };

  // Helper function to get impact color
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-danger-600 bg-danger-50 border-danger-200';
      case 'medium': return 'text-warning-600 bg-warning-50 border-warning-200';
      case 'low': return 'text-success-600 bg-success-50 border-success-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Helper function to get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-danger-600 bg-danger-50 border-danger-200';
      case 'medium': return 'text-warning-600 bg-warning-50 border-warning-200';
      case 'low': return 'text-primary-600 bg-primary-50 border-primary-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Helper function to get complexity color
  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'high': return 'text-danger-600 bg-danger-50 border-danger-200';
      case 'medium': return 'text-warning-600 bg-warning-50 border-warning-200';
      case 'low': return 'text-success-600 bg-success-50 border-success-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Helper function to get security level color
  const getSecurityLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-danger-600 bg-danger-50 border-danger-200';
      case 'medium': return 'text-warning-600 bg-warning-50 border-warning-200';
      case 'low': return 'text-success-600 bg-success-50 border-success-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Helper function to get automation potential color
  const getAutomationColor = (potential: string) => {
    switch (potential) {
      case 'high': return 'text-success-600 bg-success-50 border-success-200';
      case 'medium': return 'text-warning-600 bg-warning-50 border-warning-200';
      case 'low': return 'text-danger-600 bg-danger-50 border-danger-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const categories = [
    { id: 'overview', name: 'Overview', icon: AcademicCapIcon },
    { id: 'technical_patterns', name: 'Technical Patterns', icon: CodeBracketIcon },
    { id: 'rl_optimizations', name: 'RL Optimizations', icon: SparklesIcon },
    { id: 'best_practices', name: 'Best Practices', icon: LightBulbIcon },
    { id: 'performance_insights', name: 'Performance', icon: ArrowTrendingUpIcon },
    { id: 'security_patterns', name: 'Security', icon: ShieldCheckIcon },
    { id: 'testing_strategies', name: 'Testing', icon: BeakerIcon },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-dashboard flex items-center justify-center">
        <div className="text-center">
          <div className="spinner spinner-lg mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Generating Common Learning</h3>
          <p className="text-gray-600">Analyzing all PR discussions for insights...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const errorMessage = axios.isAxiosError(error) 
      ? error.response?.data?.message || error.response?.data?.error || error.message
      : 'Unknown error occurred';

    return (
      <div className="min-h-screen bg-gradient-dashboard">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <AcademicCapIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Common Learning</h2>
                    <p className="text-sm text-gray-500">AI-powered insights from all PRs</p>
                  </div>
                </div>
                <button
                  onClick={() => refetch()}
                  className="btn btn-primary"
                >
                  <AcademicCapIcon className="w-4 h-4 mr-2" />
                  Generate Insights
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="error-state">
                <div className="flex items-start space-x-3">
                  <ExclamationTriangleIcon className="w-5 h-5 text-danger-600 mt-0.5" />
                  <div>
                    <h3 className="error-title">Failed to generate common learning</h3>
                    <p className="error-message">{errorMessage}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!learning) {
    return (
      <div className="min-h-screen bg-gradient-dashboard">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <AcademicCapIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Common Learning</h2>
                    <p className="text-sm text-gray-500">AI-powered insights from all PRs</p>
                  </div>
                </div>
                <button
                  onClick={() => refetch()}
                  className="btn btn-primary"
                >
                  <AcademicCapIcon className="w-4 h-4 mr-2" />
                  Generate Insights
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="empty-state">
                <AcademicCapIcon className="empty-state-icon" />
                <h3 className="empty-state-title">No Common Learning Available</h3>
                <p className="empty-state-description">
                  Generate AI-powered insights from all connector PR discussions to discover patterns, best practices, and improvement opportunities.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const confidenceScore = learning.metadata.confidence_score;
  const confidencePercentage = Math.round(confidenceScore * 100);

  return (
    <div className="min-h-screen bg-gradient-dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Common Learning</h1>
              <div className="flex items-center space-x-4 mt-2">
                <p className="text-gray-600">
                  AI insights from {learning.metadata.analyzed_prs} PRs, {learning.metadata.total_comments} comments, {learning.metadata.total_reviews} reviews
                </p>
                <div className={`px-2 py-1 rounded-md text-xs font-medium ${getConfidenceColor(confidenceScore)}`}>
                  {getConfidenceLevel(confidenceScore)} Confidence ({confidencePercentage}%)
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-xs text-gray-500">Last Updated</div>
                <div className="text-xs font-medium text-gray-700">
                  {formatDate(learning.metadata.last_updated)}
                </div>
              </div>
              <button
                onClick={() => regenerateMutation.mutate()}
                disabled={regenerateMutation.isPending}
                className="btn btn-secondary"
              >
                {regenerateMutation.isPending ? (
                  <>
                    <div className="spinner spinner-sm mr-2"></div>
                    Regenerating...
                  </>
                ) : (
                  <>
                    <ArrowPathIcon className="w-4 h-4 mr-2" />
                    Regenerate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search insights..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <FunnelIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Filter by category:</span>
              </div>
            </div>
          </div>
        </div>

        {/* Category Navigation */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const Icon = category.icon;
                const isActive = activeCategory === category.id;
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-100 text-primary-700 border border-primary-200'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{category.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="space-y-8">
          {activeCategory === 'overview' && (
            <div className="space-y-8">
              {/* Overview Cards */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="metric-card">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                      <CodeBracketIcon className="w-4 h-4 text-primary-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Technical Patterns</h4>
                      <p className="text-sm text-gray-500">Common code patterns</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-primary-600">
                    {learning.insights.technical_patterns.length}
                  </p>
                </div>

                <div className="metric-card">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <SparklesIcon className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">RL Optimizations</h4>
                      <p className="text-sm text-gray-500">Enhancement opportunities</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">
                    {learning.insights.rl_optimizations.length}
                  </p>
                </div>

                <div className="metric-card">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center">
                      <LightBulbIcon className="w-4 h-4 text-success-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Best Practices</h4>
                      <p className="text-sm text-gray-500">Proven approaches</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-success-600">
                    {learning.insights.best_practices.length}
                  </p>
                </div>

                <div className="metric-card">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-warning-100 rounded-lg flex items-center justify-center">
                      <ShieldCheckIcon className="w-4 h-4 text-warning-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Security Patterns</h4>
                      <p className="text-sm text-gray-500">Security insights</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-warning-600">
                    {learning.insights.security_patterns.length}
                  </p>
                </div>
              </div>

              {/* Trends Section */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <ArrowTrendingUpIcon className="w-5 h-5 mr-2 text-primary-600" />
                    Current Trends
                  </h3>
                </div>
                <div className="card-body">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-semibold text-success-900 mb-3">🔥 Emerging Topics</h4>
                      <ul className="space-y-2">
                        {learning.trends.emerging_topics.map((topic, index) => (
                          <li key={index} className="text-success-800 text-sm">
                            • {topic}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary-900 mb-3">💬 Hot Discussions</h4>
                      <ul className="space-y-2">
                        {learning.trends.hot_discussions.map((discussion, index) => (
                          <li key={index} className="text-primary-800 text-sm">
                            • {discussion}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">📉 Declining Issues</h4>
                      <ul className="space-y-2">
                        {learning.trends.declining_issues.map((issue, index) => (
                          <li key={index} className="text-gray-700 text-sm">
                            • {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations Section */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <LightBulbIcon className="w-5 h-5 mr-2 text-warning-600" />
                    AI Recommendations
                  </h3>
                </div>
                <div className="card-body">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg">
                        <h4 className="font-semibold text-danger-900 mb-3">🚨 Immediate Actions</h4>
                        <ul className="space-y-2">
                          {learning.recommendations.immediate_actions.map((action, index) => (
                            <li key={index} className="text-danger-800 text-sm">
                              • {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
                        <h4 className="font-semibold text-primary-900 mb-3">🎯 Priority Focus Areas</h4>
                        <ul className="space-y-2">
                          {learning.recommendations.priority_focus_areas.map((area, index) => (
                            <li key={index} className="text-primary-800 text-sm">
                              • {area}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="p-4 bg-success-50 border border-success-200 rounded-lg">
                        <h4 className="font-semibold text-success-900 mb-3">📈 Long-term Improvements</h4>
                        <ul className="space-y-2">
                          {learning.recommendations.long_term_improvements.map((improvement, index) => (
                            <li key={index} className="text-success-800 text-sm">
                              • {improvement}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <h4 className="font-semibold text-purple-900 mb-3">🧪 Experimental Approaches</h4>
                        <ul className="space-y-2">
                          {learning.recommendations.experimental_approaches.map((approach, index) => (
                            <li key={index} className="text-purple-800 text-sm">
                              • {approach}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Technical Patterns */}
          {activeCategory === 'technical_patterns' && (
            <div className="space-y-6">
              {learning.insights.technical_patterns.length > 0 ? (
                learning.insights.technical_patterns.map((pattern, index) => (
                  <div key={index} className="card">
                    <div className="card-body">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{pattern.pattern_name}</h3>
                          <p className="text-gray-700 mb-3">{pattern.description}</p>
                        </div>
                        <div className="flex items-center space-x-3 ml-4">
                          <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getImpactColor(pattern.impact)}`}>
                            {pattern.impact} impact
                          </span>
                          <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            {pattern.frequency}% frequency
                          </span>
                        </div>
                      </div>
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Examples:</h4>
                        <ul className="space-y-1">
                          {pattern.examples.map((example, exIndex) => (
                            <li key={exIndex} className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                              • {example}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                        Category: {pattern.category}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="card">
                  <div className="card-body">
                    <div className="empty-state">
                      <CodeBracketIcon className="empty-state-icon" />
                      <h3 className="empty-state-title">No Technical Patterns Found</h3>
                      <p className="empty-state-description">
                        No technical patterns have been identified yet. Generate insights to discover common code patterns.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* RL Optimizations */}
          {activeCategory === 'rl_optimizations' && (
            <div className="space-y-6">
              {learning.insights.rl_optimizations.length > 0 ? (
                learning.insights.rl_optimizations.map((optimization, index) => (
                  <div key={index} className="card">
                    <div className="card-body">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{optimization.optimization_type}</h3>
                          <p className="text-gray-700 mb-3">{optimization.description}</p>
                        </div>
                        <div className="flex items-center space-x-3 ml-4">
                          <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getPriorityColor(optimization.priority)}`}>
                            {optimization.priority} priority
                          </span>
                          <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getComplexityColor(optimization.complexity)}`}>
                            {optimization.complexity} complexity
                          </span>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Implementation Approach:</h4>
                          <p className="text-sm text-gray-700 bg-primary-50 p-3 rounded">
                            {optimization.implementation_approach}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Expected Benefits:</h4>
                          <ul className="space-y-1">
                            {optimization.expected_benefits.map((benefit, bIndex) => (
                              <li key={bIndex} className="text-sm text-gray-700">
                                • {benefit}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="card">
                  <div className="card-body">
                    <div className="empty-state">
                      <SparklesIcon className="empty-state-icon" />
                      <h3 className="empty-state-title">No RL Optimizations Found</h3>
                      <p className="empty-state-description">
                        No reinforcement learning optimizations have been identified yet. Generate insights to discover enhancement opportunities.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Best Practices */}
          {activeCategory === 'best_practices' && (
            <div className="space-y-6">
              {learning.insights.best_practices.length > 0 ? (
                learning.insights.best_practices.map((practice, index) => (
                  <div key={index} className="card">
                    <div className="card-body">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{practice.practice_name}</h3>
                          <p className="text-gray-700 mb-3">{practice.description}</p>
                        </div>
                        <div className="flex items-center space-x-3 ml-4">
                          <span className="text-sm font-medium text-success-600 bg-success-100 px-2 py-1 rounded">
                            {practice.adoption_rate}% adoption
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {practice.category}
                          </span>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Implementation Guide:</h4>
                          <p className="text-sm text-gray-700 bg-success-50 p-3 rounded">
                            {practice.implementation_guide}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Benefits:</h4>
                          <ul className="space-y-1">
                            {practice.benefits.map((benefit, bIndex) => (
                              <li key={bIndex} className="text-sm text-gray-700">
                                • {benefit}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="card">
                  <div className="card-body">
                    <div className="empty-state">
                      <LightBulbIcon className="empty-state-icon" />
                      <h3 className="empty-state-title">No Best Practices Found</h3>
                      <p className="empty-state-description">
                        No best practices have been identified yet. Generate insights to discover proven approaches.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Performance Insights */}
          {activeCategory === 'performance_insights' && (
            <div className="space-y-6">
              {learning.insights.performance_insights.length > 0 ? (
                learning.insights.performance_insights.map((insight, index) => (
                  <div key={index} className="card">
                    <div className="card-body">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{insight.insight_type}</h3>
                          <p className="text-gray-700 mb-3">{insight.description}</p>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Performance Impact:</h4>
                          <p className="text-sm text-gray-700 bg-warning-50 p-3 rounded">
                            {insight.performance_impact}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Implementation Effort:</h4>
                          <p className="text-sm text-gray-700 bg-primary-50 p-3 rounded">
                            {insight.implementation_effort}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-900 mb-2">Measurable Benefits:</h4>
                        <ul className="space-y-1">
                          {insight.measurable_benefits.map((benefit, bIndex) => (
                            <li key={bIndex} className="text-sm text-gray-700">
                              • {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="card">
                  <div className="card-body">
                    <div className="empty-state">
                      <ArrowTrendingUpIcon className="empty-state-icon" />
                      <h3 className="empty-state-title">No Performance Insights Found</h3>
                      <p className="empty-state-description">
                        No performance insights have been identified yet. Generate insights to discover optimization opportunities.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Security Patterns */}
          {activeCategory === 'security_patterns' && (
            <div className="space-y-6">
              {learning.insights.security_patterns.length > 0 ? (
                learning.insights.security_patterns.map((pattern, index) => (
                  <div key={index} className="card">
                    <div className="card-body">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{pattern.pattern_name}</h3>
                          <p className="text-gray-700 mb-3">{pattern.description}</p>
                        </div>
                        <div className="flex items-center space-x-3 ml-4">
                          <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getSecurityLevelColor(pattern.security_level)}`}>
                            {pattern.security_level} security
                          </span>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Implementation Steps:</h4>
                          <ul className="space-y-1">
                            {pattern.implementation_steps.map((step, sIndex) => (
                              <li key={sIndex} className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                                {sIndex + 1}. {step}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Vulnerabilities Prevented:</h4>
                          <ul className="space-y-1">
                            {pattern.common_vulnerabilities_prevented.map((vuln, vIndex) => (
                              <li key={vIndex} className="text-sm text-gray-700">
                                • {vuln}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="card">
                  <div className="card-body">
                    <div className="empty-state">
                      <ShieldCheckIcon className="empty-state-icon" />
                      <h3 className="empty-state-title">No Security Patterns Found</h3>
                      <p className="empty-state-description">
                        No security patterns have been identified yet. Generate insights to discover security best practices.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Testing Strategies */}
          {activeCategory === 'testing_strategies' && (
            <div className="space-y-6">
              {learning.insights.testing_strategies.length > 0 ? (
                learning.insights.testing_strategies.map((strategy, index) => (
                  <div key={index} className="card">
                    <div className="card-body">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{strategy.strategy_name}</h3>
                          <p className="text-gray-700 mb-3">{strategy.description}</p>
                        </div>
                        <div className="flex items-center space-x-3 ml-4">
                          <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getAutomationColor(strategy.automation_potential)}`}>
                            {strategy.automation_potential} automation
                          </span>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Test Types:</h4>
                          <div className="flex flex-wrap gap-2">
                            {strategy.test_types.map((type, tIndex) => (
                              <span key={tIndex} className="text-xs font-medium text-primary-600 bg-primary-100 px-2 py-1 rounded">
                                {type}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Coverage Improvement:</h4>
                          <p className="text-sm text-gray-700 bg-success-50 p-3 rounded">
                            {strategy.coverage_improvement}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="card">
                  <div className="card-body">
                    <div className="empty-state">
                      <BeakerIcon className="empty-state-icon" />
                      <h3 className="empty-state-title">No Testing Strategies Found</h3>
                      <p className="empty-state-description">
                        No testing strategies have been identified yet. Generate insights to discover effective testing approaches.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <CpuChipIcon className="w-3 h-3" />
                <span>Analysis Timeframe: {learning.metadata.analysis_timeframe}</span>
              </div>
              <div className="flex items-center space-x-1">
                <InformationCircleIcon className="w-3 h-3" />
                <span>Confidence: {confidencePercentage}%</span>
              </div>
            </div>
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <ClockIcon className="w-3 h-3" />
              <span>Last updated {formatDate(learning.metadata.last_updated)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommonLearningTab;
