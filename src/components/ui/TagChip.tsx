// TagChip component - Interactive tag display with various states
import React from 'react';
import type { Tag } from '../../types/api';

interface TagChipProps {
  tag: Tag;
  variant?: 'default' | 'selected' | 'clickable' | 'removable';
  size?: 'sm' | 'md' | 'lg';
  onClick?: (tag: Tag) => void;
  onRemove?: (tag: Tag) => void;
  className?: string;
}

export const TagChip: React.FC<TagChipProps> = ({
  tag,
  variant = 'default',
  size = 'md',
  onClick,
  onRemove,
  className = '',
}) => {
  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  // Base classes
  const baseClasses = `
    inline-flex items-center gap-1 font-medium rounded-full border transition-all duration-200
    ${sizeClasses[size]}
  `;

  // Variant-specific classes
  const variantClasses = {
    default: 'border-transparent',
    selected: 'border-current ring-2 ring-current ring-opacity-20',
    clickable: 'border-transparent hover:border-current hover:ring-2 hover:ring-current hover:ring-opacity-20 cursor-pointer',
    removable: 'border-transparent hover:bg-opacity-80 cursor-pointer',
  };

  // Color styles based on tag color
  const colorStyle = {
    backgroundColor: variant === 'selected' ? tag.color : `${tag.color}20`,
    color: tag.color,
  };

  // Handle click
  const handleClick = () => {
    if (onClick && (variant === 'clickable' || variant === 'selected')) {
      onClick(tag);
    }
  };

  // Handle remove
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove(tag);
    }
  };

  return (
    <span
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={colorStyle}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Category indicator (optional) */}
      {tag.category && size === 'lg' && (
        <span className="opacity-75 text-xs">
          {tag.category}:
        </span>
      )}
      
      {/* Tag name */}
      <span>{tag.name}</span>
      
      {/* Remove button for removable variant */}
      {variant === 'removable' && onRemove && (
        <button
          onClick={handleRemove}
          className="ml-1 hover:bg-black hover:bg-opacity-10 rounded-full p-0.5 transition-colors"
          aria-label={`Remove ${tag.name} tag`}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      
      {/* Selection indicator for selected variant */}
      {variant === 'selected' && (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
      )}
    </span>
  );
};

// Helper component for displaying multiple tags
interface TagListProps {
  tags: Tag[];
  maxDisplay?: number;
  variant?: TagChipProps['variant'];
  size?: TagChipProps['size'];
  onTagClick?: (tag: Tag) => void;
  onTagRemove?: (tag: Tag) => void;
  className?: string;
}

export const TagList: React.FC<TagListProps> = ({
  tags,
  maxDisplay = Infinity,
  variant = 'default',
  size = 'md',
  onTagClick,
  onTagRemove,
  className = '',
}) => {
  const displayedTags = tags.slice(0, maxDisplay);
  const remainingCount = tags.length - maxDisplay;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {displayedTags.map((tag) => (
        <TagChip
          key={tag.id}
          tag={tag}
          variant={variant}
          size={size}
          onClick={onTagClick}
          onRemove={onTagRemove}
        />
      ))}
      
      {remainingCount > 0 && (
        <span className={`${sizeClasses[size]} px-2 py-1 bg-gray-100 text-gray-600 font-medium rounded-full`}>
          +{remainingCount} more
        </span>
      )}
    </div>
  );
};

// Size classes for the helper component
const sizeClasses = {
  sm: 'text-xs',
  md: 'text-xs',
  lg: 'text-sm',
};