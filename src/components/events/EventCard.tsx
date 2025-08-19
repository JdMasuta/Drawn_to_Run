// EventCard component - Reusable card for displaying event information
import React from "react";
import { Link } from "react-router-dom";
import type { Event } from "../../types/api";

interface EventCardProps {
  event: Event;
  onRegister?: (eventId: number) => void;
  isRegistering?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onRegister,
  isRegistering = false,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      completed: "bg-gray-100 text-gray-800",
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${
          styles[status as keyof typeof styles] || styles.active
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const isRegistrationOpen = event.status === "active";
  const isCapacityFull =
    event.capacity &&
    event.registration_count &&
    event.registration_count >= event.capacity;

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      {/* Event Image */}
      <div className="w-full h-48 bg-gradient-to-br from-blue-400 to-blue-600 relative">
        {event.banner_image ? (
          <img
            src={event.banner_image}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="w-16 h-16 text-white opacity-80"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          {getStatusBadge(event.status)}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-6">
        {/* Title and Description */}
        <div className="mb-4">
          <Link
            to={`/events/${event.id}`}
            className="block hover:text-blue-600 transition-colors"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
              {event.title}
            </h3>
          </Link>

          {event.description && (
            <p className="text-gray-600 text-sm line-clamp-3">
              {event.description}
            </p>
          )}
        </div>

        {/* Event Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-500">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>
              {formatDate(event.event_date)} at {formatTime(event.event_date)}
            </span>
          </div>

          <div className="flex items-center text-sm text-gray-500">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="truncate">{event.location}</span>
          </div>

          {/* Capacity Info */}
          {event.capacity && (
            <div className="flex items-center text-sm text-gray-500">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span>
                {event.registration_count || 0} / {event.capacity} registered
                {isCapacityFull ? (
                  <span className="text-red-600 font-medium ml-1">(Full)</span>
                ) : null}{" "}
              </span>
            </div>
          )}

          {/* Organizer */}
          {event.organizer && (
            <div className="flex items-center text-sm text-gray-500">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span>by {event.organizer.name}</span>
            </div>
          )}
        </div>

        {/* Distance Options */}
        {event.distance_options && event.distance_options.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {event.distance_options.map((distance, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
              >
                {distance}
              </span>
            ))}
          </div>
        )}

        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {event.tags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="px-2 py-1 text-xs font-medium rounded-full"
                style={{
                  backgroundColor: tag.color + "20",
                  color: tag.color,
                }}
              >
                {tag.name}
              </span>
            ))}
            {event.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                +{event.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Registration Fee */}
        {event.registration_fee && (
          <div className="text-lg font-semibold text-gray-900 mb-4">
            ${event.registration_fee}
            {event.early_bird_fee && event.early_bird_deadline && (
              <span className="text-sm text-green-600 ml-2">
                (Early bird: ${event.early_bird_fee})
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Link
            to={`/events/${event.id}`}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors text-center"
          >
            View Details
          </Link>

          {isRegistrationOpen && !isCapacityFull && onRegister && (
            <button
              onClick={() => onRegister(event.id)}
              disabled={isRegistering}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-md transition-colors"
            >
              {isRegistering ? "Registering..." : "Register"}
            </button>
          )}

          {isCapacityFull && (
            <div className="flex-1 px-4 py-2 text-sm font-medium text-gray-500 bg-gray-100 rounded-md text-center cursor-not-allowed">
              Full
            </div>
          )}

          {event.status === "cancelled" && (
            <div className="flex-1 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md text-center">
              Cancelled
            </div>
          )}

          {event.status === "completed" && (
            <div className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-md text-center">
              Completed
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
