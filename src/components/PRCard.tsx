import React from 'react';
import { ClockIcon, UserIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

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
  requested_reviewers: string[];
  pending_reviewers: string[];
  url: string;
}

interface Review {
  id: number;
  pr_id: number;
  reviewer_username: string;
  review_state: 'commented' | 'approved' | 'changes_requested';
  submitted_at: string;
  is_latest_review: boolean;
}

interface PRCardProps {
  pr: PullRequest;
  reviews: Review[];
  statusColor: 'success' | 'warning' | 'danger' | 'primary';
  onClick?: () => void;
}

const PRCard: React.FC<PRCardProps> = ({ pr, reviews, statusColor, onClick }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const getStatusBadgeColor = () => {
    switch (statusColor) {
      case 'success':
        return 'bg-success-50 text-success-600 border-success-200';
      case 'warning':
        return 'bg-warning-50 text-warning-600 border-warning-200';
      case 'danger':
        return 'bg-danger-50 text-danger-600 border-danger-200';
      default:
        return 'bg-primary-50 text-primary-600 border-primary-200';
    }
  };

  const getStatusIcon = () => {
    switch (statusColor) {
      case 'success':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'warning':
      case 'danger':
        return <ExclamationTriangleIcon className="w-4 h-4" />;
      default:
        return <ClockIcon className="w-4 h-4" />;
    }
  };

  const getStatusText = () => {
    // Both merged and closed mean the PR was merged in this project
    if (pr.status === 'merged' || pr.status === 'closed') return 'Merged';
    
    // Calculate dynamic total required approvals
    const totalRequired = pr.current_approvals_count + pr.pending_reviewers.length;
    
    // For open PRs, show approval status
    if (pr.pending_reviewers.length === 0 && pr.current_approvals_count > 0) return 'Ready to merge';
    if (pr.current_approvals_count === 0 && totalRequired === 0) return 'No reviewers assigned';
    if (pr.current_approvals_count === 0) return 'Needs review';
    
    const changesRequested = reviews.some(r => r.review_state === 'changes_requested');
    if (changesRequested) return 'Changes requested';
    
    return `${pr.current_approvals_count}/${totalRequired} approvals`;
  };

  const getPRStatusColor = () => {
    // Both merged and closed mean the PR was merged (green)
    if (pr.status === 'merged' || pr.status === 'closed') {
      return 'bg-green-50 text-green-600 border-green-200';
    }
    return getStatusBadgeColor(); // Use existing logic for open PRs
  };

  const getPRStatusIcon = () => {
    // Both merged and closed mean the PR was merged (checkmark)
    if (pr.status === 'merged' || pr.status === 'closed') return <CheckCircleIcon className="w-4 h-4" />;
    return getStatusIcon(); // Use existing logic for open PRs
  };

  const approvedReviewers = reviews.filter(r => r.review_state === 'approved');
  const changesRequestedReviewers = reviews.filter(r => r.review_state === 'changes_requested');

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate hover:text-primary-600 transition-colors">
            {pr.title}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            #{pr.github_pr_number} by {pr.author}
          </p>
        </div>
      </div>

      {/* Status Badge */}
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getPRStatusColor()} mb-4`}>
        {getPRStatusIcon()}
        <span className="ml-1">{getStatusText()}</span>
      </div>

      {/* Approval Progress */}
      <div className="mb-4">
        {(() => {
          const totalRequired = pr.current_approvals_count + pr.pending_reviewers.length;
          const progressPercentage = totalRequired > 0 ? (pr.current_approvals_count / totalRequired) * 100 : 0;
          
          return (
            <>
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Approvals</span>
                <span>{pr.current_approvals_count}/{totalRequired}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    pr.pending_reviewers.length === 0 && pr.current_approvals_count > 0
                      ? 'bg-success-500' 
                      : 'bg-primary-500'
                  }`}
                  style={{ 
                    width: `${Math.min(progressPercentage, 100)}%`
                  }}
                ></div>
              </div>
            </>
          );
        })()}
      </div>

      {/* Reviewers */}
      {(approvedReviewers.length > 0 || changesRequestedReviewers.length > 0 || pr.pending_reviewers.length > 0) && (
        <div className="mb-4">
          {approvedReviewers.length > 0 && (
            <div className="flex items-center text-sm text-success-600 mb-1">
              <CheckCircleIcon className="w-4 h-4 mr-1" />
              <span>Approved by: {approvedReviewers.map(r => r.reviewer_username).join(', ')}</span>
            </div>
          )}
          {changesRequestedReviewers.length > 0 && (
            <div className="flex items-center text-sm text-warning-600 mb-1">
              <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
              <span>Changes requested by: {changesRequestedReviewers.map(r => r.reviewer_username).join(', ')}</span>
            </div>
          )}
          {pr.pending_reviewers.length > 0 && (
            <div className="flex items-center text-sm text-gray-600">
              <ClockIcon className="w-4 h-4 mr-1" />
              <span>Waiting for: {pr.pending_reviewers.join(', ')}</span>
            </div>
          )}
        </div>
      )}

      {/* Labels */}
      {pr.labels.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {pr.labels.slice(0, 3).map(label => (
              <span 
                key={label}
                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800"
              >
                {label}
              </span>
            ))}
            {pr.labels.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                +{pr.labels.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
        <div className="flex items-center">
          <ClockIcon className="w-4 h-4 mr-1" />
          <span>Created {formatDate(pr.created_at)}</span>
        </div>
        <div className="flex items-center">
          {(pr.status === 'merged' || pr.status === 'closed') && pr.merged_at ? (
            <>
              <CheckCircleIcon className="w-4 h-4 mr-1" />
              <span>Merged {formatDate(pr.merged_at)}</span>
            </>
          ) : (
            <>
              <UserIcon className="w-4 h-4 mr-1" />
              <span>Updated {formatDate(pr.updated_at)}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PRCard;
