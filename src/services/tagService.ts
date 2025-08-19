// Tag service for API calls
import type { Tag } from '../types/api';

export interface TagResponse {
  tags: Tag[];
  categories: Record<string, Tag[]>;
}

export class TagService {
  /**
   * Get all available tags grouped by category
   */
  static async getTags(): Promise<TagResponse> {
    const response = await fetch('/api/tags', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tags: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to fetch tags');
    }

    return data.data;
  }

  /**
   * Create new tag (admin only)
   */
  static async createTag(data: Omit<Tag, 'id'>): Promise<Tag> {
    const response = await fetch('/api/tags', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create tag: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to create tag');
    }

    return result.data;
  }

  /**
   * Update existing tag (admin only)
   */
  static async updateTag(tagId: number, data: Partial<Omit<Tag, 'id'>>): Promise<Tag> {
    const response = await fetch(`/api/tags/${tagId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update tag: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to update tag');
    }

    return result.data;
  }

  /**
   * Delete tag (admin only)
   */
  static async deleteTag(tagId: number): Promise<void> {
    const response = await fetch(`/api/tags/${tagId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete tag: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to delete tag');
    }
  }

  /**
   * Assign tags to an event (organizer+ only)
   */
  static async assignTagsToEvent(eventId: number, tagIds: number[]): Promise<void> {
    const response = await fetch(`/api/events/${eventId}/tags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: JSON.stringify({ tagIds }),
    });

    if (!response.ok) {
      throw new Error(`Failed to assign tags to event: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to assign tags to event');
    }
  }

  /**
   * Remove tags from an event (organizer+ only)
   */
  static async removeTagsFromEvent(eventId: number, tagIds: number[]): Promise<void> {
    const response = await fetch(`/api/events/${eventId}/tags`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: JSON.stringify({ tagIds }),
    });

    if (!response.ok) {
      throw new Error(`Failed to remove tags from event: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to remove tags from event');
    }
  }
}