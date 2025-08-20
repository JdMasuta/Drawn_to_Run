import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LoadingSpinner } from './LoadingSpinner';

interface FollowButtonProps {
  targetUserId: number;
  initialIsFollowing?: boolean;
  onFollowChange?: (isFollowing: boolean, followerCount: number) => void;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

interface FollowStatus {
  isFollowing: boolean;
  targetUserId: number;
  followerCount: number;
  followingCount: number;
}

const followUser = async (targetUserId: number) => {
  const response = await fetch(`/api/users/${targetUserId}/follow`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to follow user');
  }

  return response.json();
};

const unfollowUser = async (targetUserId: number) => {
  const response = await fetch(`/api/users/${targetUserId}/follow`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to unfollow user');
  }

  return response.json();
};

const getFollowStatus = async (targetUserId: number): Promise<FollowStatus> => {
  const response = await fetch(`/api/users/${targetUserId}/follow`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get follow status');
  }

  return response.json();
};

export const FollowButton: React.FC<FollowButtonProps> = ({
  targetUserId,
  initialIsFollowing = false,
  onFollowChange,
  className = '',
  size = 'medium',
}) => {
  const queryClient = useQueryClient();
  
  // Get current follow status
  const { data: followStatus, isLoading: isLoadingStatus } = useQuery({
    queryKey: ['followStatus', targetUserId],
    queryFn: () => getFollowStatus(targetUserId),
    initialData: {
      isFollowing: initialIsFollowing,
      targetUserId,
      followerCount: 0,
      followingCount: 0,
    },
  });

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: () => followUser(targetUserId),
    onSuccess: (data) => {
      queryClient.setQueryData(['followStatus', targetUserId], {
        ...followStatus,
        isFollowing: true,
        followerCount: data.followerCount,
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['userProfile', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['followers', targetUserId] });
      
      onFollowChange?.(true, data.followerCount);
    },
    onError: (error) => {
      console.error('Follow error:', error);
    },
  });

  // Unfollow mutation
  const unfollowMutation = useMutation({
    mutationFn: () => unfollowUser(targetUserId),
    onSuccess: (data) => {
      queryClient.setQueryData(['followStatus', targetUserId], {
        ...followStatus,
        isFollowing: false,
        followerCount: data.followerCount,
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['userProfile', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['followers', targetUserId] });
      
      onFollowChange?.(false, data.followerCount);
    },
    onError: (error) => {
      console.error('Unfollow error:', error);
    },
  });

  const isLoading = isLoadingStatus || followMutation.isPending || unfollowMutation.isPending;
  const isFollowing = followStatus?.isFollowing || false;

  const handleClick = () => {
    if (isLoading) return;

    if (isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  // Size classes
  const sizeClasses = {
    small: 'px-3 py-1 text-sm',
    medium: 'px-4 py-2 text-sm',
    large: 'px-6 py-3 text-base',
  };

  // Button styling
  const baseClasses = 'font-medium rounded-lg transition-colors duration-200 flex items-center gap-2 border';
  const followingClasses = 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200';
  const notFollowingClasses = 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700';

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`
        ${baseClasses}
        ${sizeClasses[size]}
        ${isFollowing ? followingClasses : notFollowingClasses}
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {isLoading && <LoadingSpinner size="small" />}
      
      {!isLoading && (
        <>
          {isFollowing ? (
            <>
              <span>✓</span>
              <span>Following</span>
            </>
          ) : (
            <>
              <span>+</span>
              <span>Follow</span>
            </>
          )}
        </>
      )}
    </button>
  );
};