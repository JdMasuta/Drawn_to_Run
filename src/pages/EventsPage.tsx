import React, { useState } from 'react';
import { useEvents, useRegisterForEvent } from '../hooks/useEvents';
import { useAuth } from '../hooks/useAuth';
import { EventCard } from '../components/events/EventCard';
import type { EventQueryParams } from '../types/api';

const EventsPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [filters, setFilters] = useState<EventQueryParams>({
    page: 1,
    limit: 12,
    sort: 'event_date',
    order: 'asc',
  });

  const { data: eventsData, isLoading, error } = useEvents(filters);
  const registerMutation = useRegisterForEvent();

  const handleRegister = async (eventId: number) => {
    if (!isAuthenticated) {
      // Redirect to login - you could use navigate here
      window.location.href = '/login';
      return;
    }

    try {
      await registerMutation.mutateAsync({
        eventId,
        data: { distance: '5K' } // Default distance - in a real app, this would be a modal
      });
    } catch (error) {
      console.error('Registration failed:', error);
      // Handle error - show toast notification, etc.
    }
  };

  const handleSearchChange = (search: string) => {
    setFilters(prev => ({ ...prev, search, page: 1 }));
  };

  const handleDistanceFilter = (distance: string, checked: boolean) => {
    setFilters(prev => {
      const currentDistance = prev.distance || '';
      const distances = currentDistance.split(',').filter(Boolean);
      
      if (checked) {
        distances.push(distance);
      } else {
        const index = distances.indexOf(distance);
        if (index > -1) distances.splice(index, 1);
      }
      
      return {
        ...prev,
        distance: distances.join(',') || undefined,
        page: 1
      };
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Running Events</h1>
          <p className="mt-2 text-gray-600">
            Discover upcoming running events and register for your next challenge
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search
                  </label>
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={filters.search || ''}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Distance
                  </label>
                  <div className="space-y-2">
                    {['5K', '10K', 'Half Marathon', 'Marathon'].map((distance) => {
                      const isChecked = filters.distance?.split(',').includes(distance) || false;
                      return (
                        <label key={distance} className="flex items-center">
                          <input 
                            type="checkbox" 
                            className="mr-2"
                            checked={isChecked}
                            onChange={(e) => handleDistanceFilter(distance, e.target.checked)}
                          />
                          <span className="text-sm text-gray-600">{distance}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select 
                    value={`${filters.sort}-${filters.order}`}
                    onChange={(e) => {
                      const [sort, order] = e.target.value.split('-');
                      setFilters(prev => ({ 
                        ...prev, 
                        sort: sort as EventQueryParams['sort'], 
                        order: order as EventQueryParams['order']
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="event_date-asc">Date (Earliest)</option>
                    <option value="event_date-desc">Date (Latest)</option>
                    <option value="title-asc">Title (A-Z)</option>
                    <option value="title-desc">Title (Z-A)</option>
                    <option value="created_at-desc">Recently Added</option>
                  </select>
                </div>

                {/* Clear Filters */}
                <button
                  onClick={() => setFilters({
                    page: 1,
                    limit: 12,
                    sort: 'event_date',
                    order: 'asc',
                  })}
                  className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </div>

          {/* Events Grid */}
          <div className="lg:w-3/4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                <p className="text-red-600 text-sm">
                  Failed to load events. Please try again later.
                </p>
              </div>
            )}

            {isLoading ? (
              // Loading skeleton
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                    <div className="w-full h-48 bg-gray-200"></div>
                    <div className="p-6 space-y-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      <div className="flex gap-2">
                        <div className="h-6 bg-gray-200 rounded-full w-12"></div>
                        <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                      </div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : eventsData?.events && eventsData.events.length > 0 ? (
              <>
                {/* Results info */}
                <div className="mb-6 text-sm text-gray-600">
                  Showing {eventsData.events.length} of {eventsData.meta.total} events
                  {filters.search && ` for "${filters.search}"`}
                </div>

                {/* Events grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {eventsData.events.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onRegister={handleRegister}
                      isRegistering={registerMutation.isPending}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {eventsData.meta.totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page! - 1) }))}
                        disabled={filters.page === 1}
                        className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      
                      <span className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md">
                        Page {filters.page} of {eventsData.meta.totalPages}
                      </span>
                      
                      <button
                        onClick={() => setFilters(prev => ({ ...prev, page: prev.page! + 1 }))}
                        disabled={filters.page === eventsData.meta.totalPages}
                        className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              // No events found
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No events found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filters.search ? 'Try adjusting your search or filters.' : 'Check back later for new events.'}
                </p>
                {filters.search && (
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, search: undefined, page: 1 }))}
                    className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventsPage;