import { useQuery } from '@tanstack/react-query';

interface CommunityStats {
  community: {
    totalUsers: number;
    activeMembers: number;
    totalEvents: number;
    totalRegistrations: number;
    totalCities: number;
    estimatedMilesRun: number;
  };
  growth: {
    recentUsers: number;
    growthRate: number;
  };
  engagement: {
    averageEventsPerUser: number;
    averageRegistrationsPerEvent: number;
  };
}

const fetchCommunityStats = async (): Promise<CommunityStats> => {
  const response = await fetch('/api/stats');
  
  if (!response.ok) {
    throw new Error(`Failed to fetch community stats: ${response.statusText}`);
  }
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || 'Failed to fetch community stats');
  }
  
  return result.data;
};

export const useCommunityStats = () => {
  return useQuery({
    queryKey: ['community-stats'],
    queryFn: fetchCommunityStats,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    retryDelay: 1000,
    // Provide fallback data if query fails
    placeholderData: {
      community: {
        totalUsers: 500,
        activeMembers: 350,
        totalEvents: 150,
        totalRegistrations: 850,
        totalCities: 25,
        estimatedMilesRun: 2500,
      },
      growth: {
        recentUsers: 45,
        growthRate: 12,
      },
      engagement: {
        averageEventsPerUser: 2.8,
        averageRegistrationsPerEvent: 5.7,
      }
    } as CommunityStats,
  });
};