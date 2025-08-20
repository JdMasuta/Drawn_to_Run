// UserRegistrations component - Display user's event registrations
import React from 'react';
import { useEvents } from '../../hooks/useEvents';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import type { Event } from '../../types/api';

interface MockRegistration {
  id: number;
  event_id: number;
  distance: string;
  status: 'registered' | 'completed' | 'dns' | 'dnf';
  bib_number?: number;
  finish_time?: string;
  registered_at: string;
  completed_at?: string;
  event?: Event;
}

export const UserRegistrations: React.FC = () => {
  const { data: eventsData, isLoading, error } = useEvents();

  // Mock registrations data - in real implementation, this would come from API
  const mockRegistrations: MockRegistration[] = [
    {
      id: 1,
      event_id: 1,
      distance: '5K',
      status: 'completed',
      bib_number: 142,
      finish_time: '24:15',
      registered_at: '2024-01-15T10:30:00Z',
      completed_at: '2024-02-15T09:45:00Z'
    },
    {
      id: 2,
      event_id: 2,
      distance: '10K',
      status: 'registered',
      bib_number: 89,
      registered_at: '2024-01-20T14:22:00Z'
    },
    {
      id: 3,
      event_id: 3,
      distance: 'Half Marathon',
      status: 'completed',
      bib_number: 256,
      finish_time: '1:45:33',
      registered_at: '2024-02-01T16:15:00Z',
      completed_at: '2024-03-01T08:30:00Z'
    }
  ];

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
            <h3 className="text-sm font-medium text-red-800">Error loading registrations</h3>
            <p className="text-sm text-red-700 mt-1">
              Unable to load your registrations. Please try refreshing the page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const events = eventsData?.events || [];
  
  // Get event details for each registration
  const registrationsWithEvents = mockRegistrations.map(registration => {
    const event = events.find((e: Event) => e.id === registration.event_id);
    return { ...registration, event };
  }).filter(reg => reg.event); // Only show registrations for existing events

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'registered':
        return 'bg-blue-100 text-blue-800';
      case 'dns':
        return 'bg-yellow-100 text-yellow-800';
      case 'dnf':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'registered':
        return 'Registered';
      case 'dns':
        return 'Did Not Start';
      case 'dnf':
        return 'Did Not Finish';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">My Registrations</h2>
            <p className="text-gray-600 mt-1">
              Events you've registered for and completed
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {registrationsWithEvents.length} {registrationsWithEvents.length === 1 ? 'registration' : 'registrations'}
          </div>
        </div>
      </div>

      {/* Registrations List */}
      {registrationsWithEvents.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No registrations yet</h3>
            <div className="text-gray-500 space-y-4">
              <p>You haven't registered for any events yet.</p>
              <button
                onClick={() => window.location.href = '/events'}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Browse Events
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {registrationsWithEvents.map((registration) => (
            <div key={registration.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {registration.event?.title}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(registration.status)}`}>
                      {getStatusLabel(registration.status)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Distance:</span>
                      <span className="ml-2 font-medium text-gray-900">{registration.distance}</span>
                    </div>
                    
                    {registration.bib_number && (
                      <div>
                        <span className="text-gray-500">Bib Number:</span>
                        <span className="ml-2 font-medium text-gray-900">#{registration.bib_number}</span>
                      </div>
                    )}
                    
                    <div>
                      <span className="text-gray-500">Event Date:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {new Date(registration.event?.event_date || '').toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-gray-500">Registered:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {new Date(registration.registered_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {registration.finish_time && (
                    <div className="mt-3 p-3 bg-green-50 rounded-md">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-green-800 font-medium">
                          Finish Time: {registration.finish_time}
                        </span>
                      </div>
                      {registration.completed_at && (
                        <p className="text-green-700 text-sm mt-1">
                          Completed on {new Date(registration.completed_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mt-4 text-sm text-gray-600">
                    <p>{registration.event?.location}</p>
                  </div>
                </div>
                
                <div className="ml-4">
                  <button
                    onClick={() => window.location.href = `/events/${registration.event?.id}`}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Registration Statistics */}
      {registrationsWithEvents.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Registration Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{registrationsWithEvents.length}</div>
              <div className="text-sm text-gray-500">Total Registrations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {registrationsWithEvents.filter(reg => reg.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-500">Completed Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {registrationsWithEvents.filter(reg => reg.status === 'registered').length}
              </div>
              <div className="text-sm text-gray-500">Upcoming Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {registrationsWithEvents.filter(reg => reg.finish_time).length}
              </div>
              <div className="text-sm text-gray-500">Personal Records</div>
            </div>
          </div>
        </div>
      )}

      {/* Race Performance Summary */}
      {registrationsWithEvents.filter(reg => reg.finish_time).length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Records</h3>
          <div className="space-y-3">
            {registrationsWithEvents
              .filter(reg => reg.finish_time)
              .map((registration) => (
                <div key={registration.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <span className="font-medium text-gray-900">{registration.distance}</span>
                    <span className="text-gray-500 ml-2">• {registration.event?.title}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">{registration.finish_time}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(registration.completed_at || '').toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};