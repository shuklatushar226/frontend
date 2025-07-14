import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  Cell,
  LabelList
} from 'recharts';
import { 
  ClockIcon, 
  ArrowPathIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Types
interface PRTimelineStage {
  stage: 'pr_raised' | 'first_review' | 'comments_fixed' | 'approved' | 'merged';
  timestamp: string;
  duration_from_previous?: number;
}

interface PRTimeline {
  pr_number: number;
  pr_title: string;
  pr_author: string;
  total_duration: number;
  stages: PRTimelineStage[];
  is_completed: boolean;
  stage_durations: {
    pr_raised_to_first_review: number;
    first_review_to_comments_fixed: number;
    comments_fixed_to_approved: number;
    approved_to_merged: number;
    ongoing_time: number;
    total_review_time: number;
  };
  milestones: {
    pr_created: { timestamp: string; achieved: boolean; };
    first_review: { timestamp: string | null; achieved: boolean; };
    approved: { timestamp: string | null; achieved: boolean; };
    merged: { timestamp: string | null; achieved: boolean; };
  };
}

interface TimelineAnalytics {
  timeline_data: PRTimeline[];
  summary: {
    total_prs_analyzed: number;
    completed_prs: number;
    avg_total_time_days: number;
    avg_first_review_time_days: number;
    avg_approval_time_days: number;
    longest_pr: PRTimeline | null;
    fastest_pr: PRTimeline | null;
    data_quality?: {
      high_quality: number;
      medium_quality: number;
      low_quality: number;
      invalid_timelines: number;
      avg_confidence_score: number;
      total_issues_detected: number;
      review_cycles_total: number;
    };
  };
  generated_at: string;
}

interface ChartDataPoint {
  prNumber: number;
  prTitle: string;
  prAuthor: string;
  totalDuration: number;
  prRaised: number;
  reviewDiscussion: number;
  commentsFixed: number;
  waitingToMerge: number;
  ongoingTime: number;
  isCompleted: boolean;
  milestones: {
    pr_created: { timestamp: string; achieved: boolean; };
    first_review: { timestamp: string | null; achieved: boolean; };
    approved: { timestamp: string | null; achieved: boolean; };
    merged: { timestamp: string | null; achieved: boolean; };
  };
}

// Stage colors for the chart
const STAGE_COLORS = {
  prRaised: '#3b82f6',        // Blue
  reviewDiscussion: '#f59e0b', // Yellow/Orange  
  commentsFixed: '#ef4444',   // Red
  waitingToMerge: '#10b981',  // Green
  ongoingTime: '#6b7280'      // Gray
};

const STAGE_LABELS = {
  prRaised: 'Waiting for Review',
  reviewDiscussion: 'Under Review',
  commentsFixed: 'Comments Fixed', 
  waitingToMerge: 'Approved & Waiting to Merge',
  ongoingTime: 'Open Time (Still Waiting)'
};

const PRTimelineHistogram: React.FC = () => {
  const [sortBy, setSortBy] = useState<'total' | 'review' | 'approval'>('total');
  const [filterCompleted, setFilterCompleted] = useState<'all' | 'completed' | 'open'>('all');
  const [showHours, setShowHours] = useState(false);

  // Fetch timeline data
  const { data: timelineData, isLoading, error, refetch } = useQuery<TimelineAnalytics>({
    queryKey: ['timeline-analytics'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/api/analytics/timeline`);
      return response.data;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  // Transform data for chart
  const chartData: ChartDataPoint[] = React.useMemo(() => {
    if (!timelineData?.timeline_data) return [];

    let filteredData = timelineData.timeline_data;

    // Apply filters
    if (filterCompleted === 'completed') {
      filteredData = filteredData.filter(t => t.is_completed);
    } else if (filterCompleted === 'open') {
      filteredData = filteredData.filter(t => !t.is_completed);
    }

    // Transform to chart format with new comprehensive timeline segments
    const transformed = filteredData.map(timeline => ({
      prNumber: timeline.pr_number,
      prTitle: timeline.pr_title.length > 30 ? 
        timeline.pr_title.substring(0, 30) + '...' : 
        timeline.pr_title,
      prAuthor: timeline.pr_author,
      totalDuration: timeline.total_duration,
      prRaised: timeline.stage_durations.pr_raised_to_first_review,
      reviewDiscussion: timeline.stage_durations.first_review_to_comments_fixed,
      commentsFixed: timeline.stage_durations.comments_fixed_to_approved,
      waitingToMerge: timeline.stage_durations.approved_to_merged,
      ongoingTime: timeline.stage_durations.ongoing_time || 0,
      isCompleted: timeline.is_completed,
      milestones: timeline.milestones
    }));

    // Sort data
    switch (sortBy) {
      case 'review':
        return transformed.sort((a, b) => b.reviewDiscussion - a.reviewDiscussion);
      case 'approval':
        return transformed.sort((a, b) => b.waitingToMerge - a.waitingToMerge);
      default:
        return transformed.sort((a, b) => b.totalDuration - a.totalDuration);
    }
  }, [timelineData, sortBy, filterCompleted]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    const totalDays = data.totalDuration; // Now in days from backend
    const totalHours = totalDays * 24;

    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg max-w-sm">
        <div className="font-semibold text-gray-900 mb-2">
          PR #{data.prNumber}
        </div>
        <div className="text-sm text-gray-600 mb-3">
          {data.prTitle}
        </div>
        <div className="text-xs text-gray-500 mb-3">
          by {data.prAuthor} • {data.isCompleted ? 'Completed' : 'Open'}
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Total Duration:</span>
            <span className="text-sm">
              {showHours ? `${totalHours.toFixed(1)}h` : `${totalDays.toFixed(1)}d`}
            </span>
          </div>
          
          {payload.map((entry: any, index: number) => {
            if (entry.value === 0) return null;
            const entryDays = entry.value; // Now in days from backend
            const entryHours = entryDays * 24;
            return (
              <div key={index} className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-sm" 
                    style={{ backgroundColor: STAGE_COLORS[entry.dataKey as keyof typeof STAGE_COLORS] }}
                  ></div>
                  <span className="text-xs">{STAGE_LABELS[entry.dataKey as keyof typeof STAGE_LABELS]}:</span>
                </div>
                <span className="text-xs">
                  {showHours ? `${entryHours.toFixed(1)}h` : `${entryDays.toFixed(1)}d`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Format Y-axis labels
  const formatYAxisLabel = (value: number) => {
    if (showHours) {
      const hours = value * 24; // Convert days to hours for display
      return `${hours.toFixed(0)}h`;
    } else {
      return `${value.toFixed(1)}d`;
    }
  };

  if (isLoading) {
    return (
      <div className="chart-container">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="spinner spinner-lg mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Timeline Data</h3>
            <p className="text-gray-600">Analyzing PR lifecycle stages...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chart-container">
        <div className="flex items-center space-x-3 p-4 bg-danger-50 border border-danger-200 rounded-lg">
          <ExclamationTriangleIcon className="w-5 h-5 text-danger-600" />
          <div>
            <h3 className="font-medium text-danger-900">Failed to load timeline data</h3>
            <p className="text-sm text-danger-700">
              {axios.isAxiosError(error) ? error.message : 'Unknown error occurred'}
            </p>
            <button
              onClick={() => refetch()}
              className="btn btn-secondary mt-2"
            >
              <ArrowPathIcon className="w-4 h-4 mr-2" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!timelineData || chartData.length === 0) {
    return (
      <div className="chart-container">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Timeline Data</h3>
            <p className="text-gray-600">No PR timeline data available to display.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="chart-title flex items-center space-x-2">
            <ClockIcon className="w-5 h-5 text-primary-600" />
            <span>PR Timeline Analysis</span>
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Duration breakdown for each stage of the PR lifecycle
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
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

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <AdjustmentsHorizontalIcon className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters:</span>
        </div>
        
        {/* Sort Control */}
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-600">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'total' | 'review' | 'approval')}
            className="text-sm border border-gray-300 rounded-md px-2 py-1"
          >
            <option value="total">Total Duration</option>
            <option value="review">Review Time</option>
            <option value="approval">Approval Time</option>
          </select>
        </div>

        {/* Filter Control */}
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-600">Status:</label>
          <select
            value={filterCompleted}
            onChange={(e) => setFilterCompleted(e.target.value as 'all' | 'completed' | 'open')}
            className="text-sm border border-gray-300 rounded-md px-2 py-1"
          >
            <option value="all">All PRs</option>
            <option value="completed">Completed Only</option>
            <option value="open">Open Only</option>
          </select>
        </div>

        {/* Time Unit Toggle */}
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-600">Units:</label>
          <button
            onClick={() => setShowHours(!showHours)}
            className={`px-3 py-1 text-xs rounded-md border ${
              showHours ? 'bg-primary-100 text-primary-700 border-primary-200' : 'bg-gray-100 text-gray-700 border-gray-200'
            }`}
          >
            {showHours ? 'Hours' : 'Days'}
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      {timelineData.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-primary-50 p-3 rounded-lg border border-primary-200">
            <div className="text-xs text-primary-600 font-medium mb-1">Total PRs</div>
            <div className="text-lg font-bold text-primary-900">
              {timelineData.summary.total_prs_analyzed}
            </div>
          </div>
          <div className="bg-success-50 p-3 rounded-lg border border-success-200">
            <div className="text-xs text-success-600 font-medium mb-1">Completed</div>
            <div className="text-lg font-bold text-success-900">
              {timelineData.summary.completed_prs}
            </div>
          </div>
          <div className="bg-warning-50 p-3 rounded-lg border border-warning-200">
            <div className="text-xs text-warning-600 font-medium mb-1">Avg Total Time</div>
            <div className="text-lg font-bold text-warning-900">
              {showHours 
                ? `${(timelineData.summary.avg_total_time_days * 24).toFixed(1)}h`
                : `${timelineData.summary.avg_total_time_days.toFixed(1)}d`
              }
            </div>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="text-xs text-blue-600 font-medium mb-1">Avg First Review</div>
            <div className="text-lg font-bold text-blue-900">
              {showHours 
                ? `${(timelineData.summary.avg_first_review_time_days * 24).toFixed(1)}h`
                : `${timelineData.summary.avg_first_review_time_days.toFixed(1)}d`
              }
            </div>
          </div>
        </div>
      )}

      {/* Data Quality Metrics */}
      {timelineData.summary?.data_quality && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <ChartBarIcon className="w-4 h-4 mr-2 text-gray-600" />
            Data Quality Assessment
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-xs text-green-600 font-medium mb-1">High Quality</div>
              <div className="text-lg font-bold text-green-900">
                {timelineData.summary.data_quality.high_quality}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-yellow-600 font-medium mb-1">Medium Quality</div>
              <div className="text-lg font-bold text-yellow-900">
                {timelineData.summary.data_quality.medium_quality}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-red-600 font-medium mb-1">Low Quality</div>
              <div className="text-lg font-bold text-red-900">
                {timelineData.summary.data_quality.low_quality}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600 font-medium mb-1">Avg Confidence</div>
              <div className="text-lg font-bold text-gray-900">
                {(timelineData.summary.data_quality.avg_confidence_score * 100).toFixed(0)}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-orange-600 font-medium mb-1">Issues Found</div>
              <div className="text-lg font-bold text-orange-900">
                {timelineData.summary.data_quality.total_issues_detected}
              </div>
            </div>
          </div>
          {timelineData.summary.data_quality.avg_confidence_score < 0.7 && (
            <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-md">
              <div className="flex items-start space-x-2">
                <ExclamationTriangleIcon className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-800">
                  <strong>Data Quality Warning:</strong> Some timeline calculations have low confidence scores. 
                  This may indicate incomplete review data or complex PR workflows that don't follow standard patterns.
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chart */}
      <div className="mb-6">
        <ResponsiveContainer width="100%" height={600}>
          <BarChart
            data={chartData}
            margin={{ top: 30, right: 40, left: 60, bottom: 100 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.7} />
            <XAxis 
              dataKey="prNumber"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
              tickLine={{ stroke: '#d1d5db' }}
              axisLine={{ stroke: '#d1d5db' }}
            />
            <YAxis 
              tickFormatter={formatYAxisLabel}
              tick={{ fontSize: 11, fill: '#6b7280' }}
              label={{ 
                value: showHours ? 'Duration (hours)' : 'Duration (days)', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle', fill: '#374151', fontSize: '12px', fontWeight: '500' }
              }}
              tickLine={{ stroke: '#d1d5db' }}
              axisLine={{ stroke: '#d1d5db' }}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} />
            {/* Remove automatic legend since Cell components break color detection */}
            
            <Bar 
              dataKey="prRaised" 
              stackId="timeline" 
              stroke="#ffffff"
              strokeWidth={1}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={STAGE_COLORS.prRaised}
                  fillOpacity={entry.isCompleted ? 1 : 0.8}
                />
              ))}
            </Bar>
            <Bar 
              dataKey="reviewDiscussion" 
              stackId="timeline" 
              stroke="#ffffff"
              strokeWidth={1}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={STAGE_COLORS.reviewDiscussion}
                  fillOpacity={entry.isCompleted ? 1 : 0.8}
                />
              ))}
            </Bar>
            <Bar 
              dataKey="commentsFixed" 
              stackId="timeline" 
              stroke="#ffffff"
              strokeWidth={1}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={STAGE_COLORS.commentsFixed}
                  fillOpacity={entry.isCompleted ? 1 : 0.8}
                />
              ))}
            </Bar>
            <Bar 
              dataKey="waitingToMerge" 
              stackId="timeline" 
              stroke="#ffffff"
              strokeWidth={1}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={STAGE_COLORS.waitingToMerge}
                  fillOpacity={entry.isCompleted ? 1 : 0.8}
                />
              ))}
            </Bar>
            <Bar 
              dataKey="ongoingTime" 
              stackId="timeline" 
              stroke="#ffffff"
              strokeWidth={1}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={STAGE_COLORS.ongoingTime}
                  fillOpacity={entry.isCompleted ? 1 : 0.8}
                />
              ))}
              <LabelList 
                dataKey={(entry: any) => entry.isCompleted ? 'MERGED' : ''}
                position="top"
                style={{
                  fontSize: '10px',
                  fontWeight: 'bold',
                  fill: '#16a34a'
                }}
                offset={5}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Custom Legend */}
      <div className="flex flex-wrap justify-center items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-sm font-medium text-gray-700 mr-2">Stage Legend:</div>
        {Object.entries(STAGE_COLORS).map(([key, color]) => (
          <div key={key} className="flex items-center space-x-2">
            <div 
              className="w-4 h-3 rounded-sm border border-gray-300" 
              style={{ backgroundColor: color }}
            ></div>
            <span className="text-xs text-gray-700">
              {STAGE_LABELS[key as keyof typeof STAGE_LABELS]}
            </span>
          </div>
        ))}
      </div>

      {/* Insights */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Longest PR */}
        {timelineData.summary.longest_pr && (
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center space-x-2 mb-2">
              <ClockIcon className="w-4 h-4 text-orange-600" />
              <h4 className="font-medium text-orange-900">Longest PR</h4>
            </div>
            <div className="text-sm text-orange-800">
              <div className="font-medium">#{timelineData.summary.longest_pr.pr_number}</div>
              <div className="truncate">{timelineData.summary.longest_pr.pr_title}</div>
              <div className="text-xs mt-1">
                Duration: {showHours 
                  ? `${(timelineData.summary.longest_pr.total_duration * 24).toFixed(1)} hours`
                  : `${timelineData.summary.longest_pr.total_duration.toFixed(1)} days`
                }
              </div>
            </div>
          </div>
        )}

        {/* Fastest PR */}
        {timelineData.summary.fastest_pr && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2 mb-2">
              <ChartBarIcon className="w-4 h-4 text-green-600" />
              <h4 className="font-medium text-green-900">Fastest PR</h4>
            </div>
            <div className="text-sm text-green-800">
              <div className="font-medium">#{timelineData.summary.fastest_pr.pr_number}</div>
              <div className="truncate">{timelineData.summary.fastest_pr.pr_title}</div>
              <div className="text-xs mt-1">
                Duration: {showHours 
                  ? `${(timelineData.summary.fastest_pr.total_duration * 24).toFixed(1)} hours`
                  : `${timelineData.summary.fastest_pr.total_duration.toFixed(1)} days`
                }
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="mt-6 flex items-start space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <InformationCircleIcon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-blue-800">
          <strong>How to read this chart:</strong> Each bar represents a PR's journey through different stages. 
          <strong>"MERGED" labels appear above completed PRs.</strong> 
          <strong>Bar opacity indicates PR status:</strong> 
          <span style={{ fontWeight: 'bold' }}>Vibrant colors = Merged PRs</span>, 
          <span style={{ fontWeight: 'bold', opacity: 0.8 }}>Faded colors = Open PRs</span>.
          <br />
          Stage colors: <span className="text-blue-600">■ Waiting for Review</span>, <span className="text-yellow-600">■ Under Review</span>, 
          <span className="text-red-600">■ Comments Fixed</span>, <span className="text-green-600">■ Approved & Waiting to Merge</span>, 
          <span className="text-gray-600">■ Open Time</span>.
          Hover for detailed timing.
        </div>
      </div>
    </div>
  );
};

export default PRTimelineHistogram;
