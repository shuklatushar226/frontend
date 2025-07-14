import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ClockIcon,
  SparklesIcon,
  CodeBracketIcon,
  SignalIcon,
  PencilIcon,
  QuestionMarkCircleIcon,
  CheckBadgeIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Types matching the backend
interface CategorizedComment {
  comment_id: number;
  content: string;
  author: string;
  created_at: string;
  file_path?: string;
  line_number?: number;
  category: 'reusability' | 'rust_best_practices' | 'status_mapping' | 'typos' | 'unclassified';
  confidence_score: number;
  reasoning: string;
}

interface PRCommentCategorization {
  pr_number: number;
  pr_title: string;
  pr_author: string;
  categories: {
    reusability: CategorizedComment[];
    rust_best_practices: CategorizedComment[];
    status_mapping: CategorizedComment[];
    typos: CategorizedComment[];
    unclassified: CategorizedComment[];
  };
  summary: {
    total_comments: number;
    reusability_count: number;
    rust_best_practices_count: number;
    status_mapping_count: number;
    typos_count: number;
    unclassified_count: number;
    avg_confidence: number;
  };
}

interface CommentCategorizationResponse {
  pr_categorizations: PRCommentCategorization[];
  overall_summary: {
    total_prs_analyzed: number;
    total_comments_categorized: number;
    category_distribution: {
      reusability: number;
      rust_best_practices: number;
      status_mapping: number;
      typos: number;
      unclassified: number;
    };
    avg_confidence_score: number;
  };
  metadata: {
    generated_at: string;
    model_used: string;
    analysis_scope: string;
  };
  cache_info?: {
    from_cache: boolean;
    generated_at: string;
    expires_at: string;
    cache_age_minutes: number;
  };
}

