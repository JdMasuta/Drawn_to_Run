// React Query hooks for event management
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EventService } from '../services/eventService';
import { useAuth } from './useAuth';
import type { 
  EventQueryParams, 
  EventRegistrationRequest,
  CreateCommentRequest 
} from '../types/api';

// Query keys for React Query
export const eventKeys = {
  all: ['events'] as const,
  lists: () => [...eventKeys.all, 'list'] as const,
  list: (params?: EventQueryParams) => [...eventKeys.lists(), params] as const,
  details: () => [...eventKeys.all, 'detail'] as const,
  detail: (id: number) => [...eventKeys.details(), id] as const,
  comments: (id: number) => [...eventKeys.detail(id), 'comments'] as const,
};

/**
 * Hook to fetch events with filtering and pagination
 */
export const useEvents = (params?: EventQueryParams) => {
  return useQuery({
    queryKey: eventKeys.list(params),
    queryFn: () => EventService.getEvents(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook to fetch a single event
 */
export const useEvent = (eventId: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: eventKeys.detail(eventId),
    queryFn: () => EventService.getEvent(eventId),
    enabled: enabled && !!eventId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch event comments
 */
export const useEventComments = (eventId: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: eventKeys.comments(eventId),
    queryFn: () => EventService.getEventComments(eventId),
    enabled: enabled && !!eventId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

/**
 * Hook to register for an event
 */
export const useRegisterForEvent = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: number; data: EventRegistrationRequest }) =>
      EventService.registerForEvent(eventId, data),
    onSuccess: (_, { eventId }) => {
      // Invalidate and refetch event details to update registration count
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(eventId) });
      
      // Invalidate events list to update registration counts
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      
      // If we have user registrations cached, invalidate those too
      if (user) {
        queryClient.invalidateQueries({ 
          queryKey: ['users', user.id, 'registrations'] 
        });
      }
    },
    onError: (error) => {
      console.error('Failed to register for event:', error);
    },
  });
};

/**
 * Hook to add a comment to an event
 */
export const useAddEventComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: number; data: CreateCommentRequest }) =>
      EventService.addEventComment(eventId, data),
    onSuccess: (_, { eventId }) => {
      // Invalidate and refetch comments
      queryClient.invalidateQueries({ queryKey: eventKeys.comments(eventId) });
    },
    onError: (error) => {
      console.error('Failed to add comment:', error);
    },
  });
};

/**
 * Hook to get user's registrations
 */
export const useUserRegistrations = (userId: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['users', userId, 'registrations'],
    queryFn: () => EventService.getUserRegistrations(userId),
    enabled: enabled && !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};