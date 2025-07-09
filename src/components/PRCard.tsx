import React from 'react';
import { 
  ClockIcon, 
  UserIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon,
  TagIcon,
  UsersIcon
} from '@heroicons/react/24/outline';

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

  const totalRequired = pr.current_approvals_count + pr.pending_reviewers.length;
  const progressPercentage = totalRequired > 0 ? (pr.current_approvals_count / totalRequired) * 100 : 0;
  const isReadyToMerge = pr.pending_reviewers.length === 0 && pr.current_approvals_count > 0;
  const isMerged = pr.status === 'merged' || pr.status === 'closed';

  return (
    <div 
      className="card group cursor-pointer"
      onClick={onClick}
    >
      {/* Card Header with Status Indicator */}
      <div className="relative">
        {/* Status Color Bar */}
        <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl ${
          isMerged ? 'bg-gradient-to-r from-success-500 to-success-600' :
          isReadyToMerge ? 'bg-gradient-to-r from-success-400 to-success-500' :
          statusColor === 'danger' ? 'bg-gradient-to-r from-danger-500 to-danger-600' :
          statusColor === 'warning' ? 'bg-gradient-to-r from-warning-500 to-warning-600' :
          'bg-gradient-to-r from-primary-500 to-primary-600'
        }`}></div>

        {/* Header Content */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                  #{pr.github_pr_number}
                </span>
                <ArrowTopRightOnSquareIcon className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 leading-tight mb-2 group-hover:text-primary-600 transition-colors">
                {pr.title}
              </h3>
              <div className="flex items-center space-x-3 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <UserIcon className="w-4 h-4" />
                  <span className="font-medium">{pr.author}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <ClockIcon className="w-4 h-4" />
                  <span>Created {formatDate(pr.created_at)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center justify-between mb-4">
            <div className={`status-badge ${
              isMerged ? 'status-success' :
              isReadyToMerge ? 'status-success' :
              statusColor === 'danger' ? 'status-danger' :
              statusColor === 'warning' ? 'status-warning' :
              'status-primary'
            }`}>
              {getPRStatusIcon()}
              <span className="ml-2">{getStatusText()}</span>
            </div>
            
            {/* Quick Stats */}
            <div className="flex items-center space-x-3 text-xs text-gray-500">
              {totalRequired > 0 && (
                <div className="flex items-center space-x-1">
                  <UsersIcon className="w-3 h-3" />
                  <span>{pr.current_approvals_count}/{totalRequired}</span>
                </div>
              )}
              {pr.labels.length > 0 && (
                <div className="flex items-center space-x-1">
                  <TagIcon className="w-3 h-3" />
                  <span>{pr.labels.length}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Section */}
      {totalRequired > 0 && (
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium text-gray-700">Approval Progress</span>
            <span className="text-gray-500">{pr.current_approvals_count} of {totalRequired}</span>
          </div>
          <div className="progress-container">
            <div 
              className={`progress-bar ${
                isReadyToMerge ? 'progress-success' :
                statusColor === 'danger' ? 'progress-danger' :
                statusColor === 'warning' ? 'progress-warning' :
                'progress-primary'
              }`}
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Reviewers Section */}
      {(approvedReviewers.length > 0 || changesRequestedReviewers.length > 0 || pr.pending_reviewers.length > 0) && (
        <div className="px-6 pb-4">
          <div className="space-y-2">
            {approvedReviewers.length > 0 && (
              <div className="flex items-center text-sm">
                <div className="flex items-center space-x-2 text-success-600">
                  <CheckCircleIcon className="w-4 h-4" />
                  <span className="font-medium">Approved:</span>
                </div>
                <div className="ml-2 flex flex-wrap gap-1">
                  {approvedReviewers.slice(0, 3).map(r => (
                    <span key={r.reviewer_username} className="px-2 py-1 bg-success-50 text-success-700 rounded-md text-xs font-medium">
                      {r.reviewer_username}
                    </span>
                  ))}
                  {approvedReviewers.length > 3 && (
                    <span className="px-2 py-1 bg-success-50 text-success-700 rounded-md text-xs font-medium">
                      +{approvedReviewers.length - 3}
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {changesRequestedReviewers.length > 0 && (
              <div className="flex items-center text-sm">
                <div className="flex items-center space-x-2 text-warning-600">
                  <ExclamationTriangleIcon className="w-4 h-4" />
                  <span className="font-medium">Changes:</span>
                </div>
                <div className="ml-2 flex flex-wrap gap-1">
                  {changesRequestedReviewers.slice(0, 3).map(r => (
                    <span key={r.reviewer_username} className="px-2 py-1 bg-warning-50 text-warning-700 rounded-md text-xs font-medium">
                      {r.reviewer_username}
                    </span>
                  ))}
                  {changesRequestedReviewers.length > 3 && (
                    <span className="px-2 py-1 bg-warning-50 text-warning-700 rounded-md text-xs font-medium">
                      +{changesRequestedReviewers.length - 3}
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {pr.pending_reviewers.length > 0 && (
              <div className="flex items-center text-sm">
                <div className="flex items-center space-x-2 text-gray-500">
                  <ClockIcon className="w-4 h-4" />
                  <span className="font-medium">Pending:</span>
                </div>
                <div className="ml-2 flex flex-wrap gap-1">
                  {pr.pending_reviewers.slice(0, 3).map(reviewer => (
                    <span key={reviewer} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">
                      {reviewer}
                    </span>
                  ))}
                  {pr.pending_reviewers.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">
                      +{pr.pending_reviewers.length - 3}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Labels Section */}
      {pr.labels.length > 0 && (
        <div className="px-6 pb-4">
          <div className="flex items-center space-x-2 mb-2">
            <TagIcon className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Labels</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {pr.labels.slice(0, 4).map(label => (
              <span 
                key={label}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200"
              >
                {label}
              </span>
            ))}
            {pr.labels.length > 4 && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                +{pr.labels.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="card-footer">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <ClockIcon className="w-3 h-3" />
              <span>Created {formatDate(pr.created_at)}</span>
            </div>
            {(isMerged && pr.merged_at) ? (
              <div className="flex items-center space-x-1 text-success-600">
                <CheckCircleIcon className="w-3 h-3" />
                <span>Merged {formatDate(pr.merged_at)}</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1">
                <UserIcon className="w-3 h-3" />
                <span>Updated {formatDate(pr.updated_at)}</span>
              </div>
            )}
          </div>
          
          {/* Action Hint */}
          <div className="flex items-center space-x-1 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
            <span>Click to view</span>
            <ArrowTopRightOnSquareIcon className="w-3 h-3" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PRCard;
