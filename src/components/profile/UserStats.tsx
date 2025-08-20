// UserStats component - Display user statistics and achievements
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';

interface UserStatsProps {
  userId?: number;
}

interface FollowCounts {
  followers: number;
  following: number;
}

const getFollowCounts = async (userId: number): Promise<FollowCounts> => {
  const response = await fetch(`/api/users/${userId}/follow`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });

  if (!response.ok) {
    // If user is not authenticated or follow status cannot be determined, return 0s
    return { followers: 0, following: 0 };
  }

  const data = await response.json();
  return {
    followers: data.followerCount || 0,
    following: data.followingCount || 0,
  };
};

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange';
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 ring-blue-600/20',
    green: 'bg-green-50 text-green-600 ring-green-600/20',
    purple: 'bg-purple-50 text-purple-600 ring-purple-600/20',
    orange: 'bg-orange-50 text-orange-600 ring-orange-600/20',
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ring-4 ring-inset ${colorClasses[color]}`}>
          {icon}
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export const UserStats: React.FC<UserStatsProps> = ({ userId }) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  // Get follow counts
  const { data: followCounts } = useQuery({
    queryKey: ['followCounts', targetUserId],
    queryFn: () => getFollowCounts(targetUserId!),
    enabled: !!targetUserId,
    initialData: { followers: 0, following: 0 },
  });

  // Mock stats for now - in real implementation, these would come from API
  const stats = {
    totalEvents: user?.role === 'organizer' || user?.role === 'admin' ? 3 : 0,
    totalRegistrations: 7,
    upcomingEvents: 2,
    completedRaces: 5,
  };

  const achievements = [
    { name: 'First Event', description: 'Registered for your first event', earned: true },
    { name: 'Regular Runner', description: 'Completed 5 events', earned: stats.completedRaces >= 5 },
    { name: 'Event Creator', description: 'Created your first event', earned: stats.totalEvents > 0 },
    { name: 'Community Member', description: 'Active for 30 days', earned: true },
  ];

  return (
    <div className="space-y-6">
      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Followers"
          value={followCounts?.followers || 0}
          subtitle="Total followers"
          color="blue"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />

        <StatCard
          title="Following"
          value={followCounts?.following || 0}
          subtitle="People following"
          color="green"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          }
        />

        <StatCard
          title="Total Registrations"
          value={stats.totalRegistrations}
          subtitle="All time"
          color="purple"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />

        <StatCard
          title="Completed Races"
          value={stats.completedRaces}
          subtitle="All time"
          color="orange"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          }
        />

        {(user?.role === 'organizer' || user?.role === 'admin') && (
          <StatCard
            title="Events Created"
            value={stats.totalEvents}
            subtitle="As organizer"
            color="orange"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          />
        )}
      </div>

      {/* Achievements */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Achievements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.name}
              className={`p-4 rounded-lg border-2 ${
                achievement.earned
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  achievement.earned
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 text-gray-500'
                }`}>
                  {achievement.earned ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3 flex-1">
                  <h4 className={`font-medium ${
                    achievement.earned ? 'text-green-900' : 'text-gray-500'
                  }`}>
                    {achievement.name}
                  </h4>
                  <p className={`text-sm ${
                    achievement.earned ? 'text-green-700' : 'text-gray-400'
                  }`}>
                    {achievement.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Goals */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Goals & Progress</h3>
        <div className="space-y-4">
          {/* Next Event Goal */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Next Event Registration</span>
              <span className="text-sm text-gray-500">
                {stats.upcomingEvents > 0 ? 'On track' : 'Find an event'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  stats.upcomingEvents > 0 ? 'bg-green-500' : 'bg-gray-400'
                }`}
                style={{ width: stats.upcomingEvents > 0 ? '100%' : '0%' }}
              ></div>
            </div>
          </div>

          {/* Annual Goal */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Annual Goal (10 events)</span>
              <span className="text-sm text-gray-500">
                {stats.totalRegistrations}/10 events
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${Math.min((stats.totalRegistrations / 10) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};