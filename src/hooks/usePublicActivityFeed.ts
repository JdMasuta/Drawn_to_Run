import { useQuery } from '@tanstack/react-query';

interface PublicActivity {
  id: string;
  type: 'registration' | 'comment';
  user: {
    initials: string;
    displayName: string;
    avatarColor: string;
  };
  event: {
    id: number;
    title: string;
  };
  message: string;
  distance?: string;
  content?: string;
  timeAgo: string;
  created_at: string;
}

interface PublicActivityFeedResponse {
  activities: PublicActivity[];
  total: number;
}

const fetchPublicActivityFeed = async (limit: number = 5): Promise<PublicActivityFeedResponse> => {
  const response = await fetch(`/api/activity-feed-public?limit=${limit}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch public activity feed: ${response.statusText}`);
  }
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || 'Failed to fetch public activity feed');
  }
  
  return result.data;
};

export const usePublicActivityFeed = (limit: number = 5) => {
  return useQuery({
    queryKey: ['public-activity-feed', limit],
    queryFn: () => fetchPublicActivityFeed(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    retryDelay: 1000,
    // Provide fallback data if query fails
    placeholderData: {
      activities: [
        {
          id: 'placeholder-1',
          type: 'registration' as const,
          user: {
            initials: 'JD',
            displayName: 'John D.',
            avatarColor: 'bg-blue-500',
          },
          event: {
            id: 1,
            title: 'Central Park 5K Fun Run',
          },
          message: 'registered for the',
          distance: '5K',
          timeAgo: '2 hours ago',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'placeholder-2',
          type: 'registration' as const,
          user: {
            initials: 'SM',
            displayName: 'Sarah M.',
            avatarColor: 'bg-green-500',
          },
          event: {
            id: 2,
            title: 'Brooklyn Bridge 10K',
          },
          message: 'registered for the',
          distance: '10K',
          timeAgo: '5 hours ago',
          created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'placeholder-3',
          type: 'comment' as const,
          user: {
            initials: 'MR',
            displayName: 'Mike R.',
            avatarColor: 'bg-orange-500',
          },
          event: {
            id: 3,
            title: 'Marathon Training Tips',
          },
          message: 'commented on',
          content: 'Great advice for beginners!',
          timeAgo: '1 day ago',
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
      total: 3,
    } as PublicActivityFeedResponse,
  });
};