import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ActivityFeed } from '../components/community/ActivityFeed';

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  // Redirect if not authenticated
  if (!isAuthenticated || !user) {
    navigate('/login');
    return null;
  }

  const handleUserClick = (userId: number) => {
    navigate(`/profile?id=${userId}`);
  };

  const handleEventClick = (eventId: number) => {
    navigate(`/events/${eventId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user.name}! 👋
              </h1>
              <p className="text-gray-600 mt-1">
                Here's what's happening in your running community
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/events')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Discover Events
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
              >
                View Profile
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming Events</p>
                <p className="text-2xl font-bold text-gray-900">3</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <span className="text-green-600 text-lg">🏃‍♀️</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Following</p>
                <p className="text-2xl font-bold text-gray-900">12</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <span className="text-blue-600 text-lg">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Races</p>
                <p className="text-2xl font-bold text-gray-900">8</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <span className="text-orange-600 text-lg">🏆</span>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <ActivityFeed
            onUserClick={handleUserClick}
            onEventClick={handleEventClick}
            limit={20}
          />
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;