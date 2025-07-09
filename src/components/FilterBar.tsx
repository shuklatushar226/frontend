import React from 'react';
import { FunnelIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

interface FilterState {
  status: string;
  needsReview: boolean;
  hasChangesRequested: boolean;
  sortBy: 'created' | 'updated' | 'approvals';
  sortOrder: 'asc' | 'desc';
}

interface FilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, onFiltersChange }) => {
  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const toggleSortOrder = () => {
    updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const clearFilters = () => {
    onFiltersChange({
      status: 'all',
      needsReview: false,
      hasChangesRequested: false,
      sortBy: 'updated',
      sortOrder: 'desc',
    });
  };

  const hasActiveFilters = 
    filters.status !== 'all' || 
    filters.needsReview || 
    filters.hasChangesRequested;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Filter Icon */}
        <div className="flex items-center text-gray-600">
          <FunnelIcon className="w-5 h-5 mr-2" />
          <span className="font-medium">Filters</span>
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Status:</label>
          <select
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="merged">Merged</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {/* Quick Filters */}
        <div className="flex items-center space-x-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.needsReview}
              onChange={(e) => updateFilter('needsReview', e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700">Needs Review</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.hasChangesRequested}
              onChange={(e) => updateFilter('hasChangesRequested', e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700">Changes Requested</span>
          </label>
        </div>

        {/* Sort Options */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Sort by:</label>
          <select
            value={filters.sortBy}
            onChange={(e) => updateFilter('sortBy', e.target.value as 'created' | 'updated' | 'approvals')}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="updated">Last Updated</option>
            <option value="created">Created Date</option>
            <option value="approvals">Approvals</option>
          </select>

          <button
            onClick={toggleSortOrder}
            className="flex items-center px-2 py-1 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            title={`Sort ${filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
          >
            {filters.sortOrder === 'asc' ? (
              <ArrowUpIcon className="w-4 h-4" />
            ) : (
              <ArrowDownIcon className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-1 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-md transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-gray-500">Active filters:</span>
            
            {filters.status !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                Status: {filters.status}
                <button
                  onClick={() => updateFilter('status', 'all')}
                  className="ml-1 text-primary-600 hover:text-primary-800"
                >
                  ×
                </button>
              </span>
            )}

            {filters.needsReview && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-danger-100 text-danger-800">
                Needs Review
                <button
                  onClick={() => updateFilter('needsReview', false)}
                  className="ml-1 text-danger-600 hover:text-danger-800"
                >
                  ×
                </button>
              </span>
            )}

            {filters.hasChangesRequested && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-warning-100 text-warning-800">
                Changes Requested
                <button
                  onClick={() => updateFilter('hasChangesRequested', false)}
                  className="ml-1 text-warning-600 hover:text-warning-800"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;