const PRCommentCategorizationTable: React.FC = () => {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  // Helper function to get cached data from localStorage
  const getCachedData = (): CommentCategorizationResponse | undefined => {
    try {
      const cached = localStorage.getItem('comment-categorization-cache');
      if (cached) {
        const parsedCache = JSON.parse(cached);
        // Check if cache is still valid (24 hours)
        const cacheAge = Date.now() - new Date(parsedCache.timestamp).getTime();
        if (cacheAge < 24 * 60 * 60 * 1000) {
          return parsedCache.data as CommentCategorizationResponse;
        }
      }
    } catch (error) {
      console.error('Error reading cached data:', error);
    }
    return undefined;
  };

  // Helper function to save data to localStorage
  const saveCachedData = (data: CommentCategorizationResponse) => {
    try {
      const cacheEntry = {
        data,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('comment-categorization-cache', JSON.stringify(cacheEntry));
    } catch (error) {
      console.error('Error saving cached data:', error);
    }
  };

  // Fetch categorization data with caching
  const { data: categorization, isLoading, error, refetch } = useQuery({
    queryKey: ['comment-categorization'],
    queryFn: async (): Promise<CommentCategorizationResponse> => {
      const response = await axios.get(`${API_BASE_URL}/api/analytics/comment-categorization`);
      
      // Save fresh data to localStorage
      saveCachedData(response.data);
      
      return response.data;
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes - keep in React Query cache for 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
    initialData: getCachedData, // Use cached data immediately if available
  });

  // Check if we're showing cached data
  const isFromCache = categorization?.cache_info?.from_cache || false;
  const cacheAge = categorization?.cache_info?.cache_age_minutes || 0;

  const toggleRowExpansion = (prNumber: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(prNumber)) {
      newExpanded.delete(prNumber);
    } else {
      newExpanded.add(prNumber);
    }
    setExpandedRows(newExpanded);
  };

  const toggleCommentExpansion = (commentKey: string) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(commentKey)) {
      newExpanded.delete(commentKey);
    } else {
      newExpanded.add(commentKey);
    }
    setExpandedComments(newExpanded);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'reusability':
        return <CodeBracketIcon className="w-4 h-4" />;
      case 'rust_best_practices':
        return <CheckBadgeIcon className="w-4 h-4" />;
      case 'status_mapping':
        return <SignalIcon className="w-4 h-4" />;
      case 'typos':
        return <PencilIcon className="w-4 h-4" />;
      case 'unclassified':
        return <QuestionMarkCircleIcon className="w-4 h-4" />;
      default:
        return <ChatBubbleLeftRightIcon className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'reusability':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'rust_best_practices':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'status_mapping':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'typos':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'unclassified':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatCategoryName = (category: string) => {
    switch (category) {
      case 'reusability':
        return 'Reusability';
      case 'rust_best_practices':
        return 'Rust Best Practices';
      case 'status_mapping':
        return 'Status Mapping';
      case 'typos':
        return 'Typos';
      case 'unclassified':
        return 'Unclassified';
      default:
        return category;
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Comment Categorization</h2>
              <p className="text-sm text-gray-500">AI-powered comment analysis by category</p>
            </div>
          </div>
        </div>
        <div className="card-body">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="spinner spinner-lg mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Analyzing Comments</h3>
              <p className="text-gray-600">Categorizing PR comments using AI...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    const errorMessage = axios.isAxiosError(error) 
      ? error.response?.data?.message || error.response?.data?.error || error.message
      : 'Unknown error occurred';

    return (
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <ChatBubbleLeftRightIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Comment Categorization</h2>
                <p className="text-sm text-gray-500">AI-powered comment analysis by category</p>
              </div>
            </div>
            <button
              onClick={() => refetch()}
              className="btn btn-primary"
            >
              <SparklesIcon className="w-4 h-4 mr-2" />
              Generate Analysis
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="error-state">
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-danger-600 mt-0.5" />
              <div>
                <h3 className="error-title">Failed to generate categorization</h3>
                <p className="error-message">{errorMessage}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!categorization) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <ChatBubbleLeftRightIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Comment Categorization</h2>
                <p className="text-sm text-gray-500">AI-powered comment analysis by category</p>
              </div>
            </div>
            <button
              onClick={() => refetch()}
              className="btn btn-primary"
            >
              <SparklesIcon className="w-4 h-4 mr-2" />
              Generate Analysis
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="empty-state">
            <ChatBubbleLeftRightIcon className="empty-state-icon" />
            <h3 className="empty-state-title">No Comment Analysis Available</h3>
            <p className="empty-state-description">
              Generate an AI-powered categorization to see how PR comments are distributed across different categories.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const filteredPRs = selectedCategory === 'all' 
    ? categorization.pr_categorizations
    : categorization.pr_categorizations.filter(pr => {
        const categoryKey = selectedCategory as keyof typeof pr.categories;
        return pr.categories[categoryKey]?.length > 0;
      });

  return (
    <div className="space-y-6">
      {/* Header with Summary */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <ChatBubbleLeftRightIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Comment Categorization</h2>
                <div className="flex items-center space-x-3 mt-1">
                  <p className="text-sm text-gray-500">AI-powered comment analysis by category</p>
                  <div className={`px-2 py-1 rounded-md text-xs font-medium ${getConfidenceColor(categorization.overall_summary.avg_confidence_score)}`}>
                    {Math.round(categorization.overall_summary.avg_confidence_score * 100)}% Confidence
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-xs text-gray-500">Generated</div>
                <div className="text-xs font-medium text-gray-700">
                  {formatDate(categorization.metadata.generated_at)}
                </div>
              </div>
              <button
                onClick={() => refetch()}
                disabled={isLoading}
                className="btn btn-secondary"
              >
                <ArrowPathIcon className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="card-body">
          <div className="flex flex-wrap justify-center md:justify-between items-center gap-6 md:gap-8">
            <div className="flex flex-col items-center">
              <div className="text-2xl font-bold text-indigo-600">{categorization.overall_summary.total_prs_analyzed}</div>
              <div className="text-xs text-gray-600 whitespace-nowrap">PRs Analyzed</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-2xl font-bold text-green-600">{categorization.overall_summary.total_comments_categorized}</div>
              <div className="text-xs text-gray-600 whitespace-nowrap">Comments</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-2xl font-bold text-blue-600">{categorization.overall_summary.category_distribution.reusability}</div>
              <div className="text-xs text-gray-600 whitespace-nowrap">Reusability</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-2xl font-bold text-orange-600">{categorization.overall_summary.category_distribution.rust_best_practices}</div>
              <div className="text-xs text-gray-600 whitespace-nowrap">Rust Practices</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-2xl font-bold text-green-600">{categorization.overall_summary.category_distribution.status_mapping}</div>
              <div className="text-xs text-gray-600 whitespace-nowrap">Status Mapping</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-2xl font-bold text-purple-600">{categorization.overall_summary.category_distribution.typos}</div>
              <div className="text-xs text-gray-600 whitespace-nowrap">Typos</div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center space-x-4">
        <label className="text-sm font-medium text-gray-700">Filter by category:</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="all">All Categories</option>
          <option value="reusability">Reusability</option>
          <option value="rust_best_practices">Rust Best Practices</option>
          <option value="status_mapping">Status Mapping</option>
          <option value="typos">Typos</option>
          <option value="unclassified">Unclassified</option>
        </select>
        <div className="text-sm text-gray-500">
          Showing {filteredPRs.length} of {categorization.pr_categorizations.length} PRs
        </div>
      </div>

      {/* Main Table */}
      <div className="card">
        <div className="card-body overflow-x-auto">
          {filteredPRs.length === 0 ? (
            <div className="empty-state">
              <QuestionMarkCircleIcon className="empty-state-icon" />
              <h3 className="empty-state-title">No PRs Found</h3>
              <p className="empty-state-description">
                No PRs match the selected category filter.
              </p>
            </div>
          ) : (
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PR</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Reusability</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Rust Practices</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status Mapping</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Typos</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Unclassified</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPRs.map((pr) => (
                  <React.Fragment key={pr.pr_number}>
                    {/* Main Row */}
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => toggleRowExpansion(pr.pr_number)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                          >
                            {expandedRows.has(pr.pr_number) ? (
                              <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                            ) : (
                              <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              PR #{pr.pr_number}
                            </div>
                            <div className="text-sm text-gray-600 max-w-md truncate">
                              {pr.pr_title}
                            </div>
                            <div className="text-xs text-gray-500">
                              by {pr.pr_author}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          pr.summary.reusability_count > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {pr.summary.reusability_count}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          pr.summary.rust_best_practices_count > 0 ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {pr.summary.rust_best_practices_count}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          pr.summary.status_mapping_count > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {pr.summary.status_mapping_count}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          pr.summary.typos_count > 0 ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {pr.summary.typos_count}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          pr.summary.unclassified_count > 0 ? 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {pr.summary.unclassified_count}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {pr.summary.total_comments}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getConfidenceColor(pr.summary.avg_confidence)}`}>
                          {Math.round(pr.summary.avg_confidence * 100)}%
                        </span>
                      </td>
                    </tr>

                    {/* Expanded Row */}
                    {expandedRows.has(pr.pr_number) && (
                      <tr>
                        <td colSpan={8} className="px-4 py-6 bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {Object.entries(pr.categories).map(([category, categoryComments]) => {
                              if (categoryComments.length === 0) return null;
                              
                              return (
                                <div key={category} className="bg-white rounded-lg p-4 border border-gray-200 h-fit">
                                  <div className={`flex items-center space-x-2 mb-4 px-3 py-2 rounded-lg border ${getCategoryColor(category)}`}>
                                    {getCategoryIcon(category)}
                                    <h4 className="font-semibold text-sm">
                                      {formatCategoryName(category)} ({categoryComments.length})
                                    </h4>
                                  </div>
                                  <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {categoryComments.map((comment) => {
                                      const commentKey = `${pr.pr_number}-${comment.comment_id}`;
                                      const isExpanded = expandedComments.has(commentKey);
                                      
                                      return (
                                        <div key={comment.comment_id} className="border border-gray-200 rounded-lg p-3">
                                          <div className="flex items-start justify-between mb-2">
                                            <div className="flex flex-col space-y-1 min-w-0 flex-1">
                                              <div className="flex items-center space-x-2">
                                                <div className="text-sm font-medium text-gray-900 truncate">
                                                  {comment.author}
                                                </div>
                                                <div className="text-xs text-gray-500 flex-shrink-0">
                                                  {formatDate(comment.created_at)}
                                                </div>
                                              </div>
                                              {comment.file_path && (
                                                <div className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded truncate">
                                                  {comment.file_path}{comment.line_number ? `:${comment.line_number}` : ''}
                                                </div>
                                              )}
                                            </div>
                                            <div className="flex items-center space-x-2 flex-shrink-0">
                                              <span className={`px-2 py-1 rounded text-xs font-medium ${getConfidenceColor(comment.confidence_score)}`}>
                                                {Math.round(comment.confidence_score * 100)}%
                                              </span>
                                              <button
                                                onClick={() => toggleCommentExpansion(commentKey)}
                                                className="text-gray-400 hover:text-gray-600"
                                              >
                                                {isExpanded ? (
                                                  <ChevronDownIcon className="w-4 h-4" />
                                                ) : (
                                                  <ChevronRightIcon className="w-4 h-4" />
                                                )}
                                              </button>
                                            </div>
                                          </div>
                                          
                                          <div className={`text-sm text-gray-800 ${!isExpanded ? 'line-clamp-2' : ''}`}>
                                            {comment.content}
                                          </div>
                                          
                                          {isExpanded && (
                                            <div className="mt-3 pt-3 border-t border-gray-100">
                                              <div className="text-xs text-gray-600">
                                                <span className="font-medium">AI Reasoning:</span> {comment.reasoning}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default PRCommentCategorizationTable;
