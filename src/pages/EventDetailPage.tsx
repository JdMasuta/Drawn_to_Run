import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { useEvent, useEventComments, useRegisterForEvent, useAddEventComment } from '../hooks/useEvents';
import { useAuth } from '../hooks/useAuth';
import { formatDistanceToNow, format } from 'date-fns';

const EventDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedDistance, setSelectedDistance] = useState<string>('');
  const [newComment, setNewComment] = useState('');

  const eventId = parseInt(id || '0');
  
  const { 
    data: event, 
    isLoading: eventLoading, 
    error: eventError 
  } = useEvent(eventId, !!id);
  
  const { 
    data: comments = [], 
    isLoading: commentsLoading 
  } = useEventComments(eventId, !!id);
  
  const registerMutation = useRegisterForEvent();
  const addCommentMutation = useAddEventComment();

  const handleRegister = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!selectedDistance) {
      alert('Please select a distance');
      return;
    }

    try {
      await registerMutation.mutateAsync({
        eventId,
        data: { distance: selectedDistance }
      });
      alert('Registration successful!');
    } catch (error) {
      console.error('Registration failed:', error);
      alert('Registration failed. Please try again.');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/login');
      return;
    }

    if (!newComment.trim()) return;

    try {
      await addCommentMutation.mutateAsync({
        eventId,
        data: { content: newComment.trim() }
      });
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('Failed to add comment. Please try again.');
    }
  };

  if (eventLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded-lg mb-6"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="h-40 bg-gray-200 rounded mb-4"></div>
            </div>
            <div className="h-60 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (eventError || !event) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Event Not Found</h2>
          <p className="text-red-600 mb-4">
            The event you're looking for doesn't exist or has been removed.
          </p>
          <Link 
            to="/events" 
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  const eventDate = new Date(event.event_date);
  const isUpcoming = eventDate > new Date();
  const hasEarlyBird = event.early_bird_fee && event.early_bird_deadline && 
    new Date(event.early_bird_deadline) > new Date();

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          <li><Link to="/events" className="hover:text-blue-600">Events</Link></li>
          <li>/</li>
          <li className="text-gray-900 truncate">{event.title}</li>
        </ol>
      </nav>

      {/* Hero Section */}
      <div className="relative mb-8">
        {event.banner_image && (
          <div className="h-64 md:h-80 bg-gray-200 rounded-lg overflow-hidden">
            <img 
              src={event.banner_image} 
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className={`${event.banner_image ? 'absolute inset-0 bg-black bg-opacity-40 rounded-lg' : ''} flex items-end p-6`}>
          <div className={event.banner_image ? 'text-white' : 'text-gray-900'}>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{event.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                {format(eventDate, 'EEEE, MMMM d, yyyy')} at {format(eventDate, 'h:mm a')}
              </span>
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                {event.location}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <div>
              <div className="flex flex-wrap gap-2">
                {event.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">About This Event</h2>
            <div className="prose max-w-none text-gray-700">
              {event.description ? (
                <p className="whitespace-pre-wrap">{event.description}</p>
              ) : (
                <p className="text-gray-500 italic">No description provided.</p>
              )}
            </div>
          </div>

          {/* Event Details */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Details</h2>
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900">Distance Options</h3>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {event.distance_options.map((distance) => (
                      <span key={distance} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        {distance}
                      </span>
                    ))}
                  </div>
                </div>
                
                {event.capacity && (
                  <div>
                    <h3 className="font-medium text-gray-900">Capacity</h3>
                    <p className="mt-1 text-gray-700">
                      {event.registration_count || 0} / {event.capacity} registered
                    </p>
                  </div>
                )}
              </div>

              {event.organizer && (
                <div>
                  <h3 className="font-medium text-gray-900">Organized by</h3>
                  <p className="mt-1 text-gray-700">{event.organizer.name}</p>
                </div>
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Comments ({comments.length})
            </h2>

            {/* Add Comment Form */}
            {user ? (
              <form onSubmit={handleAddComment} className="mb-6">
                <div className="flex space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Add a comment..."
                      rows={3}
                    />
                    <div className="mt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={!newComment.trim() || addCommentMutation.isPending}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {addCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-600">
                  <Link to="/login" className="text-blue-600 hover:underline">
                    Sign in
                  </Link>{' '}
                  to join the conversation.
                </p>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {commentsLoading ? (
                <div className="animate-pulse space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                        <div className="h-12 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 text-sm font-medium">
                          {comment.user?.name?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {comment.user?.name || 'Anonymous'}
                        </span>
                        <span className="text-gray-500 text-sm">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No comments yet. Be the first to share your thoughts!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Registration Card */}
          {isUpcoming && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Register for Event</h3>
              
              {/* Pricing */}
              <div className="mb-4">
                {hasEarlyBird && (
                  <div className="mb-2">
                    <span className="text-green-600 font-medium">Early Bird: ${event.early_bird_fee}</span>
                    <p className="text-xs text-gray-500">
                      Until {format(new Date(event.early_bird_deadline!), 'MMM d, yyyy')}
                    </p>
                  </div>
                )}
                {event.registration_fee !== undefined && (
                  <div>
                    <span className="text-gray-900">
                      Regular: ${event.registration_fee === 0 ? 'Free' : event.registration_fee}
                    </span>
                  </div>
                )}
              </div>

              {/* Distance Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Distance
                </label>
                <select
                  value={selectedDistance}
                  onChange={(e) => setSelectedDistance(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose distance...</option>
                  {event.distance_options.map((distance) => (
                    <option key={distance} value={distance}>
                      {distance}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleRegister}
                disabled={registerMutation.isPending || !selectedDistance}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {registerMutation.isPending ? 'Registering...' : 'Register Now'}
              </button>

              {event.capacity && (
                <p className="mt-2 text-xs text-gray-500 text-center">
                  {event.capacity - (event.registration_count || 0)} spots remaining
                </p>
              )}
            </div>
          )}

          {/* Event Info */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${
                  event.status === 'active' ? 'text-green-600' : 
                  event.status === 'cancelled' ? 'text-red-600' : 
                  'text-gray-600'
                }`}>
                  {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span className="text-gray-900">
                  {format(new Date(event.created_at), 'MMM d, yyyy')}
                </span>
              </div>
              {event.registration_count !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Registered:</span>
                  <span className="text-gray-900">{event.registration_count} participants</span>
                </div>
              )}
            </div>
          </div>

          {/* Share Event */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Share Event</h3>
            <div className="flex space-x-2">
              <button className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 transition-colors">
                Copy Link
              </button>
              <button className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded text-sm hover:bg-gray-200 transition-colors">
                Share
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;