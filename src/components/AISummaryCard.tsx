import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

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

  const getSeverityColor = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getToneColor = (tone: 'positive' | 'neutral' | 'negative') => {
    switch (tone) {
      case 'positive': return 'text-green-600 bg-green-50';
      case 'neutral': return 'text-gray-600 bg-gray-50';
      case 'negative': return 'text-red-600 bg-red-50';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            🤖 AI Summary
          </h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-gray-600">Generating AI summary...</span>
        </div>
      </div>
    );
  }

  if (error) {
    const errorMessage = axios.isAxiosError(error) 
      ? error.response?.data?.message || error.response?.data?.error || error.message
      : 'Unknown error occurred';

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            🤖 AI Summary
          </h2>
          <button
            onClick={() => refetch()}
            className="btn btn-primary text-sm"
          >
            Generate Summary
          </button>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-red-600 mr-2">⚠️</span>
            <div>
              <p className="text-red-800 font-medium">Failed to generate summary</p>
              <p className="text-red-600 text-sm mt-1">{errorMessage}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            🤖 AI Summary
          </h2>
          <button
            onClick={() => refetch()}
            className="btn btn-primary text-sm"
          >
            Generate Summary
          </button>
        </div>
        <div className="text-center py-8 text-gray-500">
          <p>No AI summary available for this PR.</p>
          <p className="text-sm mt-1">Click "Generate Summary" to create one.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          🤖 AI Summary
          <span className="ml-2 text-sm font-normal text-gray-500">
            (Confidence: {Math.round(summary.metadata.confidence_score * 100)}%)
          </span>
        </h2>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">
            Generated {formatDate(summary.metadata.generated_at)}
          </span>
          <button
            onClick={() => regenerateMutation.mutate()}
            disabled={regenerateMutation.isPending}
            className="btn btn-secondary text-sm"
          >
            {regenerateMutation.isPending ? 'Regenerating...' : 'Regenerate'}
          </button>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('executive')}
          className="flex items-center justify-between w-full text-left"
        >
          <h3 className="text-lg font-medium text-gray-900">📋 Executive Summary</h3>
          <span className="text-gray-400">
            {expandedSections.has('executive') ? '−' : '+'}
          </span>
        </button>
        {expandedSections.has('executive') && (
          <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-gray-800">{summary.summary.executive}</p>
          </div>
        )}
      </div>

      {/* Technical Feedback */}
      {summary.summary.technical_feedback.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => toggleSection('technical')}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="text-lg font-medium text-gray-900">
              🔧 Technical Feedback ({summary.summary.technical_feedback.length})
            </h3>
            <span className="text-gray-400">
              {expandedSections.has('technical') ? '−' : '+'}
            </span>
          </button>
          {expandedSections.has('technical') && (
            <div className="mt-3 space-y-3">
              {summary.summary.technical_feedback.map((feedback, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">{feedback.category}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(feedback.severity)}`}>
                        {feedback.severity}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">by {feedback.reviewer}</span>
                  </div>
                  <p className="text-gray-800 mb-2">{feedback.description}</p>
                  {feedback.file_path && (
                    <div className="text-xs text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded">
                      📁 {feedback.file_path}{feedback.line_number ? `:${feedback.line_number}` : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* RL Insights */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('rl_insights')}
          className="flex items-center justify-between w-full text-left"
        >
          <h3 className="text-lg font-medium text-gray-900">🧠 RL Enhancement Insights</h3>
          <span className="text-gray-400">
            {expandedSections.has('rl_insights') ? '−' : '+'}
          </span>
        </button>
        {expandedSections.has('rl_insights') && (
          <div className="mt-3 space-y-4">
            {summary.summary.rl_insights.current_approach_analysis && (
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-medium text-purple-900 mb-2">Current Approach Analysis</h4>
                <p className="text-purple-800">{summary.summary.rl_insights.current_approach_analysis}</p>
              </div>
            )}
            
            {summary.summary.rl_insights.improvement_opportunities.length > 0 && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-900 mb-2">Improvement Opportunities</h4>
                <ul className="list-disc list-inside space-y-1">
                  {summary.summary.rl_insights.improvement_opportunities.map((opportunity, index) => (
                    <li key={index} className="text-green-800">{opportunity}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {summary.summary.rl_insights.risk_assessment && (
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-medium text-yellow-900 mb-2">Risk Assessment</h4>
                <p className="text-yellow-800">{summary.summary.rl_insights.risk_assessment}</p>
              </div>
            )}
            
            {summary.summary.rl_insights.recommended_experiments.length > 0 && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Recommended Experiments</h4>
                <ul className="list-disc list-inside space-y-1">
                  {summary.summary.rl_insights.recommended_experiments.map((experiment, index) => (
                    <li key={index} className="text-blue-800">{experiment}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Items */}
      {summary.summary.action_items.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => toggleSection('action_items')}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="text-lg font-medium text-gray-900">
              ✅ Action Items ({summary.summary.action_items.length})
            </h3>
            <span className="text-gray-400">
              {expandedSections.has('action_items') ? '−' : '+'}
            </span>
          </button>
          {expandedSections.has('action_items') && (
            <div className="mt-3 space-y-3">
              {summary.summary.action_items.map((item, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(item.priority)}`}>
                        {item.priority}
                      </span>
                      {item.blocking && (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                          BLOCKING
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{item.estimated_effort}</span>
                  </div>
                  <p className="text-gray-800 mb-1">{item.description}</p>
                  {item.assigned_to && (
                    <p className="text-xs text-gray-600">Assigned to: {item.assigned_to}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sentiment Analysis */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection('sentiment')}
          className="flex items-center justify-between w-full text-left"
        >
          <h3 className="text-lg font-medium text-gray-900">📊 Sentiment Analysis</h3>
          <span className="text-gray-400">
            {expandedSections.has('sentiment') ? '−' : '+'}
          </span>
        </button>
        {expandedSections.has('sentiment') && (
          <div className="mt-3 grid md:grid-cols-3 gap-4">
            <div className={`p-3 rounded-lg ${getToneColor(summary.summary.sentiment_analysis.overall_tone)}`}>
              <h4 className="font-medium mb-1">Overall Tone</h4>
              <p className="capitalize">{summary.summary.sentiment_analysis.overall_tone}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-1">Reviewer Confidence</h4>
              <p className="capitalize text-gray-800">{summary.summary.sentiment_analysis.reviewer_confidence}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-1">Consensus Level</h4>
              <p className="capitalize text-gray-800">{summary.summary.sentiment_analysis.consensus_level}</p>
            </div>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Model: {summary.metadata.model_used}</span>
          <span>Tokens: {summary.metadata.token_usage.total_tokens}</span>
        </div>
      </div>
    </div>
  );
};

export default AISummaryCard;
