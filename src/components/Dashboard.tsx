import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import PRCard from './PRCard';
import Analytics from './Analytics';
import FilterBar from './FilterBar';

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

interface FilterState {
  status: string;
  needsReview: boolean;
  hasChangesRequested: boolean;
  sortBy: 'created' | 'updated' | 'approvals';
  sortOrder: 'asc' | 'desc';
}

const Dashboard: React.FC = () => {
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    needsReview: false,
    hasChangesRequested: false,
    sortBy: 'updated',
    sortOrder: 'desc',
  });

  const [ws, setWs] = useState<WebSocket | null>(null);
  const navigate = useNavigate();

  // Fetch PRs
  const { data: prs = [], isLoading, refetch } = useQuery<PullRequest[]>({
    queryKey: ['prs'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/api/prs`);
      return response.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch reviews for filtering
  const { data: allReviews = [] } = useQuery<Review[]>({
    queryKey: ['reviews'],
    queryFn: async () => {
      const reviewPromises = prs.map(pr =>
        axios.get(`${API_BASE_URL}/api/prs/${pr.github_pr_number}/reviews`)
      );
      const responses = await Promise.all(reviewPromises);
      return responses.flatMap(response => response.data);
    },
    enabled: prs.length > 0,
  });

  // WebSocket connection for real-time updates
  useEffect(() => {
    const wsUrl = `ws://localhost:3001`;
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log('Connected to WebSocket');
      setWs(websocket);
    };

    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'prs_updated') {
        refetch();
      }
    };

    websocket.onclose = () => {
      console.log('WebSocket connection closed');
      setWs(null);
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      websocket.close();
    };
  }, [refetch]);

  // Filter and sort PRs
  const filteredPRs = React.useMemo(() => {
    let filtered = [...prs];

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(pr => pr.status === filters.status);
    }

    // Apply needs review filter
    if (filters.needsReview) {
      filtered = filtered.filter(pr => pr.current_approvals_count === 0);
    }

    // Apply changes requested filter
    if (filters.hasChangesRequested) {
      filtered = filtered.filter(pr => {
        const prReviews = allReviews.filter(r => r.pr_id === pr.github_pr_number);
        return prReviews.some(r => r.review_state === 'changes_requested');
      });
    }

    // Sort PRs
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (filters.sortBy) {
        case 'created':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'updated':
          aValue = new Date(a.updated_at);
          bValue = new Date(b.updated_at);
          break;
        case 'approvals':
          aValue = a.current_approvals_count;
          bValue = b.current_approvals_count;
          break;
        default:
          return 0;
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [prs, allReviews, filters]);

  const getStatusColor = (pr: PullRequest) => {
    // Calculate dynamic total required approvals
    const totalRequired = pr.current_approvals_count + pr.pending_reviewers.length;
    
    // Ready to merge: no pending reviewers and has approvals
    if (pr.pending_reviewers.length === 0 && pr.current_approvals_count > 0) return 'success';
    
    // No reviewers assigned
    if (pr.current_approvals_count === 0 && totalRequired === 0) return 'primary';
    
    // Needs initial review
    if (pr.current_approvals_count === 0) return 'danger';
    
    // Check for changes requested
    const prReviews = allReviews.filter(r => r.pr_id === pr.github_pr_number);
    if (prReviews.some(r => r.review_state === 'changes_requested')) {
      return 'warning';
    }
    
    // In progress (has some approvals but still waiting for more)
    return 'primary';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Analytics Section */}
      <div className="mb-8">
        <Analytics prs={prs} reviews={allReviews} />
      </div>

      {/* Filter Bar */}
      <div className="mb-6">
        <FilterBar filters={filters} onFiltersChange={setFilters} />
      </div>

      {/* Connection Status */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Pull Requests ({filteredPRs.length})
        </h2>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${ws ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">
            {ws ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* PR Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredPRs.map(pr => (
          <PRCard
            key={pr.id}
            pr={pr}
            reviews={allReviews.filter(r => r.pr_id === pr.github_pr_number)}
            statusColor={getStatusColor(pr)}
            onClick={() => navigate(`/pr/${pr.github_pr_number}`)}
          />
        ))}
      </div>

      {filteredPRs.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">
            No pull requests match the current filters.
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
