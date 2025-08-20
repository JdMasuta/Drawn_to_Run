import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { User } from '../../types';
import { UserAvatar } from '../ui/UserAvatar';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface FollowersListProps {
  userId: number;
  className?: string;
}

interface FollowersResponse {
  followers: (User & { followed_at: string })[];
  total: number;
  hasMore: boolean;
}

const getFollowers = async (userId: number, limit = 20, offset = 0): Promise<FollowersResponse> => {
  const response = await fetch(
    `/api/users/${userId}/followers?limit=${limit}&offset=${offset}`,
    {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get followers');
  }

  const result = await response.json();
  return result.data;
};

export const FollowersList: React.FC<FollowersListProps> = ({
  userId,
  className = '',
}) => {
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);

  const {
    data: followersData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['followers', userId, limit, offset],
    queryFn: () => getFollowers(userId, limit, offset),
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
          {error instanceof Error ? error.message : 'Failed to load followers'}
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

  if (!followersData?.followers?.length) {
    return (
      <div className="text-center p-8 text-gray-500">
        <div className="text-4xl mb-4">👥</div>
        <h3 className="text-lg font-medium mb-2">No followers yet</h3>
        <p className="text-sm">This user doesn't have any followers.</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Followers ({followersData.total})
        </h3>
        <p className="text-sm text-gray-600">
          People who follow this user
        </p>
      </div>

      <div className="space-y-3">
        {followersData.followers.map((follower) => (
          <div
            key={follower.id}
            className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <div className="flex items-center space-x-3">
              <UserAvatar
                user={follower}
                size="md"
                clickable
                onClick={() => window.location.href = `/profile?id=${follower.id}`}
              />
              <div>
                <h4 className="font-medium text-gray-900">{follower.name}</h4>
                {follower.bio && (
                  <p className="text-sm text-gray-600 line-clamp-1">{follower.bio}</p>
                )}
                <p className="text-xs text-gray-500">
                  Followed {new Date(follower.followed_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <button
              onClick={() => window.location.href = `/profile?id=${follower.id}`}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View Profile
            </button>
          </div>
        ))}
      </div>

      {followersData.hasMore && (
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