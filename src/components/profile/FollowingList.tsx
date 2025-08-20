import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { User } from '../../types';
import { UserAvatar } from '../ui/UserAvatar';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface FollowingListProps {
  userId: number;
  className?: string;
}

interface FollowingResponse {
  following: (User & { followed_at: string })[];
  total: number;
  hasMore: boolean;
}

const getFollowing = async (userId: number, limit = 20, offset = 0): Promise<FollowingResponse> => {
  const response = await fetch(
    `/api/users/${userId}/following?limit=${limit}&offset=${offset}`,
    {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get following list');
  }

  const result = await response.json();
  return result.data;
};

export const FollowingList: React.FC<FollowingListProps> = ({
  userId,
  className = '',
}) => {
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);

  const {
    data: followingData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['following', userId, limit, offset],
    queryFn: () => getFollowing(userId, limit, offset),
  });

  const handleLoadMore = () => {
    setOffset(prev => prev + limit);
  };

  const handleRetry = () => {
    refetch();
  };

  if (isLoading && offset === 0) {
    return (
      <div className="flex justify-center items-center p-8">
        <LoadingSpinner size="medium" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-600 mb-4">
          {error instanceof Error ? error.message : 'Failed to load following list'}
        </div>
        <button
          onClick={handleRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!followingData?.following?.length) {
    return (
      <div className="text-center p-8 text-gray-500">
        <div className="text-4xl mb-4">👤</div>
        <h3 className="text-lg font-medium mb-2">Not following anyone</h3>
        <p className="text-sm">This user isn't following anyone yet.</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Following ({followingData.total})
        </h3>
        <p className="text-sm text-gray-600">
          People this user follows
        </p>
      </div>

      <div className="space-y-3">
        {followingData.following.map((following) => (
          <div
            key={following.id}
            className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <div className="flex items-center space-x-3">
              <UserAvatar
                user={following}
                size="md"
                clickable
                onClick={() => window.location.href = `/profile?id=${following.id}`}
              />
              <div>
                <h4 className="font-medium text-gray-900">{following.name}</h4>
                {following.bio && (
                  <p className="text-sm text-gray-600 line-clamp-1">{following.bio}</p>
                )}
                <p className="text-xs text-gray-500">
                  Followed {new Date(following.followed_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <button
              onClick={() => window.location.href = `/profile?id=${following.id}`}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View Profile
            </button>
          </div>
        ))}
      </div>

      {followingData.hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={handleLoadMore}
            disabled={isLoading}
            className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <LoadingSpinner size="small" />
                Loading...
              </span>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}
    </div>
  );
};