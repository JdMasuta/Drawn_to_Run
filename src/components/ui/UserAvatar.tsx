// UserAvatar component - Consistent user avatar display
import React from 'react';
import type { User } from '../../types/api';

interface UserAvatarProps {
  user: User | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  showRole?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'md',
  showName = false,
  showRole = false,
  clickable = false,
  onClick,
  className = '',
}) => {
  // Size configurations
  const sizeConfig = {
    xs: {
      avatar: 'w-6 h-6 text-xs',
      container: 'gap-2',
      text: 'text-xs',
    },
    sm: {
      avatar: 'w-8 h-8 text-sm',
      container: 'gap-2',
      text: 'text-sm',
    },
    md: {
      avatar: 'w-10 h-10 text-sm',
      container: 'gap-3',
      text: 'text-sm',
    },
    lg: {
      avatar: 'w-12 h-12 text-base',
      container: 'gap-3',
      text: 'text-base',
    },
    xl: {
      avatar: 'w-16 h-16 text-lg',
      container: 'gap-4',
      text: 'text-lg',
    },
  };

  const config = sizeConfig[size];

  // Get user initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  // Role color mapping
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'text-red-600 bg-red-100';
      case 'organizer':
        return 'text-blue-600 bg-blue-100';
      case 'participant':
      default:
        return 'text-green-600 bg-green-100';
    }
  };

  // Role display names
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'organizer':
        return 'Organizer';
      case 'participant':
      default:
        return 'Participant';
    }
  };

  const containerClasses = `
    flex items-center ${config.container} ${clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''} ${className}
  `;

  const handleClick = () => {
    if (clickable && onClick) {
      onClick();
    }
  };

  if (!user) {
    // Placeholder for when user is not available
    return (
      <div className={containerClasses} onClick={handleClick}>
        <div className={`${config.avatar} bg-gray-200 rounded-full flex items-center justify-center`}>
          <svg className="w-1/2 h-1/2 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        {showName && (
          <div className="flex-1 min-w-0">
            <div className={`${config.text} text-gray-500 font-medium`}>
              Unknown User
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={containerClasses} onClick={handleClick}>
      {/* Avatar */}
      <div className={`${config.avatar} rounded-full flex items-center justify-center overflow-hidden`}>
        {user.profile_image ? (
          <img
            src={user.profile_image}
            alt={`${user.name}'s profile`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-blue-600 flex items-center justify-center">
            <span className="text-white font-medium">
              {getInitials(user.name)}
            </span>
          </div>
        )}
      </div>

      {/* User info */}
      {(showName || showRole) && (
        <div className="flex-1 min-w-0">
          {showName && (
            <div className={`${config.text} text-gray-900 font-medium truncate`}>
              {user.name}
            </div>
          )}
          {showRole && (
            <div className="flex items-center mt-1">
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}
              >
                {getRoleDisplayName(user.role)}
              </span>
              {!user.email_verified && (
                <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full text-yellow-600 bg-yellow-100">
                  Unverified
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Optional click indicator */}
      {clickable && (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </div>
  );
};

// Simplified avatar for just displaying the image/initials
interface SimpleAvatarProps {
  user: User | null;
  size?: UserAvatarProps['size'];
  className?: string;
}

export const SimpleAvatar: React.FC<SimpleAvatarProps> = ({ user, size = 'md', className = '' }) => {
  return (
    <UserAvatar
      user={user}
      size={size}
      showName={false}
      showRole={false}
      clickable={false}
      className={className}
    />
  );
};

// Avatar with name only
interface AvatarWithNameProps {
  user: User | null;
  size?: UserAvatarProps['size'];
  clickable?: boolean;
  onClick?: () => void;
  className?: string;
}

export const AvatarWithName: React.FC<AvatarWithNameProps> = ({
  user,
  size = 'md',
  clickable = false,
  onClick,
  className = '',
}) => {
  return (
    <UserAvatar
      user={user}
      size={size}
      showName={true}
      showRole={false}
      clickable={clickable}
      onClick={onClick}
      className={className}
    />
  );
};

// Full avatar with name and role
interface FullAvatarProps {
  user: User | null;
  size?: UserAvatarProps['size'];
  clickable?: boolean;
  onClick?: () => void;
  className?: string;
}

export const FullAvatar: React.FC<FullAvatarProps> = ({
  user,
  size = 'md',
  clickable = false,
  onClick,
  className = '',
}) => {
  return (
    <UserAvatar
      user={user}
      size={size}
      showName={true}
      showRole={true}
      clickable={clickable}
      onClick={onClick}
      className={className}
    />
  );
};