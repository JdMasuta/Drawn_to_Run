// UserEventHistory component - Display user's created events
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useEvents } from '../../hooks/useEvents';
import { EventCard } from '../events/EventCard';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import type { Event } from '../../types/api';

export const UserEventHistory: React.FC = () => {
  const { user } = useAuth();
  const { data: eventsData, isLoading, error } = useEvents();

  // Filter events created by this user
  const userEvents = eventsData?.events?.filter((event: Event) => event.created_by === user?.id) || [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading events</h3>
            <p className="text-sm text-red-700 mt-1">
              Unable to load your events. Please try refreshing the page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">My Events</h2>
            <p className="text-gray-600 mt-1">
              Events you've created{user?.role === 'participant' ? ' (requires organizer role)' : ''}
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {userEvents.length} {userEvents.length === 1 ? 'event' : 'events'}
          </div>
        </div>
      </div>

      {/* Events List */}
      {userEvents.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events created yet</h3>
            {user?.role === 'participant' ? (
              <div className="text-gray-500 space-y-2">
                <p>You need organizer privileges to create events.</p>
                <p className="text-sm">Contact an administrator to upgrade your account.</p>
              </div>
            ) : (
              <div className="text-gray-500 space-y-4">
                <p>You haven't created any events yet.</p>
                <button
                  onClick={() => window.location.href = '/events/create'}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Your First Event
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {userEvents.map((event: Event) => (
            <div key={event.id} className="relative">
              <EventCard event={event} />
              {/* Event Management Badge */}
              <div className="absolute top-2 right-2">
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  Your Event
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Event Statistics */}
      {userEvents.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{userEvents.length}</div>
              <div className="text-sm text-gray-500">Total Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {userEvents.filter((event: Event) => new Date(event.event_date) > new Date()).length}
              </div>
              <div className="text-sm text-gray-500">Upcoming Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {userEvents.filter((event: Event) => new Date(event.event_date) < new Date()).length}
              </div>
              <div className="text-sm text-gray-500">Past Events</div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {(user?.role === 'organizer' || user?.role === 'admin') && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Management</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => window.location.href = '/events/create'}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Event
            </button>
            <button
              onClick={() => window.location.href = '/events'}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Browse All Events
            </button>
          </div>
        </div>
      )}
    </div>
  );
};