import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import CommentRenderer from './CommentRenderer';
import AISummaryCard from './AISummaryCard';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

interface PullRequest {
  id: number;
  github_pr_number: number;
  title: string;
  author: string;
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  status: 'open' | 'merged' | 'closed';
  is_connector_integration: boolean;
  current_approvals_count: number;
  labels: string[];
  reviewers: string[];
  url: string;
}

interface Review {
  id: number;
  pr_id: number;
  reviewer_username: string;
  review_state: 'commented' | 'approved' | 'changes_requested';
  submitted_at: string;
  is_latest_review: boolean;
  content?: string; // Add content field for review text
}

interface Comment {
  id: number;
  pr_id: number;
  github_comment_id: number;
  author: string;
  content: string;
  created_at: string;
  is_resolved: boolean;
  comment_type: 'review' | 'issue' | 'general';
  // Code context fields for review comments
  file_path?: string | null;
  line_number?: number | null;
  diff_hunk?: string | null;
  original_line?: number | null;
  side?: 'LEFT' | 'RIGHT' | null;
}

const PRDetailPage: React.FC = () => {
  const { prNumber } = useParams<{ prNumber: string }>();
  
  // Fetch all PRs to find the specific one
  const { data: prs = [] } = useQuery<PullRequest[]>({
    queryKey: ['prs'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/api/prs`);
      return response.data;
    },
  });

  // Find the specific PR
  const pr = prs.find(p => p.github_pr_number.toString() === prNumber);

  // Fetch reviews for this PR
  const { data: reviews = [] } = useQuery<Review[]>({
    queryKey: ['reviews', prNumber],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/api/prs/${prNumber}/reviews`);
      return response.data;
    },
    enabled: !!prNumber,
  });

  // Fetch comments for this PR
  const { data: comments = [] } = useQuery<Comment[]>({
    queryKey: ['comments', prNumber],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/api/prs/${prNumber}/comments`);
      return response.data;
    },
    enabled: !!prNumber,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };


  if (!pr) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">PR Not Found</h1>
          <p className="text-gray-600 mb-4">The pull request #{prNumber} could not be found.</p>
          <Link to="/" className="btn btn-primary">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const approvedReviews = reviews.filter(r => r.review_state === 'approved');
  const changesRequestedReviews = reviews.filter(r => r.review_state === 'changes_requested');
  const commentedReviews = reviews.filter(r => r.review_state === 'commented');

  // Show only comments with code context, ignore empty reviews
  const timeline = comments.map(c => ({ ...c, type: 'comment' as const, submitted_at: c.created_at }))
    .sort((a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime());

  // Debug logging
  console.log('PR #' + prNumber + ' - Reviews:', reviews.length, reviews);
  console.log('PR #' + prNumber + ' - Comments:', comments.length, comments);
  console.log('PR #' + prNumber + ' - Timeline:', timeline.length, timeline);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link to="/" className="text-primary-600 hover:text-primary-700 text-sm">
          ← Back to Dashboard
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {pr.title}
            </h1>
            <p className="text-gray-600">
              #{pr.github_pr_number} by {pr.author} • Created {formatRelativeTime(pr.created_at)}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <a
              href={pr.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              View on GitHub
            </a>
          </div>
        </div>

        {/* Status and Progress */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Status */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Approvals</span>
                <span className="text-sm font-medium">{pr.current_approvals_count}/5</span>
              </div>
              <div className="progress-bar">
                <div 
                  className={`progress-fill ${
                    pr.current_approvals_count >= 5 ? 'bg-success-500' : 'bg-primary-500'
                  }`}
                  style={{ width: `${Math.min((pr.current_approvals_count / 5) * 100, 100)}%` }}
                ></div>
              </div>
              
              {pr.current_approvals_count >= 5 && (
                <div className="status-badge bg-success-50 text-success-600 border-success-200">
                  ✓ Ready to merge
                </div>
              )}
              
              {pr.current_approvals_count === 0 && (
                <div className="status-badge bg-danger-50 text-danger-600 border-danger-200">
                  ⚠ Needs review
                </div>
              )}
              
              {changesRequestedReviews.length > 0 && (
                <div className="status-badge bg-warning-50 text-warning-600 border-warning-200">
                  ⚠ Changes requested
                </div>
              )}
            </div>
          </div>

          {/* Reviews */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Reviews</h3>
            <div className="space-y-2">
              {approvedReviews.map(review => (
                <div key={review.id} className="flex items-center text-sm">
                  <span className="text-success-600 mr-2">✓</span>
                  <span className="text-gray-900">{review.reviewer_username}</span>
                  <span className="text-gray-500 ml-auto">
                    {formatRelativeTime(review.submitted_at)}
                  </span>
                </div>
              ))}
              
              {changesRequestedReviews.map(review => (
                <div key={review.id} className="flex items-center text-sm">
                  <span className="text-warning-600 mr-2">⚠</span>
                  <span className="text-gray-900">{review.reviewer_username}</span>
                  <span className="text-gray-500 ml-auto">
                    {formatRelativeTime(review.submitted_at)}
                  </span>
                </div>
              ))}
              
              {commentedReviews.map(review => (
                <div key={review.id} className="flex items-center text-sm">
                  <span className="text-gray-600 mr-2">💬</span>
                  <span className="text-gray-900">{review.reviewer_username}</span>
                  <span className="text-gray-500 ml-auto">
                    {formatRelativeTime(review.submitted_at)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Labels and Timeline */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Details</h3>
            
            {/* Labels */}
            {pr.labels.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Labels</h4>
                <div className="flex flex-wrap gap-1">
                  {pr.labels.map(label => (
                    <span 
                      key={label}
                      className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Timeline</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div>Created: {formatDate(pr.created_at)}</div>
                <div>Updated: {formatDate(pr.updated_at)}</div>
                {pr.merged_at && <div>Merged: {formatDate(pr.merged_at)}</div>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Summary */}
      <div className="mb-6">
        <AISummaryCard prNumber={parseInt(prNumber!)} />
      </div>

      {/* Conversation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Conversation ({timeline.length})
        </h2>
        
        {timeline.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No comments or reviews yet
          </div>
        ) : (
          <div className="space-y-4">
            {timeline.map((item, index) => {
              const comment = item as any;
              return (
                <CommentRenderer
                  key={`comment-${comment.id}`}
                  content={comment.content}
                  author={comment.author}
                  createdAt={comment.created_at}
                  commentType={comment.comment_type}
                  filePath={comment.file_path}
                  lineNumber={comment.line_number}
                  diffHunk={comment.diff_hunk}
                  originalLine={comment.original_line}
                  side={comment.side}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PRDetailPage;
