import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const CommunityPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Join Our Running Community</h1>
          <p className="mt-2 text-gray-600">
            Connect with fellow runners, share experiences, and grow together
          </p>
        </div>

        {/* Community Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Follow Runners</h3>
            <p className="text-gray-600">Connect with other members, follow their progress, and build meaningful running relationships.</p>
          </div>

          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Share & Discuss</h3>
            <p className="text-gray-600">Share your running experiences, get advice, and participate in event discussions.</p>
          </div>

          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Event Community</h3>
            <p className="text-gray-600">Join event discussions, share race experiences, and connect with fellow participants.</p>
          </div>
        </div>

        {/* Community Stats */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Community Highlights</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">500+</div>
              <div className="text-sm text-gray-600">Active Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">150+</div>
              <div className="text-sm text-gray-600">Events Hosted</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">2,500+</div>
              <div className="text-sm text-gray-600">Miles Run Together</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">25+</div>
              <div className="text-sm text-gray-600">Cities Connected</div>
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Getting Started</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">For New Members</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  Create your free account to join the community
                </li>
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  Browse and register for upcoming running events
                </li>
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  Follow other runners and build your network
                </li>
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  Share your running journey and experiences
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Community Guidelines</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  Be supportive and encouraging to all runners
                </li>
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  Share constructive advice and experiences
                </li>
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  Respect diverse running abilities and goals
                </li>
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  Keep discussions running-related and positive
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Recent Activity Preview */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Community Activity</h2>
            {isAuthenticated ? (
              <Link 
                to="/dashboard" 
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View Full Feed →
              </Link>
            ) : (
              <span className="text-gray-500 text-sm">Join to see full activity</span>
            )}
          </div>
          
          {/* Sample Activity Items */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                JD
              </div>
              <div className="flex-1">
                <div className="text-sm">
                  <span className="font-medium text-gray-900">John D.</span> registered for the 
                  <span className="font-medium text-blue-600"> Central Park 5K Fun Run</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">2 hours ago</div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                SM
              </div>
              <div className="flex-1">
                <div className="text-sm">
                  <span className="font-medium text-gray-900">Sarah M.</span> completed the 
                  <span className="font-medium text-green-600"> Brooklyn Bridge 10K</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">5 hours ago</div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                MR
              </div>
              <div className="flex-1">
                <div className="text-sm">
                  <span className="font-medium text-gray-900">Mike R.</span> commented on 
                  <span className="font-medium text-orange-600"> Marathon Training Tips</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">1 day ago</div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          {!isAuthenticated ? (
            <div className="space-x-4">
              <Link 
                to="/register"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium text-lg px-8 py-3 rounded-md transition-colors"
              >
                Join Community
              </Link>
              <Link 
                to="/login"
                className="inline-block border border-gray-300 hover:border-gray-400 text-gray-700 font-medium text-lg px-8 py-3 rounded-md transition-colors"
              >
                Sign In
              </Link>
            </div>
          ) : (
            <Link 
              to="/events"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium text-lg px-8 py-3 rounded-md transition-colors"
            >
              Discover Events
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;