import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { 
  ArrowPathIcon,
  SignalIcon,
  FolderOpenIcon,
  ChartBarIcon,
  AcademicCapIcon,
  ArrowRightIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import Analytics from './Analytics';

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

const Dashboard: React.FC = () => {
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

  // Fetch reviews
  const { data: allReviews = [] } = useQuery<Review[]>({
    queryKey: ['reviews'],
    queryFn: async () => {
      const reviewPromises = prs.map(pr =>
        axios.get(`${API_BASE_URL}/api/prs/${pr.github_pr_number}/reviews`)
          .then(response => response.data)
          .catch(() => [])
      );
      const responses = await Promise.all(reviewPromises);
      return responses.flatMap(response => response);
    },
    enabled: prs.length > 0,
  });

  // WebSocket connection for real-time updates
  useEffect(() => {
    const wsUrl = API_BASE_URL.replace('http', 'ws');
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

  // Calculate quick stats
  const stats = React.useMemo(() => {
    const total = prs.length;
    const open = prs.filter(pr => pr.status === 'open').length;
    const merged = prs.filter(pr => pr.status === 'merged').length;
    const needingReview = prs.filter(pr => pr.current_approvals_count === 0 && pr.status === 'open').length;
    const readyToMerge = prs.filter(pr => pr.pending_reviewers.length === 0 && pr.current_approvals_count > 0 && pr.status === 'open').length;
    const changesRequested = prs.filter(pr => {
      const prReviews = allReviews.filter(r => r.pr_id === pr.github_pr_number);
      return prReviews.some(r => r.review_state === 'changes_requested');
    }).length;

    return { total, open, merged, needingReview, readyToMerge, changesRequested };
  }, [prs, allReviews]);

  // Get recent PRs for quick access
  const recentPRs = React.useMemo(() => {
    return prs
      .filter(pr => pr.status === 'open')
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 5);
  }, [prs]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-dashboard flex items-center justify-center">
        <div className="text-center">
          <div className="spinner spinner-lg mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Dashboard</h3>
          <p className="text-gray-600">Fetching latest data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Overview of connector integration pull requests and system analytics
              </p>
            </div>

            {/* Connection Status & Refresh */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 px-3 py-2 bg-white rounded-lg border shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${ws ? 'bg-success-500' : 'bg-danger-500'} ${ws ? 'animate-pulse' : ''}`}></div>
                  <SignalIcon className={`w-4 h-4 ${ws ? 'text-success-600' : 'text-danger-600'}`} />
                </div>
                <span className={`text-sm font-medium ${ws ? 'text-success-700' : 'text-danger-700'}`}>
                  {ws ? 'Live' : 'Offline'}
                </span>
              </div>
              
              <button
                onClick={() => refetch()}
                className="btn btn-secondary"
                disabled={isLoading}
              >
                <ArrowPathIcon className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <div className="metric-card">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                <FolderOpenIcon className="w-4 h-4 text-primary-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Total PRs</h4>
                <p className="text-sm text-gray-500">All time</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-primary-600">{stats.total}</p>
          </div>

          <div className="metric-card">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center">
                <ClockIcon className="w-4 h-4 text-success-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Open</h4>
                <p className="text-sm text-gray-500">Active PRs</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-success-600">{stats.open}</p>
          </div>

          <div className="metric-card">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <CheckCircleIcon className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Merged</h4>
                <p className="text-sm text-gray-500">Completed</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-purple-600">{stats.merged}</p>
          </div>

          <div className="metric-card">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-warning-100 rounded-lg flex items-center justify-center">
                <UserGroupIcon className="w-4 h-4 text-warning-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Needs Review</h4>
                <p className="text-sm text-gray-500">No approvals</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-warning-600">{stats.needingReview}</p>
          </div>

          <div className="metric-card">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center">
                <CheckCircleIcon className="w-4 h-4 text-success-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Ready to Merge</h4>
                <p className="text-sm text-gray-500">All approved</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-success-600">{stats.readyToMerge}</p>
          </div>

          <div className="metric-card">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-danger-100 rounded-lg flex items-center justify-center">
                <ExclamationTriangleIcon className="w-4 h-4 text-danger-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Changes Requested</h4>
                <p className="text-sm text-gray-500">Needs updates</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-danger-600">{stats.changesRequested}</p>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="mb-8">
          <Analytics prs={prs} reviews={allReviews} />
        </div>

        {/* Quick Access Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Pull Requests Quick Access */}
          <div className="card group cursor-pointer" onClick={() => navigate('/pull-requests')}>
            <div className="card-header">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                    <FolderOpenIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Pull Requests</h3>
                    <p className="text-sm text-gray-500">View and manage all PRs</p>
                  </div>
                </div>
                <ArrowRightIcon className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
              </div>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Open PRs</span>
                  <span className="font-semibold text-primary-600">{stats.open}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Ready to merge</span>
                  <span className="font-semibold text-success-600">{stats.readyToMerge}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Need review</span>
                  <span className="font-semibold text-warning-600">{stats.needingReview}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Common Learning Quick Access */}
          <div className="card group cursor-pointer" onClick={() => navigate('/common-learning')}>
            <div className="card-header">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <AcademicCapIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Common Learning</h3>
                    <p className="text-sm text-gray-500">AI insights and patterns</p>
                  </div>
                </div>
                <ArrowRightIcon className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
              </div>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total PRs analyzed</span>
                  <span className="font-semibold text-purple-600">{stats.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Reviews analyzed</span>
                  <span className="font-semibold text-purple-600">{allReviews.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">AI insights</span>
                  <span className="font-semibold text-purple-600">Available</span>
                </div>
              </div>
            </div>
          </div>

          {/* System Analytics */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center">
                  <ChartBarIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
                  <p className="text-sm text-gray-500">Real-time monitoring</p>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Connection</span>
                  <span className={`font-semibold ${ws ? 'text-success-600' : 'text-danger-600'}`}>
                    {ws ? 'Live' : 'Offline'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Auto-refresh</span>
                  <span className="font-semibold text-success-600">30s</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Last update</span>
                  <span className="font-semibold text-gray-600">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        {recentPRs.length > 0 && (
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                <button
                  onClick={() => navigate('/pull-requests')}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View all PRs →
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {recentPRs.map(pr => (
                  <div 
                    key={pr.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => navigate(`/pr/${pr.github_pr_number}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-semibold text-gray-500 bg-gray-200 px-2 py-1 rounded">
                          #{pr.github_pr_number}
                        </span>
                        <span className={`status-badge ${
                          pr.pending_reviewers.length === 0 && pr.current_approvals_count > 0 ? 'status-success' :
                          pr.current_approvals_count === 0 ? 'status-warning' : 'status-primary'
                        }`}>
                          {pr.pending_reviewers.length === 0 && pr.current_approvals_count > 0 ? 'Ready to merge' :
                           pr.current_approvals_count === 0 ? 'Needs review' : 'In progress'}
                        </span>
                      </div>
                      <h4 className="font-medium text-gray-900 truncate">{pr.title}</h4>
                      <p className="text-sm text-gray-500">
                        by {pr.author} • Updated {new Date(pr.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
