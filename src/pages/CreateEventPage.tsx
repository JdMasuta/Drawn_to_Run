import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { EventCreateForm } from '../components/events/EventCreateForm';

const CreateEventPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleEventCreated = (eventId: number) => {
    // Redirect to the newly created event's detail page
    navigate(`/events/${eventId}`);
  };

  const handleCancel = () => {
    // Go back to events list
    navigate('/events');
  };

  return (
    <ProtectedRoute requiredRole={['organizer', 'admin']}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <ol className="flex items-center space-x-2 text-sm text-gray-500">
              <li>
                <Link to="/events" className="hover:text-blue-600 transition-colors">
                  Events
                </Link>
              </li>
              <li>/</li>
              <li className="text-gray-900">Create Event</li>
            </ol>
          </nav>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Create New Event</h1>
            <p className="mt-2 text-gray-600">
              Create a new running event for the community. Fill out all the details to help participants 
              understand what to expect and how to register.
            </p>
          </div>

          {/* User Role Info */}
          {user && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="text-blue-800 text-sm">
                  Creating as <strong>{user.name}</strong> ({user.role})
                </span>
              </div>
            </div>
          )}

          {/* Help Text */}
          <div className="mb-8 bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Creation Guidelines</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Required Information</h3>
                <ul className="space-y-1">
                  <li>• Event title and description</li>
                  <li>• Date, time, and location</li>
                  <li>• At least one distance option</li>
                  <li>• Clear event details for participants</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Best Practices</h3>
                <ul className="space-y-1">
                  <li>• Use descriptive, engaging titles</li>
                  <li>• Include route details and terrain info</li>
                  <li>• Set appropriate capacity limits</li>
                  <li>• Consider early bird pricing</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Event Creation Form */}
          <EventCreateForm 
            onSuccess={handleEventCreated}
            onCancel={handleCancel}
          />

          {/* Additional Help */}
          <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Need Help?</h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p>
                <strong>Event Approval:</strong> All events are subject to review. Events will be visible to participants 
                once approved by the platform administrators.
              </p>
              <p>
                <strong>Managing Events:</strong> After creation, you can view registrations, communicate with participants, 
                and manage event details through your event dashboard.
              </p>
              <p>
                <strong>Cancellations:</strong> If you need to cancel an event, contact support or update the event status. 
                Registered participants will be notified automatically.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link
              to="/events"
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Events
            </Link>

            {user?.role === 'admin' && (
              <Link
                to="/admin/events"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Event Management
              </Link>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default CreateEventPage;