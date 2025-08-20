// ProfilePage component - User profile with tabbed interface
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { UserAvatar } from '../components/ui/UserAvatar';
import { FollowButton } from '../components/ui/FollowButton';
import { ProfileEditForm } from '../components/profile/ProfileEditForm';
import { UserEventHistory } from '../components/profile/UserEventHistory';
import { UserRegistrations } from '../components/profile/UserRegistrations';
import { UserStats } from '../components/profile/UserStats';
import { FollowersList } from '../components/profile/FollowersList';
import { FollowingList } from '../components/profile/FollowingList';

type TabType = 'overview' | 'events' | 'registrations' | 'followers' | 'following' | 'edit';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  // Get user ID from URL params for viewing other profiles
  const urlParams = new URLSearchParams(window.location.search);
  const profileUserId = urlParams.get('id') ? parseInt(urlParams.get('id')!) : user?.id;
  const isOwnProfile = !profileUserId || profileUserId === user?.id;

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: '👤' },
    { id: 'events' as TabType, label: isOwnProfile ? 'My Events' : 'Events', icon: '🏃' },
    { id: 'registrations' as TabType, label: 'Registrations', icon: '📝' },
    { id: 'followers' as TabType, label: 'Followers', icon: '👥' },
    { id: 'following' as TabType, label: 'Following', icon: '👤' },
    ...(isOwnProfile ? [{ id: 'edit' as TabType, label: 'Edit Profile', icon: '⚙️' }] : []),
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <UserAvatar user={user} size="xl" />
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
                      <p className="text-gray-600 mt-1">{user?.email}</p>
                      {user?.bio && (
                        <p className="text-gray-700 mt-3">{user.bio}</p>
                      )}
                      <div className="mt-4">
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                          user?.role === 'admin' ? 'bg-red-100 text-red-800' :
                          user?.role === 'organizer' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {user?.role?.charAt(0).toUpperCase()}{user?.role?.slice(1)}
                        </span>
                        {!user?.email_verified && (
                          <span className="ml-2 px-3 py-1 text-sm font-medium rounded-full bg-yellow-100 text-yellow-800">
                            Email not verified
                          </span>
                        )}
                      </div>
                      <div className="mt-4 text-sm text-gray-500">
                        Member since {new Date(user?.created_at || '').toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                    
                    {/* Follow Button for other users' profiles */}
                    {!isOwnProfile && profileUserId && (
                      <div className="flex-shrink-0">
                        <FollowButton 
                          targetUserId={profileUserId}
                          size="medium"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <UserStats userId={profileUserId} />

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
              <div className="text-gray-500 text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p>No recent activity to display</p>
                <p className="text-sm mt-1">Your event registrations and activities will appear here</p>
              </div>
            </div>
          </div>
        );

      case 'events':
        return <UserEventHistory />;

      case 'registrations':
        return <UserRegistrations />;

      case 'followers':
        return <FollowersList userId={profileUserId!} />;

      case 'following':
        return <FollowingList userId={profileUserId!} />;

      case 'edit':
        return isOwnProfile ? <ProfileEditForm /> : null;

      default:
        return null;
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {isOwnProfile ? 'My Profile' : `${user?.name}'s Profile`}
            </h1>
            <p className="mt-2 text-gray-600">
              {isOwnProfile 
                ? 'Manage your profile, view your events, and track your running journey'
                : 'View profile, events, and running activity'
              }
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow-md mb-6">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mb-8">
            {renderTabContent()}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={() => window.location.href = '/events'}
                className="flex items-center justify-center gap-2 p-4 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Browse Events
              </button>

              {(user?.role === 'organizer' || user?.role === 'admin') && (
                <button 
                  onClick={() => window.location.href = '/events/create'}
                  className="flex items-center justify-center gap-2 p-4 border border-blue-300 text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Event
                </button>
              )}

              <button 
                onClick={() => window.location.href = '/dashboard'}
                className="flex items-center justify-center gap-2 p-4 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ProfilePage;