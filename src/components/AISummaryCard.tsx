import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  SparklesIcon,
  DocumentTextIcon,
  WrenchScrewdriverIcon,
  LightBulbIcon,
  CheckCircleIcon,
  ChartBarIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ClockIcon,
  CpuChipIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Types matching the backend
interface TechnicalFeedback {
  category: string;
  description: string;
  file_path?: string;
  line_number?: number;
  severity: 'high' | 'medium' | 'low';
  reviewer: string;
}

interface RLInsights {
  current_approach_analysis: string;
  improvement_opportunities: string[];
  risk_assessment: string;
  recommended_experiments: string[];
}

interface ActionItem {
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimated_effort: string;
  blocking: boolean;
  assigned_to?: string;
}

interface SentimentAnalysis {
  overall_tone: 'positive' | 'neutral' | 'negative';
  reviewer_confidence: 'high' | 'medium' | 'low';
  consensus_level: 'strong' | 'moderate' | 'weak';
}

interface PRSummary {
  summary: {
    executive: string;
    technical_feedback: TechnicalFeedback[];
    rl_insights: RLInsights;
    action_items: ActionItem[];
    sentiment_analysis: SentimentAnalysis;
  };
  metadata: {
    generated_at: string;
    model_used: string;
    token_usage: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
    confidence_score: number;
    analysis_strategy?: {
      type: 'human_discussion' | 'code_only' | 'hybrid';
      human_comments: number;
      bot_comments: number;
      human_reviews: number;
      bot_reviews: number;
      confidence_level: 'high' | 'medium' | 'low';
    };
  };
}

interface AISummaryCardProps {
  prNumber: number;
}

