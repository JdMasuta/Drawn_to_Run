import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Activity, ActivityFeedResponse } from '../../types';
import { ActivityCard } from './ActivityCard';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface ActivityFeedProps {
  className?: string;
  limit?: number;
  onUserClick?: (userId: number) => void;
  onEventClick?: (eventId: number) => void;
}

export function ActivityFeed({ 
  className = '', 
  limit = 20,
  onUserClick,
  onEventClick 
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Fetch activity feed
  const {
    data: feedResponse,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['activity-feed', limit, offset],
    queryFn: async (): Promise<ActivityFeedResponse> => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/activity/feed?limit=${limit}&offset=${offset}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load activity feed');
      }

      return response.json();
    },
    enabled: true,
  });

  // Update activities when new data comes in
  useEffect(() => {
    if (feedResponse) {
      if (offset === 0) {
        // Initial load or refresh
        setActivities(feedResponse.activities);
      } else {
        // Load more
        setActivities(prev => [...prev, ...feedResponse.activities]);
      }
      setHasMore(feedResponse.hasMore);
    }
  }, [feedResponse, offset]);

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      setOffset(prev => prev + limit);
    }
  };

  const handleRefresh = () => {
    setOffset(0);
    setActivities([]);
    refetch();
  };

  const handleUserClick = (userId: number) => {
    if (onUserClick) {
      onUserClick(userId);
    } else {
      window.location.href = `/profile?id=${userId}`;
    }
  };

  const handleEventClick = (eventId: number) => {
    if (onEventClick) {
      onEventClick(eventId);
    } else {
      window.location.href = `/events/${eventId}`;
    }
  };

  if (isLoading && activities.length === 0) {
    return (
      <div className={`flex justify-center py-8 ${className}`}>
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-gray-500 mb-4">
          <span className="text-4xl mb-2 block">📭</span>
          <p className="text-lg font-medium text-gray-900 mb-2">
            Failed to load activity feed
          </p>
          <p className="text-sm text-gray-600 mb-4">
            {error instanceof Error ? error.message : 'Something went wrong'}
          </p>
          <button
            onClick={handleRefresh}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (activities.length === 0 && !isLoading) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-gray-500">
          <span className="text-6xl mb-4 block">🌟</span>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Your activity feed is empty
          </h3>
          <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
            Start following other runners to see their activities here. You'll see when they register for events, 
            complete races, and engage with the community.
          </p>
          <button
            onClick={() => window.location.href = '/events'}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Discover Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Activity Feed</h2>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
        >
          <svg
            className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {/* Activity list */}
      <div className="space-y-3">
        {activities.map((activity) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            onUserClick={handleUserClick}
            onEventClick={handleEventClick}
          />
        ))}
      </div>

      {/* Load more button */}
      {hasMore && (
        <div className="flex justify-center pt-6">
          <button
            onClick={handleLoadMore}
            disabled={isLoading}
            className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="small" />
                <span>Loading...</span>
              </>
            ) : (
              <span>Load More Activities</span>
            )}
          </button>
        </div>
      )}

      {/* End of feed indicator */}
      {!hasMore && activities.length > 0 && (
        <div className="text-center py-4 text-sm text-gray-500">
          <span>You're all caught up! 🎉</span>
        </div>
      )}
    </div>
  );
}

export default ActivityFeed;