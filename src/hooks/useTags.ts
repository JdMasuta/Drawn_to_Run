// React Query hooks for tag management
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TagService, type TagResponse } from '../services/tagService';
import type { Tag } from '../types/api';

// Query key factory for consistent caching
const TAGS_QUERY_KEY = 'tags';

/**
 * Hook to fetch all available tags
 */
export const useTags = () => {
  return useQuery<TagResponse, Error>({
    queryKey: [TAGS_QUERY_KEY],
    queryFn: TagService.getTags,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime in newer React Query versions)
  });
};

/**
 * Hook to create a new tag (admin only)
 */
export const useCreateTag = () => {
  const queryClient = useQueryClient();

  return useMutation<Tag, Error, Omit<Tag, 'id'>>({
    mutationFn: TagService.createTag,
    onSuccess: () => {
      // Invalidate and refetch tags
      queryClient.invalidateQueries({ queryKey: [TAGS_QUERY_KEY] });
    },
  });
};

/**
 * Hook to update an existing tag (admin only)
 */
export const useUpdateTag = () => {
  const queryClient = useQueryClient();

  return useMutation<Tag, Error, { tagId: number; data: Partial<Omit<Tag, 'id'>> }>({
    mutationFn: ({ tagId, data }) => TagService.updateTag(tagId, data),
    onSuccess: () => {
      // Invalidate and refetch tags
      queryClient.invalidateQueries({ queryKey: [TAGS_QUERY_KEY] });
    },
  });
};

/**
 * Hook to delete a tag (admin only)
 */
export const useDeleteTag = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: TagService.deleteTag,
    onSuccess: () => {
      // Invalidate and refetch tags
      queryClient.invalidateQueries({ queryKey: [TAGS_QUERY_KEY] });
    },
  });
};

/**
 * Hook to assign tags to an event
 */
export const useAssignTagsToEvent = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { eventId: number; tagIds: number[] }>({
    mutationFn: ({ eventId, tagIds }) => TagService.assignTagsToEvent(eventId, tagIds),
    onSuccess: () => {
      // Invalidate events queries to refresh event data with new tags
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
};

/**
 * Hook to remove tags from an event
 */
export const useRemoveTagsFromEvent = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { eventId: number; tagIds: number[] }>({
    mutationFn: ({ eventId, tagIds }) => TagService.removeTagsFromEvent(eventId, tagIds),
    onSuccess: () => {
      // Invalidate events queries to refresh event data
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
};

/**
 * Helper hook to get tags by category
 */
export const useTagsByCategory = (category?: string) => {
  const { data: tagsData, ...rest } = useTags();
  
  const tagsByCategory = tagsData?.categories || {};
  const filteredTags = category ? tagsByCategory[category] || [] : tagsData?.tags || [];
  
  return {
    tags: filteredTags,
    categories: tagsByCategory,
    allTags: tagsData?.tags || [],
    ...rest,
  };
};