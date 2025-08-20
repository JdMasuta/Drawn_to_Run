// UserAvatar component tests
import { render, screen } from '../../__tests__/utils/test-utils';
import { UserAvatar, SimpleAvatar, AvatarWithName, FullAvatar } from './UserAvatar';
import { mockUser, mockAdminUser } from '../../__tests__/utils/test-utils';

describe('UserAvatar', () => {
  describe('Basic rendering', () => {
    test('renders with user name initials when no profile image', () => {
      const userWithoutImage = { ...mockUser, profile_image: undefined };
      render(<UserAvatar user={userWithoutImage} />);
      
      expect(screen.getByText('TU')).toBeInTheDocument();
    });

    test('renders profile image when provided', () => {
      const userWithImage = { ...mockUser, profile_image: 'https://example.com/image.jpg' };
      render(<UserAvatar user={userWithImage} />);
      
      const image = screen.getByAltText("Test User's profile");
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    test('renders placeholder when user is null', () => {
      render(<UserAvatar user={null} />);
      
      expect(screen.getByText('Unknown User')).toBeInTheDocument();
    });
  });

  describe('Size variants', () => {
    test('applies correct size classes', () => {
      const { rerender } = render(<UserAvatar user={mockUser} size="xs" />);
      let container = screen.getByText('TU').closest('div');
      expect(container).toHaveClass('w-6', 'h-6');

      rerender(<UserAvatar user={mockUser} size="xl" />);
      container = screen.getByText('TU').closest('div');
      expect(container).toHaveClass('w-16', 'h-16');
    });
  });

  describe('Display options', () => {
    test('shows user name when showName is true', () => {
      render(<UserAvatar user={mockUser} showName={true} />);
      
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    test('shows user role when showRole is true', () => {
      render(<UserAvatar user={mockAdminUser} showRole={true} />);
      
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    test('shows unverified status for unverified email', () => {
      const unverifiedUser = { ...mockUser, email_verified: false };
      render(<UserAvatar user={unverifiedUser} showRole={true} />);
      
      expect(screen.getByText('Unverified')).toBeInTheDocument();
    });
  });

  describe('Role styling', () => {
    test('applies correct role colors', () => {
      const { rerender } = render(<UserAvatar user={mockAdminUser} showRole={true} />);
      let roleElement = screen.getByText('Admin');
      expect(roleElement).toHaveClass('bg-red-100', 'text-red-800');

      const organizerUser = { ...mockUser, role: 'organizer' as const };
      rerender(<UserAvatar user={organizerUser} showRole={true} />);
      roleElement = screen.getByText('Organizer');
      expect(roleElement).toHaveClass('bg-blue-100', 'text-blue-800');

      rerender(<UserAvatar user={mockUser} showRole={true} />);
      roleElement = screen.getByText('Participant');
      expect(roleElement).toHaveClass('bg-green-100', 'text-green-800');
    });
  });

  describe('Clickable behavior', () => {
    test('calls onClick when clickable and clicked', () => {
      const onClickMock = jest.fn();
      render(<UserAvatar user={mockUser} clickable={true} onClick={onClickMock} />);
      
      const avatar = screen.getByText('TU').closest('div');
      if (avatar) {
        avatar.click();
        expect(onClickMock).toHaveBeenCalledTimes(1);
      }
    });

    test('does not call onClick when not clickable', () => {
      const onClickMock = jest.fn();
      render(<UserAvatar user={mockUser} clickable={false} onClick={onClickMock} />);
      
      const avatar = screen.getByText('TU').closest('div');
      if (avatar) {
        avatar.click();
        expect(onClickMock).not.toHaveBeenCalled();
      }
    });

    test('shows click indicator when clickable', () => {
      render(<UserAvatar user={mockUser} clickable={true} />);
      
      const clickIndicator = screen.getByRole('img', { hidden: true });
      expect(clickIndicator).toBeInTheDocument();
    });
  });

  describe('Initial generation', () => {
    test('generates correct initials for single name', () => {
      const singleNameUser = { ...mockUser, name: 'John' };
      render(<UserAvatar user={singleNameUser} />);
      
      expect(screen.getByText('J')).toBeInTheDocument();
    });

    test('generates correct initials for multiple names', () => {
      const multiNameUser = { ...mockUser, name: 'John Michael Smith' };
      render(<UserAvatar user={multiNameUser} />);
      
      expect(screen.getByText('JM')).toBeInTheDocument();
    });
  });
});

describe('SimpleAvatar', () => {
  test('renders without name or role', () => {
    render(<SimpleAvatar user={mockUser} />);
    
    expect(screen.getByText('TU')).toBeInTheDocument();
    expect(screen.queryByText('Test User')).not.toBeInTheDocument();
    expect(screen.queryByText('Participant')).not.toBeInTheDocument();
  });
});

describe('AvatarWithName', () => {
  test('renders with name but no role', () => {
    render(<AvatarWithName user={mockUser} />);
    
    expect(screen.getByText('TU')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.queryByText('Participant')).not.toBeInTheDocument();
  });
});

describe('FullAvatar', () => {
  test('renders with both name and role', () => {
    render(<FullAvatar user={mockUser} />);
    
    expect(screen.getByText('TU')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('Participant')).toBeInTheDocument();
  });
});