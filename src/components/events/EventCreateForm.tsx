import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { EventService } from '../../services/eventService';
import { useTagsByCategory, useAssignTagsToEvent } from '../../hooks/useTags';
import { TagChip } from '../ui/TagChip';
import type { CreateEventRequest, Tag } from '../../types/api';

interface EventCreateFormProps {
  onSuccess?: (eventId: number) => void;
  onCancel?: () => void;
}

interface FormData {
  title: string;
  description: string;
  event_date: string;
  location: string;
  distance_options: { value: string }[];
  capacity?: number;
  registration_fee?: number;
  early_bird_fee?: number;
  early_bird_deadline?: string;
}

export const EventCreateForm: React.FC<EventCreateFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  
  // Fetch available tags
  const { categories, isLoading: tagsLoading } = useTagsByCategory();
  const assignTagsMutation = useAssignTagsToEvent();

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      title: '',
      description: '',
      event_date: '',
      location: '',
      distance_options: [{ value: '5K' }],
      capacity: undefined,
      registration_fee: undefined,
      early_bird_fee: undefined,
      early_bird_deadline: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'distance_options',
  });

  const watchEarlyBirdFee = watch('early_bird_fee');
  const watchEventDate = watch('event_date');

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Transform form data to match API requirements
      const eventData: CreateEventRequest = {
        title: data.title,
        description: data.description || undefined,
        event_date: data.event_date,
        location: data.location,
        distance_options: data.distance_options.map(d => d.value).filter(Boolean),
        capacity: data.capacity || undefined,
        registration_fee: data.registration_fee || undefined,
        early_bird_fee: data.early_bird_fee || undefined,
        early_bird_deadline: data.early_bird_deadline || undefined,
      };

      const newEvent = await EventService.createEvent(eventData);
      
      // Assign tags if any are selected
      if (selectedTags.length > 0) {
        try {
          await assignTagsMutation.mutateAsync({
            eventId: newEvent.id,
            tagIds: selectedTags
          });
        } catch (tagError) {
          console.error('Failed to assign tags:', tagError);
          // Event was created successfully, but tags failed - continue anyway
        }
      }
      
      if (onSuccess) {
        onSuccess(newEvent.id);
      } else {
        navigate(`/events/${newEvent.id}`);
      }
    } catch (error) {
      console.error('Event creation failed:', error);
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to create event. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const addDistanceOption = () => {
    append({ value: '' });
  };

  const removeDistanceOption = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  // Generate min date (today) for date inputs
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Create New Event</h2>
        <p className="text-gray-600 mt-1">Fill out the details for your running event</p>
      </div>

      {submitError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600 text-sm">{submitError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Event Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Event Title *
          </label>
          <input
            type="text"
            {...register('title', {
              required: 'Event title is required',
              minLength: { value: 3, message: 'Title must be at least 3 characters' },
              maxLength: { value: 255, message: 'Title must be less than 255 characters' },
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Central Park 5K Fun Run"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        {/* Event Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            {...register('description', {
              maxLength: { value: 2000, message: 'Description must be less than 2000 characters' },
            })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Describe your event, what makes it special, and any important details participants should know..."
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        {/* Event Date and Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Event Date & Time *
          </label>
          <input
            type="datetime-local"
            {...register('event_date', {
              required: 'Event date and time are required',
              validate: (value) => {
                const eventDate = new Date(value);
                const now = new Date();
                if (eventDate <= now) {
                  return 'Event must be scheduled for a future date and time';
                }
                return true;
              },
            })}
            min={new Date().toISOString().slice(0, 16)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.event_date && (
            <p className="mt-1 text-sm text-red-600">{errors.event_date.message}</p>
          )}
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location *
          </label>
          <input
            type="text"
            {...register('location', {
              required: 'Event location is required',
              maxLength: { value: 255, message: 'Location must be less than 255 characters' },
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Central Park, New York, NY"
          />
          {errors.location && (
            <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
          )}
        </div>

        {/* Distance Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Distance Options *
          </label>
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <input
                  type="text"
                  {...register(`distance_options.${index}.value`, {
                    required: 'Distance option is required',
                    pattern: {
                      value: /^[0-9]+[KkMm]?.*$/,
                      message: 'Please enter a valid distance (e.g., 5K, 10K, Marathon)',
                    },
                  })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 5K, 10K, Half Marathon"
                />
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDistanceOption(index)}
                    className="px-3 py-2 text-red-600 hover:text-red-800 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            {errors.distance_options?.[0]?.value && (
              <p className="text-sm text-red-600">{errors.distance_options[0].value.message}</p>
            )}
          </div>
          
          <button
            type="button"
            onClick={addDistanceOption}
            className="mt-2 px-4 py-2 text-blue-600 hover:text-blue-800 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
          >
            Add Distance Option
          </button>
        </div>

        {/* Event Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Event Tags
          </label>
          <p className="text-sm text-gray-500 mb-3">
            Select tags to help participants discover your event
          </p>
          
          {tagsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                  <div className="flex gap-2">
                    <div className="h-6 bg-gray-200 rounded-full w-12 animate-pulse"></div>
                    <div className="h-6 bg-gray-200 rounded-full w-16 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(categories).map(([categoryKey, tags]) => {
                if (!Array.isArray(tags) || !tags.length) return null;
                
                const categoryConfig: Record<string, { label: string; description: string }> = {
                  distance: { label: 'Distance', description: 'Race distances offered' },
                  location: { label: 'Location Type', description: 'Venue and terrain' },
                  type: { label: 'Event Type', description: 'Event category' },
                  difficulty: { label: 'Difficulty', description: 'Challenge level' },
                };
                
                const config = categoryConfig[categoryKey];
                if (!config) return null;
                
                return (
                  <div key={categoryKey} className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900">
                      {config.label}
                      <span className="text-xs text-gray-500 ml-2">({config.description})</span>
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {(tags as Tag[]).map((tag: Tag) => (
                        <TagChip
                          key={tag.id}
                          tag={tag}
                          variant={selectedTags.includes(tag.id) ? 'selected' : 'clickable'}
                          size="sm"
                          onClick={(clickedTag) => {
                            setSelectedTags(prev => 
                              prev.includes(clickedTag.id)
                                ? prev.filter(id => id !== clickedTag.id)
                                : [...prev, clickedTag.id]
                            );
                          }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {/* Selected tags summary */}
              {selectedTags.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="text-sm font-medium text-blue-800 mb-2">
                    Selected Tags ({selectedTags.length})
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {Object.values(categories).flat()
                      .filter((tag: any): tag is Tag => tag && selectedTags.includes(tag.id))
                      .map((tag: Tag) => (
                        <TagChip
                          key={tag.id}
                          tag={tag}
                          variant="removable"
                          size="sm"
                          onRemove={(removedTag) => {
                            setSelectedTags(prev => prev.filter(id => id !== removedTag.id));
                          }}
                        />
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Capacity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Participant Capacity
          </label>
          <input
            type="number"
            {...register('capacity', {
              min: { value: 1, message: 'Capacity must be at least 1' },
              max: { value: 10000, message: 'Capacity cannot exceed 10,000' },
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Leave empty for unlimited capacity"
            min="1"
            max="10000"
          />
          {errors.capacity && (
            <p className="mt-1 text-sm text-red-600">{errors.capacity.message}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Maximum number of participants (optional)
          </p>
        </div>

        {/* Registration Fee */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Registration Fee ($)
            </label>
            <input
              type="number"
              step="0.01"
              {...register('registration_fee', {
                min: { value: 0, message: 'Fee cannot be negative' },
                max: { value: 1000, message: 'Fee cannot exceed $1,000' },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
              min="0"
              max="1000"
            />
            {errors.registration_fee && (
              <p className="mt-1 text-sm text-red-600">{errors.registration_fee.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Early Bird Fee ($)
            </label>
            <input
              type="number"
              step="0.01"
              {...register('early_bird_fee', {
                min: { value: 0, message: 'Fee cannot be negative' },
                max: { value: 1000, message: 'Fee cannot exceed $1,000' },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
              min="0"
              max="1000"
            />
            {errors.early_bird_fee && (
              <p className="mt-1 text-sm text-red-600">{errors.early_bird_fee.message}</p>
            )}
          </div>
        </div>

        {/* Early Bird Deadline */}
        {watchEarlyBirdFee && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Early Bird Deadline
            </label>
            <input
              type="date"
              {...register('early_bird_deadline', {
                validate: (value) => {
                  if (!value) return true; // Optional field
                  const deadline = new Date(value);
                  const eventDate = new Date(watchEventDate);
                  if (deadline >= eventDate) {
                    return 'Early bird deadline must be before the event date';
                  }
                  if (deadline <= new Date()) {
                    return 'Early bird deadline must be in the future';
                  }
                  return true;
                },
              })}
              min={today}
              max={watchEventDate ? watchEventDate.split('T')[0] : undefined}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.early_bird_deadline && (
              <p className="mt-1 text-sm text-red-600">{errors.early_bird_deadline.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Last date for early bird pricing
            </p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 sm:flex-none px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Creating Event...' : 'Create Event'}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-6 py-3 bg-gray-200 text-gray-800 font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default EventCreateForm;