import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  ExclamationCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import PRCard from './PRCard';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Types
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

const PullRequestsTab: React.FC = () => {
  const navigate = useNavigate();

  // Fetch PRs
  const { data: prs = [], isLoading, error, refetch } = useQuery<PullRequest[]>({
    queryKey: ['prs'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/api/prs`);
      return response.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch all reviews for all PRs
  const { data: allReviews = [] } = useQuery<Review[]>({
    queryKey: ['all-reviews'],
    queryFn: async () => {
      const reviewPromises = prs.map(pr => 
        axios.get(`${API_BASE_URL}/api/prs/${pr.github_pr_number}/reviews`)
          .then(response => response.data)
          .catch(() => [])
      );
      const reviewArrays = await Promise.all(reviewPromises);
      return reviewArrays.flat();
    },
    enabled: prs.length > 0,
    refetchInterval: 30000,
  });

  // Helper function to get reviews for a specific PR
  const getReviewsForPR = (prNumber: number): Review[] => {
    return allReviews.filter(review => review.pr_id === prNumber);
  };

  // Helper function to calculate status color
  const getStatusColor = (pr: PullRequest, reviews: Review[]): 'success' | 'warning' | 'danger' | 'primary' => {
    // Both merged and closed mean the PR was merged (success)
    if (pr.status === 'merged' || pr.status === 'closed') return 'success';
    
    // For open PRs
    const changesRequested = reviews.some(r => r.review_state === 'changes_requested');
    if (changesRequested) return 'danger';
    
    // Ready to merge
    if (pr.pending_reviewers.length === 0 && pr.current_approvals_count > 0) return 'success';
    
    // Needs review
    if (pr.current_approvals_count === 0) return 'warning';
    
    // In progress
    return 'primary';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-dashboard">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="spinner spinner-lg mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Pull Requests</h3>
              <p className="text-gray-600">Fetching connector integration PRs...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-dashboard">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="card">
            <div className="card-body">
              <div className="error-state">
                <div className="flex items-start space-x-3">
                  <ExclamationCircleIcon className="w-5 h-5 text-danger-600 mt-0.5" />
                  <div>
                    <h3 className="error-title">Failed to load pull requests</h3>
                    <p className="error-message">
                      {axios.isAxiosError(error) ? error.message : 'Unknown error occurred'}
                    </p>
                    <button
                      onClick={() => refetch()}
                      className="btn btn-primary mt-4"
                    >
                      <ArrowPathIcon className="w-4 h-4 mr-2" />
                      Retry
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* PR Cards Grid - Clean and Simple */}
        {prs.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {prs.map((pr) => {
              const reviews = getReviewsForPR(pr.github_pr_number);
              const statusColor = getStatusColor(pr, reviews);
              return (
                <PRCard 
                  key={pr.id} 
                  pr={pr} 
                  reviews={reviews}
                  statusColor={statusColor}
                  onClick={() => navigate(`/pr/${pr.github_pr_number}`)}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pull Requests</h3>
              <p className="text-gray-600">No connector integration pull requests are currently available.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PullRequestsTab;
