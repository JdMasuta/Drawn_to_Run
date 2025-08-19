// TagFilter component - Advanced tag filtering interface
import React, { useState } from 'react';
import { useTagsByCategory } from '../../hooks/useTags';
import { TagChip } from '../ui/TagChip';
import type { Tag } from '../../types/api';

interface TagFilterProps {
  selectedTags: number[];
  onTagsChange: (tagIds: number[]) => void;
  className?: string;
}

export const TagFilter: React.FC<TagFilterProps> = ({
  selectedTags,
  onTagsChange,
  className = '',
}) => {
  const { categories, isLoading, error } = useTagsByCategory();
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['distance']);

  // Handle tag selection/deselection
  const handleTagToggle = (tag: Tag) => {
    const isSelected = selectedTags.includes(tag.id);
    let newSelectedTags: number[];

    if (isSelected) {
      newSelectedTags = selectedTags.filter(id => id !== tag.id);
    } else {
      newSelectedTags = [...selectedTags, tag.id];
    }

    onTagsChange(newSelectedTags);
  };

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Clear all selected tags
  const clearAllTags = () => {
    onTagsChange([]);
  };

  // Category display configuration
  const categoryConfig: Record<string, { label: string; icon: string; description: string }> = {
    distance: {
      label: 'Distance',
      icon: '📏',
      description: 'Filter by race distance',
    },
    location: {
      label: 'Location Type',
      icon: '📍',
      description: 'Filter by venue type',
    },
    type: {
      label: 'Event Type',
      icon: '🏃',
      description: 'Filter by event category',
    },
    difficulty: {
      label: 'Difficulty',
      icon: '💪',
      description: 'Filter by challenge level',
    },
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">Tags</h3>
          <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
        </div>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
            <div className="flex gap-2">
              <div className="h-6 bg-gray-200 rounded-full w-12 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded-full w-16 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded-full w-10 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <h3 className="text-sm font-medium text-gray-900">Tags</h3>
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
          Failed to load tags. Please try again later.
        </div>
      </div>
    );
  }

  const hasSelectedTags = selectedTags.length > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">Tags</h3>
        {hasSelectedTags && (
          <button
            onClick={clearAllTags}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Selected tags summary */}
      {hasSelectedTags && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="text-xs text-blue-800 font-medium mb-2">
            {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''} selected
          </div>
          <div className="flex flex-wrap gap-1">
            {Object.values(categories).flat()
              .filter((tag): tag is Tag => {
                return tag && typeof tag === 'object' && 'id' in tag && selectedTags.includes((tag as Tag).id);
              })
              .map((tag: Tag) => (
                <TagChip
                  key={tag.id}
                  tag={tag}
                  variant="removable"
                  size="sm"
                  onRemove={handleTagToggle}
                />
              ))}
          </div>
        </div>
      )}

      {/* Category sections */}
      <div className="space-y-3">
        {Object.entries(categories).map(([categoryKey, tags]) => {
          const config = categoryConfig[categoryKey];
          if (!config || !Array.isArray(tags) || !tags.length) return null;

          const isExpanded = expandedCategories.includes(categoryKey);
          const categorySelectedCount = tags.filter((tag: any) => selectedTags.includes(tag.id)).length;

          return (
            <div key={categoryKey} className="border border-gray-200 rounded-md">
              {/* Category header */}
              <button
                onClick={() => toggleCategory(categoryKey)}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{config.icon}</span>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {config.label}
                      {categorySelectedCount > 0 && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                          {categorySelectedCount}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">{config.description}</div>
                  </div>
                </div>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Category tags */}
              {isExpanded && (
                <div className="px-3 pb-3">
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag: any) => (
                      <TagChip
                        key={tag.id}
                        tag={tag}
                        variant={selectedTags.includes(tag.id) ? 'selected' : 'clickable'}
                        size="sm"
                        onClick={handleTagToggle}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Help text */}
      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
        <p className="mb-1 font-medium">💡 Tag Filtering Tips:</p>
        <ul className="space-y-1">
          <li>• Select multiple tags to find events that match any of them</li>
          <li>• Use different categories to narrow your search</li>
          <li>• Clear tags anytime to see all events</li>
        </ul>
      </div>
    </div>
  );
};