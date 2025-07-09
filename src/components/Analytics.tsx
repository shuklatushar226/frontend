import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

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

  // PR age distribution
  const now = new Date();
  const ageDistribution = [
    { name: '< 1 day', value: 0 },
    { name: '1-3 days', value: 0 },
    { name: '4-7 days', value: 0 },
    { name: '> 1 week', value: 0 },
  ];

  prs.forEach(pr => {
    const created = new Date(pr.created_at);
    const ageInDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    
    if (ageInDays < 1) {
      ageDistribution[0].value++;
    } else if (ageInDays <= 3) {
      ageDistribution[1].value++;
    } else if (ageInDays <= 7) {
      ageDistribution[2].value++;
    } else {
      ageDistribution[3].value++;
    }
  });

  // Reviewer activity
  const reviewerActivity = reviews.reduce((acc, review) => {
    acc[review.reviewer_username] = (acc[review.reviewer_username] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const reviewerData = Object.entries(reviewerActivity)
    .map(([reviewer, count]) => ({ name: reviewer, reviews: count }))
    .sort((a, b) => b.reviews - a.reviews)
    .slice(0, 10);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const MetricCard: React.FC<{ title: string; value: number; color: string; description?: string }> = ({ 
    title, 
    value, 
    color, 
    description 
  }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full ${color} mr-3`}></div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard 
          title="Total PRs" 
          value={totalPRs} 
          color="bg-blue-500"
          description="All connector PRs"
        />
        <MetricCard 
          title="Open PRs" 
          value={openPRs} 
          color="bg-primary-500"
          description="Currently open"
        />
        <MetricCard 
          title="Need Review" 
          value={prsNeedingReview} 
          color="bg-danger-500"
          description="0 approvals"
        />
        <MetricCard 
          title="Changes Requested" 
          value={prsWithChangesRequested} 
          color="bg-warning-500"
          description="Feedback pending"
        />
        <MetricCard 
          title="Ready to Merge" 
          value={readyToMerge} 
          color="bg-success-500"
          description="5+ approvals"
        />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Approval Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Approval Distribution</h3>
          {approvalDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={approvalDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {approvalDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No data available
            </div>
          )}
        </div>

        {/* PR Age Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">PR Age Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ageDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Reviewer Activity */}
      {reviewerData.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Reviewers</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reviewerData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Bar dataKey="reviews" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default Analytics;
