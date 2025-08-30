import { formatDistanceToNow } from 'date-fns';
import type { Activity, ActivityCardProps, ActivityType } from '../../types';
import { UserAvatar } from '../ui/UserAvatar';

export function ActivityCard({ activity, onUserClick, onEventClick }: ActivityCardProps) {
  const getActivityIcon = (type: ActivityType): string => {
    switch (type) {
      case 'user_registered':
        return '🏃';
      case 'user_followed':
        return '👥';
      case 'event_created':
        return '🏁';
      case 'event_completed':
        return '🏆';
      case 'comment_posted':
        return '💬';
      default:
        return '📋';
    }
  };

  const getActivityText = (activity: Activity): React.ReactNode => {
    const userName = activity.user?.name || 'Someone';
    const userElement = (
      <button
        onClick={() => onUserClick?.(activity.user_id)}
        className="font-semibold text-blue-600 hover:text-blue-800 transition-colors"
      >
        {userName}
      </button>
    );

    switch (activity.type) {
      case 'user_registered':
        const eventName = activity.target_event?.title || 'an event';
        const distance = activity.metadata?.distance;
        return (
          <span>
            {userElement} registered for{' '}
            <button
              onClick={() => onEventClick?.(activity.target_id)}
              className="font-semibold text-green-600 hover:text-green-800 transition-colors"
            >
              {eventName}
            </button>
            {distance && <span className="text-gray-600"> ({distance})</span>}
          </span>
        );

      case 'user_followed':
        const followedUserName = activity.target_user?.name || 'someone';
        return (
          <span>
            {userElement} started following{' '}
            <button
              onClick={() => onUserClick?.(activity.target_id)}
              className="font-semibold text-purple-600 hover:text-purple-800 transition-colors"
            >
              {followedUserName}
            </button>
          </span>
        );

      case 'event_created':
        const createdEventName = activity.target_event?.title || 'a new event';
        return (
          <span>
            {userElement} created{' '}
            <button
              onClick={() => onEventClick?.(activity.target_id)}
              className="font-semibold text-green-600 hover:text-green-800 transition-colors"
            >
              {createdEventName}
            </button>
          </span>
        );

      case 'event_completed':
        const completedEventName = activity.target_event?.title || 'an event';
        const finishTime = activity.metadata?.finish_time;
        return (
          <span>
            {userElement} completed{' '}
            <button
              onClick={() => onEventClick?.(activity.target_id)}
              className="font-semibold text-orange-600 hover:text-orange-800 transition-colors"
            >
              {completedEventName}
            </button>
            {finishTime && (
              <span className="text-gray-600"> in {finishTime}</span>
            )}
          </span>
        );

      case 'comment_posted':
        const commentEventName = activity.target_event?.title || 'an event';
        return (
          <span>
            {userElement} commented on{' '}
            <button
              onClick={() => onEventClick?.(activity.target_event?.id || activity.target_id)}
              className="font-semibold text-blue-600 hover:text-blue-800 transition-colors"
            >
              {commentEventName}
            </button>
          </span>
        );

      default:
        return <span>{userElement} did something</span>;
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'some time ago';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-3">
        {/* Activity Icon */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg">
            {getActivityIcon(activity.type)}
          </div>
        </div>

        {/* Activity Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              {/* User Avatar */}
              {activity.user && (
                <UserAvatar
                  user={activity.user}
                  size="sm"
                  onClick={() => onUserClick?.(activity.user_id)}
                  className="cursor-pointer"
                />
              )}
              
              {/* Activity Text */}
              <div className="text-sm text-gray-900">
                {getActivityText(activity)}
              </div>
            </div>

            {/* Timestamp */}
            <div className="flex-shrink-0 text-xs text-gray-500">
              {formatTimeAgo(activity.created_at)}
            </div>
          </div>

          {/* Event Description for event_created activities */}
          {activity.type === 'event_created' && activity.target_event?.description && (
            <div className="mt-2 text-sm text-gray-600 line-clamp-2">
              {activity.target_event.description}
            </div>
          )}

          {/* Comment content for comment_posted activities */}
          {activity.type === 'comment_posted' && activity.metadata?.content && (
            <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700 line-clamp-3">
              "{activity.metadata.content}"
            </div>
          )}

          {/* Event details for registrations and completions */}
          {(activity.type === 'user_registered' || activity.type === 'event_completed') && 
           activity.target_event && (
            <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
              <span>📅 {new Date(activity.target_event.event_date).toLocaleDateString()}</span>
              <span>📍 {activity.target_event.location}</span>
              {activity.target_event.distance_options.length > 0 && (
                <span>🏃 {activity.target_event.distance_options.join(', ')}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ActivityCard;