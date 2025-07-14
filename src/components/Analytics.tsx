import React from 'react';
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  ChartBarIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import PRTimelineHistogram from './PRTimelineHistogram';
import PRCommentCategorizationTable from './PRCommentCategorizationTable';

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
}

interface AnalyticsProps {
  prs: PullRequest[];
  reviews: Review[];
}

const Analytics: React.FC<AnalyticsProps> = ({ prs, reviews }) => {
  // Calculate metrics
  const totalPRs = prs.length;
  const openPRs = prs.filter(pr => pr.status === 'open').length;
  const prsNeedingReview = prs.filter(pr => pr.current_approvals_count === 0).length;
  const prsWithChangesRequested = prs.filter(pr => {
    const prReviews = reviews.filter(r => r.pr_id === pr.github_pr_number);
    return prReviews.some(r => r.review_state === 'changes_requested');
  }).length;
  const readyToMerge = prs.filter(pr => pr.current_approvals_count >= 5).length;

  // Approval distribution data
  const approvalDistribution = [
    { name: '0 approvals', value: prs.filter(pr => pr.current_approvals_count === 0).length },
    { name: '1-2 approvals', value: prs.filter(pr => pr.current_approvals_count >= 1 && pr.current_approvals_count <= 2).length },
    { name: '3-4 approvals', value: prs.filter(pr => pr.current_approvals_count >= 3 && pr.current_approvals_count <= 4).length },
    { name: '5+ approvals', value: prs.filter(pr => pr.current_approvals_count >= 5).length },
  ].filter(item => item.value > 0);


  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Calculate trends (mock data for demonstration)
  const mergedPRs = prs.filter(pr => pr.status === 'merged' || pr.status === 'closed').length;
  const avgApprovals = totalPRs > 0 ? (prs.reduce((sum, pr) => sum + pr.current_approvals_count, 0) / totalPRs).toFixed(1) : '0';

  const MetricCard: React.FC<{ 
    title: string; 
    value: number | string; 
    icon: React.ReactNode; 
    description?: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    colorClass: string;
  }> = ({ title, value, icon, description, trend, trendValue, colorClass }) => (
    <div className="metric-card group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
              {icon}
            </div>
            <div>
              <p className="metric-label">{title}</p>
              {description && <p className="text-xs text-gray-500">{description}</p>}
            </div>
          </div>
          <div className="flex items-end justify-between">
            <p className="metric-value">{value}</p>
            {trend && trendValue && (
              <div className={`flex items-center space-x-1 metric-trend ${
                trend === 'up' ? 'trend-up' : trend === 'down' ? 'trend-down' : 'trend-neutral'
              }`}>
                {trend === 'up' ? (
                  <ArrowTrendingUpIcon className="w-3 h-3" />
                ) : trend === 'down' ? (
                  <ArrowTrendingDownIcon className="w-3 h-3" />
                ) : null}
                <span>{trendValue}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Overview</h2>
          <p className="text-gray-600 mt-1">Real-time insights into connector PR performance</p>
        </div>
        <div className="flex items-center space-x-2 px-3 py-2 bg-primary-50 rounded-lg border border-primary-200">
          <ChartBarIcon className="w-4 h-4 text-primary-600" />
          <span className="text-sm font-medium text-primary-700">Live Data</span>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <MetricCard 
          title="Total PRs" 
          value={totalPRs}
          icon={<ChartBarIcon className="w-5 h-5 text-white" />}
          description="All connector PRs"
          colorClass="bg-gradient-to-br from-blue-500 to-blue-600"
          trend="neutral"
          trendValue={`${totalPRs} total`}
        />
        <MetricCard 
          title="Open PRs" 
          value={openPRs}
          icon={<ClockIcon className="w-5 h-5 text-white" />}
          description="Currently active"
          colorClass="bg-gradient-to-br from-primary-500 to-primary-600"
          trend={openPRs > mergedPRs ? 'up' : 'down'}
          trendValue={`${((openPRs / totalPRs) * 100).toFixed(0)}%`}
        />
        <MetricCard 
          title="Need Review" 
          value={prsNeedingReview}
          icon={<ExclamationTriangleIcon className="w-5 h-5 text-white" />}
          description="Awaiting approval"
          colorClass="bg-gradient-to-br from-danger-500 to-danger-600"
          trend={prsNeedingReview > 0 ? 'up' : 'down'}
          trendValue={`${prsNeedingReview} pending`}
        />
        <MetricCard 
          title="Changes Requested" 
          value={prsWithChangesRequested}
          icon={<ExclamationTriangleIcon className="w-5 h-5 text-white" />}
          description="Feedback pending"
          colorClass="bg-gradient-to-br from-warning-500 to-warning-600"
          trend="neutral"
          trendValue={`${prsWithChangesRequested} items`}
        />
        <MetricCard 
          title="Ready to Merge" 
          value={readyToMerge}
          icon={<CheckCircleIcon className="w-5 h-5 text-white" />}
          description="Fully approved"
          colorClass="bg-gradient-to-br from-success-500 to-success-600"
          trend={readyToMerge > 0 ? 'up' : 'neutral'}
          trendValue={`${readyToMerge} ready`}
        />
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-1 gap-8">
        {/* PR Timeline Histogram */}
        <PRTimelineHistogram />

        {/* Comment Categorization Table */}
        <PRCommentCategorizationTable />

        {/* Approval Distribution */}
        <div className="chart-container">
          <div className="flex items-center justify-between mb-6">
            <h3 className="chart-title">Approval Distribution</h3>
            <div className="text-sm text-gray-500">
              Avg: {avgApprovals} approvals
            </div>
          </div>
          {approvalDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={approvalDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value} (${((percent || 0) * 100).toFixed(0)}%)`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                  strokeWidth={2}
                  stroke="#ffffff"
                >
                  {approvalDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <ChartBarIcon className="empty-state-icon" />
              <h4 className="empty-state-title">No Data Available</h4>
              <p className="empty-state-description">
                No approval data to display at this time.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
