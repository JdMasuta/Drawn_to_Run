// FilterSidebar component - Comprehensive filtering interface for events
import React, { useState } from 'react';
import { TagFilter } from './TagFilter';
import type { EventQueryParams } from '../../types/api';

interface FilterSidebarProps {
  filters: EventQueryParams;
  onFiltersChange: (filters: EventQueryParams) => void;
  className?: string;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  onFiltersChange,
  className = '',
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Handle search input change
  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search: search || undefined, page: 1 });
  };

  // Handle location search change
  const handleLocationChange = (location: string) => {
    onFiltersChange({ ...filters, location: location || undefined, page: 1 });
  };

  // Handle distance filter change
  const handleDistanceChange = (distance: string, checked: boolean) => {
    const currentDistances = filters.distance ? filters.distance.split(',') : [];
    
    let newDistances: string[];
    if (checked) {
      newDistances = [...currentDistances, distance];
    } else {
      newDistances = currentDistances.filter(d => d !== distance);
    }
    
    onFiltersChange({
      ...filters,
      distance: newDistances.length > 0 ? newDistances.join(',') : undefined,
      page: 1
    });
  };

  // Handle tag filter change
  const handleTagsChange = (tagIds: number[]) => {
    onFiltersChange({
      ...filters,
      tags: tagIds.length > 0 ? tagIds.join(',') : undefined,
      page: 1
    });
  };

  // Handle date range changes
  const handleDateFromChange = (date: string) => {
    onFiltersChange({ ...filters, date_from: date || undefined, page: 1 });
  };

  const handleDateToChange = (date: string) => {
    onFiltersChange({ ...filters, date_to: date || undefined, page: 1 });
  };

  // Handle sort change
  const handleSortChange = (value: string) => {
    const [sort, order] = value.split('-');
    onFiltersChange({
      ...filters,
      sort: sort as EventQueryParams['sort'],
      order: order as EventQueryParams['order']
    });
  };

  // Clear all filters
  const clearAllFilters = () => {
    onFiltersChange({
      page: 1,
      limit: filters.limit || 12,
      sort: 'event_date',
      order: 'asc',
    });
  };

  // Check if any filters are active
  const hasActiveFilters = !!(
    filters.search ||
    filters.location ||
    filters.distance ||
    filters.date_from ||
    filters.date_to ||
    filters.tags
  );

  // Get selected tag IDs
  const selectedTagIds = filters.tags 
    ? filters.tags.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
    : [];

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                Clear all
              </button>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="md:hidden p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className={`w-5 h-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
        
        {hasActiveFilters && (
          <div className="mt-2 text-xs text-gray-500">
            {Object.values({
              search: filters.search,
              location: filters.location,
              distance: filters.distance,
              dateRange: filters.date_from || filters.date_to,
              tags: filters.tags,
            }).filter(Boolean).length} filter{hasActiveFilters ? 's' : ''} active
          </div>
        )}
      </div>

      {/* Filter content */}
      <div className={`${isCollapsed ? 'hidden md:block' : 'block'}`}>
        <div className="p-4 space-y-6">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Events
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by title, description, location..."
                value={filters.search || ''}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <svg
                className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Location Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Filter by location..."
                value={filters.location || ''}
                onChange={(e) => handleLocationChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <svg
                className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">From</label>
                <input
                  type="date"
                  value={filters.date_from || ''}
                  onChange={(e) => handleDateFromChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">To</label>
                <input
                  type="date"
                  value={filters.date_to || ''}
                  onChange={(e) => handleDateToChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Distance Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Distance Options
            </label>
            <div className="space-y-2">
              {['5K', '10K', 'Half Marathon', 'Marathon'].map((distance) => {
                const isChecked = filters.distance?.split(',').includes(distance) || false;
                return (
                  <label key={distance} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => handleDistanceChange(distance, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-3 text-sm text-gray-600">{distance}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Tag Filter */}
          <TagFilter
            selectedTags={selectedTagIds}
            onTagsChange={handleTagsChange}
          />

          {/* Sort Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              value={`${filters.sort}-${filters.order}`}
              onChange={(e) => handleSortChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="event_date-asc">Date (Earliest First)</option>
              <option value="event_date-desc">Date (Latest First)</option>
              <option value="title-asc">Title (A-Z)</option>
              <option value="title-desc">Title (Z-A)</option>
              <option value="created_at-desc">Recently Added</option>
              <option value="created_at-asc">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Footer with active filter summary */}
        {hasActiveFilters && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="text-xs text-gray-600">
              <div className="font-medium mb-2">Active Filters:</div>
              <div className="space-y-1">
                {filters.search && (
                  <div>• Search: "{filters.search}"</div>
                )}
                {filters.location && (
                  <div>• Location: "{filters.location}"</div>
                )}
                {filters.distance && (
                  <div>• Distance: {filters.distance.replace(/,/g, ', ')}</div>
                )}
                {(filters.date_from || filters.date_to) && (
                  <div>
                    • Date: {filters.date_from || 'Any'} to {filters.date_to || 'Any'}
                  </div>
                )}
                {filters.tags && (
                  <div>• {selectedTagIds.length} tag{selectedTagIds.length !== 1 ? 's' : ''} selected</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};