const AISummaryCard: React.FC<AISummaryCardProps> = ({ prNumber }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['executive']));
  const queryClient = useQueryClient();

  // Fetch summary
  const { data: summary, isLoading, error, refetch } = useQuery<PRSummary>({
    queryKey: ['summary', prNumber],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/api/prs/${prNumber}/summary`);
      return response.data;
    },
    retry: false,
  });

  // Regenerate summary mutation
  const regenerateMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(`${API_BASE_URL}/api/prs/${prNumber}/summary/regenerate`);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['summary', prNumber], data);
    },
  });

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };


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

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <SparklesIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">AI Summary</h2>
                <p className="text-sm text-gray-500">Powered by Gemini AI</p>
              </div>
            </div>
          </div>
        </div>
        <div className="card-body">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="spinner spinner-lg mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Generating AI Summary</h3>
              <p className="text-gray-600">Analyzing PR content and reviews...</p>
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
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <SparklesIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">AI Summary</h2>
                <p className="text-sm text-gray-500">Powered by Gemini AI</p>
              </div>
            </div>
            <button
              onClick={() => refetch()}
              className="btn btn-primary"
            >
              <SparklesIcon className="w-4 h-4 mr-2" />
              Generate Summary
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="error-state">
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-danger-600 mt-0.5" />
              <div>
                <h3 className="error-title">Failed to generate summary</h3>
                <p className="error-message">{errorMessage}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <SparklesIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">AI Summary</h2>
                <p className="text-sm text-gray-500">Powered by Gemini AI</p>
              </div>
            </div>
            <button
              onClick={() => refetch()}
              className="btn btn-primary"
            >
              <SparklesIcon className="w-4 h-4 mr-2" />
              Generate Summary
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="empty-state">
            <SparklesIcon className="empty-state-icon" />
            <h3 className="empty-state-title">No AI Summary Available</h3>
            <p className="empty-state-description">
              Generate an AI-powered summary to get insights into this PR's technical feedback, action items, and sentiment analysis.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const confidenceScore = summary.metadata.confidence_score;
  const confidencePercentage = Math.round(confidenceScore * 100);

  return (
    <div className="card">
      {/* Professional Header */}
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">AI Summary</h2>
              <div className="flex items-center space-x-3 mt-1">
                <p className="text-sm text-gray-500">Powered by Gemini AI</p>
                <div className={`px-2 py-1 rounded-md text-xs font-medium ${getConfidenceColor(confidenceScore)}`}>
                  {getConfidenceLevel(confidenceScore)} Confidence ({confidencePercentage}%)
                </div>
                {summary.metadata.analysis_strategy && (
                  <div className={`px-2 py-1 rounded-md text-xs font-medium border ${
                    summary.metadata.analysis_strategy.type === 'human_discussion' ? 'text-primary-600 bg-primary-50 border-primary-200' :
                    summary.metadata.analysis_strategy.type === 'code_only' ? 'text-warning-600 bg-warning-50 border-warning-200' :
                    'text-purple-600 bg-purple-50 border-purple-200'
                  }`}>
                    {summary.metadata.analysis_strategy.type === 'human_discussion' ? '💬 Discussion Analysis' :
                     summary.metadata.analysis_strategy.type === 'code_only' ? '🔍 Code Analysis' :
                     '🔄 Hybrid Analysis'}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-xs text-gray-500">Generated</div>
              <div className="text-xs font-medium text-gray-700">
                {formatDate(summary.metadata.generated_at)}
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

      <div className="card-body space-y-6">
        {/* Analysis Statistics */}
        {summary.metadata.analysis_strategy && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Analysis Details</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-lg font-bold text-primary-600">{summary.metadata.analysis_strategy.human_comments}</div>
                <div className="text-gray-600">👥 Human Comments</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-success-600">{summary.metadata.analysis_strategy.human_reviews}</div>
                <div className="text-gray-600">✅ Human Reviews</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-500">{summary.metadata.analysis_strategy.bot_comments}</div>
                <div className="text-gray-600">🤖 Bot Comments (filtered)</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-500">{summary.metadata.analysis_strategy.bot_reviews}</div>
                <div className="text-gray-600">🤖 Bot Reviews (filtered)</div>
              </div>
            </div>
          </div>
        )}

        {/* Executive Summary */}
        <div>
          <button
            onClick={() => toggleSection('executive')}
            className="flex items-center justify-between w-full text-left group hover:bg-gray-50 p-3 rounded-lg transition-colors"
          >
            <div className="flex items-center space-x-3">
              <DocumentTextIcon className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">Executive Summary</h3>
            </div>
            {expandedSections.has('executive') ? (
              <ChevronDownIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
            ) : (
              <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
            )}
          </button>
          {expandedSections.has('executive') && (
            <div className="mt-4 p-6 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl border border-primary-200">
              <p className="text-gray-800 leading-relaxed">{summary.summary.executive}</p>
            </div>
          )}
        </div>

        {/* Technical Feedback */}
        {summary.summary.technical_feedback.length > 0 && (
          <div>
            <button
              onClick={() => toggleSection('technical')}
              className="flex items-center justify-between w-full text-left group hover:bg-gray-50 p-3 rounded-lg transition-colors"
            >
              <div className="flex items-center space-x-3">
                <WrenchScrewdriverIcon className="w-5 h-5 text-warning-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Technical Feedback
                  <span className="ml-2 px-2 py-1 bg-warning-100 text-warning-700 rounded-md text-sm font-medium">
                    {summary.summary.technical_feedback.length}
                  </span>
                </h3>
              </div>
              {expandedSections.has('technical') ? (
                <ChevronDownIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
              ) : (
                <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
              )}
            </button>
            {expandedSections.has('technical') && (
              <div className="mt-4 space-y-4">
                {summary.summary.technical_feedback.map((feedback, index) => (
                  <div key={index} className="card">
                    <div className="card-body">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-md">
                            {feedback.category}
                          </span>
                          <span className={`status-badge ${
                            feedback.severity === 'high' ? 'status-danger' :
                            feedback.severity === 'medium' ? 'status-warning' : 'status-success'
                          }`}>
                            {feedback.severity} severity
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                          by {feedback.reviewer}
                        </span>
                      </div>
                      <p className="text-gray-800 mb-3 leading-relaxed">{feedback.description}</p>
                      {feedback.file_path && (
                        <div className="bg-gray-100 border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center space-x-2 text-sm text-gray-600 font-mono">
                            <InformationCircleIcon className="w-4 h-4" />
                            <span>{feedback.file_path}{feedback.line_number ? `:${feedback.line_number}` : ''}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RL Insights */}
        <div>
          <button
            onClick={() => toggleSection('rl_insights')}
            className="flex items-center justify-between w-full text-left group hover:bg-gray-50 p-3 rounded-lg transition-colors"
          >
            <div className="flex items-center space-x-3">
              <LightBulbIcon className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">RL Enhancement Insights</h3>
            </div>
            {expandedSections.has('rl_insights') ? (
              <ChevronDownIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
            ) : (
              <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
            )}
          </button>
          {expandedSections.has('rl_insights') && (
            <div className="mt-4 space-y-4">
              {summary.summary.rl_insights.current_approach_analysis && (
                <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-3 flex items-center">
                    <CpuChipIcon className="w-4 h-4 mr-2" />
                    Current Approach Analysis
                  </h4>
                  <p className="text-purple-800 leading-relaxed">{summary.summary.rl_insights.current_approach_analysis}</p>
                </div>
              )}
              
              {summary.summary.rl_insights.improvement_opportunities.length > 0 && (
                <div className="p-6 bg-gradient-to-br from-success-50 to-success-100 rounded-xl border border-success-200">
                  <h4 className="font-semibold text-success-900 mb-3 flex items-center">
                    <LightBulbIcon className="w-4 h-4 mr-2" />
                    Improvement Opportunities
                  </h4>
                  <ul className="space-y-2">
                    {summary.summary.rl_insights.improvement_opportunities.map((opportunity, index) => (
                      <li key={index} className="flex items-start space-x-2 text-success-800">
                        <CheckCircleIcon className="w-4 h-4 mt-0.5 text-success-600" />
                        <span className="leading-relaxed">{opportunity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {summary.summary.rl_insights.risk_assessment && (
                <div className="p-6 bg-gradient-to-br from-warning-50 to-warning-100 rounded-xl border border-warning-200">
                  <h4 className="font-semibold text-warning-900 mb-3 flex items-center">
                    <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
                    Risk Assessment
                  </h4>
                  <p className="text-warning-800 leading-relaxed">{summary.summary.rl_insights.risk_assessment}</p>
                </div>
              )}
              
              {summary.summary.rl_insights.recommended_experiments.length > 0 && (
                <div className="p-6 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl border border-primary-200">
                  <h4 className="font-semibold text-primary-900 mb-3 flex items-center">
                    <SparklesIcon className="w-4 h-4 mr-2" />
                    Recommended Experiments
                  </h4>
                  <ul className="space-y-2">
                    {summary.summary.rl_insights.recommended_experiments.map((experiment, index) => (
                      <li key={index} className="flex items-start space-x-2 text-primary-800">
                        <InformationCircleIcon className="w-4 h-4 mt-0.5 text-primary-600" />
                        <span className="leading-relaxed">{experiment}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Items */}
        {summary.summary.action_items.length > 0 && (
          <div>
            <button
              onClick={() => toggleSection('action_items')}
              className="flex items-center justify-between w-full text-left group hover:bg-gray-50 p-3 rounded-lg transition-colors"
            >
              <div className="flex items-center space-x-3">
                <CheckCircleIcon className="w-5 h-5 text-success-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Action Items
                  <span className="ml-2 px-2 py-1 bg-success-100 text-success-700 rounded-md text-sm font-medium">
                    {summary.summary.action_items.length}
                  </span>
                </h3>
              </div>
              {expandedSections.has('action_items') ? (
                <ChevronDownIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
              ) : (
                <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
              )}
            </button>
            {expandedSections.has('action_items') && (
              <div className="mt-4 space-y-4">
                {summary.summary.action_items.map((item, index) => (
                  <div key={index} className="card">
                    <div className="card-body">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className={`status-badge ${
                            item.priority === 'high' ? 'status-danger' :
                            item.priority === 'medium' ? 'status-warning' : 'status-primary'
                          }`}>
                            {item.priority} priority
                          </span>
                          {item.blocking && (
                            <span className="status-badge status-danger">
                              BLOCKING
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Effort</div>
                          <div className="text-xs font-medium text-gray-700">{item.estimated_effort}</div>
                        </div>
                      </div>
                      <p className="text-gray-800 mb-3 leading-relaxed">{item.description}</p>
                      {item.assigned_to && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <ClockIcon className="w-4 h-4" />
                          <span>Assigned to: <span className="font-medium">{item.assigned_to}</span></span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sentiment Analysis */}
        <div>
          <button
            onClick={() => toggleSection('sentiment')}
            className="flex items-center justify-between w-full text-left group hover:bg-gray-50 p-3 rounded-lg transition-colors"
          >
            <div className="flex items-center space-x-3">
              <ChartBarIcon className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Sentiment Analysis</h3>
            </div>
            {expandedSections.has('sentiment') ? (
              <ChevronDownIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
            ) : (
              <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
            )}
          </button>
          {expandedSections.has('sentiment') && (
            <div className="mt-4 grid md:grid-cols-3 gap-4">
              <div className="metric-card">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    summary.summary.sentiment_analysis.overall_tone === 'positive' ? 'bg-success-100' :
                    summary.summary.sentiment_analysis.overall_tone === 'negative' ? 'bg-danger-100' : 'bg-gray-100'
                  }`}>
                    <ChartBarIcon className={`w-4 h-4 ${
                      summary.summary.sentiment_analysis.overall_tone === 'positive' ? 'text-success-600' :
                      summary.summary.sentiment_analysis.overall_tone === 'negative' ? 'text-danger-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Overall Tone</h4>
                    <p className="text-sm text-gray-500">Review sentiment</p>
                  </div>
                </div>
                <p className={`text-lg font-semibold capitalize ${
                  summary.summary.sentiment_analysis.overall_tone === 'positive' ? 'text-success-600' :
                  summary.summary.sentiment_analysis.overall_tone === 'negative' ? 'text-danger-600' : 'text-gray-600'
                }`}>
                  {summary.summary.sentiment_analysis.overall_tone}
                </p>
              </div>

              <div className="metric-card">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                    <CheckCircleIcon className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Reviewer Confidence</h4>
                    <p className="text-sm text-gray-500">Confidence level</p>
                  </div>
                </div>
                <p className="text-lg font-semibold text-primary-600 capitalize">
                  {summary.summary.sentiment_analysis.reviewer_confidence}
                </p>
              </div>

              <div className="metric-card">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <InformationCircleIcon className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Consensus Level</h4>
                    <p className="text-sm text-gray-500">Agreement level</p>
                  </div>
                </div>
                <p className="text-lg font-semibold text-purple-600 capitalize">
                  {summary.summary.sentiment_analysis.consensus_level}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Professional Footer */}
      <div className="card-footer">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <CpuChipIcon className="w-3 h-3" />
              <span>Model: {summary.metadata.model_used}</span>
            </div>
            <div className="flex items-center space-x-1">
              <InformationCircleIcon className="w-3 h-3" />
              <span>Tokens: {summary.metadata.token_usage.total_tokens.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <ClockIcon className="w-3 h-3" />
            <span>Generated {formatDate(summary.metadata.generated_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISummaryCard;
